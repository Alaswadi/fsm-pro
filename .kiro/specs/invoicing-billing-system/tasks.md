# Implementation Plan: Invoicing & Billing System

## Overview

This implementation plan breaks down the Invoicing & Billing System into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring the system is functional at each stage.

---

## Tasks

- [ ] 1. Database schema and migrations
  - [ ] 1.1 Create invoice-related database tables and enums
    - Create `invoice_status`, `line_item_type`, `payment_method`, `payment_status`, `recurrence_frequency`, and `recurring_status` enum types
    - Create `invoices` table with all fields, constraints, and indexes
    - Create `invoice_line_items` table with foreign key to invoices
    - Create `payments` table with foreign key to invoices
    - Create `recurring_invoices` and `recurring_invoice_line_items` tables
    - Create `billing_settings` table
    - Create `invoice_reminders` table
    - Add updated_at triggers for all new tables
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 1.2 Create database migration script
    - Write SQL migration file to add all invoice tables to existing database
    - Include rollback script for safe migration reversal
    - Test migration on development database
    - _Requirements: 1.1, 9.1_

  - [ ] 1.3 Seed default billing settings for existing companies
    - Write script to create default billing_settings record for each existing company
    - Set sensible defaults (tax rate 0%, Net 30 terms, invoice prefix "INV")
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2. TypeScript types and interfaces
  - [ ] 2.1 Define invoice-related TypeScript types
    - Add `InvoiceStatus`, `LineItemType`, `PaymentMethod`, `PaymentStatus`, `RecurrenceFrequency`, `RecurringStatus` types to `api/src/types/index.ts`
    - Create `Invoice`, `InvoiceLineItem`, `Payment`, `RecurringInvoice`, `RecurringInvoiceLineItem`, `BillingSettings` interfaces
    - Export all new types and interfaces
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Billing settings management
  - [ ] 3.1 Create billing settings controller
    - Create `api/src/controllers/billingSettingsController.ts`
    - Implement `getBillingSettings` function to fetch company billing settings
    - Implement `updateBillingSettings` function to update settings
    - Implement `getNextInvoiceNumber` helper function
    - Add validation for billing settings fields
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 3.2 Create billing settings routes
    - Create `api/src/routes/billingSettings.ts`
    - Add GET `/api/billing-settings` route
    - Add PUT `/api/billing-settings` route
    - Apply authentication middleware
    - Register routes in main router
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 4. Core invoice management
  - [ ] 4.1 Create invoice service for business logic
    - Create `api/src/services/invoiceService.ts`
    - Implement `calculateInvoiceTotals` function (subtotal, tax, discount, total)
    - Implement `generateInvoiceNumber` function using billing settings
    - Implement `updateInvoiceStatus` function based on payments
    - Implement `validateInvoiceData` function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.2 Create invoice controller - CRUD operations
    - Create `api/src/controllers/invoicesController.ts`
    - Implement `getInvoices` function with pagination, filtering (status, customer, date range), and search
    - Implement `getInvoice` function to fetch single invoice with line items and payments
    - Implement `createInvoice` function with line items creation in transaction
    - Implement `updateInvoice` function (draft invoices only)
    - Implement `deleteInvoice` function (draft invoices only, no payments)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 4.3 Implement invoice generation from work orders
    - Add `generateInvoiceFromJobs` function to invoice controller
    - Fetch completed jobs and validate they belong to same customer
    - Create invoice line items from job data (labor, parts used)
    - Calculate totals using invoice service
    - Return created invoice with all line items
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.4 Implement invoice status management
    - Add `finalizeInvoice` function to mark invoice as sent (no more edits)
    - Add `voidInvoice` function to cancel an invoice
    - Update invoice status based on payment amounts
    - Track sent_at and paid_at timestamps
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 4.5 Create invoice routes
    - Create `api/src/routes/invoices.ts`
    - Add GET `/api/invoices` route with query parameters
    - Add GET `/api/invoices/:id` route
    - Add POST `/api/invoices` route
    - Add PUT `/api/invoices/:id` route
    - Add DELETE `/api/invoices/:id` route
    - Add POST `/api/invoices/generate-from-jobs` route
    - Add POST `/api/invoices/:id/finalize` route
    - Add POST `/api/invoices/:id/void` route
    - Apply authentication and authorization middleware
    - Register routes in main router
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5. Payment management
  - [ ] 5.1 Create payment service
    - Create `api/src/services/paymentService.ts`
    - Implement `recordPayment` function to create payment and update invoice
    - Implement `calculateInvoiceBalance` function
    - Implement `allocatePaymentToInvoice` function to update amounts
    - Use database transactions for payment recording
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.2 Create payment controller
    - Create `api/src/controllers/paymentsController.ts`
    - Implement `getPayments` function with pagination and filtering
    - Implement `getPayment` function for single payment
    - Implement `createPayment` function to record manual payments
    - Implement `deletePayment` function (admin only, reverses payment)
    - Validate payment amounts don't exceed invoice balance
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.3 Create payment routes
    - Create `api/src/routes/payments.ts`
    - Add GET `/api/payments` route
    - Add GET `/api/payments/:id` route
    - Add POST `/api/payments` route
    - Add DELETE `/api/payments/:id` route
    - Apply authentication middleware
    - Register routes in main router
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. PDF invoice generation
  - [ ] 6.1 Install and configure PDF generation library
    - Install PDFKit library (`npm install pdfkit @types/pdfkit`)
    - Create `api/src/services/pdfService.ts`
    - Implement basic PDF document creation helper
    - _Requirements: 3.1, 3.2_

  - [ ] 6.2 Create invoice PDF template
    - Implement `generateInvoicePDF` function in pdfService
    - Design PDF layout with company header, invoice details, line items table, totals
    - Include company logo if configured
    - Add footer with payment terms and notes
    - Format currency and dates properly
    - _Requirements: 3.1, 3.2, 9.4_

  - [ ] 6.3 Implement PDF storage and retrieval
    - Save generated PDFs to file system or cloud storage
    - Store PDF URL in invoice record
    - Add `getInvoicePDF` function to invoice controller
    - Add GET `/api/invoices/:id/pdf` route to download PDF
    - Regenerate PDF when invoice is updated
    - _Requirements: 3.1, 3.2_

- [ ] 7. Email notifications
  - [ ] 7.1 Create email service for invoices
    - Create `api/src/services/emailService.ts` (or extend existing)
    - Implement `sendInvoiceEmail` function using existing mail_settings
    - Create HTML email template for invoice notifications
    - Attach PDF invoice to email
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.2 Implement send invoice functionality
    - Add `sendInvoice` function to invoice controller
    - Generate PDF if not already generated
    - Send email with PDF attachment
    - Update invoice sent_at timestamp
    - Add POST `/api/invoices/:id/send` route
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.3 Implement resend invoice functionality
    - Allow resending invoices to customers
    - Track email send history in invoice_reminders table
    - _Requirements: 3.5_

- [ ] 8. Stripe payment gateway integration
  - [ ] 8.1 Install and configure Stripe SDK
    - Install Stripe library (`npm install stripe @types/stripe`)
    - Create `api/src/services/stripeService.ts`
    - Initialize Stripe client with API keys from billing_settings
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 8.2 Implement online payment processing
    - Add `processOnlinePayment` function to payment service
    - Create Stripe payment intent
    - Handle payment confirmation
    - Record payment in database on success
    - Update invoice status
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 8.3 Create Stripe webhook handler
    - Add `handleStripeWebhook` function to payment controller
    - Verify webhook signature
    - Handle `payment_intent.succeeded` event
    - Handle `payment_intent.failed` event
    - Add POST `/api/payments/webhook/stripe` route
    - _Requirements: 6.3, 6.4_

  - [ ] 8.4 Create online payment endpoint
    - Add `createOnlinePayment` function to payment controller
    - Add POST `/api/payments/online` route
    - Return client secret for Stripe payment
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 9. Recurring invoices
  - [ ] 9.1 Create recurring invoice controller
    - Create `api/src/controllers/recurringInvoicesController.ts`
    - Implement `getRecurringInvoices` function with filtering
    - Implement `getRecurringInvoice` function
    - Implement `createRecurringInvoice` function with line items
    - Implement `updateRecurringInvoice` function
    - Implement `deleteRecurringInvoice` function
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 9.2 Implement recurring invoice status management
    - Add `pauseRecurringInvoice` function
    - Add `resumeRecurringInvoice` function
    - Add `cancelRecurringInvoice` function
    - _Requirements: 11.4_

  - [ ] 9.3 Create recurring invoice routes
    - Create `api/src/routes/recurringInvoices.ts`
    - Add GET `/api/recurring-invoices` route
    - Add GET `/api/recurring-invoices/:id` route
    - Add POST `/api/recurring-invoices` route
    - Add PUT `/api/recurring-invoices/:id` route
    - Add DELETE `/api/recurring-invoices/:id` route
    - Add POST `/api/recurring-invoices/:id/pause` route
    - Add POST `/api/recurring-invoices/:id/resume` route
    - Add POST `/api/recurring-invoices/:id/cancel` route
    - Register routes in main router
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 9.4 Implement recurring invoice generation service
    - Create `api/src/services/recurringInvoiceService.ts`
    - Implement `generateInvoiceFromTemplate` function
    - Calculate next invoice date based on frequency
    - Create invoice from recurring template
    - Update recurring invoice tracking fields
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ] 9.5 Create scheduled job for recurring invoice generation
    - Install node-cron (`npm install node-cron @types/node-cron`)
    - Create `api/src/jobs/recurringInvoiceJob.ts`
    - Implement daily cron job to check for due recurring invoices
    - Generate invoices for templates where next_invoice_date <= today
    - Send generated invoices automatically
    - Update next_invoice_date for each template
    - Register cron job in server startup
    - _Requirements: 11.1, 11.2_

- [ ] 10. Payment reminders
  - [ ] 10.1 Create reminder service
    - Create `api/src/services/reminderService.ts`
    - Implement `sendPaymentReminder` function
    - Create reminder email template
    - Track sent reminders in invoice_reminders table
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 10.2 Create scheduled job for payment reminders
    - Create `api/src/jobs/paymentReminderJob.ts`
    - Implement daily cron job to check for overdue invoices
    - Send reminders based on billing_settings configuration
    - Check reminder_days_after_due array for reminder schedule
    - Avoid sending duplicate reminders
    - Register cron job in server startup
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 10.3 Implement manual reminder sending
    - Add `sendReminder` function to invoice controller
    - Add POST `/api/invoices/:id/send-reminder` route
    - Allow admin to manually trigger reminder email
    - _Requirements: 12.5_

- [ ] 11. Financial reports
  - [ ] 11.1 Create reports controller
    - Create `api/src/controllers/reportsController.ts`
    - Implement `getAccountsReceivableAging` function
    - Group outstanding invoices by age buckets (0-30, 31-60, 61-90, 90+ days)
    - Calculate totals for each bucket
    - _Requirements: 8.1, 8.5_

  - [ ] 11.2 Implement revenue report
    - Add `getRevenueReport` function to reports controller
    - Calculate total invoiced and collected amounts by date range
    - Support grouping by day, week, month, quarter, year
    - Include metrics: total invoiced, total paid, outstanding balance
    - _Requirements: 8.2, 8.5_

  - [ ] 11.3 Implement customer statement
    - Add `getCustomerStatement` function to reports controller
    - List all invoices and payments for specific customer
    - Calculate running balance
    - Include summary totals
    - _Requirements: 8.3_

  - [ ] 11.4 Implement invoice summary metrics
    - Add `getInvoiceSummary` function to reports controller
    - Calculate total outstanding, total overdue, average days to payment
    - Count invoices by status
    - _Requirements: 8.5_

  - [ ] 11.5 Create reports routes
    - Create `api/src/routes/reports.ts`
    - Add GET `/api/reports/accounts-receivable-aging` route
    - Add GET `/api/reports/revenue` route
    - Add GET `/api/reports/customer-statement/:customer_id` route
    - Add GET `/api/reports/invoice-summary` route
    - Add GET `/api/reports/payment-history` route
    - Register routes in main router
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 11.6 Implement report export functionality
    - Add CSV export for all reports
    - Add PDF export for customer statements
    - Use existing PDF service for PDF generation
    - _Requirements: 8.4_

- [ ] 12. Admin frontend - Invoice management
  - [ ] 12.1 Create invoice list page
    - Create `admin-frontend/src/pages/Invoices.tsx`
    - Display invoices in table with pagination
    - Add filters for status, customer, date range
    - Add search by invoice number or customer name
    - Show invoice number, customer, date, amount, status
    - Add action buttons (view, edit, send, delete)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 12.2 Create invoice detail/edit page
    - Create `admin-frontend/src/pages/InvoiceDetail.tsx`
    - Display invoice header information
    - Show line items in editable table
    - Calculate and display totals
    - Allow adding/removing line items
    - Show payment history
    - Add actions (save, send, finalize, void)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 12.3 Create invoice creation modal/page
    - Create `admin-frontend/src/components/InvoiceModal.tsx`
    - Add customer selection dropdown
    - Add option to generate from completed jobs
    - Add line item entry form
    - Calculate totals in real-time
    - Validate all required fields
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 12.4 Implement invoice actions
    - Add send invoice functionality with confirmation
    - Add finalize invoice action
    - Add void invoice action with reason
    - Add delete draft invoice action
    - Show success/error notifications
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 12.5 Create invoice API service
    - Create `admin-frontend/src/services/invoiceService.ts`
    - Implement functions for all invoice API endpoints
    - Handle API errors and responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 13. Admin frontend - Payment management
  - [ ] 13.1 Create payment list page
    - Create `admin-frontend/src/pages/Payments.tsx`
    - Display payments in table with pagination
    - Add filters for invoice, customer, date range, payment method
    - Show payment date, invoice number, customer, amount, method
    - Add action buttons (view, delete)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 13.2 Create record payment modal
    - Create `admin-frontend/src/components/RecordPaymentModal.tsx`
    - Add invoice selection
    - Add payment date picker
    - Add amount input with validation
    - Add payment method dropdown
    - Add optional fields (check number, reference, notes)
    - Show invoice balance
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 13.3 Add payment section to invoice detail page
    - Display payment history on invoice detail page
    - Show payment date, amount, method for each payment
    - Add "Record Payment" button
    - Update invoice status after payment recorded
    - _Requirements: 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 13.4 Create payment API service
    - Create `admin-frontend/src/services/paymentService.ts`
    - Implement functions for all payment API endpoints
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14. Admin frontend - Billing settings
  - [ ] 14.1 Create billing settings page
    - Create `admin-frontend/src/pages/BillingSettings.tsx`
    - Add form for company billing information
    - Add tax rate configuration
    - Add payment terms configuration
    - Add invoice customization options (logo, footer)
    - Add Stripe configuration section
    - Add payment reminder settings
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 14.2 Implement settings save functionality
    - Validate all settings fields
    - Save settings via API
    - Show success/error notifications
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 14.3 Create billing settings API service
    - Create `admin-frontend/src/services/billingSettingsService.ts`
    - Implement get and update functions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15. Admin frontend - Reports
  - [ ] 15.1 Create reports dashboard page
    - Create `admin-frontend/src/pages/Reports.tsx`
    - Add navigation to different report types
    - Display invoice summary metrics (KPI cards)
    - _Requirements: 8.5_

  - [ ] 15.2 Create accounts receivable aging report
    - Create `admin-frontend/src/components/ARAgingReport.tsx`
    - Display aging buckets in table
    - Show totals for each bucket
    - Add export to CSV button
    - _Requirements: 8.1, 8.4_

  - [ ] 15.3 Create revenue report
    - Create `admin-frontend/src/components/RevenueReport.tsx`
    - Add date range selector
    - Add grouping selector (day, week, month)
    - Display revenue data in chart and table
    - Add export functionality
    - _Requirements: 8.2, 8.4_

  - [ ] 15.4 Create customer statement view
    - Create `admin-frontend/src/components/CustomerStatement.tsx`
    - Add customer selector
    - Add date range selector
    - Display invoices and payments chronologically
    - Show running balance
    - Add export to PDF button
    - _Requirements: 8.3, 8.4_

  - [ ] 15.5 Create reports API service
    - Create `admin-frontend/src/services/reportsService.ts`
    - Implement functions for all report endpoints
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Admin frontend - Recurring invoices
  - [ ] 16.1 Create recurring invoices list page
    - Create `admin-frontend/src/pages/RecurringInvoices.tsx`
    - Display recurring invoice templates in table
    - Show template name, customer, frequency, status, next invoice date
    - Add filters for status
    - Add action buttons (view, edit, pause, resume, cancel, delete)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 16.2 Create recurring invoice form
    - Create `admin-frontend/src/components/RecurringInvoiceForm.tsx`
    - Add template name and description fields
    - Add customer selection
    - Add frequency selector
    - Add start and end date pickers
    - Add line items entry
    - Add payment terms and tax rate
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 16.3 Implement recurring invoice actions
    - Add pause/resume functionality
    - Add cancel functionality
    - Show generated invoices history
    - _Requirements: 11.4, 11.5_

  - [ ] 16.4 Create recurring invoices API service
    - Create `admin-frontend/src/services/recurringInvoiceService.ts`
    - Implement functions for all recurring invoice endpoints
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 17. Customer portal - Invoice viewing
  - [ ] 17.1 Create customer invoice list page
    - Create customer-facing invoice list view
    - Show only invoices for logged-in customer
    - Display invoice number, date, amount, status
    - Add filter for status and date range
    - _Requirements: 10.1, 10.2_

  - [ ] 17.2 Create customer invoice detail page
    - Display invoice details (read-only)
    - Show line items and totals
    - Add download PDF button
    - Show payment history
    - Add "Pay Now" button for unpaid invoices (if online payments enabled)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 17.3 Implement online payment flow for customers
    - Integrate Stripe Elements for card input
    - Handle payment submission
    - Show payment confirmation
    - Update invoice status after successful payment
    - _Requirements: 6.1, 6.2, 6.3, 10.5_

- [ ] 18. Integration and polish
  - [ ] 18.1 Add invoice status to work order detail page
    - Show if work order has been invoiced
    - Display invoice number and link
    - Add "Create Invoice" button for completed jobs
    - _Requirements: 1.1_

  - [ ] 18.2 Update navigation and routing
    - Add "Invoices" menu item to admin sidebar
    - Add "Payments" menu item
    - Add "Reports" menu item with submenu
    - Add "Billing Settings" to settings menu
    - Configure routes for all new pages
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 18.3 Add dashboard widgets for invoicing
    - Add "Outstanding Invoices" KPI card to dashboard
    - Add "Overdue Invoices" KPI card
    - Add "Revenue This Month" KPI card
    - Add recent invoices widget
    - _Requirements: 8.5_

  - [ ] 18.4 Implement error handling and validation
    - Add comprehensive error handling for all API endpoints
    - Add input validation on frontend forms
    - Display user-friendly error messages
    - Handle edge cases (deleted customers, invalid amounts, etc.)
    - _Requirements: All_

  - [ ]* 18.5 Add comprehensive logging
    - Log all invoice creation and updates
    - Log all payment transactions
    - Log email sending attempts
    - Log Stripe webhook events
    - _Requirements: All_

- [ ]* 19. Testing and documentation
  - [ ]* 19.1 Write unit tests for invoice calculations
    - Test subtotal calculation
    - Test tax calculation
    - Test discount application
    - Test balance due calculation
    - _Requirements: 1.4, 1.5, 2.4, 2.5_

  - [ ]* 19.2 Write integration tests for invoice workflow
    - Test invoice creation from jobs
    - Test payment recording and status updates
    - Test recurring invoice generation
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 11.1, 11.2_

  - [ ]* 19.3 Write API documentation
    - Document all invoice endpoints
    - Document all payment endpoints
    - Document all report endpoints
    - Include request/response examples
    - _Requirements: All_

  - [ ]* 19.4 Create user guide
    - Write guide for creating invoices
    - Write guide for recording payments
    - Write guide for setting up recurring invoices
    - Write guide for configuring billing settings
    - _Requirements: All_
