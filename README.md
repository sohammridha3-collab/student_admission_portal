# 🎓 Metropolitan University — Student Admission Portal

A comprehensive, production-ready, full-stack web application designed to automate and streamline the entire university admission process. The portal connects **Prospective Students**, **Admission Officers**, and **System Administrators** with strict workflow enforcement, automated document verification, entrance exam scoring, and institutional governance.

---

## 🏛️ System Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express.js, REST API, Multer (Local Document File Storage).
- **Database & ORM**: SQLite via Prisma ORM (Relational schema with zero external dependencies, easily switchable to PostgreSQL).
- **Security & RBAC**: JSON Web Tokens (JWT), bcrypt password hashing, Role-Based Access Control, granular capability gates (`canVerifyDocs`, `canGradeTest`, `canMakeDecision`, `canExportReports`).
- **Audit Ledger**: Comprehensive audit logging recording every admin and officer action with user, IP address, and timestamp.

---

## 👥 Seeded Demo Personas & Credentials

The application is pre-seeded with real-world demo accounts across all three roles, accessible via the **Instant Demo Switcher** in the top navigation bar or manual login:

| Role | Persona Name | Email | Password | Application State / Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Eleanor Vance (Chief Administrator) | `admin@admission.edu` | `Admin@123` | Full system governance, User CRUD, Policies, Audit Logs |
| **Admission Officer** | Dr. Sarah Jenkins | `officer@admission.edu` | `Officer@123` | Senior Reviewer (All verification, test scoring & decision authority) |
| **Admission Officer 2** | James Wilson | `officer2@admission.edu` | `Officer@123` | Restricted Reviewer (Verification & test scoring; decision restricted) |
| **Student** | Alice Morgan | `alice@student.edu` | `Student@123` | `SUBMITTED` — Form filled, Docs uploaded, Fee paid, Pending review |
| **Student** | Bob Davis | `bob@student.edu` | `Student@123` | `APPROVED` — Docs verified, Test passed (88.5/100), Formal Letter issued |
| **Student** | Charlie Parker | `charlie@student.edu` | `Student@123` | `DRAFT` — Application in progress, awaiting document & fee completion |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24.16.0)
- **npm** v9+

### 2. Run the Entire Project (Backend & Frontend) Concurrently
From the root project folder:
```bash
# Start both backend (Port 5000) and frontend (Port 5173) concurrently:
npm run dev
```

Alternatively, run in separate terminals:
```bash
# Terminal 1 - Backend:
cd backend
npm run dev

# Terminal 2 - Frontend:
cd frontend
npm run dev
```

### 3. Open in Browser
- **Portal URL**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Static Uploads Directory**: [http://localhost:5000/uploads](http://localhost:5000/uploads)

---

## 📋 UML Use Case Implementation Breakdown

### Phase 1: Database Schema & Entity Relational Design
- `User`: Handles Students, Admission Officers, and Admins with `role`, `status` (`ACTIVE`/`INACTIVE`), and JSON `permissions`.
- `Application`: Tracks unique `application_number` (`ADM-2026-XXXX`), applicant details, and status (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `TEST_SCHEDULED`, `APPROVED`, `REJECTED`).
- `Document`: Stores file URL, document type, file size, mime type, verification status (`PENDING`, `VERIFIED`, `REJECTED`), and reviewer verification notes.
- `Payment`: Stores fee payments ($75), unique transaction IDs (`TXN-...`), payment method, and completion timestamp.
- `EntranceTest`: Records Undergraduate Academic Aptitude Test (UAAT) score, passing criteria, test date, and interview observations.
- `SystemPolicy`: Configures cutoff deadline, application fee, portal status (`OPEN`/`CLOSED`), required document checklist, and announcements.
- `SystemLog`: Immutable security and audit trail ledger.
- `Notification`: In-app notification center for alerts on status changes, document verifications, and decisions.

### Phase 2: Authentication & RBAC Access Control
- **Student Registration & Login**: Immediate issuance of a unique application docket upon registration.
- **Dedicated Multi-Role Sign In**: Role-specific tabs for Student, Officer, and Admin.
- **Forgot Password Flow**: Secure cryptographic token generation with recovery instructions.
- **Deactivated Account Guard**: Middleware immediately blocks inactive users.
- **Granular Permissions Guard**: Enforces operational capabilities per officer.

### Phase 3: Student Module (Applicant)
- **Strict 4-Step Application Workflow**:
  1. *Step 1: Fill Application Form* — Candidate personal identity, contact, guardian info, and secondary academic records.
  2. *Step 2: Upload Required Documents* — Upload transcripts, government IDs, and passport photos with live status badges.
  3. *Step 3: Pay Application Fee* — Interactive checkout simulator (Credit Card, UPI, Net Banking) authorizing fee.
  4. *Step 4: Final Submission* — Validates that Steps 1, 2, and 3 are 100% completed. If any prerequisite is missing or deadline passed, submission is locked.
- **Real-Time Application Status Tracker**: Stage-by-stage visual timeline showing review progression, verified documents, and test scores.
- **Official Acceptance Letter**: When an application is approved, candidates can view and print their formal admission letter with university seal and digital certification.
- **Payment Receipt**: Printable bursar fee payment receipt with transaction ID.

### Phase 4: Admission Officer Module
- **Verification Dashboard**: Metrics overview tracking queue size, pending verifications, and approved tallies.
- **Application Queue**: Multi-status tabs (`SUBMITTED`, `UNDER_REVIEW`, `TEST_SCHEDULED`, `APPROVED`, `REJECTED`), applicant search, and degree filters.
- **Document Viewer & Authenticity Inspection (Strict `<<include>>`)**:
  - Embedded PDF iframe and image viewer modal.
  - Officer marks each document as `VERIFIED` or `REJECTED` (with reason).
  - *Rule Enforced*: Officer cannot proceed to review or make final decisions until all documents are marked verified.
- **Conduct Entrance Test**:
  - Input exam score (0-100), passing score comparison, and interview observations, or mark as `WAIVED`.
  - *Rule Enforced*: Must be scored or waived before approving/declining.
- **Decision Engine**:
  - Final decision buttons (`Approve & Grant Admission` / `Reject Application`).
  - Triggers real-time notification to the student portal and logs audit events.
- **Generate Admission Reports**: Export candidate lists, test results, and admission dates to CSV.

### Phase 5: Admin Module (System Administrator)
- **User Management (CRUD)**:
  - Add new Officer, Student, or Admin accounts.
  - Edit user names, emails, and roles.
  - Toggle Deactivation / Reactivation (blocks login immediately).
  - Direct Admin Password Reset.
- **Role & Permissions Management (RBAC)**:
  - Matrix interface allowing administrators to toggle granular permissions per officer account.
- **System Configuration & Policies**:
  - Set application deadline date & time.
  - Set application fee amount.
  - Toggle portal status (`OPEN` vs `CLOSED`).
  - Configure mandatory document checklist (add/remove document types).
  - Set broadcast announcements.
- **Audit Trail & Security Logs**:
  - Filterable security ledger tracking every action taken by admins and officers.
- **System-Wide Reports & Analytics**:
  - Real-time gross revenue metrics ($), conversion rates, and admissions pipeline distribution charts.

### Phase 6: Admin ↔ Admission Officer Collaboration Rules
- **Admin Sets Policies**: Deadlines and fees set by the Admin are strictly enforced across Officer review and Student submission pipelines.
- **Admin Creates Officers**: Officers use administrative provisioned accounts with RBAC permission levels.
- **Segregated Access**: Admin manages user identities; Officers have read-only access to student profiles and write access to application review decisions.

---

## 🧪 Testing Verification Scenarios

1. **Test Prerequisite Workflow Locking (Student)**:
   - Log in as `charlie@student.edu` (Draft stage).
   - Attempt to jump to Step 4 (Submit). Observe that the submit button is locked until Steps 1, 2, and 3 are completed.
2. **Test Document Verification & Decision Engine (Officer)**:
   - Log in as `officer@admission.edu`.
   - Open Alice Morgan's application (`ADM-2026-001`).
   - Notice the decision buttons are locked until all documents are verified and test score is saved.
   - Click "Verify" on all documents, input an entrance score (e.g., 85), and observe the decision buttons unlock!
3. **Test Acceptance Letter & Confetti (Accepted Student)**:
   - Switch persona to `bob@student.edu` (Accepted).
   - Observe acceptance banner, click "View Admission Letter", and preview the printable official university offer letter.
4. **Test Policy Enforcement & Deadline Locking (Admin)**:
   - Log in as `admin@admission.edu`.
   - Go to System Settings, change application fee or deadline, and view the immediate update in Student and Officer views.
   - Go to User Management to deactivate an account or reset a user's password directly.
