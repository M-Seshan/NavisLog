# NavisLog — Autonomous Logistics & Fleet Operations Engine

A full-stack MERN application with a native Node.js Agentic AI architecture for autonomous fleet management.

---

## 🏗 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React.js 18, React Router v6, Recharts |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose                  |
| Auth       | JWT + bcryptjs                      |
| AI Agents  | Native Node.js (SSE streaming)      |
| Language   | JavaScript only (no TypeScript)     |

---

## 📁 Project Structure

```
navislog/
├── server/                    # Express.js backend
│   ├── agents/                # AI Agents (Dispatch, Maintenance, Audit)
│   │   ├── AgentEngine.js     # Base SSE streaming engine
│   │   ├── DispatchAgent.js   # Fleet dispatch analyzer
│   │   ├── MaintenanceAgent.js# Maintenance issue analyzer
│   │   └── AuditAgent.js      # Fuel ledger auditor
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Auth + upload middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── uploads/               # Uploaded images (auto-created)
│   ├── .env                   # Environment variables
│   └── index.js               # Server entry point
│
└── client/                    # React frontend
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── layout/        # Sidebar, TopNav, AppLayout
        │   └── shared/        # Toast notifications
        ├── context/           # AuthContext, ThemeContext
        ├── pages/
        │   ├── auth/          # Login, Register
        │   ├── admin/         # All admin pages
        │   └── driver/        # All driver pages
        ├── utils/
        │   └── api.js         # Axios instance with JWT interceptor
        ├── App.js             # Routes
        ├── index.js           # Entry point
        └── index.css          # Global styles + themes
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone / Extract the project
```bash
cd navislog
```

### 2. Configure environment
Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/navislog
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/navislog
```

### 3. Install dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4. Run the application

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
Server runs on: `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd client
npm start
```
App opens at: `http://localhost:3000`

---

## 🔑 Authentication & Roles

| Role   | Access                                      |
|--------|---------------------------------------------|
| Admin  | Full dashboard, all management pages, AI agents |
| Driver | Own vehicle, fuel entries, issue reporting  |

### First-time Setup:
1. Open `http://localhost:3000/register`
2. Create an **Admin** account (select role: Admin)
3. Log in as admin
4. Navigate to **Vehicles** → Add vehicles
5. Navigate to **Drivers** → Create driver accounts
6. Assign vehicles to drivers
7. Log in as driver to submit fuel entries and report issues

---

## 🤖 AI Agent Center

Three autonomous agents with **live SSE streaming**:

### Dispatch Agent
- Analyzes fleet vehicle status and assignments
- Reviews active trips and telemetry gaps
- Generates dispatch recommendations

### Maintenance Agent
- Reviews all open maintenance issues by severity
- Compares with historical patterns
- Checks overdue service schedules
- Correlates fuel anomalies with maintenance

### Audit Agent
- Audits all fuel ledger entries
- Detects price anomalies using statistical analysis (2σ threshold)
- Checks fuel type compliance per vehicle
- Generates month-over-month trend reports

All reasoning steps are:
1. Streamed live to the React terminal UI via SSE
2. Persisted to MongoDB `AgentMemory` collection
3. Visible in session history

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List with pagination/search/filter |
| POST | `/api/vehicles` | Create vehicle (Admin) |
| PUT | `/api/vehicles/:id` | Update vehicle (Admin) |
| DELETE | `/api/vehicles/:id` | Delete vehicle (Admin) |
| PUT | `/api/vehicles/:id/assign-driver` | Assign driver (Admin) |
| GET | `/api/vehicles/stats` | Vehicle statistics |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List drivers (Admin) |
| POST | `/api/drivers` | Create driver (Admin) |
| PUT | `/api/drivers/:id` | Update driver (Admin) |
| DELETE | `/api/drivers/:id` | Delete driver (Admin) |
| PUT | `/api/drivers/:id/toggle-status` | Activate/deactivate |

### Fuel
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fuel` | List entries (role-scoped) |
| POST | `/api/fuel` | Submit entry (Driver) |
| PUT | `/api/fuel/:id` | Update entry |
| DELETE | `/api/fuel/:id` | Delete entry |
| GET | `/api/fuel/stats` | Fuel statistics |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | List records (role-scoped) |
| POST | `/api/maintenance` | Report issue (Driver) |
| PUT | `/api/maintenance/:id` | Update/resolve (Admin) |
| DELETE | `/api/maintenance/:id` | Delete (Admin) |
| GET | `/api/maintenance/stats` | Stats |

### Telemetry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telemetry` | Get telemetry (role-scoped) |
| GET | `/api/telemetry/latest` | Latest per vehicle (Admin) |
| POST | `/api/telemetry` | Submit telemetry |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/run/:agentType` | Run agent with SSE stream |
| GET | `/api/agents/history` | Session history |
| GET | `/api/agents/session/:id` | Session details |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Admin dashboard stats |
| GET | `/api/reports/vehicles` | Vehicle report |
| GET | `/api/reports/drivers` | Driver report |

---

## 🗄 MongoDB Collections

| Collection | Description |
|------------|-------------|
| `users` | Admin and Driver accounts |
| `vehicles` | Fleet vehicles |
| `fuellers` | Fuel ledger entries |
| `maintenances` | Maintenance reports |
| `telemetries` | Vehicle telemetry data |
| `trips` | Trip records |
| `notifications` | System notifications |
| `agentmemories` | AI agent session logs |

---

## 🎨 UI Features

- **Dark / Light Theme** — Toggle in top nav
- **Responsive** — Works on mobile, tablet, desktop
- **Empty States** — No fake data; shows guidance when empty
- **Loading Skeletons** — Smooth loading experience
- **Toast Notifications** — Success/error/info feedback
- **Confirmation Dialogs** — Before destructive actions
- **Role-based Navigation** — Sidebar adapts to user role
- **CSV Export** — Download vehicle and driver reports
- **Live Notification Badge** — Updates every 30 seconds

---

## ⚠️ Important Notes

- **Database starts completely empty** — No demo/seed data
- **All data is real** — Only user-entered records appear
- **Driver isolation** — Drivers can only see their own data
- **File uploads** — Images stored in `server/uploads/` (auto-created)
- **JWT tokens** expire in 7 days by default

---

## 🔧 Production Deployment

### Backend
```bash
NODE_ENV=production
# Use a strong JWT_SECRET (32+ random characters)
# Use MongoDB Atlas for production database
# Run: node index.js (or use PM2)
```

### Frontend
```bash
cd client
npm run build
# Serve the build/ folder with nginx or a static host
# Or serve from Express: app.use(express.static('client/build'))
```

---

## 📄 License

MIT — NavisLog Fleet Operations Engine
