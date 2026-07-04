const { getPool } = require('../config/database');

/**
 * Generates a human-readable voting code
 * Format: XXXX-XXXX-XXXX
 */
const generateVotingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const segment = () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

  return `${segment()}-${segment()}-${segment()}`;
};

/**
 * Generates a unique voting code not already in DB
 */
const generateUniqueVotingCode = async () => {
  const pool = getPool();
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateVotingCode();

    const result = await pool.query(
      'SELECT id FROM students WHERE voting_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return code;
    }

    attempts++;
  } while (attempts < maxAttempts);

  throw new Error(
    'Failed to generate unique voting code after multiple attempts'
  );
};

/**
 * Generate multiple codes
 */
const generateBulkCodes = async (count) => {
  const codes = new Set();

  while (codes.size < count) {
    codes.add(generateVotingCode());
  }

  return Array.from(codes);
};

module.exports = {
  generateVotingCode,
  generateUniqueVotingCode,
  generateBulkCodes
};