# Invoicing Integration

This document describes the invoicing integration for both on-site and workshop jobs in the FSM Pro system.

## Overview

The invoicing system provides a unified approach to calculating job costs and preparing jobs for invoicing, regardless of whether they are on-site or workshop jobs.

## Features

- **Automatic Cost Calculation**: Job totals are automatically calculated when jobs are completed
- **Workshop Job Support**: Includes pickup/delivery fees for workshop jobs
- **Parts Tracking**: Automatically includes parts used in the job
- **Invoice Readiness Check**: Validates that jobs are ready for invoicing
- **Unified Workflow**: Same invoicing process for both on-site and workshop jobs

## API Endpoints

### Get Invoice Data
```
GET /api/invoices/job/:job_id
```

Returns complete invoice data for a job including:
- Line items (parts and fees)
- Customer information
- Job details
- Subtotal and total

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "job_number": "WO-2024-0001",
    "location_type": "workshop",
    "line_items": [
      {
        "description": "Replacement Part XYZ",
        "quantity": 2,
        "unit_price": 45.00,
        "total": 90.00,
        "type": "part"
      },
      {
        "description": "Equipment Pickup/Delivery Fee",
        "quantity": 1,
        "unit_price": 50.00,
        "total": 50.00,
        "type": "fee"
      }
    ],
    "subtotal": 140.00,
    "total": 140.00,
    "customer_info": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "company_name": "Acme Corp",
      "billing_address": "123 Main St"
    },
    "job_info": {
      "title": "Printer Repair",
      "description": "Fix paper jam issue",
      "completed_at": "2024-01-15T10:30:00Z",
      "technician_name": "Jane Smith"
    }
  }
}
```

### Calculate Job Total
```
POST /api/invoices/job/:job_id/calculate
```

Calculates and updates the job's total cost based on parts used and fees.

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "total_cost": 140.00
  },
  "message": "Job total calculated and updated successfully"
}
```

### Check Invoice Readiness
```
GET /api/invoices/job/:job_id/ready
```

Checks if a job is ready for invoicing.

**Response:**
```json
{
  "success": true,
  "data": {
    "ready": true
  }
}
```

Or if not ready:
```json
{
  "success": true,
  "data": {
    "ready": false,
    "reason": "Equipment status is 'in_repair'. Equipment must be returned before invoicing."
  }
}
```

### Get Jobs Ready for Invoicing
```
GET /api/invoices/ready?page=1&limit=20
```

Returns a paginated list of jobs that are ready for invoicing.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "job_number": "WO-2024-0001",
        "title": "Printer Repair",
        "location_type": "workshop",
        "completed_at": "2024-01-15T10:30:00Z",
        "total_cost": 140.00,
        "customer_name": "John Doe",
        "customer_company": "Acme Corp",
        "equipment_status": "returned"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

## Automatic Cost Calculation

### On-Site Jobs

When an on-site job is marked as **completed**, the system automatically:
1. Calculates the total cost (parts used)
2. Updates the `total_cost` field in the jobs table
3. Makes the job available for invoicing

### Workshop Jobs

When a workshop job's equipment is marked as **returned**, the system automatically:
1. Calculates the total cost (parts used + pickup/delivery fee)
2. Updates the `total_cost` field in the jobs table
3. Makes the job available for invoicing

## Invoice Readiness Rules

### On-Site Jobs
- Job status must be `completed`

### Workshop Jobs
- Job status must be `completed`
- Equipment status must be `returned`

## Cost Components

### Parts
All parts used in a job (tracked in `job_parts` table) are automatically included in the invoice.

### Pickup/Delivery Fee
For workshop jobs, if a `pickup_delivery_fee` is set, it is automatically included as a line item in the invoice.

### Labor (Future Enhancement)
Labor costs based on technician hourly rates and time spent can be added in future versions.

## Frontend Integration

The frontend can use the `invoiceService.ts` to interact with the invoicing API:

```typescript
import { getJobInvoice, checkJobInvoiceReady, getJobsReadyForInvoicing } from './services/invoiceService';

// Check if job is ready for invoicing
const readyCheck = await checkJobInvoiceReady(jobId);
if (readyCheck.ready) {
  // Get invoice data
  const invoice = await getJobInvoice(jobId);
  // Display invoice to user
}

// Get all jobs ready for invoicing
const { jobs, pagination } = await getJobsReadyForInvoicing(1, 20);
```

## Database Schema

The invoicing system uses existing tables:

### jobs table
- `total_cost`: Stores the calculated total cost
- `pickup_delivery_fee`: Stores delivery fee for workshop jobs
- `location_type`: Distinguishes between on-site and workshop jobs

### job_parts table
- Tracks parts used in jobs with quantities and prices
- `total_price` is automatically calculated as `quantity_used * unit_price`

### equipment_status table
- Tracks equipment status for workshop jobs
- Used to determine if workshop job is ready for invoicing

## Error Handling

The system handles various error scenarios:

1. **Job Not Found**: Returns 404 if job doesn't exist
2. **Not Ready for Invoicing**: Returns 400 with reason if job isn't ready
3. **Missing Data**: Gracefully handles missing parts or fees
4. **Calculation Errors**: Logs errors but doesn't fail the job completion

## Future Enhancements

1. **Tax Calculation**: Add tax calculation based on customer location
2. **Labor Costs**: Include technician labor costs based on hourly rates
3. **Discounts**: Support customer-specific discounts
4. **Invoice Generation**: Generate PDF invoices
5. **Payment Integration**: Integrate with payment processors
6. **Invoice History**: Track invoice versions and changes
7. **Recurring Invoices**: Support for service contracts
