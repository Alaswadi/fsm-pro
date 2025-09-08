import nodemailer from 'nodemailer';
import { ApiResponse } from '../types';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.warn('Email service not configured. SMTP environment variables missing.');
        return;
      }

      const config: EmailConfig = {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<ApiResponse> {
    try {
      if (!this.isConfigured || !this.transporter) {
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      const mailOptions = {
        from: `"FSM Pro" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        data: {
          messageId: result.messageId,
          message: 'Email sent successfully'
        }
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: 'Failed to send email'
      };
    }
  }

  async sendPasswordResetEmail(
    email: string, 
    fullName: string, 
    resetToken: string
  ): Promise<ApiResponse> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const html = this.generatePasswordResetEmailTemplate(fullName, resetUrl);
      
      return await this.sendEmail({
        to: email,
        subject: 'FSM Pro - Password Reset Request',
        html,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return {
        success: false,
        error: 'Failed to send password reset email'
      };
    }
  }

  private generatePasswordResetEmailTemplate(fullName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - FSM Pro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FSM Pro</div>
            <div class="title">Password Reset Request</div>
          </div>
          
          <div class="content">
            <p>Hello ${fullName},</p>
            
            <p>We received a request to reset your password for your FSM Pro technician account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by FSM Pro. If you have any questions, please contact your system administrator.</p>
            <p>© ${new Date().getFullYear()} FSM Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
