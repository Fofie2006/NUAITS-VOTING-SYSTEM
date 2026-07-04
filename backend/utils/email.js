const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // ALWAYS false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendVotingCredentials = async ({ fullname, student_id, email, voting_code }) => {
  const transporter = createTransporter();

  const votingPortalUrl =
    process.env.VOTING_PORTAL_URL || 'http://localhost:3000/vote';

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: '🗳️ NUAITS Voting Access Code',
    html: `
      <h2>Hello ${fullname}</h2>
      <p>Your voting credentials are below:</p>

      <p><b>Student ID:</b> ${student_id}</p>
      <p><b>Voting Code:</b> <b>${voting_code}</b></p>

      <p>
        <a href="${votingPortalUrl}">Go to Voting Portal</a>
      </p>

      <p><b>Do not share this code.</b></p>
    `,
  });
};

module.exports = { sendVotingCredentials };