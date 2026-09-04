# Reference Example: Multi-Role Organization Setup & Pos Delegation

> **Status**: Approved Specification  
> **Target Personas**: Organization Administrator, Pos Coordinator, Field Responder  
> **Core Objective (JTBD)**: Allow disaster response organizations to register their organization, invite coordinators, delegate pos-level permissions, and provision offline keys for field volunteers.  
> **Context & Environment**: Web Admin Dashboard (Online) & Mobile Field Clients (Hybrid Online/Offline).

---

## 1. Flow Overview & Scope

### In Scope
- Organization creation and admin profile registration.
- Role-Based Access Control (RBAC): Super Admin, Pos Coordinator, Field Responder, Read-Only Auditor.
- Generation of single-use or token-based invite links / QR codes for field staff.
- Offline device authorization token provisioning.

### Out of Scope
- Financial donor billing and invoicing.

---

## 2. Macro Journey Map

```mermaid
flowchart LR
    A([1. Org Registration]) --> B([2. Define Incident & Pos])
    B --> C([3. Provision Coordinator Invites])
    C --> D([4. Field Device Onboarding])
    D --> E([5. Access Active Dashboard])
```

---

## 3. Detailed Micro Flow & Logic Branching

```mermaid
flowchart TD
    Start([Admin Lands on App]) --> AuthCheck{"Has Account?"}
    
    AuthCheck -->|No| Register["Register Admin (Email, Name, Password)"]
    Register --> OrgSetup["Fill Organization Details (Name, Disaster Type, Base Location)"]
    OrgSetup --> SaveOrg[(Save Organization to Central DB)]
    
    AuthCheck -->|Yes| Login["Sign In via Credentials / Magic Link"]
    Login --> SaveOrg
    
    SaveOrg --> OrgDashboard["Open Organization Console"]
    OrgDashboard --> AddPos["Click 'Create New Disaster Pos'"]
    
    AddPos --> PosForm["Enter Pos Name, GPS Coordinates, Target Capacity"]
    PosForm --> SavePos[(Persist Pos Profile)]
    
    SavePos --> InviteStaff["Click 'Invite / Assign Responders'"]
    InviteStaff --> SelectRole{"Select Role to Provision"}
    
    SelectRole -->|Pos Coordinator| GenLink["Generate Coordinator Email Invite Link"]
    SelectRole -->|Field Volunteer / Offline Device| GenDeviceToken["Generate Offline Provisioning QR / Secret"]
    
    GenLink --> SendEmail[/Send Email / WhatsApp Invite/]
    SendEmail --> CoordAccept[/Coordinator Clicks Link & Sets PIN/]
    CoordAccept --> CoordActive([Coordinator Account Activated])
    
    GenDeviceToken --> ShowQR["Display Provisioning QR in Admin Console"]
    ShowQR --> VolScan[/Field Volunteer Scans Provisioning QR with Mobile App/]
    VolScan --> CheckToken{"Is Token Valid & Unexpired?"}
    
    CheckToken -->|Expired / Invalid| RejectProvision["Show 'Invalid Activation Code' Alert"]
    CheckToken -->|Valid| StoreLocalKey[(Store Signed Pos Certificate in Device Keychain)]
    
    StoreLocalKey --> VolReady([Field Volunteer Ready for Offline Operations])
```

---

## 4. Step-by-Step Interaction Table

| Step # | Screen / Route | Actor Action | System Response | Validations & Notes |
|---|---|---|---|---|
| **1.0** | `/auth/register` | Admin inputs org name, contact info, and admin password | Creates new Org tenant & assigns SuperAdmin role | Enforces strong password rules |
| **1.1** | `/org/dashboard` | Admin selects "Pos Management" -> "Add Pos" | Opens Pos creation modal | Pre-populates location via browser geolocation if granted |
| **1.2** | `/org/pos/[id]/staff` | Admin selects "Generate Field Pass QR" | Creates signed device token with 7-day expiration | Encrypted with org public key |
| **1.3** | `/onboarding/scan-pass` | Volunteer scans Field Pass QR using mobile app | Decodes token, binds device ID to Pos, switches app to offline-ready state | Stores JWT/certificate locally |

---

## 5. Edge Cases & Exception Matrix

| Trigger / Condition | Failure Mode | UX Behavior / Recovery Path |
|---|---|---|
| **Stolen / Compromised Field Device** | Unauthorized person holds field phone | Admin can click "Revoke Device Key" in Org console; subsequent syncs from that device ID are rejected at server gateway. |
| **Field Pass QR Scanned Twice** | Multi-use attempt on single-use token | System rejects second scan with message "This activation code was already used on another device." |
| **Role Downgrade while Offline** | User role demoted from Coordinator to Read-Only | Device retains local permissions until next successful online sync or peer sync verification. |
