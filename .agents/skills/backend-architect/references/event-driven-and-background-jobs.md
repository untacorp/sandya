# Event-Driven Architecture & Background Jobs

This guide defines how to reliably process asynchronous tasks, guarantee zero event loss using the Transactional Outbox Pattern, and design robust worker queues.

---

## 📬 1. The Dual-Write Problem & Transactional Outbox Pattern

### The Problem
When a database update and a message broker publish happen in the same API request:
- If the database write succeeds but the network crashes before publishing to the queue, the event is **lost forever**.
- If the event publishes first but the database rollback occurs, downstream consumers process **phantom data**.

### The Solution: Transactional Outbox
1. Write the domain state and append the event to an `outbox` table within the **same ACID database transaction**.
2. An asynchronous background poller or Change Data Capture (CDC) engine reads pending outbox events and publishes them to the queue broker.
3. Upon broker acknowledgment, mark the outbox entry as `PROCESSED`.

```
┌────────────────────────────────────────────────────────────────┐
│ DATABASE TRANSACTION (Atomic)                                  │
│  1. INSERT / UPDATE business_table                            │
│  2. INSERT INTO transactional_outbox (event_name, payload)     │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ OUTBOX RELAY / POLLER (BullMQ / Cron / Debezium)               │
│  1. Read unprocessed events WHERE status = 'PENDING'           │
│  2. Publish to Message Broker (Redis / RabbitMQ / Kafka)       │
│  3. UPDATE transactional_outbox SET status = 'PROCESSED'       │
└────────────────────────────────────────────────────────────────┘
```

### Outbox Table Schema (PostgreSQL DDL)
```sql
CREATE TABLE transactional_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_pending ON transactional_outbox (created_at) WHERE status = 'PENDING';
```

---

## ⚙️ 2. Queue & Worker Architecture (BullMQ / Redis)

### Queue Topology Standard
- Separate queues by priority and workload type:
  - `critical-events-queue`: High priority outbox dispatch & notifications.
  - `sync-reconciliation-queue`: Edge packet processing, mesh ingestion.
  - `reports-queue`: Heavy analytical queries and PDF generation.

### Worker Configuration Standards
```typescript
import { Worker, Queue } from 'bullmq';
import { redisConnection } from '@/infrastructure/redis';

export const outboxRelayQueue = new Queue('outbox-relay', { connection: redisConnection });

export const outboxWorker = new Worker(
  'outbox-relay',
  async (job) => {
    const { eventType, aggregateId, payload } = job.data;
    
    // Idempotent processing check
    const isAlreadyProcessed = await checkEventProcessed(job.id);
    if (isAlreadyProcessed) return;

    await dispatchDomainEvent(eventType, aggregateId, payload);
    await markEventProcessed(job.id);
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000, // 100 jobs per second rate limit
    },
  }
);
```

---

## 🔁 3. Retry Strategy: Exponential Backoff with Jitter

Fixed retries cause **thundering herd** problems when downstream services recover. Always configure exponential backoff with full jitter:

$$\text{Delay} = \min(\text{MaxDelay}, \text{InitialDelay} \times 2^{\text{attempt}}) \times \text{random}(0.5, 1.5)$$

```typescript
export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s -> 4s -> 8s -> 16s -> 32s
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: false, // Keep failed jobs for DLQ inspection
};
```

---

## 🪦 4. Dead Letter Queue (DLQ) & Poison Pill Handling

When all retry attempts are exhausted:
1. Move the failed job to the **Dead Letter Queue (DLQ)**.
2. Emit an alert to telemetry / Slack / Sentry with the complete error stack trace, payload, and attempt history.
3. Provide an admin API / CLI command to inspect, repair, and redrive DLQ messages.

```typescript
outboxWorker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    console.error(`🚨 Job ${job.id} failed permanently: ${err.message}`);
    await deadLetterQueue.add('poison-pill', {
      originalQueue: job.queueName,
      jobId: job.id,
      data: job.data,
      failedReason: err.message,
      stacktrace: err.stack,
      failedAt: new Date().toISOString(),
    });
  }
});
```

---

## 🎭 5. Distributed Sagas (Choreography vs Orchestration)

When a business transaction spans multiple services or local databases without shared distributed ACID locks:

### Orchestration Saga (Recommended for complex multi-step workflows)
A central Saga Coordinator manages the state, dispatches commands, and triggers compensating transactions if any step fails:
```
Coordinator ──► Step 1: Reserve Stock ──► OK
Coordinator ──► Step 2: Charge Payment ──► FAILED
Coordinator ──► Compensating Action: Release Stock ──► OK
```
