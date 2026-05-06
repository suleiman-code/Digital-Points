const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const getFromAddress = () => {
  const from = process.env.MAIL_FROM || "noreply@example.com";
  const fromName = process.env.MAIL_FROM_NAME || "Digital Points";
  return `${fromName} <${from}>`;
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!resend) {
    console.warn("RESEND_API_KEY is not configured. Skipping email send.");
    return false;
  }

  await resend.emails.send({
    from: getFromAddress(),
    to: [to],
    subject,
    html,
    text
  });
  return true;
};

const sendPasswordResetEmail = async (email, token) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Reset your Digital Points password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Reset your password using this link: ${resetUrl}`
  });
};

const sendBookingReply = async (email, message) => {
  return sendEmail({
    to: email,
    subject: "Reply to your inquiry",
    html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${String(message || "")}</div>`,
    text: String(message || "")
  });
};

const sendContactReply = async (email, message) => {
  return sendEmail({
    to: email,
    subject: "Reply to your contact message",
    html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${String(message || "")}</div>`,
    text: String(message || "")
  });
};

module.exports = {
  sendPasswordResetEmail,
  sendBookingReply,
  sendContactReply
};
