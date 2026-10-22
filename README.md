# CampusFlow — Smart Campus Event Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v8-47A248.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](https://render.com/)

An enterprise-grade, full-stack university platform designed to streamline campus life. **CampusFlow** orchestrates end-to-end event scheduling, automated venue conflict detection, instant digital QR-pass check-ins, cryptographic certificate generation, and multi-tier role governance.

---

## 🌟 Core Highlights & Architectural Features

### 1. 🛡️ Role-Based Access Governance (RBAC) & Google OAuth 2.0
- **Multi-Role Portal**: Tailored workflows and views for **Students**, **Event Organizers**, and **University Administrators**.
- **Google OAuth 2.0 Integration**: Native Single Sign-On powered by Google Identity Services (`google-auth-library` cryptographic ID token verification).
- **1-Click Evaluation Switcher**: Test different perspectives (Student, Organizer, Admin) seamlessly with persistent state and automatic dashboard routing.

### 2. 🏛️ Automated Venue Conflict Detection Engine
- **Spatial & Temporal Scheduling**: Algorithms verify date/time overlap with an automated 30-minute buffer (`VENUE_BUFFER_MINUTES`) for setup and teardown.
- **Smart Conflict Prevention**: Prevents double bookings across auditoriums, computing labs, and seminar halls before submission.

### 3. 📲 Instant QR Attendance & Anti-Proxy Verification
- **Dynamic Digital Passes**: Generates cryptographically unique QR passes (`CF-2026-XXXX`) for each verified registrant.
- **Live Camera Scanner**: High-speed camera scanner powered by `html5-qrcode` (under 200ms decode time) with audio-visual check-in feedback.
- **Idempotency & Anti-Proxy**: Blocks duplicate check-ins and logs attendance timestamps with organizer audit tags.
- **Manual Desk Override**: Allows organizers to check in students by Roll Number (`241FA04312`) if camera or device access is unavailable.

### 4. 📜 Verifiable E-Certificates & High-Res PDF Export
- **Tamper-Evident Credentials**: Issues verifiable certificates featuring unique alphanumeric Verification IDs (`CF-CERT-2026-...`) and QR authentication links.
- **Vector-Crisp PDF Export**: Client-side high-resolution rendering using `jspdf` and `html2canvas` with custom signatures, gold seals, and university honors styling.

### 5. 📊 Real-Time Analytics & Governance Dashboard
- **Admin Command Center**: Visualizes campus engagement metrics using `recharts` (Registration vs. Capacity, Category distribution, Department breakdowns).
- **Event Lifecycle Approvals**: Multi-stage approval workflow (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED`).
- **Comprehensive Audit Trail**: Security audit logging tracking login sessions, role changes, and attendance verifications.

### 6. 🔔 Smart Reminders & In-App Alerts
- Automated reminder jobs notifying students of upcoming schedules, deadlines, check-in confirmations, and certificate releases.

---

## 👥 Role Capabilities

| Feature | Student | Organizer | Administrator |
| :--- | :---: | :---: | :---: |
| Browse & Filter Events | ✅ | ✅ | ✅ |
| 1-Click Event Registration | ✅ | ✅ | ✅ |
| Access Digital QR Event Pass | ✅ | ❌ | ❌ |
| Download High-Res PDF Certificates | ✅ | ❌ | ❌ |
| Create & Manage Campus Events | ❌ | ✅ | ✅ |
| Reserve Venues with Conflict Checks | ❌ | ✅ | ✅ |
| Live Camera QR Scanner & Check-in | ❌ | ✅ | ✅ |
| Export Attendance Rosters | ❌ | ✅ | ✅ |
| Approve / Reject Pending Events | ❌ | ❌ | ✅ |
| University Aggregation Analytics | ❌ | ❌ | ✅ |
| User Governance & Audit Logs | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack & Libraries

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, React Router v7, Lucide Icons, Recharts, jsPDF, html2canvas, html5-qrcode.
- **Backend**: Node.js, Express 4, TypeScript, Mongoose 8, JWT, bcryptjs, google-auth-library, helmet, express-rate-limit, cors.
- **Database**: MongoDB (Local or MongoDB Atlas).
- **Testing**: Vitest, Supertest.
- **Deployment**: Render Web Service (`render.yaml` Blueprint).

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v20 or newer
- **MongoDB**: Community Server running locally on `127.0.0.1:27017` (or a MongoDB Atlas connection string)

### 2. Clone & Install
```bash
git clone https://github.com/Pavansai-kavuri/smart-campus-event-management-system_CampusFlow.git
cd smart-campus-event-management-system_CampusFlow
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/campusflow
JWT_SECRET=campusflow-local-dev-secret-key-2026-change-in-production
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
VENUE_BUFFER_MINUTES=30
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Seed the Database
Populate the database with pre-configured venues, demo users, sample events, and registrations:
```bash
npm run seed
```

### 5. Launch Development Servers
```bash
npm run dev
```
- **Web App**: [http://localhost:5174](http://localhost:5174)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🔑 Pre-Seeded Evaluation Accounts

| Role | Name | Email / Roll Number | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Pavan Sai Ram Likhith | `Vu.241FA04312@gmail.com` *(or `241FA04312`)* | `CampusFlow@2026` |
| **Organizer** | Prof. Vikram Mehta | `vikram.mehta@campusflow.edu` | `Organizer@2026` |
| **Administrator** | Dr. Aaravind Krishnan | `admin@campusflow.edu` *(or `dean.aaravind@campusflow.edu`)* | `Admin@2026` |

*(You can also use the 1-click Demo Cards on the login screen or the role switcher in the sidebar to switch perspectives instantly.)*

---

## ☁️ Deployment on Render

This repository includes a production-ready **`render.yaml`** configuration:

1. Create a free account on [Render](https://render.com/).
2. Click **New +** $\rightarrow$ **Blueprint** (or **Web Service**).
3. Connect your repository: `smart-campus-event-management-system_CampusFlow`.
4. Set the following environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (`mongodb+srv://...`).
   - `JWT_SECRET`: Any secure random secret string.
   - `NODE_ENV`: `production`
5. Click **Apply** or **Create Web Service**. Render will execute `npm install && npm run build` and launch `npm start`.

---

## 🧪 Testing & Verification

Run the automated integration and unit test suite:
```bash
npm test
```
To check TypeScript compilation across both client and server:
```bash
npm run typecheck
```

---

## 📄 License
Released under the [MIT License](LICENSE). Built for Apex University & the Student Event Community.
