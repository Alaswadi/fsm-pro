# Design Document: Invoicing & Billing System

## Overview

The Invoicing & Billing System is a comprehensive module that enables FSM Pro to generate invoices from completed work orders, track payments, manage billing cycles, and provide financial reporting. The system integrates with the existing work order management system and extends it with financial capabilities including invoice generation, payment processing, recurring billing, and accounts receivable management.

### Key Design Goals

1. **Seamless Integration**: Work with existing work orders, customers, and parts data
2. **Flexibility**: Support various billing scenarios (one-time, recurring, custom)
3. **Automation**: Minimize manual work through automated invoice generation and reminders
4. **Accuracy**: Ensure financial data integrity through proper validation and transactions
5. **Scalability**: Handle growing transaction volumes efficiently

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Invoice    │  │   Payment    │  │   Reports    │      │
│  │  Management  │  │   Tracking   │  │  & Analytics │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Invoice    │  │   Payment    │  │   Billing    │      │
│  │  Controller  │  │  Controller  │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Invoice    │  │   Payment    │  │   PDF        │      │
│  │   Service    │  │   Service    │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Email      │  │   Stripe     │  │   Report     │      │
│  │   Service    │  │  Integration │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   invoices   │  │   payments   │  │  recurring   │      │
│  │              │  │              │  │   invoices   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   invoice    │  │   billing    │                        │
│  │   line_items │  │   settings   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Node.js + Express + TypeScript (existing)
- **Database**: PostgreSQL (existing)
- **PDF Generation**: PDFKit or Puppeteer
- **Payment Processing**: Stripe API
- **Email**: Nodemailer (existing mail_settings)
- **Scheduled Jobs**: node-cron for recurring invoices and reminders

## Components and Interfaces

### Database Schema

#### invoices Table

```sql
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent', 
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
  'void'
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Invoice details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_terms VARCHAR(100) DEFAULT 'Net 30',
  
  -- Financial amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Status and tracking
  status invoice_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional info
  notes TEXT,
  footer_text TEXT,
  internal_notes TEXT,
  
  -- Recurring invoice reference
  recurring_invoice_id UUID REFERENCES recurring_invoices(id) ON DELETE SET NULL,
  
  -- PDF storage
  pdf_url TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT check_amounts CHECK (
    subtotal >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0 AND
    amount_paid >= 0 AND
    balance_due >= 0
  )
);

CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
```

#### invoice_line_items Table

```sql
CREATE TYPE line_item_type AS ENUM ('labor', 'part', 'service', 'fee', 'discount', 'custom');

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Line item details
  line_item_type line_item_type NOT NULL DEFAULT 'custom',
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Tax handling
  is_taxable BOOLEAN DEFAULT true,
  
  -- References to source data
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  
  -- Sorting
  sort_order INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_line_item_amounts CHECK (
    quantity > 0 AND 
    amount >= 0
  )
);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_job_id ON invoice_line_items(job_id);
```

#### payments Table

```sql
CREATE TYPE payment_method AS ENUM (
  'cash',
  'check',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'online',
  'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  
  -- Payment details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'completed',
  
  -- Payment gateway info
  transaction_id VARCHAR(255), -- Stripe payment intent ID
  gateway_response JSONB, -- Full response from payment gateway
  
  -- Check details (if applicable)
  check_number VARCHAR(50),
  
  -- Reference and notes
  reference_number VARCHAR(100),
  notes TEXT,
  
  -- Audit fields
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
```

#### recurring_invoices Table

```sql
CREATE TYPE recurrence_frequency AS ENUM (
  'weekly',
  'bi_weekly',
  'monthly',
  'quarterly',
  'semi_annually',
  'annually'
);

CREATE TYPE recurring_status AS ENUM (
  'active',
  'paused',
  'cancelled',
  'completed'
);

CREATE TABLE recurring_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  
  -- Template details
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Recurrence settings
  frequency recurrence_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means no end date
  next_invoice_date DATE NOT NULL,
  
  -- Invoice template data
  payment_terms VARCHAR(100) DEFAULT 'Net 30',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  footer_text TEXT,
  
  -- Status
  status recurring_status NOT NULL DEFAULT 'active',
  
  -- Tracking
  last_generated_at TIMESTAMP WITH TIME ZONE,
  invoices_generated INTEGER DEFAULT 0,
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_invoices_company_id ON recurring_invoices(company_id);
CREATE INDEX idx_recurring_invoices_customer_id ON recurring_invoices(customer_id);
CREATE INDEX idx_recurring_invoices_status ON recurring_invoices(status);
CREATE INDEX idx_recurring_invoices_next_invoice_date ON recurring_invoices(next_invoice_date);
```

#### recurring_invoice_line_items Table

```sql
CREATE TABLE recurring_invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_invoice_id UUID REFERENCES recurring_invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Line item template
  line_item_type line_item_type NOT NULL DEFAULT 'custom',
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_taxable BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_invoice_line_items_recurring_invoice_id 
  ON recurring_invoice_line_items(recurring_invoice_id);
```

#### billing_settings Table

```sql
CREATE TABLE billing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Company billing info
  company_name VARCHAR(255) NOT NULL,
  billing_address TEXT NOT NULL,
  billing_phone VARCHAR(20),
  billing_email VARCHAR(255),
  tax_id VARCHAR(50),
  
  -- Default settings
  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
  default_payment_terms VARCHAR(100) DEFAULT 'Net 30',
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1,
  
  -- Invoice customization
  invoice_logo_url TEXT,
  invoice_footer_text TEXT,
  invoice_notes_template TEXT,
  
  -- Payment gateway
  stripe_publishable_key VARCHAR(255),
  stripe_secret_key VARCHAR(255),
  stripe_webhook_secret VARCHAR(255),
  online_payments_enabled BOOLEAN DEFAULT false,
  
  -- Reminder settings
  send_payment_reminders BOOLEAN DEFAULT true,
  reminder_days_before_due INTEGER DEFAULT 3,
  reminder_days_after_due INTEGER[] DEFAULT ARRAY[7, 14, 30],
  reminder_email_template TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_settings_company_id ON billing_settings(company_id);
```

#### invoice_reminders Table

```sql
CREATE TABLE invoice_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Reminder details
  reminder_type VARCHAR(50) NOT NULL, -- 'before_due', 'overdue'
  days_offset INTEGER NOT NULL, -- Negative for before due, positive for after
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Email tracking
  email_sent_to VARCHAR(255) NOT NULL,
  email_subject VARCHAR(255),
  email_body TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX idx_invoice_reminders_sent_at ON invoice_reminders(sent_at);
```

### API Endpoints

#### Invoice Management

```typescript
// GET /api/invoices - List all invoices with filtering
GET /api/invoices?page=1&limit=20&status=sent&customer_id=xxx&date_from=2024-01-01&date_to=2024-12-31

// GET /api/invoices/:id - Get single invoice with line items and payments
GET /api/invoices/:id

// POST /api/invoices - Create new invoice
POST /api/invoices
Body: {
  customer_id: string;
  job_ids?: string[]; // Auto-populate from jobs
  invoice_date: string;
  due_date: string;
  payment_terms?: string;
  line_items: Array<{
    line_item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    is_taxable: boolean;
    job_id?: string;
    part_id?: string;
  }>;
  tax_rate?: number;
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
  footer_text?: string;
}

// PUT /api/invoices/:id - Update invoice (draft only)
PUT /api/invoices/:id

// DELETE /api/invoices/:id - Delete invoice (draft only)
DELETE /api/invoices/:id

// POST /api/invoices/:id/send - Send invoice to customer
POST /api/invoices/:id/send

// POST /api/invoices/:id/finalize - Mark invoice as sent (no more edits)
POST /api/invoices/:id/finalize

// POST /api/invoices/:id/void - Void an invoice
POST /api/invoices/:id/void

// GET /api/invoices/:id/pdf - Download invoice PDF
GET /api/invoices/:id/pdf

// POST /api/invoices/generate-from-jobs - Generate invoice from completed jobs
POST /api/invoices/generate-from-jobs
Body: {
  customer_id: string;
  job_ids: string[];
}
```

#### Payment Management

```typescript
// GET /api/payments - List all payments
GET /api/payments?page=1&limit=20&invoice_id=xxx&customer_id=xxx&date_from=2024-01-01

// GET /api/payments/:id - Get single payment
GET /api/payments/:id

// POST /api/payments - Record a payment
POST /api/payments
Body: {
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  check_number?: string;
  reference_number?: string;
  notes?: string;
}

// POST /api/payments/online - Process online payment via Stripe
POST /api/payments/online
Body: {
  invoice_id: string;
  payment_method_id: string; // Stripe payment method
  amount: number;
}

// POST /api/payments/webhook/stripe - Stripe webhook handler
POST /api/payments/webhook/stripe

// DELETE /api/payments/:id - Delete payment (admin only)
DELETE /api/payments/:id
```

#### Recurring Invoices

```typescript
// GET /api/recurring-invoices - List recurring invoice templates
GET /api/recurring-invoices?status=active

// GET /api/recurring-invoices/:id - Get recurring invoice template
GET /api/recurring-invoices/:id

// POST /api/recurring-invoices - Create recurring invoice template
POST /api/recurring-invoices
Body: {
  customer_id: string;
  template_name: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  payment_terms?: string;
  tax_rate?: number;
  line_items: Array<{
    line_item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    is_taxable: boolean;
  }>;
  notes?: string;
}

// PUT /api/recurring-invoices/:id - Update recurring invoice template
PUT /api/recurring-invoices/:id

// POST /api/recurring-invoices/:id/pause - Pause recurring invoices
POST /api/recurring-invoices/:id/pause

// POST /api/recurring-invoices/:id/resume - Resume recurring invoices
POST /api/recurring-invoices/:id/resume

// POST /api/recurring-invoices/:id/cancel - Cancel recurring invoices
POST /api/recurring-invoices/:id/cancel

// DELETE /api/recurring-invoices/:id - Delete recurring invoice template
DELETE /api/recurring-invoices/:id
```

#### Reports

```typescript
// GET /api/reports/accounts-receivable-aging - AR Aging Report
GET /api/reports/accounts-receivable-aging?as_of_date=2024-12-31

// GET /api/reports/revenue - Revenue Report
GET /api/reports/revenue?date_from=2024-01-01&date_to=2024-12-31&group_by=month

// GET /api/reports/customer-statement - Customer Statement
GET /api/reports/customer-statement/:customer_id?date_from=2024-01-01&date_to=2024-12-31

// GET /api/reports/invoice-summary - Invoice Summary Metrics
GET /api/reports/invoice-summary

// GET /api/reports/payment-history - Payment History Report
GET /api/reports/payment-history?date_from=2024-01-01&date_to=2024-12-31
```

#### Billing Settings

```typescript
// GET /api/billing-settings - Get billing settings for company
GET /api/billing-settings

// PUT /api/billing-settings - Update billing settings
PUT /api/billing-settings
Body: {
  company_name?: string;
  billing_address?: string;
  billing_phone?: string;
  billing_email?: string;
  tax_id?: string;
  default_tax_rate?: number;
  default_payment_terms?: string;
  invoice_footer_text?: string;
  online_payments_enabled?: boolean;
  send_payment_reminders?: boolean;
  reminder_days_before_due?: number;
  reminder_days_after_due?: number[];
}
```

## Data Models

### TypeScript Interfaces

```typescript
export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'partially_paid' 
  | 'overdue' 
  | 'cancelled' 
  | 'void';

export type LineItemType = 
  | 'labor' 
  | 'part' 
  | 'service' 
  | 'fee' 
  | 'discount' 
  | 'custom';

export type PaymentMethod = 
  | 'cash' 
  | 'check' 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'online' 
  | 'other';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled';

export type RecurrenceFrequency = 
  | 'weekly' 
  | 'bi_weekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'semi_annually' 
  | 'annually';

export type RecurringStatus = 
  | 'active' 
  | 'paused' 
  | 'cancelled' 
  | 'completed';

export interface Invoice {
  id: string;
  company_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  discount_percentage: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: InvoiceStatus;
  sent_at?: string;
  paid_at?: string;
  notes?: string;
  footer_text?: string;
  internal_notes?: string;
  recurring_invoice_id?: string;
  pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
  line_items?: InvoiceLineItem[];
  payments?: Payment[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  line_item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  is_taxable: boolean;
  job_id?: string;
  part_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  job?: Job;
  part?: Part;
}

export interface Payment {
  id: string;
  company_id: string;
  invoice_id: string;
  customer_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id?: string;
  gateway_response?: any;
  check_number?: string;
  reference_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  invoice?: Invoice;
  customer?: Customer;
}

export interface RecurringInvoice {
  id: string;
  company_id: string;
  customer_id: string;
  template_name: string;
  description?: string;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string;
  next_invoice_date: string;
  payment_terms: string;
  tax_rate: number;
  notes?: string;
  footer_text?: string;
  status: RecurringStatus;
  last_generated_at?: string;
  invoices_generated: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
  line_items?: RecurringInvoiceLineItem[];
}

export interface RecurringInvoiceLineItem {
  id: string;
  recurring_invoice_id: string;
  line_item_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  is_taxable: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BillingSettings {
  id: string;
  company_id: string;
  company_name: string;
  billing_address: string;
  billing_phone?: string;
  billing_email?: string;
  tax_id?: string;
  default_tax_rate: number;
  default_payment_terms: string;
  invoice_prefix: string;
  next_invoice_number: number;
  invoice_logo_url?: string;
  invoice_footer_text?: string;
  invoice_notes_template?: string;
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  stripe_webhook_secret?: string;
  online_payments_enabled: boolean;
  send_payment_reminders: boolean;
  reminder_days_before_due: number;
  reminder_days_after_due: number[];
  reminder_email_template?: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Validation Errors

- Invalid customer ID
- Invalid job IDs (not completed or already invoiced)
- Invalid amounts (negative values, payment exceeds balance)
- Invalid dates (due date before invoice date)
- Missing required fields

### Business Logic Errors

- Cannot edit sent/paid invoices
- Cannot delete invoices with payments
- Cannot process payment for cancelled invoice
- Insufficient balance for payment amount
- Duplicate invoice numbers

### Payment Gateway Errors

- Card declined
- Insufficient funds
- Invalid payment method
- Network timeout
- Gateway service unavailable

### Error Response Format

```typescript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details?: any
}
```

## Testing Strategy

### Unit Tests

1. **Invoice Calculation Logic**
   - Subtotal calculation from line items
   - Tax calculation
   - Discount application
   - Balance due calculation

2. **Payment Processing**
   - Payment allocation to invoices
   - Status updates based on payments
   - Overpayment handling

3. **Recurring Invoice Generation**
   - Next invoice date calculation
   - Template to invoice conversion
   - Frequency handling

### Integration Tests

1. **Invoice Generation from Jobs**
   - Fetch completed jobs
   - Create line items from job data
   - Calculate totals correctly

2. **Payment Gateway Integration**
   - Stripe payment processing
   - Webhook handling
   - Error scenarios

3. **Email Delivery**
   - Invoice email sending
   - Payment reminder emails
   - PDF attachment

### End-to-End Tests

1. **Complete Invoice Workflow**
   - Create invoice from jobs
   - Send to customer
   - Record payment
   - Verify status updates

2. **Recurring Invoice Workflow**
   - Create recurring template
   - Generate invoices automatically
   - Handle end dates

3. **Payment Workflow**
   - Online payment processing
   - Manual payment recording
   - Partial payments

## Performance Considerations

### Database Optimization

1. **Indexes**: Created on frequently queried columns (status, dates, customer_id)
2. **Pagination**: All list endpoints support pagination
3. **Eager Loading**: Load related data (line items, payments) efficiently
4. **Calculated Fields**: Use database computed columns for amounts

### Caching Strategy

1. **Billing Settings**: Cache company billing settings (rarely change)
2. **PDF Generation**: Cache generated PDFs, regenerate only on changes
3. **Report Data**: Cache report results for 5 minutes

### Scalability

1. **Background Jobs**: Use job queue for PDF generation and email sending
2. **Batch Processing**: Process recurring invoices in batches
3. **Database Transactions**: Use transactions for payment processing to ensure data integrity

## Security Considerations

### Authentication & Authorization

- All endpoints require authentication
- Company-level data isolation (multi-tenant)
- Role-based access (admin can manage, technicians view only)
- Customer portal access restricted to own invoices

### Payment Security

- Stripe handles sensitive card data (PCI compliance)
- Store only transaction IDs, not card details
- Use Stripe webhooks for payment confirmation
- Encrypt Stripe API keys in database

### Data Protection

- Validate all input data
- Sanitize user-provided content
- Use parameterized queries (SQL injection prevention)
- Audit trail for financial transactions

## Migration Strategy

### Phase 1: Database Setup
- Create new tables
- Add indexes and constraints
- Create default billing settings for existing companies

### Phase 2: API Implementation
- Implement invoice CRUD operations
- Implement payment recording
- Implement basic reporting

### Phase 3: Integration
- Connect to existing jobs system
- Implement PDF generation
- Implement email notifications

### Phase 4: Advanced Features
- Stripe integration
- Recurring invoices
- Payment reminders
- Advanced reports

### Phase 5: UI Development
- Admin invoice management pages
- Payment tracking interface
- Reports dashboard
- Customer portal

## Future Enhancements

1. **Multi-Currency Support**: Handle invoices in different currencies
2. **Credit Notes**: Issue credit notes for refunds/adjustments
3. **Estimates/Quotes**: Convert estimates to invoices
4. **Batch Invoicing**: Generate multiple invoices at once
5. **Custom Invoice Templates**: Allow companies to customize invoice layout
6. **Payment Plans**: Support installment payments
7. **Late Fees**: Automatically calculate and apply late fees
8. **Integration with Accounting Software**: QuickBooks, Xero integration
9. **Mobile Invoice View**: Optimize invoice viewing for mobile devices
10. **Invoice Approval Workflow**: Multi-level approval for large invoices
