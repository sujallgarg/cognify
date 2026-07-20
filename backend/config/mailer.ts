import nodemailer from 'nodemailer';

// Configure SMTP transport or fallback to Ethereal mail simulator
export async function getMailerTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Generate fallback test SMTP service from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[Mailer] Ethereal SMTP account generated: user="${testAccount.user}" pass="${testAccount.pass}"`);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: MailOptions) {
  try {
    const transporter = await getMailerTransport();
    const info = await transporter.sendMail({
      from: '"Cognify Monitor" <no-reply@cognify.ai>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[Mailer] Email sent successfully! MessageID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mailer] Ethereal E-mail Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('[Mailer] Send email failed:', error);
  }
}
