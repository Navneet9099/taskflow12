# REPORT_NOTES — TaskFlow Individual Project Report Material

> These notes map directly to the sections of a typical university software engineering project report.
> All content describes only what is implemented and verified. No promises or aspirational features.

---

## 1. Project Overview

**Project Title:** TaskFlow — Personal Task Management System  
**Type:** Full-stack web application  
**Deadline:** November 5, 2026

TaskFlow is a single-user task manager where each registered user has a private, isolated task list. The system allows users to create, edit, filter, sort, change the status of, and delete tasks through a browser-based interface backed by a secure REST API.

**Problem statement:** Students and professionals frequently lose track of individual work items and deadlines. Existing tools are either too complex or require paid subscriptions. TaskFlow provides a clean, self-hosted alternative with the core workflow: capture → prioritise → track → complete.

---

## 2. Objectives and Scope

### Objectives
1. Build a working register → login → task CRUD flow using industry-standard technologies.
2. Enforce user-level data isolation so that no user can read or modify another user's tasks.
3. Provide filtering and sorting without pagination to keep scope manageable.
4. Secure all task endpoints with JWT and hash all passwords with BCrypt.
5. Generate interactive API documentation via Swagger UI.

### In-scope
- User registration and login
- JWT-protected task CRUD (Create, Read, Update, Delete)
- Task fields: title, description, status, priority, due date
- Filter by status and priority; sort by creation date or due date
- Responsive single-page frontend

### Out-of-scope (explicitly excluded)
- Team/shared tasks, role-based access control
- Email notifications or reminders
- File attachments
- Pagination or search
- Dark mode
- Mobile native app

---

## 3. System Architecture

### Layers

```
Presentation Layer  →  React SPA (Vite)
          │  HTTP + JSON (Axios)
          ▼
Security Layer  →  Spring Security 6 + JwtAuthenticationFilter
          │
          ▼
Application Layer  →  Spring Boot REST Controllers
          │
          ▼
Business Logic Layer  →  Spring @Service classes
          │
          ▼
Data Access Layer  →  Spring Data JPA Repositories
          │
          ▼
Database Layer  →  MySQL 8
```

### Key design decisions
- **Stateless backend:** No server-side sessions. The JWT carries the user identity on every request.
- **Layered separation:** Controllers know nothing about JPA; services know nothing about HTTP request/response objects.
- **Specification pattern:** `TaskSpecification` builds JPA `Predicate` objects dynamically so filtering can combine status and priority without hardcoding query permutations.
- **DTO isolation:** Entities are never serialised directly to JSON. DTOs (request/response) decouple the API contract from the database model.

---

## 4. Technology Stack with Justification

| Technology | Version | Justification |
|---|---|---|
| React (Vite) | 18 / 5 | Component model suits a dashboard; Vite provides fast HMR for development |
| React Router | 6 | Client-side routing needed for SPA without page reloads |
| Axios | 1.x | Interceptors allow transparent JWT injection and 401 redirect |
| Java | 21 (LTS) | Long-term support, records, modern switch (used implicitly via Spring) |
| Spring Boot | 3.3.5 | Convention-over-configuration; integrates security, JPA, validation in one POM |
| Spring Security | 6.x | Industry standard; SecurityFilterChain API matches Spring Boot 3 |
| JJWT | 0.12.6 | De-facto standard JWT library for JVM; fluent builder API |
| Spring Data JPA | (via Boot) | Removes boilerplate repository code; Specification API for dynamic queries |
| MySQL | 8 | Widely deployed, ACID-compliant, well supported by Hibernate |
| springdoc-openapi | 2.5.0 | Auto-generates OpenAPI 3 spec from annotations; serves Swagger UI |
| Maven (wrapper) | 3.9.6 | Reproducible builds without requiring Maven installed globally |

---

## 5. Database Design

### Entity-Relationship Summary

```
users (1) ──< tasks (many)
```

Every task has exactly one owner (`user_id` FK). A user can have zero or more tasks.

### `users` table

| Column     | SQL Type      | Constraints                         |
|------------|---------------|-------------------------------------|
| id         | BIGINT        | PRIMARY KEY, AUTO_INCREMENT         |
| name       | VARCHAR(255)  | NOT NULL                            |
| email      | VARCHAR(255)  | NOT NULL, UNIQUE                    |
| password   | VARCHAR(255)  | NOT NULL (BCrypt hash)              |
| created_at | DATETIME(6)   | NOT NULL, set on insert             |

### `tasks` table

| Column      | SQL Type     | Constraints                                     |
|-------------|--------------|--------------------------------------------------|
| id          | BIGINT       | PRIMARY KEY, AUTO_INCREMENT                      |
| title       | VARCHAR(150) | NOT NULL                                         |
| description | LONGTEXT     | NULLABLE                                         |
| status      | VARCHAR(20)  | NOT NULL, default TODO                           |
| priority    | VARCHAR(10)  | NOT NULL, default MEDIUM                         |
| due_date    | DATE         | NULLABLE                                         |
| created_at  | DATETIME(6)  | NOT NULL, set on insert                          |
| updated_at  | DATETIME(6)  | NOT NULL, updated on every save                  |
| user_id     | BIGINT       | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE |

### ORM mapping
- `User` and `Task` are JPA `@Entity` classes managed by Hibernate.
- `ddl-auto=update` lets Hibernate create/alter tables on startup.
- `TaskStatus` and `TaskPriority` are Java enums stored as VARCHAR.

---

## 6. API Design

### Principles
- RESTful resource naming (`/api/tasks`, `/api/tasks/{id}`)
- Consistent JSON error envelope: `{ "status": 4xx, "message": "...", "fieldErrors": {...} }`
- Validation errors: 400 with `fieldErrors` map (field name → message)
- Duplicate email: 409 Conflict
- Wrong credentials: 401 with a **generic** message (no account enumeration)
- Missing/invalid JWT: 401 JSON (no redirect, not HTML)
- Another user's task: 404 (ownership hidden)

### Endpoints (summary)

```
POST   /api/auth/register  →  201 UserResponse
POST   /api/auth/login     →  200 AuthResponse { token, user }

GET    /api/tasks           →  200 List<TaskResponse>  (filterable, sortable)
POST   /api/tasks           →  201 TaskResponse
GET    /api/tasks/{id}      →  200 TaskResponse
PUT    /api/tasks/{id}      →  200 TaskResponse
DELETE /api/tasks/{id}      →  204 No Content
```

---

## 7. Security Implementation

### Password hashing
BCrypt with Spring Security's `BCryptPasswordEncoder` (cost factor 10). The hash is stored in the database; the raw password is discarded immediately after hashing and never logged.

### JWT
- Algorithm: HS256 (HMAC SHA-256)
- Claims: `sub` = user email, `iat` = issued-at, `exp` = expiry (24 hours from `jwt.expiration-ms`)
- Secret: injected from `JWT_SECRET` environment variable. App fails fast at startup if the secret is absent or shorter than 32 characters.
- Transmission: `Authorization: Bearer <token>` header on every protected request.
- Validation: `JwtAuthenticationFilter` (extends `OncePerRequestFilter`) parses and validates the token before the controller runs. On failure the filter lets the request continue unauthenticated; the Security config then produces a 401 JSON response via `CustomAuthenticationEntryPoint`.

### CORS
Allowed origins: `http://localhost:5173`, `http://127.0.0.1:5173` (configurable via env var). Methods: GET, POST, PUT, DELETE, OPTIONS. Headers: Authorization, Content-Type.

### Session management
`SessionCreationPolicy.STATELESS` — Spring Security never creates or uses an HTTP session. This makes horizontal scaling straightforward and eliminates session fixation risk.

### CSRF
Disabled. Token-based APIs are not vulnerable to CSRF because browsers do not automatically send the `Authorization` header.

---

## 8. Frontend Design

### Structure
- **React SPA** served by Vite dev server (development) or a static host (production build).
- **React Router v6** manages `/, /login, /register, /404` routes. `ProtectedRoute` wraps authenticated pages; an unauthenticated user is redirected to `/login`.
- **AuthContext** stores the JWT and user object in `localStorage`, exposes `login`, `register`, `logout` functions, and broadcasts an `auth:unauthorized` custom event when a 401 is received on a protected endpoint.
- **Axios interceptor** automatically attaches `Authorization: Bearer <token>` to every request and redirects to `/login?expired=true` on 401 from non-auth endpoints.
- **ToastContext** provides a global `showToast(message, type)` function; toast components self-dismiss after 3.5 s and can be closed manually.

### Pages and components
| Component | Purpose |
|---|---|
| `LoginPage` | Email + password form; shows `?expired=true` banner on session expiry |
| `RegisterPage` | Name, email, password, confirm-password; client-side validation + auto-login |
| `DashboardPage` | Task list, filter toolbar, add/edit modals, delete confirm |
| `TaskCard` | Displays one task; inline quick-status change select |
| `TaskModal` | Controlled form for create and edit |
| `ConfirmModal` | Reusable destructive-action confirmation dialog |
| `Navbar` | Brand, user avatar, sign-out button |

### Keyboard and accessibility
- All form inputs have `<label>` elements with `htmlFor`.
- Modals trap `Escape` to close.
- Forms submit on `Enter`.
- `:focus-visible` outlines on all interactive elements.
- ARIA roles (`role="dialog"`, `aria-modal`, `aria-labelledby`) on modals.
- Toast container has `aria-live="polite"`.

---

## 9. Implementation Challenges and Solutions

| Challenge | Solution |
|---|---|
| Port 8080 occupied by Jenkins (system service) | Added `server.port=${SERVER_PORT:8080}`; runs on 8081 locally |
| JDK 21 vs JDK 17 pickup by Maven wrapper | Set `JAVA_HOME` explicitly per terminal session |
| Maven wrapper URL was generic path, failed to download | Updated `maven-wrapper.properties` to exact version URL |
| Sandbox blocks Maven repo download | Ran download-heavy commands with network bypass |
| DataInitializer seeded hardcoded users, broke auth tests | Deleted `DataInitializer.java`; cleaned database with SQL |
| Duplicate `UserDetailsService` bean caused Spring boot failure | Removed placeholder bean, kept only `CustomUserDetailsService` |
| JWT secret shorter than 32 chars caused HMAC key error | Added startup validation that throws `IllegalStateException` if too short |

---

## 10. Testing and Verification

### Automated end-to-end script (Phase 2, 19 checks)

A PowerShell script executed at the end of Phase 2 verified:

| Check | Endpoint | Expected Result |
|---|---|---|
| 1 | POST /api/auth/register | 201, no password field in response |
| 2 | POST /api/auth/register (User B) | 201 |
| 3 | POST /api/auth/login (User A) | 200, token received |
| 4 | POST /api/auth/login (User B) | 200 |
| 5 | Register duplicate email | 409 |
| 6 | Register short password | 400 |
| 7 | Login wrong password | 401, generic message |
| 8 | Login nonexistent email | 401, generic message |
| 9 | GET /api/tasks without token | 401 |
| 10 | GET /api/tasks with garbage token | 401 |
| 11 | User A creates a task | 201 |
| 12 | User B GET User A's task | 404 |
| 13 | User B PUT User A's task | 404 |
| 14 | User B DELETE User A's task | 404 |
| 15 | User B GET /api/tasks | 200, count = 0 |
| 16 | User A GET /api/tasks | 200, count = 1 |
| 17 | User A updates task | 200 |
| 18 | User A deletes task | 204 |
| 19 | CORS preflight from :5173 | 200, correct Allow-Origin header |

**Result: all 19 checks passed.**

### Manual testing (Phase 3)
- Register → login → create task → edit task → change status inline → filter by status and priority → sort by due date → delete → logout verified manually in browser.

---

## 11. Validation Rules

| Entity | Field | Rule |
|---|---|---|
| User | name | `@NotBlank` |
| User | email | `@NotBlank`, `@Email`, unique in DB, normalised to lowercase |
| User | password | `@Size(min=8)` |
| Task | title | `@NotBlank`, `@Size(max=150)` |
| Task | status | Must match `TaskStatus` enum (validated by Spring) |
| Task | priority | Must match `TaskPriority` enum (validated by Spring) |
| Task | due_date | Optional; ISO 8601 `LocalDate` |

Invalid field requests → HTTP 400 with `fieldErrors` map.  
Duplicate email → HTTP 409 with message.

---

## 12. Security Considerations

1. **No secret in committed code.** `DB_PASSWORD` and `JWT_SECRET` are read exclusively from environment variables. The application will not start if they are missing or too short.
2. **Credential leakage prevention.** Wrong email and wrong password return the identical 401 message.
3. **Ownership isolation.** `TaskRepository.findByIdAndUserId()` is used for all single-task operations. If the task does not belong to the requesting user, the result is `Optional.empty()`, which the service converts to 404 — not 403 — so the existence of a resource is not revealed.
4. **BCrypt.** The password hash cannot be reversed; even if the database were compromised, raw passwords are not exposed.
5. **Stateless JWT.** No session fixation or session hijacking vectors.

---

## 13. Project Structure

```
backend/src/main/java/com/taskflow/
├── config/          SecurityConfig.java, OpenApiConfig.java
├── controller/      AuthController.java, TaskController.java
├── dto/             RegisterRequest, LoginRequest, AuthResponse,
│                    UserResponse, TaskRequestDto, TaskResponseDto, ErrorResponseDto
├── entity/          User.java, Task.java, TaskStatus.java, TaskPriority.java
├── exception/       GlobalExceptionHandler.java,
│                    ResourceNotFoundException.java, DuplicateResourceException.java,
│                    BadRequestException.java
├── repository/      UserRepository.java, TaskRepository.java, TaskSpecification.java
├── security/        JwtService.java, JwtAuthenticationFilter.java,
│                    UserPrincipal.java, CustomUserDetailsService.java,
│                    CustomAuthenticationEntryPoint.java, CustomAccessDeniedHandler.java
└── service/         AuthService.java, TaskService.java

frontend/src/
├── api/             axios.js
├── components/      Navbar, TaskCard, TaskModal, ConfirmModal, ProtectedRoute
├── context/         AuthContext.jsx, ToastContext.jsx
├── pages/           LoginPage, RegisterPage, DashboardPage, NotFoundPage
├── styles/          app.css
└── utils/           constants.js
```

---

## 14. Lessons Learned and Reflections

1. **Environment parity matters.** The Jenkins port conflict (8080) demonstrated that every environment-specific value should be externalised from the start, not retrofitted.
2. **Fail-fast beats silent misconfiguration.** Throwing `IllegalStateException` on missing or short JWT secret catches misconfiguration at startup rather than at the first authenticated request.
3. **DTO discipline pays off.** Returning entity objects directly from controllers would have accidentally exposed the password hash; DTOs made that impossible.
4. **Security defaults are strict in Spring Boot 3.** The `SecurityFilterChain` bean with a `permitAll` on public paths and `authenticated()` on everything else was simpler to reason about than the old `WebSecurityConfigurerAdapter` approach.
5. **Frontend error handling should be defensive.** The Axios response interceptor that catches 401 and redirects to `/login?expired=true` saved significant repeated error-handling code in each page component.
6. **Ownership as 404, not 403.** This is a subtle but important security pattern: returning 404 for another user's resource prevents confirming that the resource exists, which could otherwise allow an attacker to enumerate task IDs.

