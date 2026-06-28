-- =====================================================
-- NUAITS VOTING SYSTEM — USEFUL QUERIES
-- Run these in SSMS to monitor and manage the system
-- =====================================================

USE nuaits_voting;
GO

-- =====================================================
-- QUERY 1: Live Election Dashboard
-- Shows total voters, turnout %, and current status
-- =====================================================
SELECT
    e.title                                             AS Election,
    e.status                                            AS Status,
    CASE e.voting_enabled WHEN 1 THEN 'YES' ELSE 'NO' END AS VotingOpen,
    e.start_time                                        AS StartTime,
    e.end_time                                          AS EndTime,
    (SELECT COUNT(*) FROM students)                     AS TotalStudents,
    (SELECT COUNT(*) FROM students WHERE code_used = 1) AS StudentsVoted,
    CAST(
        (SELECT COUNT(*) FROM students WHERE code_used = 1) * 100.0
        / NULLIF((SELECT COUNT(*) FROM students), 0)
    AS DECIMAL(5,1))                                    AS TurnoutPercent,
    (SELECT COUNT(*) FROM votes WHERE election_id = e.id) AS TotalVoteCast
FROM elections e
WHERE e.status IN ('pending', 'active')
ORDER BY e.created_at DESC;
GO

-- =====================================================
-- QUERY 2: Live Results — Votes per Candidate
-- =====================================================
SELECT
    c.position                              AS Position,
    c.fullname                              AS Candidate,
    c.department                            AS Department,
    COUNT(v.id)                             AS VotesReceived,
    CAST(
        COUNT(v.id) * 100.0
        / NULLIF(
            (SELECT COUNT(*) FROM votes v2
             WHERE v2.position = c.position
               AND v2.election_id = (
                   SELECT TOP 1 id FROM elections
                   WHERE status IN ('active','ended')
                   ORDER BY created_at DESC
               )
            ), 0
        )
    AS DECIMAL(5,1))                        AS VotePercent
FROM candidates c
LEFT JOIN votes v
    ON v.candidate_id = c.id
    AND v.election_id = (
        SELECT TOP 1 id FROM elections
        WHERE status IN ('active','ended')
        ORDER BY created_at DESC
    )
GROUP BY c.id, c.position, c.fullname, c.department
ORDER BY c.position, VotesReceived DESC;
GO

-- =====================================================
-- QUERY 3: Winner Per Position
-- =====================================================
WITH RankedCandidates AS (
    SELECT
        c.position,
        c.fullname                              AS Candidate,
        COUNT(v.id)                             AS Votes,
        ROW_NUMBER() OVER (
            PARTITION BY c.position
            ORDER BY COUNT(v.id) DESC
        )                                       AS Rank
    FROM candidates c
    LEFT JOIN votes v ON v.candidate_id = c.id
    GROUP BY c.position, c.id, c.fullname
)
SELECT
    position    AS Position,
    Candidate   AS Winner,
    Votes       AS WinningVotes
FROM RankedCandidates
WHERE Rank = 1
ORDER BY Position;
GO

-- =====================================================
-- QUERY 4: Students Who Have NOT Voted Yet
-- Useful for sending reminders
-- =====================================================
SELECT
    fullname    AS FullName,
    student_id  AS StudentID,
    email       AS Email,
    department  AS Department,
    level       AS Level,
    voting_code AS VotingCode,
    email_sent  AS EmailSent
FROM students
WHERE code_used = 0
ORDER BY department, fullname;
GO

-- =====================================================
-- QUERY 5: Students Who Have Voted
-- =====================================================
SELECT
    s.fullname      AS FullName,
    s.student_id    AS StudentID,
    s.department    AS Department,
    s.level         AS Level,
    MIN(v.timestamp) AS VotedAt,
    COUNT(v.id)     AS PositionsVoted,
    MAX(v.ip_address) AS IPAddress
FROM students s
JOIN votes v ON v.student_db_id = s.id
GROUP BY s.id, s.fullname, s.student_id, s.department, s.level
ORDER BY VotedAt DESC;
GO

-- =====================================================
-- QUERY 6: Failed / Invalid Voting Attempts
-- Security monitoring — possible fraud detection
-- =====================================================
SELECT
    timestamp               AS AttemptTime,
    action                  AS ActionType,
    student_id              AS StudentID,
    description             AS Details,
    ip_address              AS IPAddress,
    user_agent              AS Browser
FROM audit_logs
WHERE success = 0
  AND action LIKE 'VOTE_%'
ORDER BY timestamp DESC;
GO

-- =====================================================
-- QUERY 7: Voting Activity by IP Address
-- Detect if one IP is making many attempts
-- =====================================================
SELECT
    ip_address          AS IPAddress,
    COUNT(*)            AS TotalAttempts,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS FailedAttempts,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS SuccessfulAttempts,
    MIN(timestamp)      AS FirstSeen,
    MAX(timestamp)      AS LastSeen
FROM audit_logs
WHERE action LIKE 'VOTE_%'
GROUP BY ip_address
HAVING COUNT(*) > 1
ORDER BY FailedAttempts DESC, TotalAttempts DESC;
GO

-- =====================================================
-- QUERY 8: Full Audit Log (recent 100)
-- =====================================================
SELECT TOP 100
    timestamp   AS Time,
    action      AS Action,
    student_id  AS StudentID,
    admin_user  AS Admin,
    description AS Description,
    ip_address  AS IP,
    CASE success WHEN 1 THEN 'SUCCESS' ELSE 'FAILED' END AS Result
FROM audit_logs
ORDER BY timestamp DESC;
GO

-- =====================================================
-- QUERY 9: Voting Code Status Report
-- All students with their code status
-- =====================================================
SELECT
    student_id  AS StudentID,
    fullname    AS FullName,
    email       AS Email,
    voting_code AS VotingCode,
    CASE code_used  WHEN 1 THEN '✓ Used'    ELSE '○ Not used'  END AS CodeStatus,
    CASE email_sent WHEN 1 THEN '✓ Sent'    ELSE '✗ Not sent'  END AS EmailStatus,
    created_at  AS RegisteredAt
FROM students
ORDER BY code_used, fullname;
GO

-- =====================================================
-- QUERY 10: Department Turnout Breakdown
-- =====================================================
SELECT
    department                                              AS Department,
    COUNT(*)                                                AS TotalStudents,
    SUM(CAST(code_used AS INT))                             AS Voted,
    COUNT(*) - SUM(CAST(code_used AS INT))                  AS NotVoted,
    CAST(
        SUM(CAST(code_used AS INT)) * 100.0
        / NULLIF(COUNT(*), 0)
    AS DECIMAL(5,1))                                        AS TurnoutPercent
FROM students
GROUP BY department
ORDER BY TurnoutPercent DESC;
GO

-- =====================================================
-- QUERY 11: Reset a Voting Code (EMERGENCY USE ONLY)
-- Use this if a student genuinely could not vote
-- and needs their code reset
-- =====================================================
-- UNCOMMENT AND EDIT to use:

/*
UPDATE students
SET code_used = 0
WHERE student_id = 'CS/2021/001';  -- ← change to real student ID

-- Also remove their vote records for this election
DELETE FROM votes
WHERE student_db_id = (
    SELECT id FROM students WHERE student_id = 'CS/2021/001'
)
AND election_id = 1;  -- ← change to real election ID

-- Log this action manually
INSERT INTO audit_logs (action, description, student_id, admin_user)
VALUES (
    'VOTE_CODE_RESET',
    'Emergency code reset by admin — student was unable to vote due to technical issue',
    'CS/2021/001',
    'admin'
);

PRINT 'Voting code reset complete.';
*/
GO

-- =====================================================
-- QUERY 12: Export Full Results to Table Format
-- Ready to copy into Excel or Word
-- =====================================================
SELECT
    c.position          AS [Position],
    c.fullname          AS [Candidate Name],
    c.department        AS [Department],
    ISNULL(COUNT(v.id), 0) AS [Total Votes],
    CAST(
        ISNULL(COUNT(v.id), 0) * 100.0
        / NULLIF(
            (SELECT COUNT(*) FROM votes v2
             WHERE v2.position = c.position
               AND v2.election_id = (
                   SELECT TOP 1 id FROM elections ORDER BY created_at DESC
               )
            ), 0
        )
    AS DECIMAL(5,1))    AS [Vote %],
    (
        SELECT COUNT(*) FROM votes v3
        WHERE v3.position = c.position
          AND v3.election_id = (
              SELECT TOP 1 id FROM elections ORDER BY created_at DESC
          )
    )                   AS [Position Total]
FROM candidates c
LEFT JOIN votes v ON v.candidate_id = c.id
GROUP BY c.id, c.position, c.fullname, c.department
ORDER BY c.position, [Total Votes] DESC;
GO
