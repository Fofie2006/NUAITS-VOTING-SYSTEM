const nodemailer = require("nodemailer");

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false, // Use false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verify SMTP connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ SMTP VERIFY ERROR:");
      console.error(error);
    } else {
      console.log("✅ SMTP server is ready to send emails.");
    }
  });

  return transporter;
};

const sendVotingCredentials = async ({
  fullname,
  student_id,
  email,
  voting_code,
}) => {
  const transporter = createTransporter();

  const votingPortalUrl =
    process.env.VOTING_PORTAL_URL ||
    "https://nuaits2027.netlify.app/vote";

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: "🗳️ NUAITS Voting Access Code",
      html: `
        <h2>Hello ${fullname}</h2>

        <p>Your voting credentials are below:</p>

        <p><b>Student ID:</b> ${student_id}</p>

        <p><b>Voting Code:</b> <strong>${voting_code}</strong></p>

        <p>
          <a href="${votingPortalUrl}">
            Click here to access the Voting Portal
          </a>
        </p>

        <p><b>Please do not share this code with anyone.</b></p>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ EMAIL SEND ERROR");
    console.error(err);
    throw err;
  }
};

module.exports = {
  sendVotingCredentials,
};