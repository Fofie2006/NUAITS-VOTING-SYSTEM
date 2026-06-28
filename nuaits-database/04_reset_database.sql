-- =====================================================
-- NUAITS VOTING SYSTEM — DATABASE RESET SCRIPT
-- =====================================================
-- ⚠️  WARNING: THIS DELETES ALL DATA PERMANENTLY
-- Only use this to start fresh (development/testing)
-- NEVER run on a live election database
-- =====================================================

USE nuaits_voting;
GO

PRINT '⚠️  WARNING: About to drop all NUAITS tables...';
PRINT '    Press Ctrl+C NOW to cancel if this is a mistake.';
PRINT '';
GO

-- Drop tables in correct order (respect foreign keys)
IF EXISTS (SELECT * FROM sysobjects WHERE name='votes'      AND xtype='U') DROP TABLE votes;
IF EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U') DROP TABLE audit_logs;
IF EXISTS (SELECT * FROM sysobjects WHERE name='candidates' AND xtype='U') DROP TABLE candidates;
IF EXISTS (SELECT * FROM sysobjects WHERE name='elections'  AND xtype='U') DROP TABLE elections;
IF EXISTS (SELECT * FROM sysobjects WHERE name='students'   AND xtype='U') DROP TABLE students;
IF EXISTS (SELECT * FROM sysobjects WHERE name='admins'     AND xtype='U') DROP TABLE admins;

PRINT '✅ All tables dropped.';
PRINT '   Now run 01_create_tables.sql to recreate them.';
PRINT '   Then run 02_seed_data.sql to add sample data.';
GO
