# Requirements Document

## Introduction

This document outlines the requirements for an Invoicing and Billing System for the FSM Pro platform. The system will enable the generation of invoices from completed work orders, track payments, manage billing cycles, and provide financial reporting capabilities. This feature is essential for converting service delivery into revenue and maintaining accurate financial records.

## Glossary

- **Invoice System**: The software module responsible for generating, managing, and tracking invoices
- **Work Order**: A job or service request that has been assigned to a technician
- **Line Item**: An individual charge entry on an invoice (labor, parts, fees)
- **Payment Gateway**: External service for processing credit card and electronic payments
- **Billing Cycle**: The recurring period for generating invoices (e.g., monthly, weekly)
- **Payment Terms**: The conditions under which payment is expected (e.g., Net 30, Due on Receipt)
- **Tax Rate**: The percentage of tax applied to taxable items
- **Customer Account**: The financial record associated with a customer including balance and payment history

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to generate invoices from completed work orders, so that I can bill customers for services rendered

#### Acceptance Criteria

1. WHEN a work order status changes to "completed", THE Invoice System SHALL make the work order available for invoicing
2. WHEN an admin selects one or more completed work orders, THE Invoice System SHALL generate an invoice containing all selected work orders
3. THE Invoice System SHALL automatically populate invoice line items with labor charges, parts used, and additional fees from the work order
4. THE Invoice System SHALL calculate subtotals, apply tax rates, and compute the total amount due
5. WHEN an invoice is generated, THE Invoice System SHALL assign a unique invoice number following the format "INV-YYYY-NNNN"

### Requirement 2

**User Story:** As an admin user, I want to customize invoice details before sending, so that I can ensure accuracy and add special terms

#### Acceptance Criteria

1. WHEN viewing a draft invoice, THE Invoice System SHALL allow editing of line item descriptions, quantities, and unit prices
2. THE Invoice System SHALL allow adding custom line items not associated with work orders
3. THE Invoice System SHALL allow applying discounts as percentage or fixed amount
4. THE Invoice System SHALL allow setting payment terms from predefined options or custom text
5. WHEN invoice details are modified, THE Invoice System SHALL recalculate totals automatically

### Requirement 3

**User Story:** As an admin user, I want to send invoices to customers via email, so that customers receive their bills promptly

#### Acceptance Criteria

1. WHEN an invoice is marked as final, THE Invoice System SHALL generate a PDF version of the invoice
2. THE Invoice System SHALL send the invoice PDF to the customer email address via the configured mail system
3. THE Invoice System SHALL include a payment link in the email when online payment is enabled
4. WHEN an invoice email is sent, THE Invoice System SHALL record the sent date and time
5. THE Invoice System SHALL allow resending invoices to customers

### Requirement 4

**User Story:** As an admin user, I want to track payment status for invoices, so that I can manage accounts receivable

#### Acceptance Criteria

1. THE Invoice System SHALL maintain invoice status as "draft", "sent", "paid", "partially_paid", "overdue", or "cancelled"
2. WHEN a payment is recorded, THE Invoice System SHALL update the invoice status based on amount paid
3. WHEN an invoice due date passes without full payment, THE Invoice System SHALL automatically mark the invoice as "overdue"
4. THE Invoice System SHALL calculate and display the outstanding balance for each invoice
5. THE Invoice System SHALL maintain a payment history showing date, amount, and payment method for each transaction

### Requirement 5

**User Story:** As an admin user, I want to record payments against invoices, so that I can track which invoices have been paid

#### Acceptance Criteria

1. WHEN recording a payment, THE Invoice System SHALL require payment date, amount, and payment method
2. THE Invoice System SHALL support payment methods including "cash", "check", "credit_card", "bank_transfer", and "online"
3. WHEN a payment amount equals the invoice total, THE Invoice System SHALL mark the invoice as "paid"
4. WHEN a payment amount is less than the invoice total, THE Invoice System SHALL mark the invoice as "partially_paid"
5. THE Invoice System SHALL allow recording multiple partial payments against a single invoice

### Requirement 6

**User Story:** As an admin user, I want to process online payments through a payment gateway, so that customers can pay invoices electronically

#### Acceptance Criteria

1. THE Invoice System SHALL integrate with Stripe payment gateway for credit card processing
2. WHEN a customer clicks a payment link, THE Invoice System SHALL display a secure payment form
3. WHEN a payment is successfully processed, THE Invoice System SHALL automatically record the payment and update invoice status
4. IF a payment fails, THEN THE Invoice System SHALL log the failure reason and notify the customer
5. THE Invoice System SHALL store the payment gateway transaction ID for reconciliation

### Requirement 7

**User Story:** As an admin user, I want to view a list of all invoices with filtering options, so that I can manage billing efficiently

#### Acceptance Criteria

1. THE Invoice System SHALL display invoices in a paginated list with 20 items per page
2. THE Invoice System SHALL allow filtering invoices by status, customer, date range, and amount range
3. THE Invoice System SHALL allow searching invoices by invoice number or customer name
4. THE Invoice System SHALL display key information including invoice number, customer, date, amount, and status
5. THE Invoice System SHALL allow sorting by invoice date, due date, amount, or customer name

### Requirement 8

**User Story:** As an admin user, I want to generate financial reports, so that I can analyze revenue and outstanding payments

#### Acceptance Criteria

1. THE Invoice System SHALL generate an Accounts Receivable Aging Report showing outstanding invoices grouped by age (0-30, 31-60, 61-90, 90+ days)
2. THE Invoice System SHALL generate a Revenue Report showing total invoiced and collected amounts by date range
3. THE Invoice System SHALL generate a Customer Statement showing all invoices and payments for a specific customer
4. THE Invoice System SHALL allow exporting reports to PDF and CSV formats
5. THE Invoice System SHALL display summary metrics including total outstanding, total overdue, and average days to payment

### Requirement 9

**User Story:** As an admin user, I want to configure tax rates and company billing information, so that invoices reflect correct tax and company details

#### Acceptance Criteria

1. THE Invoice System SHALL allow configuring default tax rate as a percentage
2. THE Invoice System SHALL allow marking specific line items as taxable or non-taxable
3. THE Invoice System SHALL allow configuring company billing information including name, address, phone, email, and tax ID
4. THE Invoice System SHALL display configured company information on all generated invoices
5. THE Invoice System SHALL allow configuring invoice footer text for payment instructions or terms

### Requirement 10

**User Story:** As a customer, I want to view my invoice history and outstanding balance, so that I can manage my account

#### Acceptance Criteria

1. WHEN a customer logs into the system, THE Invoice System SHALL display all invoices associated with their account
2. THE Invoice System SHALL display the total outstanding balance across all unpaid invoices
3. THE Invoice System SHALL allow customers to download PDF copies of their invoices
4. THE Invoice System SHALL allow customers to view payment history for each invoice
5. WHERE online payment is enabled, THE Invoice System SHALL provide a "Pay Now" button for unpaid invoices

### Requirement 11

**User Story:** As an admin user, I want to set up recurring invoices for customers with service contracts, so that billing is automated

#### Acceptance Criteria

1. THE Invoice System SHALL allow creating recurring invoice templates with frequency (weekly, monthly, quarterly, annually)
2. WHEN a recurring invoice is due, THE Invoice System SHALL automatically generate and send the invoice
3. THE Invoice System SHALL allow specifying start date and end date for recurring invoices
4. THE Invoice System SHALL allow pausing or cancelling recurring invoice schedules
5. THE Invoice System SHALL maintain a history of all invoices generated from a recurring template

### Requirement 12

**User Story:** As an admin user, I want to send payment reminders for overdue invoices, so that I can improve collection rates

#### Acceptance Criteria

1. WHEN an invoice becomes overdue, THE Invoice System SHALL send an automated reminder email to the customer
2. THE Invoice System SHALL allow configuring reminder schedule (e.g., 7 days overdue, 14 days overdue, 30 days overdue)
3. THE Invoice System SHALL allow customizing reminder email templates
4. THE Invoice System SHALL track when reminders were sent for each invoice
5. THE Invoice System SHALL allow manually sending reminder emails for specific invoices
