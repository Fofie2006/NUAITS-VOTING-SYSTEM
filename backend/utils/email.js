const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendVotingCredentials = async ({ fullname, student_id, email, voting_code }) => {
  const transporter = createTransporter();
  const votingPortalUrl = process.env.VOTING_PORTAL_URL || 'http://localhost:3000/vote';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NUAITS Voting Access Code</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e40af 0%,#1d4ed8 50%,#16a34a 100%);padding:40px 30px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:1px;">NUAITS</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Njala University Association of IT Students</p>
      <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:6px 16px;">
        <span style="color:#fff;font-size:12px;font-weight:600;">🗳️ ELECTION VOTING CREDENTIALS</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 30px;">
      <p style="color:#374151;font-size:15px;margin:0 0 8px;">Dear <strong style="color:#1e40af;">${fullname}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 28px;">
        You are registered to participate in the upcoming NUAITS election. 
        Below are your unique voting credentials — keep them confidential.
      </p>

      <!-- Credentials Box -->
      <div style="background:#f8faff;border:2px solid #e0e7ff;border-radius:10px;padding:24px;margin-bottom:28px;">
        <h3 style="color:#1e40af;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px;">Your Voting Credentials</h3>
        
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="color:#6b7280;font-size:13px;width:120px;flex-shrink:0;">Student ID:</span>
          <span style="background:#1e40af;color:#fff;font-family:monospace;font-size:14px;font-weight:700;padding:6px 14px;border-radius:6px;letter-spacing:1px;">${student_id}</span>
        </div>
        
        <div style="display:flex;align-items:center;">
          <span style="color:#6b7280;font-size:13px;width:120px;flex-shrink:0;">Voting Code:</span>
          <span style="background:#16a34a;color:#fff;font-family:monospace;font-size:18px;font-weight:700;padding:8px 18px;border-radius:6px;letter-spacing:3px;">${voting_code}</span>
        </div>
      </div>

      <!-- Instructions -->
      <div style="margin-bottom:28px;">
        <h3 style="color:#374151;font-size:14px;font-weight:600;margin:0 0 14px;">📋 How to Vote</h3>
        <ol style="color:#6b7280;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
          <li>Visit the voting portal using the button below</li>
          <li>Enter your <strong>Student ID</strong> exactly as shown above</li>
          <li>Enter your <strong>Voting Code</strong> exactly as shown above</li>
          <li>Select your preferred candidate for each position</li>
          <li>Confirm your votes — each code can only be used <strong>once</strong></li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${votingPortalUrl}" 
           style="display:inline-block;background:linear-gradient(135deg,#1e40af,#1d4ed8);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(30,64,175,0.3);">
          🗳️ Go to Voting Portal
        </a>
      </div>

      <!-- Warning -->
      <div style="background:#fef3cd;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-top:8px;">
        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
          ⚠️ <strong>Important:</strong> Do not share your voting code with anyone. 
          Each code is single-use only. Once used, it cannot be reused.
          If you experience any issues, contact the NUAITS Electoral Committee.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8faff;padding:20px 30px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        This is an automated message from the NUAITS Voting System.<br>
        Njala University Association of Information Technology Students
      </p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'NUAITS Voting System'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
    to: email,
    subject: '🗳️ NUAITS Voting Access Code - Your Credentials',
    html: htmlContent,
    text: `
Dear ${fullname},

Your NUAITS voting credentials:

Student ID: ${student_id}
Voting Code: ${voting_code}

Visit the voting portal: ${votingPortalUrl}

Keep this code confidential. It can only be used once.

- NUAITS Electoral Committee
    `,
  });
};

const sendTestEmail = async (email) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"NUAITS Voting System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'NUAITS Email Test',
    text: 'Email configuration is working correctly.',
  });
};

module.exports = { sendVotingCredentials, sendTestEmail };
