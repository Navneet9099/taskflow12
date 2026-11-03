# TaskFlow — Task Management System

A full-stack web application for personal task management, built as a university project.  
Users can register, log in, and manage their own tasks with status tracking, priority levels, filtering, and sorting — all secured with JWT authentication.

---

## Features

- **User Registration & Login** — secure accounts, email uniqueness enforced, passwords hashed with BCrypt
- **JWT Authentication** — stateless, 24-hour tokens; auto-logout on expiry
- **Full Task CRUD** — create, view, edit, and delete tasks
- **Status Tracking** — To Do / In Progress / Completed, quick-change from task card
- **Priority Levels** — Low / Medium / High with colour-coded badges
- **Due Dates** — optional per-task, overdue tasks are highlighted
- **Filtering** — filter by status and/or priority
- **Sorting** — sort by creation date or due date, ascending or descending
- **Task Ownership** — every task is private; accessing another user's task returns 404
- **Swagger UI** — interactive API docs at `/swagger-ui.html`

---

## Tech Stack

| Layer       | Technology                                           |
|-------------|------------------------------------------------------|
| Frontend    | React 18 (Vite), React Router v6, Axios              |
| Styling     | Plain CSS (custom design system, no UI library)      |
| Backend     | Java 21, Spring Boot 3.3.5, Spring Web (REST)        |
| Security    | Spring Security 6, JWT (JJWT 0.12.6), BCrypt         |
| Persistence | Spring Data JPA + Hibernate, MySQL 8                 |
| Validation  | Jakarta Bean Validation (spring-boot-starter-validation) |
| API Docs    | springdoc-openapi 2.5.0 (Swagger UI)                 |
| Build       | Maven 3.9.6 (wrapper), Node 20, npm                  |

---

## Architecture

```
Browser (React SPA)
        │  HTTPS/HTTP + JSON
        ▼
   Axios (Bearer token injected by interceptor)
        │
        ▼
Spring Boot — JwtAuthenticationFilter
        │  validates HS256 token → sets SecurityContext
        ▼
   REST Controllers  (AuthController / TaskController)
        │
        ▼
   Service Layer  (AuthService / TaskService)
        │  business logic, ownership checks
        ▼
   Repository Layer  (JPA Repositories + Specification)
        │
        ▼
   MySQL 8  (tables: users, tasks)

JWT Flow
──────────────────────────────────────────────────────────
1. POST /api/auth/login  →  AuthService validates credentials
2. JwtService.generateToken()  →  HS256 signed, 24 h expiry
3. Client stores token in localStorage
4. Every subsequent request: Authorization: Bearer <token>
5. JwtAuthenticationFilter validates token, loads user,
   sets SecurityContextHolder
6. 401 returned for missing / invalid / expired token
```

---

## Database Schema

### `users`

| Column       | Type             | Notes                        |
|--------------|------------------|------------------------------|
| id           | BIGINT (PK, AI)  | Primary key                  |
| name         | VARCHAR(255)     | Not null                     |
| email        | VARCHAR(255)     | Unique, normalized lowercase |
| password     | VARCHAR(255)     | BCrypt hash                  |
| created_at   | DATETIME(6)      | Set on insert, not updated   |

### `tasks`

| Column       | Type             | Notes                              |
|--------------|------------------|------------------------------------|
| id           | BIGINT (PK, AI)  | Primary key                        |
| title        | VARCHAR(150)     | Not null                           |
| description  | TEXT             | Nullable                           |
| status       | VARCHAR(20)      | Enum: TODO, IN_PROGRESS, COMPLETED |
| priority     | VARCHAR(10)      | Enum: LOW, MEDIUM, HIGH            |
| due_date     | DATE             | Nullable                           |
| created_at   | DATETIME(6)      | Set on insert                      |
| updated_at   | DATETIME(6)      | Updated on every save              |
| user_id      | BIGINT (FK)      | References users(id), not null     |

**Relationship:** One user → many tasks (one-to-many; each task has exactly one owner).

---

## API Endpoints

### Auth (public)

| Method | Path                  | Auth | Purpose                             |
|--------|-----------------------|------|-------------------------------------|
| POST   | /api/auth/register    | No   | Register a new user → 201 UserResponse |
| POST   | /api/auth/login       | No   | Login → 200 AuthResponse (token + user) |

### Tasks (JWT required)

| Method | Path              | Auth | Purpose                                          |
|--------|-------------------|------|--------------------------------------------------|
| GET    | /api/tasks        | Yes  | List current user's tasks (filter + sort params) |
| POST   | /api/tasks        | Yes  | Create a new task → 201 TaskResponse             |
| GET    | /api/tasks/{id}   | Yes  | Get one task by ID (404 if not owned)            |
| PUT    | /api/tasks/{id}   | Yes  | Update task (404 if not owned)                   |
| DELETE | /api/tasks/{id}   | Yes  | Delete task → 204 (404 if not owned)             |

### Filter & Sort query parameters for `GET /api/tasks`

| Param    | Values                          | Default    |
|----------|---------------------------------|------------|
| status   | TODO, IN_PROGRESS, COMPLETED    | (all)      |
| priority | LOW, MEDIUM, HIGH               | (all)      |
| sortBy   | createdAt, dueDate              | createdAt  |
| order    | asc, desc                       | desc       |

---

## Setup

### Prerequisites

- Java 21 (Eclipse Temurin recommended)
- Node.js 20 + npm
- MySQL 8, running on localhost:3306
- Git

### 1 — Create the database

```sql
CREATE DATABASE IF NOT EXISTS taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

*(Hibernate will create the tables automatically on first run.)*

### 2 — Clone and navigate

```powershell
git clone https://github.com/YOUR_USERNAME/taskflow.git
Set-Location taskflow
```

### 3 — Set environment variables (PowerShell — repeat in every new terminal)

```powershell
$env:DB_PASSWORD  = "your_mysql_root_password"
$env:JWT_SECRET   = "a_random_string_of_at_least_32_characters"
# Optional — change backend port (default 8080):
$env:SERVER_PORT  = "8081"
```

> **Never commit these values.** `DB_PASSWORD` and `JWT_SECRET` have no defaults in any committed file and the app will refuse to start if they are missing or the secret is shorter than 32 characters.

### 4 — Run the backend

```powershell
Set-Location backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"  # adjust to your path
.\mvnw.cmd spring-boot:run
```

Backend starts on **http://localhost:8080** (or `$env:SERVER_PORT` if set).

### 5 — Run the frontend

Open a **new PowerShell terminal** in the project root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173** (Vite default).

### Default ports

| Service     | Port | URL                                        |
|-------------|------|--------------------------------------------|
| Backend API | 8080 | http://localhost:8080                      |
| Frontend    | 5173 | http://localhost:5173                      |
| Swagger UI  | 8080 | http://localhost:8080/swagger-ui.html      |

---

## Validation Rules

| Field            | Rule                                      |
|------------------|-------------------------------------------|
| name             | Not blank                                 |
| email            | Valid format, unique (normalized lowercase) |
| password         | Minimum 8 characters                      |
| task title       | Not blank, max 150 characters             |
| task status      | One of: TODO, IN_PROGRESS, COMPLETED      |
| task priority    | One of: LOW, MEDIUM, HIGH                 |
| task due date    | Optional; ISO date format (YYYY-MM-DD)    |

---

## Security Notes

- Passwords stored as **BCrypt** hashes (cost factor 10); plain text is never stored or logged.
- JWT tokens use **HS256** algorithm, signed with a secret of ≥ 32 characters. Expiry: 24 hours.
- Wrong email or wrong password both return the **same 401 message** ("Invalid email or password") to prevent account enumeration.
- Accessing or mutating another user's task returns **404** (not 403) so that resource existence is not revealed.
- Sessions are **stateless** (no server-side session); CSRF is disabled (token-based API).
- CORS is configured to allow only `http://localhost:5173` and `http://127.0.0.1:5173` by default. Override with `CORS_ALLOWED_ORIGINS` env var.

---

## Project Structure

```
Task_Flow12/
├── backend/
│   ├── src/main/java/com/taskflow/
│   │   ├── config/          # OpenApiConfig, SecurityConfig
│   │   ├── controller/      # AuthController, TaskController
│   │   ├── dto/             # Request/response DTOs
│   │   ├── entity/          # User, Task, TaskStatus, TaskPriority
│   │   ├── exception/       # GlobalExceptionHandler, custom exceptions
│   │   ├── repository/      # UserRepository, TaskRepository, TaskSpecification
│   │   ├── security/        # JwtService, JwtAuthenticationFilter, UserPrincipal,
│   │   │                    #   CustomUserDetailsService, entry/denied handlers
│   │   └── service/         # AuthService, TaskService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── application-example.properties
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/             # axios.js (interceptors)
│   │   ├── components/      # Navbar, TaskCard, TaskModal, ConfirmModal, ProtectedRoute
│   │   ├── context/         # AuthContext, ToastContext
│   │   ├── pages/           # LoginPage, RegisterPage, DashboardPage, NotFoundPage
│   │   ├── styles/          # app.css
│   │   ├── utils/           # constants.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── README.md
├── REPORT_NOTES.md
└── DEMO_SCRIPT.md
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `DB_PASSWORD is not configured` at startup | Set `$env:DB_PASSWORD` in the same terminal before running Maven |
| `JWT_SECRET must be at least 32 characters` | Set `$env:JWT_SECRET` to a longer string |
| Port already in use | Set `$env:SERVER_PORT = "8081"` (or another free port) |
| `JAVA_HOME` picks up wrong JDK | Set `$env:JAVA_HOME` to the JDK 21 installation path |
| CORS error in browser | Confirm frontend runs on port 5173; confirm backend has `cors.allowed-origins` set |
| `npm run dev` shows `VITE_API_BASE_URL` warning | Copy `.env.example` to `.env` and fill in the backend URL |

