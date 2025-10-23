import nodemailer from 'nodemailer';

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.ETHEREAL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendWelcomeEmail(email: string, role: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: '"Event Management App" <noreply@eventapp.com>',
        to: email,
        subject: 'Welcome to Event Management App!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Welcome to Event Management App! 🎉</h1>
            <p>Your account has been successfully created.</p>
            <p><strong>Role:</strong> ${role}</p>
            <p>You can now log in and start managing events!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is a mock email sent via Ethereal. Preview at: 
              <a href="${nodemailer.getTestMessageUrl(info)}">View Email</a>
            </p>
          </div>
        `,
      });

      console.log('✉️  Welcome email sent:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  async sendEventNotification(
    email: string,
    eventTitle: string,
    message: string
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: '"Event Management App" <noreply@eventapp.com>',
        to: email,
        subject: `Event Update: ${eventTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${eventTitle}</h2>
            <p>${message}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Preview at: <a href="${nodemailer.getTestMessageUrl(info)}">View Email</a>
            </p>
          </div>
        `,
      });

      console.log('✉️  Event notification sent:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send event notification:', error);
    }
  }
}

export default EmailService.getInstance();
