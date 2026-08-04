const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendBoardInviteEmail({ to, boardName, inviterName, token }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const acceptUrl = `${frontendUrl}/boards/accept-invite?token=${token}`;

  await transporter.sendMail({
    from: `"Tasky" <${process.env.SMTP_USER}>`,
    to,
    subject: `${inviterName} vous invite à rejoindre "${boardName}" sur Tasky`,
    html: `
      <p>Bonjour,</p>
      <p><strong>${inviterName}</strong> vous invite à collaborer sur le tableau <strong>${boardName}</strong> sur Tasky.</p>
      <p><a href="${acceptUrl}">Rejoindre le tableau</a></p>
      <p>Si vous n'avez pas encore de compte Tasky, connectez-vous ou inscrivez-vous d'abord avec l'adresse <strong>${to}</strong>, puis cliquez à nouveau sur ce lien.</p>
    `,
  });
}

module.exports = { transporter, sendBoardInviteEmail };