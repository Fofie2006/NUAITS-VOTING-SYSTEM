-- =====================================================
-- NUAITS VOTING SYSTEM — STORED PROCEDURES
-- Optional: Run after 01_create_tables.sql
-- These are used automatically by the Node.js backend
-- =====================================================

USE nuaits_voting;
GO

-- =====================================================
-- PROCEDURE 1: Validate student voting credentials
-- Returns student info if valid, empty if not
-- =====================================================
CREATE OR ALTER PROCEDURE sp_ValidateVoter
    @student_id  NVARCHAR(50),
    @voting_code NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.id            AS db_id,
        s.fullname,
        s.student_id,
        s.email,
        s.department,
        s.level,
        s.code_used,
        s.voting_code
    FROM students s
    WHERE UPPER(s.student_id)  = UPPER(@student_id)
      AND UPPER(s.voting_code) = UPPER(@voting_code);
END;
GO

-- =====================================================
-- PROCEDURE 2: Submit a single vote (called in loop)
-- =====================================================
CREATE OR ALTER PROCEDURE sp_CastVote
    @student_db_id  INT,
    @student_id     NVARCHAR(50),
    @candidate_id   INT,
    @position       NVARCHAR(200),
    @election_id    INT,
    @ip_address     NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO votes (
        student_db_id, student_id, candidate_id,
        position, election_id, ip_address
    )
    VALUES (
        @student_db_id, @student_id, @candidate_id,
        @position, @election_id, @ip_address
    );

    -- Increment candidate vote counter
    UPDATE candidates
    SET votes = votes + 1
    WHERE id = @candidate_id;
END;
GO

-- =====================================================
-- PROCEDURE 3: Mark voting code as used
-- Called after all votes successfully inserted
-- =====================================================
CREATE OR ALTER PROCEDURE sp_MarkCodeUsed
    @student_db_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE students
    SET code_used = 1
    WHERE id = @student_db_id
      AND code_used = 0; -- Safety: only update if not already used

    SELECT @@ROWCOUNT AS RowsUpdated;
END;
GO

-- =====================================================
-- PROCEDURE 4: Get live results for an election
-- =====================================================
CREATE OR ALTER PROCEDURE sp_GetElectionResults
    @election_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Results by candidate and position
    SELECT
        c.id                AS candidate_id,
        c.fullname          AS candidate_name,
        c.position,
        c.department,
        c.photo,
        COUNT(v.id)         AS vote_count,
        CAST(
            COUNT(v.id) * 100.0
            / NULLIF(
                (SELECT COUNT(*) FROM votes v2
                 WHERE v2.position = c.position
                   AND v2.election_id = @election_id), 0
            )
        AS DECIMAL(5,1))    AS vote_pct
    FROM candidates c
    LEFT JOIN votes v
        ON v.candidate_id = c.id
       AND v.election_id  = @election_id
    GROUP BY c.id, c.fullname, c.position, c.department, c.photo
    ORDER BY c.position, vote_count DESC;
END;
GO

-- =====================================================
-- PROCEDURE 5: Get dashboard statistics
-- =====================================================
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*)                          FROM students)                   AS total_students,
        (SELECT COUNT(*)                          FROM students WHERE code_used=1) AS students_voted,
        (SELECT COUNT(*)                          FROM votes)                      AS total_votes,
        (SELECT COUNT(*)                          FROM candidates)                 AS total_candidates,
        (SELECT TOP 1 id                          FROM elections ORDER BY created_at DESC) AS latest_election_id,
        (SELECT TOP 1 title                       FROM elections ORDER BY created_at DESC) AS latest_election_title,
        (SELECT TOP 1 status                      FROM elections ORDER BY created_at DESC) AS latest_election_status,
        (SELECT TOP 1 CAST(voting_enabled AS INT) FROM elections ORDER BY created_at DESC) AS voting_enabled;
END;
GO

-- =====================================================
-- PROCEDURE 6: Write to audit log
-- =====================================================
CREATE OR ALTER PROCEDURE sp_AuditLog
    @action      NVARCHAR(100),
    @description NVARCHAR(MAX)  = NULL,
    @student_id  NVARCHAR(50)   = NULL,
    @admin_user  NVARCHAR(100)  = NULL,
    @ip_address  NVARCHAR(50)   = NULL,
    @user_agent  NVARCHAR(500)  = NULL,
    @success     BIT            = 1
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO audit_logs (
        action, description, student_id,
        admin_user, ip_address, user_agent, success
    )
    VALUES (
        @action, @description, @student_id,
        @admin_user, @ip_address, @user_agent, @success
    );
END;
GO

PRINT '✅ All stored procedures created successfully.';
GO
