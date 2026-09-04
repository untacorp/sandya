# Mermaid Modeling & Syntax Guide for User Flows

This guide outlines standards and syntax rules for creating resilient, unambiguous, and readable Mermaid diagrams for user flows.

---

## 1. Diagram Types & Usage Rules

| Diagram Type | Primary Use Case | Key Strengths |
|---|---|---|
| **Flowchart (`flowchart TD` or `LR`)** | Screen navigation, conditional logic, user decision trees, error paths. | Best for general user flows, routing, and UI state branching. |
| **Sequence Diagram (`sequenceDiagram`)** | Peer-to-peer data sync, QR exchange, client-server APIs, multi-device handshakes. | Best for showing chronological message passing between actors & systems. |
| **State Diagram (`stateDiagram-v2`)** | Entity lifecycle (e.g., Record sync state, Disaster event status). | Best for tracking state transitions and valid trigger events. |

---

## 2. Flowchart Standards & Node Conventions

### Recommended Shapes & Meaning

```mermaid
flowchart LR
    Start([Start / End State]) --> Screen[Screen / UI Page]
    Screen --> Action[User Action / Tap]
    Action --> Decision{Decision / Branch?}
    Decision -->|Condition A| Storage[(Local Storage / DB)]
    Decision -->|Condition B| InputOutput[/Data Input / Export/]
    Storage --> SubFlow[[External / Sub-Flow]]
```

- `([Stadium])` : Entry points, exits, terminal states (`([Start Flow])`, `([Flow Completed])`).
- `[Rectangle]` : UI Views, Screens, or standard user actions (`[Open Pos Dashboard]`).
- `{"Diamond"}` : Decision points, condition evaluations, validation checks (`{"Is Camera Allowed?"}`).
- `[(Cylinder)]` : Databases, local storage, indexedDB, cache (`[(Local SQLite DB)]`).
- `[/Parallelogram/]` : I/O operations, QR code generation, camera scan (`[/Scan QR Code/]`).
- `[[Subroutine]]` : Reusable modular sub-flows (`[[Authentication Flow]]`).

---

## 3. Critical Syntax Guardrails to Prevent Rendering Errors

1. **Always Quote Labels with Punctuation**:
   ```mermaid
   %% CORRECT
   nodeA["View Details (Read-Only)"]
   nodeB{"Has Camera Permission?"}
   nodeC["Route: /dashboard/pos-1"]

   %% INCORRECT - Will break parser
   %% nodeA[View Details (Read-Only)]
   %% nodeB{Has Camera Permission?}
   ```

2. **Explicitly Label All Decision Branches**:
   Every decision diamond MUST have at least two outgoing edges with descriptive labels:
   ```mermaid
   flowchart TD
       CheckNet{"Network Online?"}
       CheckNet -->|Yes| SyncCloud["Push to API"]
       CheckNet -->|No| QueueLocal["Save to Local Outbox"]
   ```

3. **Use Subgraphs for Actors, Devices, or Screen Boundaries**:
   ```mermaid
   flowchart TD
       subgraph Device_A["Device A (Field Pos)"]
           A1["Input Evacuee Data"] --> A2["Generate QR Export"]
       end

       subgraph Device_B["Device B (Relief Camp)"]
           B1["Scan QR with Camera"] --> B2["Merge into Local DB"]
       end

       A2 -.->|Optical QR Transfer| B1
   ```

---

## 4. Sequence Diagram Standards

Use sequence diagrams when multiple actors, devices, or services interact over time.

```mermaid
sequenceDiagram
    autonumber
    actor VolA as Pos Volunteer (Device A)
    participant AppA as Sanidya App A
    actor VolB as Pos Volunteer (Device B)
    participant AppB as Sanidya App B
    participant Cloud as Central Server

    VolA->>AppA: Input evacuee data (Offline)
    AppA->>AppA: Save to local IndexedDB & mark [Pending Sync]
    VolA->>AppA: Tap "Share via QR"
    AppA->>AppA: Compress & sign data payload
    AppA-->>VolA: Display dynamic QR code

    VolB->>AppB: Open camera scanner
    AppB->>AppA: Optical scan of QR payload
    AppB->>AppB: Validate signature & check for duplicates
    alt No Conflicts
        AppB->>AppB: Merge data into local DB
        AppB-->>VolB: Show "Import Successful (12 records)"
    else Conflict Detected
        AppB-->>VolB: Prompt "Resolve 2 Conflicting Records"
        VolB->>AppB: Choose winning record
        AppB->>AppB: Commit resolution
    end

    opt Internet Restored Later
        AppB->>Cloud: POST /api/v1/sync/events
        Cloud-->>AppB: 200 OK (Sync Acknowledged)
    end
```

---

## 5. State Diagram Standards

Use `stateDiagram-v2` to model entity lifecycles.

```mermaid
stateDiagram-v2
    [*] --> Draft : Create New Record
    Draft --> StoredLocally : Save (Offline)
    
    StoredLocally --> StagedForQR : Export QR Code
    StagedForQR --> SyncedPeer : Scanned by Peer Device
    
    StoredLocally --> SyncingCloud : Network Detected
    SyncedPeer --> SyncingCloud : Network Detected
    
    SyncingCloud --> SyncedCentral : Server Confirmed (200 OK)
    SyncingCloud --> ConflictState : Version Mismatch (409 Conflict)
    
    ConflictState --> SyncedCentral : Manual / LWW Resolution Applied
    SyncedCentral --> Archived : Incident Closed
    Archived --> [*]
```
