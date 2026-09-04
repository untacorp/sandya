# Backend Architecture Patterns & Domain-Driven Design (DDD)

This guide provides architectural blueprints and structural patterns for constructing maintainable, testable, and decoupled backend systems.

---

## 🏛️ Clean / Hexagonal Architecture (Ports and Adapters)

To prevent business logic from being polluted by framework-specific code, database drivers, or third-party APIs, the codebase is structured into concentric layers with a strict **Dependency Rule**: *Inner layers know nothing about outer layers.*

```
┌─────────────────────────────────────────────────────────────┐
│ Interface / Delivery Layer (HTTP / tRPC / GQL / CLI / RPC)  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Infrastructure / Adapters (ORM, Postgres, BullMQ)     │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Application Layer (Use Cases, Commands, Queries)│  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │ Domain Core (Entities, Value Objects,     │  │  │  │
│  │  │  │              Aggregates, Domain Events)   │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1. Domain Core (`src/domain/`)
- Contains pure business logic, entities, value objects, and domain events.
- **ZERO external dependencies** (no database drivers, no Next.js/Express imports, no HTTP decorators).
- Defines repository and external service **Interfaces (Ports)**.

```typescript
// src/domain/entities/evacuee.entity.ts
export interface EvacueeProps {
  id: string;
  posId: string;
  fullName: string;
  status: 'REGISTERED' | 'DISPLACED' | 'REUNITED' | 'HOSPITALIZED';
  registeredAt: Date;
  version: number;
}

export class Evacuee {
  private constructor(private props: EvacueeProps) {}

  static create(props: Omit<EvacueeProps, 'id' | 'status' | 'registeredAt' | 'version'>): Evacuee {
    return new Evacuee({
      ...props,
      id: crypto.randomUUID(),
      status: 'REGISTERED',
      registeredAt: new Date(),
      version: 1,
    });
  }

  static rehydrate(props: EvacueeProps): Evacuee {
    return new Evacuee(props);
  }

  transferToHospital(reason: string): void {
    if (this.props.status === 'REUNITED') {
      throw new DomainError('Cannot hospitalize an evacuee already marked reunited.');
    }
    this.props.status = 'HOSPITALIZED';
    this.props.version += 1;
  }

  get state(): Readonly<EvacueeProps> {
    return Object.freeze({ ...this.props });
  }
}
```

### 2. Application Layer (`src/application/`)
- Implements use cases (Command / Query handlers, orchestrations, transaction coordination).
- Coordinates aggregates, calls repository interfaces, and writes domain events to the outbox.

```typescript
// src/application/use-cases/transfer-evacuee.use-case.ts
export interface TransferEvacueeCommand {
  evacueeId: string;
  reason: string;
  actorId: string;
}

export class TransferEvacueeUseCase {
  constructor(
    private readonly evacueeRepo: EvacueeRepositoryPort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly outboxRepo: OutboxRepositoryPort
  ) {}

  async execute(command: TransferEvacueeCommand): Promise<void> {
    await this.unitOfWork.transaction(async (tx) => {
      const evacuee = await this.evacueeRepo.findByIdWithLock(command.evacueeId, tx);
      if (!evacuee) throw new NotFoundError('Evacuee not found');

      evacuee.transferToHospital(command.reason);

      await this.evacueeRepo.save(evacuee, tx);
      await this.outboxRepo.append({
        eventType: 'EVACUEE_HOSPITALIZED',
        aggregateId: evacuee.state.id,
        payload: { evacueeId: evacuee.state.id, reason: command.reason, actorId: command.actorId },
      }, tx);
    });
  }
}
```

### 3. Infrastructure Layer (`src/infrastructure/`)
- Implements the ports defined by domain/application layers.
- Drizzle ORM / Prisma schema implementations, Redis caching, BullMQ job queues, P2P mesh adapters, S3 file uploaders.

### 4. Interface / Delivery Layer (`src/interfaces/` or `src/app/api/`)
- Web controllers, Next.js Server Actions, tRPC routers, GraphQL resolvers, or WebSocket handlers.
- Responsible for parsing raw HTTP requests, authenticating users, invoking use cases, and formatting HTTP / RFC 7807 responses.

---

## 📁 Standard Modular Monolith File Structure

```
src/
├── domain/                      # Pure Business Rules & Domain Interfaces
│   ├── evacuee/
│   │   ├── evacuee.aggregate.ts
│   │   ├── evacuee.events.ts
│   │   └── evacuee-repository.port.ts
│   └── logistics/
│       ├── stock-item.aggregate.ts
│       └── stock-movement.entity.ts
├── application/                 # Use Cases & Application Services
│   ├── evacuee/
│   │   ├── commands/
│   │   │   ├── register-evacuee.command.ts
│   │   │   └── transfer-evacuee.command.ts
│   │   └── queries/
│   │       ├── get-evacuee-detail.query.ts
│   │       └── list-pos-evacuees.query.ts
│   └── common/
│       ├── ports/               # OutboxPort, UnitOfWorkPort, EventPublisherPort
│       └── errors/              # ApplicationError, DomainError, NotFoundError
├── infrastructure/              # Concrete Drivers & Technical Implementations
│   ├── database/
│   │   ├── drizzle/             # Drizzle ORM client, schemas, migrations
│   │   ├── repositories/        # DrizzleEvacueeRepository implements EvacueeRepositoryPort
│   │   └── unit-of-work.ts      # Transaction boundary wrapper
│   ├── queues/                  # BullMQ workers, job dispatchers
│   ├── security/                # Argon2id hasher, Ed25519 signer, JWT provider
│   └── sync/                    # Local-first event replays, animated QR packet builder
└── interfaces/                  # Entry Points & Controllers
    ├── http/                    # Express/Fastify/Next.js Route Handlers
    ├── trpc/                    # tRPC Routers & procedures
    ├── graphql/                 # GraphQL SDL schemas, resolvers & DataLoader
    └── ws/                      # WebSocket / SSE connection handlers
```

---

## ⚖️ Monolith vs Modular Monolith vs Microservices Matrix

| Criterion | Single Monolith | Modular Monolith (Recommended) | Distributed Microservices |
| :--- | :--- | :--- | :--- |
| **Complexity** | Low | Moderate | Very High |
| **Boundaries** | Fuzzy | Strict in-code domain boundaries | Network & Repository isolated |
| **Transactions** | ACID (Single DB) | ACID (Single DB with module schemas) | Distributed Sagas / 2PC |
| **Deployment** | Single artifact | Single artifact | Multi-pipeline orchestration |
| **Best For** | MVPs & Small Apps | 95% of Enterprise & Scale-up Apps | Massive teams (>100 devs) |
