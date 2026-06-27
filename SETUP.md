# NUAITS Online Voting System — Setup Guide

## System Requirements

- **Node.js** v18 or higher
- **Microsoft SQL Server** 2019+ (or Express edition — free)
- **SSMS** (SQL Server Management Studio) — optional, for database viewing
- **Git** (for version control)

---

## Project Structure

```
nuaits-voting/
├── backend/              ← Node.js + Express API
│   ├── config/           ← Database connection
│   ├── controllers/      ← Business logic
│   ├── middleware/       ← Auth, validation
│   ├── routes/           ← API endpoints
│   ├── utils/            ← Email, code generator, audit logger
│   ├── server.js         ← Entry point
│   ├── .env.example      ← Config template
│   └── package.json
├── frontend/             ← React + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/   ← Home, Vote, About, Results
│   │   │   └── admin/    ← Dashboard, Students, Candidates, Election, Results, Logs
│   │   ├── components/
│   │   ├── context/      ← Auth context
│   │   └── utils/        ← API service
│   └── package.json
└── SETUP.md
```

---

## Step 1: Database Setup (SQL Server)

1. Open **SSMS** and connect to your SQL Server instance

2. Create the database:
```sql
CREATE DATABASE nuaits_voting;
```

3. Note your connection details:
   - Server name (e.g., `localhost` or `DESKTOP-XYZ\SQLEXPRESS`)
   - Authentication method (SQL Auth recommended)
   - Username and password

---

## Step 2: Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DB_SERVER=localhost          # or your SQL Server instance name
DB_PORT=1433
DB_NAME=nuaits_voting
DB_USER=sa                   # your SQL username
DB_PASSWORD=YourPassword123!

# JWT (change this in production!)
JWT_SECRET=change_this_to_a_long_random_string

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password   # Use Gmail App Password, not regular password

# Admin login
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@NUAITS2024
ADMIN_EMAIL=admin@njala.edu.sl

# Frontend URL (update for production)
FRONTEND_URL=http://localhost:3000
VOTING_PORTAL_URL=http://localhost:3000/vote
```

### Gmail App Password Setup
1. Go to Google Account → Security → 2-Step Verification (enable it)
2. Go to Google Account → Security → App passwords
3. Generate password for "Mail" → use it as `EMAIL_PASSWORD`

---

## Step 3: Install Dependencies

From the project root:
```bash
npm run install:all
```

Or manually:
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

## Step 4: Start the Application

### Development (two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Server runs at: http://localhost:5000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```
App opens at: http://localhost:3000

---

## Step 5: First Login

1. Open http://localhost:3000/admin/login
2. Login with:
   - Username: `admin` (or what you set in .env)
   - Password: `Admin@NUAITS2024` (or what you set in .env)
3. **Change your password immediately** from the admin panel

---

## Step 6: Election Setup Workflow

Follow this order:

1. **Add Candidates** → Admin → Candidates → Add Candidate
2. **Register Students** → Admin → Students → Add Student
   - Voting codes are auto-generated
   - Credentials are emailed automatically
3. **Create Election** → Admin → Election Control → New Election
4. **Start Election** → Click "Start Election" button
5. **Enable Voting** → Click "Enable Voting" when ready
6. **Monitor** → Dashboard shows live turnout
7. **End Election** → Click "End Election" to close voting
8. **View Results** → Admin → Results → select election

---

## API Endpoints Reference

### Public (no auth)
```
GET  /api/election/active          - Active election info
GET  /api/candidates               - All candidates
POST /api/vote/validate            - Verify student credentials
POST /api/vote/submit              - Submit votes
```

### Admin (Bearer token required)
```
POST /api/auth/login               - Admin login
GET  /api/admin/dashboard          - Stats overview
GET  /api/admin/students           - List students
POST /api/admin/students           - Add student
PUT  /api/admin/students/:id       - Update student
DEL  /api/admin/students/:id       - Delete student
POST /api/admin/students/:id/resend-email
GET  /api/admin/candidates         - List candidates
POST /api/admin/candidates         - Add candidate
PUT  /api/admin/candidates/:id     - Update candidate
DEL  /api/admin/candidates/:id     - Delete candidate
GET  /api/admin/elections          - List elections
POST /api/admin/elections          - Create election
PUT  /api/admin/elections/:id/status - Update election status/voting
GET  /api/admin/elections/:id/results - Election results
GET  /api/admin/logs               - Audit logs
GET  /api/admin/logs/invalid-attempts - Failed voting attempts
```

---

## Production Deployment

### Backend (Node.js server)
```bash
cd backend
NODE_ENV=production npm start
```

Use **PM2** to keep it running:
```bash
npm install -g pm2
pm2 start server.js --name nuaits-backend
pm2 startup
pm2 save
```

### Frontend (Build static files)
```bash
cd frontend
npm run build
```

Deploy the `build/` folder to:
- **Nginx** / **Apache** web server
- **Netlify** / **Vercel** (configure proxy for API)
- **cPanel** file manager

### Nginx Config Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /var/www/nuaits-voting/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (64+ random characters)
- [ ] Use HTTPS in production (SSL certificate)
- [ ] Set DB_ENCRYPT=true for production SQL Server
- [ ] Keep .env file out of Git (add to .gitignore)
- [ ] Configure firewall — only expose ports 80/443
- [ ] SQL Server: disable SA account, use least-privilege DB user
- [ ] Enable SQL Server encryption if on a network

---

## Troubleshooting

**Database connection failed:**
- Check SQL Server is running (Services → SQL Server)
- Verify DB_SERVER matches your instance name (check SSMS)
- Enable TCP/IP in SQL Server Configuration Manager
- Check firewall allows port 1433

**Email not sending:**
- Verify Gmail App Password (not regular password)
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Try EMAIL_SECURE=false with port 587

**"Voting is not currently open":**
- Go to Admin → Election Control
- Ensure election status is "active" AND voting_enabled is ON

**Frontend can't reach backend:**
- Verify backend is running on port 5000
- Check `"proxy": "http://localhost:5000"` in frontend/package.json
- In production, configure Nginx/Apache reverse proxy

---

## Default Credentials

| Role  | Username | Password          |
|-------|----------|-------------------|
| Admin | admin    | Admin@NUAITS2024  |

**Change these immediately after first login!**

---

Built with ❤️ for NUAITS — Njala University Association of Information Technology Students
