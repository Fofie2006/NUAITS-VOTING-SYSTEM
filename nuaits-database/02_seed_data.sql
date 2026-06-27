-- =====================================================
-- NUAITS VOTING SYSTEM — SAMPLE / SEED DATA
-- Run AFTER 01_create_tables.sql
-- =====================================================
-- This file inserts:
--   • 1 sample election
--   • 10 sample candidates (across 5 positions)
--   • 10 sample students with voting codes
--   • 1 default admin account
-- =====================================================
-- ⚠️  FOR TESTING ONLY — remove real student data
--     before deploying to production
-- =====================================================

USE nuaits_voting;
GO

-- =====================================================
-- SEED: Default Admin Account
-- Username: admin | Password: Admin@NUAITS2024
-- (password_hash is bcrypt of "Admin@NUAITS2024")
-- Change this password immediately after first login!
-- =====================================================
IF NOT EXISTS (SELECT id FROM admins WHERE username = 'admin')
BEGIN
    INSERT INTO admins (username, email, password_hash)
    VALUES (
        'admin',
        'admin@njala.edu.sl',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhS3R8HjGkPJe0xMbXKCF2'
        -- This is bcrypt hash of: Admin@NUAITS2024
        -- The Node.js backend will re-hash on startup if admin doesn't exist
    );
    PRINT '✅ Default admin account inserted.';
END
ELSE
    PRINT '⚠️  Admin already exists — skipped.';
GO

-- =====================================================
-- SEED: Sample Election
-- =====================================================
IF NOT EXISTS (SELECT id FROM elections WHERE title LIKE '%2026%')
BEGIN
    INSERT INTO elections (title, description, status, voting_enabled)
    VALUES (
        'NUAITS General Elections 2026/2027',
        'Annual general elections for all NUAITS executive positions at Njala Campus.',
        'pending',
        0
    );
    PRINT '✅ Sample election inserted.';
END
ELSE
    PRINT '⚠️  Sample election already exists — skipped.';
GO

-- =====================================================
-- SEED: Sample Candidates
-- =====================================================
IF NOT EXISTS (SELECT id FROM candidates WHERE position = 'President')
BEGIN
    INSERT INTO candidates (fullname, position, department, manifesto) VALUES
    -- President
    ('Aminata Koroma',   'President', 'Computer Science',
     'I will champion digital innovation, stronger industry partnerships, and ensure every IT student at Njala has access to the tools and training they need to succeed.'),
    ('Ibrahim Sesay',    'President', 'Information Technology',
     'My vision is a united NUAITS — one that bridges the gap between academic learning and real-world tech careers through workshops, mentorship, and collaboration.'),

    -- Vice President
    ('Fatmata Bangura',  'Vice President', 'Software Engineering',
     'I will support the president and lead initiatives that strengthen our academic support network, peer tutoring, and cross-departmental projects.'),
    ('Mohamed Conteh',   'Vice President', 'Computer Science',
     'Together we can build a stronger NUAITS community. I promise transparency, accountability, and active representation of every student.'),

    -- Secretary General
    ('Hawa Turay',       'Secretary General', 'Information Systems',
     'Efficient communication and organised record-keeping are the backbone of any great association. I will ensure NUAITS runs smoothly and every voice is heard.'),
    ('Sorie Kamara',     'Secretary General', 'Computer Science',
     'I bring experience in student governance and a commitment to keeping our members informed, engaged, and empowered.'),

    -- Financial Secretary
    ('Mariama Jalloh',   'Financial Secretary', 'Information Technology',
     'Financial transparency is non-negotiable. I will maintain clear, auditable records and ensure dues are spent on activities that directly benefit students.'),
    ('Alpha Koroma',     'Financial Secretary', 'Software Engineering',
     'With a background in accounting and a passion for technology, I will bring professional financial management to NUAITS.'),

    -- Public Relations Officer
    ('Isatu Mansaray',   'Public Relations Officer', 'Computer Science',
     'NUAITS deserves a strong online presence. I will grow our social media, foster industry connections, and make sure the world knows what we stand for.'),
    ('Foday Kamara',     'Public Relations Officer', 'Information Technology',
     'I will be the voice of NUAITS — communicating our achievements, events, and opportunities to students, staff, and the wider tech community.');

    PRINT '✅ Sample candidates inserted (10 candidates, 5 positions).';
END
ELSE
    PRINT '⚠️  Candidates already exist — skipped.';
GO

-- =====================================================
-- SEED: Sample Students with Voting Codes
-- =====================================================
IF NOT EXISTS (SELECT id FROM students WHERE student_id = 'CS/2021/001')
BEGIN
    INSERT INTO students (fullname, student_id, email, department, level, voting_code, email_sent) VALUES
    ('Foday Sheriff',      'CS/2021/001', 'foday.sheriff@njala.edu.sl',      'Computer Science',       '300 Level', 'ABCD-EFGH-1234', 1),
    ('Aminata Koroma',     'IT/2022/018', 'aminata.koroma@njala.edu.sl',     'Information Technology', '200 Level', 'WXYZ-MNOP-5678', 1),
    ('Ibrahim Sesay',      'SE/2020/005', 'ibrahim.sesay@njala.edu.sl',      'Software Engineering',   '400 Level', 'QRST-UVWX-9012', 1),
    ('Fatmata Bangura',    'IS/2023/042', 'fatmata.bangura@njala.edu.sl',    'Information Systems',    '100 Level', 'LMNO-PQRS-3456', 1),
    ('Mohamed Conteh',     'CS/2021/029', 'mohamed.conteh@njala.edu.sl',     'Computer Science',       '300 Level', 'BCDE-FGHI-7890', 1),
    ('Hawa Turay',         'IT/2020/011', 'hawa.turay@njala.edu.sl',         'Information Technology', '400 Level', 'YJKL-MNPQ-2345', 1),
    ('Sorie Kamara',       'CS/2022/033', 'sorie.kamara@njala.edu.sl',       'Computer Science',       '200 Level', 'RSTU-VWXY-6789', 1),
    ('Mariama Jalloh',     'SE/2021/007', 'mariama.jalloh@njala.edu.sl',     'Software Engineering',   '300 Level', 'ZKLM-NOPQ-1357', 1),
    ('Alpha Koroma',       'IS/2020/019', 'alpha.koroma@njala.edu.sl',       'Information Systems',    '400 Level', 'CDEF-GHIJ-2468', 1),
    ('Isatu Mansaray',     'CS/2023/055', 'isatu.mansaray@njala.edu.sl',     'Computer Science',       '100 Level', 'KLMN-OPQR-1470', 0);

    PRINT '✅ Sample students inserted (10 students with voting codes).';
END
ELSE
    PRINT '⚠️  Sample students already exist — skipped.';
GO

-- =====================================================
-- VERIFICATION
-- =====================================================
PRINT '';
PRINT '=== SEED DATA SUMMARY ===';
SELECT 'elections'  AS TableName, COUNT(*) AS Rows FROM elections
UNION ALL
SELECT 'candidates' AS TableName, COUNT(*) AS Rows FROM candidates
UNION ALL
SELECT 'students'   AS TableName, COUNT(*) AS Rows FROM students
UNION ALL
SELECT 'admins'     AS TableName, COUNT(*) AS Rows FROM admins;
GO

PRINT '';
PRINT '✅ Seed data complete.';
PRINT '   Login: admin / Admin@NUAITS2024';
PRINT '   ⚠️  Change the admin password immediately after first login!';
GO
