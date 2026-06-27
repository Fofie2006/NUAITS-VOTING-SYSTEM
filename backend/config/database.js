const sql = require('mssql');


const config = {
  server: 'localhost',
  port: 1433,
  database: process.env.DB_NAME || 'nuaits_voting',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '12345678',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};
module.exports = { sql, config };
let pool = null;

const getPool = async () => {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
};

const connectDB = async () => {
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to Microsoft SQL Server');
    await initializeDatabase();
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

const initializeDatabase = async () => {
  const p = await getPool();

  // Students Table
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='students' AND xtype='U')
    CREATE TABLE students (
      id INT IDENTITY(1,1) PRIMARY KEY,
      fullname NVARCHAR(200) NOT NULL,
      student_id NVARCHAR(50) NOT NULL UNIQUE,
      email NVARCHAR(200) NOT NULL UNIQUE,
      department NVARCHAR(200) NOT NULL,
      level NVARCHAR(50) NOT NULL,
      voting_code NVARCHAR(20) NOT NULL UNIQUE,
      code_used BIT NOT NULL DEFAULT 0,
      email_sent BIT NOT NULL DEFAULT 0,
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  // Candidates Table
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='candidates' AND xtype='U')
    CREATE TABLE candidates (
      id INT IDENTITY(1,1) PRIMARY KEY,
      fullname NVARCHAR(200) NOT NULL,
      photo NVARCHAR(500),
      position NVARCHAR(200) NOT NULL,
      department NVARCHAR(200),
      manifesto NVARCHAR(MAX),
      votes INT NOT NULL DEFAULT 0,
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  // Elections Table
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='elections' AND xtype='U')
    CREATE TABLE elections (
      id INT IDENTITY(1,1) PRIMARY KEY,
      title NVARCHAR(300) NOT NULL,
      description NVARCHAR(MAX),
      status NVARCHAR(20) NOT NULL DEFAULT 'pending',
      voting_enabled BIT NOT NULL DEFAULT 0,
      start_time DATETIME2,
      end_time DATETIME2,
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  // Votes Table
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='votes' AND xtype='U')
    CREATE TABLE votes (
      id INT IDENTITY(1,1) PRIMARY KEY,
      student_db_id INT NOT NULL,
      student_id NVARCHAR(50) NOT NULL,
      candidate_id INT NOT NULL,
      position NVARCHAR(200) NOT NULL,
      election_id INT NOT NULL,
      ip_address NVARCHAR(50),
      timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
      FOREIGN KEY (student_db_id) REFERENCES students(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (election_id) REFERENCES elections(id)
    )
  `);

  // AuditLogs Table
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
    CREATE TABLE audit_logs (
      id INT IDENTITY(1,1) PRIMARY KEY,
      action NVARCHAR(100) NOT NULL,
      description NVARCHAR(MAX),
      student_id NVARCHAR(50),
      admin_user NVARCHAR(100),
      ip_address NVARCHAR(50),
      user_agent NVARCHAR(500),
      success BIT NOT NULL DEFAULT 1,
      timestamp DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  // Admins Table
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admins' AND xtype='U')
    CREATE TABLE admins (
      id INT IDENTITY(1,1) PRIMARY KEY,
      username NVARCHAR(100) NOT NULL UNIQUE,
      email NVARCHAR(200) NOT NULL UNIQUE,
      password_hash NVARCHAR(200) NOT NULL,
      created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);

  // Seed default admin if not exists
  await seedDefaultAdmin(p);

  console.log('✅ Database tables initialized');
};

const seedDefaultAdmin = async (p) => {
  const bcrypt = require('bcryptjs');
  const existing = await p.request().query(`SELECT id FROM admins WHERE username = 'admin'`);
  if (existing.recordset.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@NUAITS2024', 12);
    await p.request()
      .input('username', sql.NVarChar, process.env.ADMIN_USERNAME || 'admin')
      .input('email', sql.NVarChar, process.env.ADMIN_EMAIL || 'admin@njala.edu.sl')
      .input('password_hash', sql.NVarChar, hash)
      .query(`INSERT INTO admins (username, email, password_hash) VALUES (@username, @email, @password_hash)`);
    console.log('✅ Default admin created');
  }
};

module.exports = { connectDB, getPool, sql };
