import nodemailer from 'nodemailer';
import { ApiResponse } from '../types';
import { query } from '../config/database';

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
  private currentCompanyId: string | null = null;

  constructor() {
    this.initializeTransporter();
  }

  // Get mail settings from database for a specific company
  private async getMailSettings(companyId?: string): Promise<any> {
    try {
      if (!companyId) {
        // If no company ID provided, get the first company's settings
        const companyResult = await query('SELECT id FROM companies LIMIT 1');
        if (companyResult.rows.length === 0) {
          return null;
        }
        companyId = companyResult.rows[0].id;
      }

      const result = await query(
        'SELECT * FROM mail_settings WHERE company_id = $1 AND is_enabled = true',
        [companyId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting mail settings:', error);
      return null;
    }
  }

  // Initialize transporter with database settings
  private async initializeTransporterForCompany(companyId?: string): Promise<boolean> {
    try {
      const settings = await this.getMailSettings(companyId);

      if (!settings) {
        // Fall back to environment variables if no database settings
        this.initializeTransporter();
        return this.isConfigured;
      }

      const config: EmailConfig = {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;
      this.currentCompanyId = companyId || null;

      console.log('Email service initialized with database settings for company:', companyId);
      return true;
    } catch (error) {
      console.error('Failed to initialize email service with database settings:', error);
      return false;
    }
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

  async sendEmail(options: EmailOptions, companyId?: string): Promise<ApiResponse> {
    try {
      // Initialize transporter for the specific company if needed
      if (!this.isConfigured || this.currentCompanyId !== companyId) {
        const initialized = await this.initializeTransporterForCompany(companyId);
        if (!initialized) {
          return {
            success: false,
            error: 'Email service not configured'
          };
        }
      }

      if (!this.transporter) {
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      // Get mail settings for from address
      const settings = await this.getMailSettings(companyId);
      const fromAddress = settings
        ? `"${settings.from_name}" <${settings.from_email}>`
        : `"FSM Pro" <${process.env.SMTP_USER}>`;

      const mailOptions = {
        from: fromAddress,
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
    resetToken: string,
    companyId?: string,
    isForTechnician: boolean = true
  ): Promise<ApiResponse> {
    try {
      // Use mobile app URL for technicians, admin dashboard URL for admins
      const baseUrl = isForTechnician
        ? (process.env.MOBILE_APP_URL || 'exp://localhost:8081')
        : (process.env.FRONTEND_URL || 'http://localhost:3000');

      const resetUrl = `${baseUrl}/reset-password-confirm?token=${resetToken}`;

      const html = this.generatePasswordResetEmailTemplate(fullName, resetUrl, isForTechnician);

      return await this.sendEmail({
        to: email,
        subject: 'FSM Pro - Password Reset Request',
        html,
      }, companyId);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return {
        success: false,
        error: 'Failed to send password reset email'
      };
    }
  }

  private generatePasswordResetEmailTemplate(fullName: string, resetUrl: string, isForTechnician: boolean = true): string {
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

            <p>We received a request to reset your password for your FSM Pro ${isForTechnician ? 'technician' : 'admin'} account. ${isForTechnician ? 'Your administrator has initiated this password reset.' : 'If you made this request,'} Click the button below to reset your password:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <div class="warning">
              <strong>Important:</strong> This link will expire in ${isForTechnician ? '24 hours' : '1 hour'} for security reasons. If you don't reset your password within this time, you'll need to request a new reset link.
            </div>

            ${isForTechnician ?
              '<p><strong>For Mobile App Users:</strong> This link will open in your FSM Pro mobile app. Make sure you have the app installed on your device.</p>' :
              '<p>If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>'
            }

            <p>If the button above doesn't work, you can copy and paste this link:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 12px;">${resetUrl}</p>
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
