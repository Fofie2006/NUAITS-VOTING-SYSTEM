-- =====================================================
-- NUAITS VOTING SYSTEM — DATABASE SETUP SCRIPT
-- Njala University Association of IT Students
-- Run this in SSMS (SQL Server Management Studio)
-- =====================================================
-- HOW TO USE:
-- 1. Open SSMS and connect to your SQL Server
-- 2. Click "New Query"
-- 3. Paste this entire file
-- 4. Press F5 or click Execute
-- =====================================================

-- Step 1: Create the database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'nuaits_voting')
BEGIN
    CREATE DATABASE nuaits_voting;
    PRINT '✅ Database nuaits_voting created.';
END
ELSE
BEGIN
    PRINT '⚠️  Database nuaits_voting already exists — skipping creation.';
END
GO

USE nuaits_voting;
GO

-- =====================================================
-- TABLE 1: students
-- Stores all registered voters and their voting codes
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='students' AND xtype='U')
BEGIN
    CREATE TABLE students (
        id          INT IDENTITY(1,1)   NOT NULL,
        fullname    NVARCHAR(200)        NOT NULL,
        student_id  NVARCHAR(50)         NOT NULL,
        email       NVARCHAR(200)        NOT NULL,
        department  NVARCHAR(200)        NOT NULL,
        level       NVARCHAR(50)         NOT NULL,
        voting_code NVARCHAR(20)         NOT NULL,
        code_used   BIT                  NOT NULL DEFAULT 0,
        email_sent  BIT                  NOT NULL DEFAULT 0,
        created_at  DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_students        PRIMARY KEY (id),
        CONSTRAINT UQ_student_id      UNIQUE (student_id),
        CONSTRAINT UQ_student_email   UNIQUE (email),
        CONSTRAINT UQ_voting_code     UNIQUE (voting_code)
    );

    -- Index for fast credential lookups at voting time
    CREATE INDEX IDX_students_student_id
        ON students (student_id);

    CREATE INDEX IDX_students_voting_code
        ON students (voting_code);

    CREATE INDEX IDX_students_code_used
        ON students (code_used);

    PRINT '✅ Table: students created.';
END
ELSE
    PRINT '⚠️  Table: students already exists — skipped.';
GO

-- =====================================================
-- TABLE 2: candidates
-- Stores all election candidates across all positions
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='candidates' AND xtype='U')
BEGIN
    CREATE TABLE candidates (
        id          INT IDENTITY(1,1)   NOT NULL,
        fullname    NVARCHAR(200)        NOT NULL,
        photo       NVARCHAR(500)        NULL,
        position    NVARCHAR(200)        NOT NULL,
        department  NVARCHAR(200)        NULL,
        manifesto   NVARCHAR(MAX)        NULL,
        votes       INT                  NOT NULL DEFAULT 0,
        created_at  DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_candidates PRIMARY KEY (id)
    );

    -- Index for filtering candidates by position
    CREATE INDEX IDX_candidates_position
        ON candidates (position);

    PRINT '✅ Table: candidates created.';
END
ELSE
    PRINT '⚠️  Table: candidates already exists — skipped.';
GO

-- =====================================================
-- TABLE 3: elections
-- One row per election; controls voting lifecycle
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='elections' AND xtype='U')
BEGIN
    CREATE TABLE elections (
        id              INT IDENTITY(1,1)   NOT NULL,
        title           NVARCHAR(300)        NOT NULL,
        description     NVARCHAR(MAX)        NULL,
        status          NVARCHAR(20)         NOT NULL DEFAULT 'pending',
        voting_enabled  BIT                  NOT NULL DEFAULT 0,
        start_time      DATETIME2            NULL,
        end_time        DATETIME2            NULL,
        created_at      DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_elections      PRIMARY KEY (id),
        CONSTRAINT CHK_election_status CHECK (
            status IN ('pending', 'active', 'ended')
        )
    );

    -- Index for quickly finding the active election
    CREATE INDEX IDX_elections_status
        ON elections (status, voting_enabled);

    PRINT '✅ Table: elections created.';
END
ELSE
    PRINT '⚠️  Table: elections already exists — skipped.';
GO

-- =====================================================
-- TABLE 4: votes
-- One row per candidate selection per voter
-- The most critical table — protected by transaction + row lock
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='votes' AND xtype='U')
BEGIN
    CREATE TABLE votes (
        id              INT IDENTITY(1,1)   NOT NULL,
        student_db_id   INT                  NOT NULL,
        student_id      NVARCHAR(50)         NOT NULL,
        candidate_id    INT                  NOT NULL,
        position        NVARCHAR(200)        NOT NULL,
        election_id     INT                  NOT NULL,
        ip_address      NVARCHAR(50)         NULL,
        timestamp       DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_votes          PRIMARY KEY (id),

        CONSTRAINT FK_votes_student  FOREIGN KEY (student_db_id)
            REFERENCES students (id),

        CONSTRAINT FK_votes_candidate FOREIGN KEY (candidate_id)
            REFERENCES candidates (id),

        CONSTRAINT FK_votes_election  FOREIGN KEY (election_id)
            REFERENCES elections (id),

        -- CRITICAL: Prevents double-voting on same position in same election
        -- Even if the application layer fails, the DB will reject it
        CONSTRAINT UQ_one_vote_per_position UNIQUE (
            student_db_id,
            election_id,
            position
        )
    );

    -- Index for fast result tallying
    CREATE INDEX IDX_votes_election_candidate
        ON votes (election_id, candidate_id);

    CREATE INDEX IDX_votes_student
        ON votes (student_db_id, election_id);

    CREATE INDEX IDX_votes_position
        ON votes (election_id, position);

    PRINT '✅ Table: votes created.';
END
ELSE
    PRINT '⚠️  Table: votes already exists — skipped.';
GO

-- =====================================================
-- TABLE 5: audit_logs
-- Full activity trail — every action logged
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
BEGIN
    CREATE TABLE audit_logs (
        id          INT IDENTITY(1,1)   NOT NULL,
        action      NVARCHAR(100)        NOT NULL,
        description NVARCHAR(MAX)        NULL,
        student_id  NVARCHAR(50)         NULL,
        admin_user  NVARCHAR(100)        NULL,
        ip_address  NVARCHAR(50)         NULL,
        user_agent  NVARCHAR(500)        NULL,
        success     BIT                  NOT NULL DEFAULT 1,
        timestamp   DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_audit_logs PRIMARY KEY (id)
    );

    -- Index for fraud detection: find failed vote attempts quickly
    CREATE INDEX IDX_logs_action_success
        ON audit_logs (action, success, timestamp DESC);

    -- Index for IP-based abuse detection
    CREATE INDEX IDX_logs_ip_timestamp
        ON audit_logs (ip_address, timestamp DESC);

    -- Index for student activity lookup
    CREATE INDEX IDX_logs_student_id
        ON audit_logs (student_id, timestamp DESC);

    PRINT '✅ Table: audit_logs created.';
END
ELSE
    PRINT '⚠️  Table: audit_logs already exists — skipped.';
GO

-- =====================================================
-- TABLE 6: admins
-- Admin accounts for the control panel
-- =====================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admins' AND xtype='U')
BEGIN
    CREATE TABLE admins (
        id            INT IDENTITY(1,1)   NOT NULL,
        username      NVARCHAR(100)        NOT NULL,
        email         NVARCHAR(200)        NOT NULL,
        password_hash NVARCHAR(200)        NOT NULL,
        created_at    DATETIME2            NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_admins          PRIMARY KEY (id),
        CONSTRAINT UQ_admin_username  UNIQUE (username),
        CONSTRAINT UQ_admin_email     UNIQUE (email)
    );

    PRINT '✅ Table: admins created.';
END
ELSE
    PRINT '⚠️  Table: admins already exists — skipped.';
GO

-- =====================================================
-- VERIFICATION: List all created tables
-- =====================================================
PRINT '';
PRINT '=====================================================';
PRINT 'DATABASE SETUP COMPLETE — TABLE SUMMARY';
PRINT '=====================================================';

SELECT
    t.name                          AS TableName,
    COUNT(c.column_id)              AS ColumnCount,
    (
        SELECT COUNT(*)
        FROM sys.indexes i
        WHERE i.object_id = t.object_id
          AND i.type > 0
    )                               AS IndexCount
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id
WHERE t.type = 'U'
GROUP BY t.name, t.object_id
ORDER BY t.name;
GO

PRINT '';
PRINT '✅ NUAITS Voting Database is ready.';
PRINT '   Next: configure backend/.env with your DB credentials';
PRINT '   Then run: cd backend && npm run dev';
PRINT '=====================================================';
GO
