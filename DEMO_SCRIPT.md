# DEMO_SCRIPT — TaskFlow Live Demonstration (3–4 minutes)

---

## Before You Start

1. Start the backend (port 8081):
   ```powershell
   $env:DB_PASSWORD = "your_mysql_password"
   $env:JWT_SECRET  = "your_jwt_secret_key_at_least_32_characters"
   $env:SERVER_PORT = "8081"
   $env:JAVA_HOME   = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
   Set-Location backend
   .\mvnw.cmd spring-boot:run
   ```

2. Start the frontend (separate terminal):
   ```powershell
   Set-Location frontend
   npm run dev
   ```

3. Open the browser to **http://localhost:5173**.

4. Reset the database to a clean state:
   ```sql
   USE taskflow;
   DELETE FROM tasks;
   DELETE FROM users;
   ```

5. Optionally seed demo data (see below) **after** registering the demo account.

---

## Seed Data (run after registering demo@taskflow.com)

Log in once to get the user ID, then create tasks via Swagger UI at  
**http://localhost:8081/swagger-ui.html** or directly with PowerShell:

```powershell
# Replace <TOKEN> with the actual JWT from the login response
$token = "<TOKEN>"
$base  = "http://localhost:8081"

# Task 1 — High priority, overdue
Invoke-RestMethod -Uri "$base/api/tasks" -Method Post `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"title":"Submit university project report","description":"Compile all sections and export to PDF.","status":"IN_PROGRESS","priority":"HIGH","dueDate":"2026-11-05"}'

# Task 2 — Medium priority, future due date
Invoke-RestMethod -Uri "$base/api/tasks" -Method Post `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"title":"Prepare demo presentation slides","description":"Cover architecture, API, and live demo flow.","status":"TODO","priority":"MEDIUM","dueDate":"2026-11-04"}'

# Task 3 — Low priority, completed
Invoke-RestMethod -Uri "$base/api/tasks" -Method Post `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"title":"Set up local development environment","description":"Java 21, Node 20, MySQL 8, Maven wrapper.","status":"COMPLETED","priority":"LOW","dueDate":null}'

# Task 4 — High priority, no due date
Invoke-RestMethod -Uri "$base/api/tasks" -Method Post `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"title":"Review security implementation","description":"Check JWT filter, BCrypt hashing, and ownership rules.","status":"TODO","priority":"HIGH","dueDate":null}'

# Task 5 — Medium, in progress
Invoke-RestMethod -Uri "$base/api/tasks" -Method Post `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body '{"title":"Write README and documentation","description":"README.md, REPORT_NOTES.md, and DEMO_SCRIPT.md.","status":"IN_PROGRESS","priority":"MEDIUM","dueDate":"2026-11-05"}'
```

---

## Demo Script

### [0:00 – 0:30] Introduction

> "This is TaskFlow, a personal task management system I built as my university project. It's a full-stack web application — React on the front end, Spring Boot on the back end, MySQL for the database, and JWT for authentication."

Open **http://localhost:5173** — the Register page appears.

---

### [0:30 – 1:00] Register and Auto-Login

> "First I'll create an account. The system requires a name, a valid email, and a password of at least 8 characters."

- Fill in: **Name** = `Demo User`, **Email** = `demo@taskflow.com`, **Password** = `demo1234`
- Click **Create Account**.
- Point out: "Registration calls `POST /api/auth/register`. After success, the app immediately logs in and redirects to the dashboard — no need to type credentials twice."

The dashboard appears with the welcome navbar showing "D" avatar.

---

### [1:00 – 1:45] Create and View Tasks

> "The dashboard starts empty. I'll add a few tasks."

- Click **Add Task**.
- Title: `Submit university project report`
- Status: In Progress, Priority: High, Due Date: today's date
- Click **Create Task** → task appears in the grid.

> "Each card shows the status badge, priority badge, and due date. This one is overdue so the date is highlighted in red."

- Click **Add Task** again.
- Title: `Prepare demo slides`, Status: To Do, Priority: Medium, Due Date: tomorrow
- Click **Create Task** → second card appears.

---

### [1:45 – 2:15] Edit and Quick-Status Change

> "Editing is straightforward."

- Click **Edit** on the first card.
- Change description to: `Finalize all sections and export to PDF`
- Click **Save Changes** → toast confirms update.

> "I can also change status directly from the card without opening a modal."

- On the second card, use the status dropdown → select **In Progress** → toast shows status changed.

---

### [2:15 – 2:40] Filter and Sort

> "With multiple tasks, filtering helps focus on what matters."

- In the toolbar: **Status** → "In Progress" → cards narrow to in-progress tasks.
- Change **Status** back to All, then **Priority** → High → shows high-priority cards.
- Click **Clear Filters**.
- **Sort by** → Due Date → toggle to Ascending → cards reorder.

> "Filtering and sorting work together via query parameters sent to the backend."

---

### [2:40 – 3:00] Delete with Confirmation

> "Deleting requires confirmation to prevent accidents."

- Click **Delete** on any card → modal appears with task title.
- Click **Yes, Delete** → task removed, toast confirms.

---

### [3:00 – 3:20] Security Demonstration (Optional – if time allows)

> "Every task is private. The backend returns 404, not 403, when a user tries to access another user's task — so even the existence of the resource is hidden."

Open Swagger UI: **http://localhost:8081/swagger-ui.html**

- Show the **Authorize** button → paste the JWT token.
- Call `GET /api/tasks` → shows tasks.
- Explain: "Without the token, every task endpoint returns 401 immediately."

---

### [3:20 – 3:30] Logout

> "Logging out clears the token from local storage."

- Click **Sign Out** in the navbar → redirected to Login page.
- If you try to navigate to `/` directly, ProtectedRoute sends you back to `/login`.

---

## Database Reset Commands

Run these in MySQL CLI or a GUI (e.g. MySQL Workbench) to reset before each demo:

```sql
USE taskflow;
DELETE FROM tasks;
DELETE FROM users;
```

*(Hibernate keeps the table schema; only data is cleared.)*

