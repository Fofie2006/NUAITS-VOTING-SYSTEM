# NUAITS Voting System — Database Setup Guide
## Njala University Association of Information Technology Students

---

## Files in this folder

| File | Purpose | Run Order |
|------|---------|-----------|
| `01_create_tables.sql` | Creates all 6 database tables with constraints and indexes | **1st** |
| `02_seed_data.sql` | Inserts sample election, candidates, students, and admin | **2nd** |
| `03_useful_queries.sql` | Admin queries for monitoring, results, fraud detection | As needed |
| `04_reset_database.sql` | ⚠️ Drops all tables (dev/testing only) | Emergency only |
| `05_stored_procedures.sql` | Optional stored procedures for advanced use | After step 1 |

---

## Step-by-Step Setup in SSMS

### Step 1 — Open SSMS
- Launch **SQL Server Management Studio**
- Connect to your SQL Server instance
  - Server name: `localhost` or `DESKTOP-XYZ\SQLEXPRESS`
  - Authentication: **SQL Server Authentication**
  - Login: `sa` (or your SQL username)
  - Password: your SQL password

### Step 2 — Create the database and tables
1. Click **New Query** (top left toolbar)
2. Open `01_create_tables.sql` in Notepad, copy all text
3. Paste into the SSMS query window
4. Press **F5** or click **Execute**
5. You should see green checkmarks in the Messages tab:
   ```
   ✅ Database nuaits_voting created.
   ✅ Table: students created.
   ✅ Table: candidates created.
   ✅ Table: elections created.
   ✅ Table: votes created.
   ✅ Table: audit_logs created.
   ✅ Table: admins created.
   ```

### Step 3 — Insert sample data (optional but recommended for testing)
1. Open **New Query** again
2. Copy and paste `02_seed_data.sql`
3. Press **F5**
4. You'll see:
   ```
   ✅ Default admin account inserted.
   ✅ Sample election inserted.
   ✅ Sample candidates inserted.
   ✅ Sample students inserted.
   ```

### Step 4 — Configure your backend
Edit `backend/.env`:
```env
DB_SERVER=localhost          # or DESKTOP-XYZ\SQLEXPRESS
DB_PORT=1433
DB_NAME=nuaits_voting
DB_USER=sa
DB_PASSWORD=YourSQLPassword
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

### Step 5 — Start the backend
```bash
cd backend
npm run dev
```
The backend auto-creates tables on startup too (if they don't exist), but running the SQL scripts first is safer.

---

## Database Structure

```
nuaits_voting
├── students       ← Registered voters + voting codes
├── candidates     ← Election candidates by position
├── elections      ← Election control (start/stop/enable)
├── votes          ← One row per vote cast (FK to all 3 above)
├── audit_logs     ← Every system action logged
└── admins         ← Admin panel accounts
```

### Key design decisions

**`students.code_used` (BIT)**
The most critical column. When a student votes, this is flipped from `0` to `1` inside a SQL transaction with `UPDLOCK` row locking. This guarantees a code can never be used twice, even if two requests arrive simultaneously.

**`votes` UNIQUE constraint**
```sql
CONSTRAINT UQ_one_vote_per_position UNIQUE (
    student_db_id, election_id, position
)
```
Even if the application layer somehow failed, the database itself will reject any attempt to vote twice for the same position.

**`audit_logs`**
Every single action — successful votes, failed attempts, admin logins, election start/stop — creates a row in `audit_logs` with IP address, timestamp, and success status. Nothing is silent.

---

## Useful Queries (from `03_useful_queries.sql`)

| Query | What it shows |
|-------|--------------|
| Live Dashboard | Turnout %, votes cast, election status |
| Live Results | Votes per candidate with percentages |
| Winner per Position | Top candidate in each race |
| Not Voted | Students who haven't voted yet |
| Failed Attempts | Security — invalid code entries |
| IP Activity | Detect repeated attempts from one IP |
| Department Turnout | Which departments are voting most |
| Export Results | Full results table for Word/Excel |

---

## Default Admin Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@NUAITS2024` |
| URL | `http://localhost:3000/admin/login` |

**Change this password immediately after first login.**

---

## Troubleshooting

**"Cannot connect to SQL Server"**
- Check SQL Server service is running: `Windows → Services → SQL Server`
- Enable TCP/IP: `SQL Server Configuration Manager → Network Config → TCP/IP → Enabled`
- Check your `DB_SERVER` value matches the SSMS connection name exactly

**"Login failed for user 'sa'"**
- In SSMS: Right-click server → Properties → Security → set to "SQL Server and Windows Authentication"
- Right-click `sa` under Security/Logins → Properties → Status → set Login to "Enabled"
- Restart SQL Server service after changing authentication mode

**"Table already exists" warnings**
- Normal — the scripts are idempotent (safe to run multiple times)
- They check `IF NOT EXISTS` before creating each table

**"Foreign key constraint violation" on votes insert**
- The student, candidate, or election referenced doesn't exist
- Make sure you've inserted candidates and an election before trying to vote

---

## Production Security Notes

- Create a dedicated SQL login for the app (don't use `sa` in production)
- Grant only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on the `nuaits_voting` database
- Enable SQL Server encryption (`DB_ENCRYPT=true` in `.env`)
- Back up the database daily once voting starts
- Keep `04_reset_database.sql` off the production server

---

Built for NUAITS — Njala University, Njala Campus
