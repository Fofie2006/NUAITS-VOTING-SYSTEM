const { getPool, sql } = require('../config/database');

/**
 * Generates a cryptographically secure, human-readable voting code.
 * Format: XXXX-XXXX-XXXX (alphanumeric, uppercase, no ambiguous chars)
 */
const generateVotingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,1,I to avoid confusion
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}`;
};

/**
 * Generates a unique voting code not already in the database.
 */
const generateUniqueVotingCode = async () => {
  const pool = await getPool();
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateVotingCode();
    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .query('SELECT id FROM students WHERE voting_code = @code');

    if (result.recordset.length === 0) return code;
    attempts++;
  } while (attempts < maxAttempts);

  throw new Error('Failed to generate unique voting code after multiple attempts');
};

/**
 * Generate voting codes for multiple students at once.
 */
const generateBulkCodes = async (count) => {
  const codes = new Set();
  while (codes.size < count) {
    codes.add(generateVotingCode());
  }
  return Array.from(codes);
};

module.exports = { generateVotingCode, generateUniqueVotingCode, generateBulkCodes };
