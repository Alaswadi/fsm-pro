import { query } from '../config/database';
import { emailService } from './emailService';
import { ApiResponse } from '../types';

/**
 * Workshop Notification Service
 * Handles all notifications related to workshop/depot repair operations
 */

interface NotificationContext {
  jobId: string;
  companyId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerWhatsApp?: string;
  jobNumber?: string;
  equipmentType?: string;
  estimatedCompletionDate?: string;
  deliveryDate?: string;
  workshopAddress?: string;
  workshopPhone?: string;
}

/**
 * Get customer and job details for notifications
 */
async function getNotificationContext(jobId: string, companyId: string): Promise<NotificationContext | null> {
  try {
    const contextQuery = `
      SELECT
        j.id as job_id,
        j.company_id,
        j.job_number,
        j.title as equipment_type,
        j.estimated_completion_date,
        j.delivery_scheduled_date,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.whatsapp_number as customer_whatsapp,
        ws.workshop_address,
        ws.workshop_phone
      FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      LEFT JOIN workshop_settings ws ON j.company_id = ws.company_id
      WHERE j.id = $1 AND j.company_id = $2
    `;
    
    const result = await query(contextQuery, [jobId, companyId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      jobId: row.job_id,
      companyId: row.company_id,
      jobNumber: row.job_number,
      equipmentType: row.equipment_type,
      estimatedCompletionDate: row.estimated_completion_date,
      deliveryDate: row.delivery_scheduled_date,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      customerWhatsApp: row.customer_whatsapp,
      workshopAddress: row.workshop_address,
      workshopPhone: row.workshop_phone
    };
  } catch (error) {
    console.error('Error getting notification context:', error);
    return null;
  }
}

/**
 * Check if notification type is enabled in workshop settings
 */
async function isNotificationEnabled(companyId: string, notificationType: string): Promise<boolean> {
  try {
    const settingsQuery = `
      SELECT ${notificationType}
      FROM workshop_settings
      WHERE company_id = $1
    `;
    
    const result = await query(settingsQuery, [companyId]);
    
    if (result.rows.length === 0) {
      return true; // Default to enabled if no settings found
    }
    
    return result.rows[0][notificationType] === true;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Get notification template from workshop settings
 */
async function getNotificationTemplate(companyId: string, templateType: string): Promise<string | null> {
  try {
    const templateQuery = `
      SELECT ${templateType}
      FROM workshop_settings
      WHERE company_id = $1
    `;
    
    const result = await query(templateQuery, [companyId]);
    
    if (result.rows.length === 0 || !result.rows[0][templateType]) {
      return null;
    }
    
    return result.rows[0][templateType];
  } catch (error) {
    console.error('Error getting notification template:', error);
    return null;
  }
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template: string, context: NotificationContext): string {
  return template
    .replace(/\{customer_name\}/g, context.customerName || 'Customer')
    .replace(/\{job_number\}/g, context.jobNumber || 'N/A')
    .replace(/\{equipment_type\}/g, context.equipmentType || 'Equipment')
    .replace(/\{estimated_completion_date\}/g, context.estimatedCompletionDate || 'TBD')
    .replace(/\{delivery_date\}/g, context.deliveryDate || 'TBD')
    .replace(/\{workshop_address\}/g, context.workshopAddress || 'Our workshop')
    .replace(/\{workshop_phone\}/g, context.workshopPhone || 'Contact us');
}

/**
 * Generate default intake confirmation email template
 */
function generateIntakeConfirmationTemplate(context: NotificationContext): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Equipment Received - FSM Pro</title>
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
        .info-box {
          background-color: #f3f4f6;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FSM Pro</div>
          <div class="title">Equipment Received at Workshop</div>
        </div>
        
        <div class="content">
          <p>Hello ${context.customerName},</p>

          <p>We have received your equipment at our workshop and it has been logged into our system.</p>

          <div class="info-box">
            <strong>Job Details:</strong><br>
            Job Number: ${context.jobNumber}<br>
            Equipment: ${context.equipmentType}<br>
            ${context.estimatedCompletionDate ? `Estimated Completion: ${new Date(context.estimatedCompletionDate).toLocaleDateString()}<br>` : ''}
          </div>

          <p>Our technicians will begin working on your equipment shortly. You will receive updates as the repair progresses.</p>

          ${context.workshopPhone ? `<p>If you have any questions, please contact us at ${context.workshopPhone}.</p>` : ''}
        </div>
        
        <div class="footer">
          <p>This is an automated notification from FSM Pro Workshop Management System.</p>
          <p>© ${new Date().getFullYear()} FSM Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate default ready for pickup email template
 */
function generateReadyNotificationTemplate(context: NotificationContext): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Equipment Ready for Pickup - FSM Pro</title>
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
        .success-box {
          background-color: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 15px;
          margin: 20px 0;
        }
        .info-box {
          background-color: #f3f4f6;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FSM Pro</div>
          <div class="title">Your Equipment is Ready!</div>
        </div>
        
        <div class="content">
          <p>Hello ${context.customerName},</p>

          <div class="success-box">
            <strong>Good news!</strong> Your equipment repair has been completed and is ready for pickup.
          </div>

          <div class="info-box">
            <strong>Job Details:</strong><br>
            Job Number: ${context.jobNumber}<br>
            Equipment: ${context.equipmentType}<br>
          </div>

          ${context.workshopAddress ? `
          <p><strong>Pickup Location:</strong><br>
          ${context.workshopAddress}</p>
          ` : ''}

          ${context.workshopPhone ? `<p>Please call us at ${context.workshopPhone} to arrange a convenient pickup time.</p>` : ''}

          <p>Thank you for your business!</p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from FSM Pro Workshop Management System.</p>
          <p>© ${new Date().getFullYear()} FSM Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate default status update email template
 */
function generateStatusUpdateTemplate(context: NotificationContext, newStatus: string, statusNotes?: string): string {
  const statusLabels: Record<string, string> = {
    'pending_intake': 'Pending Intake',
    'in_transit': 'In Transit to Workshop',
    'received': 'Received at Workshop',
    'in_repair': 'Repair in Progress',
    'repair_completed': 'Repair Completed',
    'ready_for_pickup': 'Ready for Pickup',
    'out_for_delivery': 'Out for Delivery',
    'returned': 'Returned to Customer'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Equipment Status Update - FSM Pro</title>
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
        .status-box {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
        }
        .info-box {
          background-color: #f3f4f6;
          border-left: 4px solid #6b7280;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FSM Pro</div>
          <div class="title">Equipment Status Update</div>
        </div>
        
        <div class="content">
          <p>Hello ${context.customerName},</p>

          <p>We have an update on your equipment repair:</p>

          <div class="status-box">
            <strong>New Status:</strong> ${statusLabels[newStatus] || newStatus}
          </div>

          <div class="info-box">
            <strong>Job Details:</strong><br>
            Job Number: ${context.jobNumber}<br>
            Equipment: ${context.equipmentType}<br>
            ${context.estimatedCompletionDate ? `Estimated Completion: ${new Date(context.estimatedCompletionDate).toLocaleDateString()}<br>` : ''}
          </div>

          ${statusNotes ? `<p><strong>Notes:</strong> ${statusNotes}</p>` : ''}

          ${context.workshopPhone ? `<p>If you have any questions, please contact us at ${context.workshopPhone}.</p>` : ''}
        </div>
        
        <div class="footer">
          <p>This is an automated notification from FSM Pro Workshop Management System.</p>
          <p>© ${new Date().getFullYear()} FSM Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate default delivery notification email template
 */
function generateDeliveryNotificationTemplate(context: NotificationContext): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Delivery Scheduled - FSM Pro</title>
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
        .delivery-box {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
        }
        .info-box {
          background-color: #f3f4f6;
          border-left: 4px solid #6b7280;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FSM Pro</div>
          <div class="title">Delivery Scheduled</div>
        </div>
        
        <div class="content">
          <p>Hello ${context.customerName},</p>

          <p>Your repaired equipment is scheduled for delivery!</p>

          ${context.deliveryDate ? `
          <div class="delivery-box">
            <strong>Scheduled Delivery Date:</strong><br>
            ${new Date(context.deliveryDate).toLocaleDateString()} ${new Date(context.deliveryDate).toLocaleTimeString()}
          </div>
          ` : ''}

          <div class="info-box">
            <strong>Job Details:</strong><br>
            Job Number: ${context.jobNumber}<br>
            Equipment: ${context.equipmentType}<br>
          </div>

          <p>Our technician will deliver your equipment to your location. Please ensure someone is available to receive and sign for the equipment.</p>

          ${context.workshopPhone ? `<p>If you need to reschedule or have any questions, please contact us at ${context.workshopPhone}.</p>` : ''}
        </div>
        
        <div class="footer">
          <p>This is an automated notification from FSM Pro Workshop Management System.</p>
          <p>© ${new Date().getFullYear()} FSM Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send intake confirmation notification
 */
export async function sendIntakeConfirmation(jobId: string, companyId: string): Promise<ApiResponse> {
  try {
    // Check if notification is enabled
    const isEnabled = await isNotificationEnabled(companyId, 'send_intake_confirmation');
    if (!isEnabled) {
      return {
        success: true,
        data: { skipped: true, reason: 'Notification disabled in settings' }
      };
    }

    // Get notification context
    const context = await getNotificationContext(jobId, companyId);
    if (!context || !context.customerEmail) {
      return {
        success: false,
        error: 'Customer email not found'
      };
    }

    // Get custom template or use default
    const customTemplate = await getNotificationTemplate(companyId, 'intake_confirmation_template');
    let emailHtml: string;

    if (customTemplate) {
      emailHtml = replaceTemplateVariables(customTemplate, context);
    } else {
      emailHtml = generateIntakeConfirmationTemplate(context);
    }

    // Send email
    const result = await emailService.sendEmail({
      to: context.customerEmail,
      subject: `Equipment Received - Job #${context.jobNumber}`,
      html: emailHtml
    }, companyId);

    return result;
  } catch (error: any) {
    console.error('Error sending intake confirmation:', error);
    return {
      success: false,
      error: error.message || 'Failed to send intake confirmation'
    };
  }
}

/**
 * Send ready for pickup notification
 */
export async function sendReadyNotification(jobId: string, companyId: string): Promise<ApiResponse> {
  try {
    // Check if notification is enabled
    const isEnabled = await isNotificationEnabled(companyId, 'send_ready_notification');
    if (!isEnabled) {
      return {
        success: true,
        data: { skipped: true, reason: 'Notification disabled in settings' }
      };
    }

    // Get notification context
    const context = await getNotificationContext(jobId, companyId);
    if (!context || !context.customerEmail) {
      return {
        success: false,
        error: 'Customer email not found'
      };
    }

    // Get custom template or use default
    const customTemplate = await getNotificationTemplate(companyId, 'ready_notification_template');
    let emailHtml: string;

    if (customTemplate) {
      emailHtml = replaceTemplateVariables(customTemplate, context);
    } else {
      emailHtml = generateReadyNotificationTemplate(context);
    }

    // Send email
    const result = await emailService.sendEmail({
      to: context.customerEmail,
      subject: `Equipment Ready for Pickup - Job #${context.jobNumber}`,
      html: emailHtml
    }, companyId);

    return result;
  } catch (error: any) {
    console.error('Error sending ready notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send ready notification'
    };
  }
}

/**
 * Send status update notification
 */
export async function sendStatusUpdate(
  jobId: string,
  companyId: string,
  newStatus: string,
  statusNotes?: string
): Promise<ApiResponse> {
  try {
    // Check if notification is enabled
    const isEnabled = await isNotificationEnabled(companyId, 'send_status_updates');
    if (!isEnabled) {
      return {
        success: true,
        data: { skipped: true, reason: 'Notification disabled in settings' }
      };
    }

    // Get notification context
    const context = await getNotificationContext(jobId, companyId);
    if (!context || !context.customerEmail) {
      return {
        success: false,
        error: 'Customer email not found'
      };
    }

    // Get custom template or use default
    const customTemplate = await getNotificationTemplate(companyId, 'status_update_template');
    let emailHtml: string;

    if (customTemplate) {
      emailHtml = replaceTemplateVariables(customTemplate, context);
    } else {
      emailHtml = generateStatusUpdateTemplate(context, newStatus, statusNotes);
    }

    // Send email
    const result = await emailService.sendEmail({
      to: context.customerEmail,
      subject: `Equipment Status Update - Job #${context.jobNumber}`,
      html: emailHtml
    }, companyId);

    return result;
  } catch (error: any) {
    console.error('Error sending status update:', error);
    return {
      success: false,
      error: error.message || 'Failed to send status update'
    };
  }
}

/**
 * Send delivery notification
 */
export async function sendDeliveryNotification(jobId: string, companyId: string): Promise<ApiResponse> {
  try {
    // Check if notification is enabled (use send_status_updates setting for delivery notifications)
    const isEnabled = await isNotificationEnabled(companyId, 'send_status_updates');
    if (!isEnabled) {
      return {
        success: true,
        data: { skipped: true, reason: 'Notification disabled in settings' }
      };
    }

    // Get notification context
    const context = await getNotificationContext(jobId, companyId);
    if (!context || !context.customerEmail) {
      return {
        success: false,
        error: 'Customer email not found'
      };
    }

    // Use default delivery template (no custom template for delivery in settings)
    const emailHtml = generateDeliveryNotificationTemplate(context);

    // Send email
    const result = await emailService.sendEmail({
      to: context.customerEmail,
      subject: `Delivery Scheduled - Job #${context.jobNumber}`,
      html: emailHtml
    }, companyId);

    return result;
  } catch (error: any) {
    console.error('Error sending delivery notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send delivery notification'
    };
  }
}
