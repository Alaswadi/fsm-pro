# Design Document: Workshop/Depot Repair System

## Overview

The Workshop/Depot Repair System extends the existing FSM Pro work order management to support scenarios where customer equipment is brought to the company's workshop for repair instead of being serviced on-site. This feature adds equipment intake tracking, workshop queue management, repair status tracking, and return logistics capabilities.

### Key Design Goals

1. **Minimal Disruption**: Extend existing jobs table rather than creating parallel systems
2. **Clear Workflow**: Distinct status tracking for workshop repair lifecycle
3. **Flexibility**: Support both on-site and workshop jobs in the same system
4. **Visibility**: Provide clear queue and status views for workshop operations
5. **Customer Communication**: Keep customers informed throughout the repair process

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Workshop   │  │   Equipment  │  │   Return     │      │
│  │    Queue     │  │    Intake    │  │   Logistics  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Workshop   │  │   Intake     │  │   Status     │      │
│  │  Controller  │  │  Controller  │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Workshop   │  │  Notification│  │   Metrics    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     jobs     │  │   equipment  │  │   workshop   │      │
│  │   (extended) │  │    intake    │  │   settings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   equipment  │  │    status    │                        │
│  │    status    │  │    history   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

#### Extend jobs Table

```sql
-- Add new columns to existing jobs table
ALTER TABLE jobs ADD COLUMN location_type VARCHAR(20) DEFAULT 'on_site' CHECK (location_type IN ('on_site', 'workshop'));
ALTER TABLE jobs ADD COLUMN estimated_completion_date DATE;
ALTER TABLE jobs ADD COLUMN pickup_delivery_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE jobs ADD COLUMN delivery_scheduled_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE jobs ADD COLUMN delivery_technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL;

-- Add index for location_type
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_estimated_completion_date ON jobs(estimated_completion_date);
```

#### equipment_intake Table

```sql
CREATE TABLE equipment_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Intake details
  intake_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Equipment condition
  reported_issue TEXT NOT NULL,
  visual_condition TEXT, -- Description of visible condition
  physical_damage_notes TEXT,
  accessories_included TEXT, -- e.g., "Power cable, manual, carrying case"
  
  -- Customer information at intake
  customer_signature TEXT, -- Base64 encoded signature
  customer_notes TEXT,
  
  -- Internal notes
  internal_notes TEXT,
  estimated_repair_time INTEGER, -- in hours
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_equipment_intake_job_id ON equipment_intake(job_id);
CREATE INDEX idx_equipment_intake_company_id ON equipment_intake(company_id);
CREATE INDEX idx_equipment_intake_intake_date ON equipment_intake(intake_date);
```

#### equipment_status Table

```sql
CREATE TYPE equipment_repair_status AS ENUM (
  'pending_intake',
  'in_transit',
  'received',
  'in_repair',
  'repair_completed',
  'ready_for_pickup',
  'out_for_delivery',
  'returned'
);

CREATE TABLE equipment_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Current status
  current_status equipment_repair_status NOT NULL DEFAULT 'pending_intake',
  
  -- Status timestamps (for quick access)
  pending_intake_at TIMESTAMP WITH TIME ZONE,
  in_transit_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  in_repair_at TIMESTAMP WITH TIME ZONE,
  repair_completed_at TIMESTAMP WITH TIME ZONE,
  ready_for_pickup_at TIMESTAMP WITH TIME ZONE,
  out_for_delivery_at TIMESTAMP WITH TIME ZONE,
  returned_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(job_id)
);

CREATE INDEX idx_equipment_status_job_id ON equipment_status(job_id);
CREATE INDEX idx_equipment_status_company_id ON equipment_status(company_id);
CREATE INDEX idx_equipment_status_current_status ON equipment_status(current_status);
```

#### equipment_status_history Table

```sql
CREATE TABLE equipment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_status_id UUID REFERENCES equipment_status(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  
  -- Status change details
  from_status equipment_repair_status,
  to_status equipment_repair_status NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Optional notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_equipment_status_history_equipment_status_id ON equipment_status_history(equipment_status_id);
CREATE INDEX idx_equipment_status_history_job_id ON equipment_status_history(job_id);
CREATE INDEX idx_equipment_status_history_changed_at ON equipment_status_history(changed_at);
```

#### intake_photos Table

```sql
CREATE TABLE intake_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_intake_id UUID REFERENCES equipment_intake(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(50), -- 'overall', 'damage', 'serial_number', 'accessories'
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_intake_photos_equipment_intake_id ON intake_photos(equipment_intake_id);
```

#### workshop_settings Table

```sql
CREATE TABLE workshop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Capacity settings
  max_concurrent_jobs INTEGER DEFAULT 20,
  max_jobs_per_technician INTEGER DEFAULT 5,
  
  -- Default settings
  default_estimated_repair_hours INTEGER DEFAULT 24,
  default_pickup_delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  
  -- Workshop location
  workshop_address TEXT,
  workshop_phone VARCHAR(20),
  workshop_hours JSONB, -- Operating hours
  
  -- Notification settings
  send_intake_confirmation BOOLEAN DEFAULT true,
  send_ready_notification BOOLEAN DEFAULT true,
  send_status_updates BOOLEAN DEFAULT true,
  
  -- Notification templates
  intake_confirmation_template TEXT,
  ready_notification_template TEXT,
  status_update_template TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workshop_settings_company_id ON workshop_settings(company_id);
```

### API Endpoints

#### Workshop Job Management

```typescript
// GET /api/workshop/jobs - List workshop jobs with filtering
GET /api/workshop/jobs?status=received&equipment_status=in_repair&page=1&limit=20

// GET /api/workshop/queue - Get workshop repair queue
GET /api/workshop/queue?sort_by=priority

// POST /api/workshop/jobs/:id/claim - Technician claims job from queue
POST /api/workshop/jobs/:id/claim

// GET /api/workshop/metrics - Get workshop performance metrics
GET /api/workshop/metrics?date_from=2024-01-01&date_to=2024-12-31
```

#### Equipment Intake

```typescript
// POST /api/workshop/intake - Create equipment intake record
POST /api/workshop/intake
Body: {
  job_id: string;
  reported_issue: string;
  visual_condition?: string;
  physical_damage_notes?: string;
  accessories_included?: string;
  customer_signature?: string;
  customer_notes?: string;
  internal_notes?: string;
  estimated_repair_time?: number;
}

// GET /api/workshop/intake/:job_id - Get intake record for job
GET /api/workshop/intake/:job_id

// PUT /api/workshop/intake/:id - Update intake record
PUT /api/workshop/intake/:id

// POST /api/workshop/intake/:id/photos - Upload intake photos
POST /api/workshop/intake/:id/photos
Body: FormData with photo files

// GET /api/workshop/intake/:id/photos - Get intake photos
GET /api/workshop/intake/:id/photos
```

#### Equipment Status Management

```typescript
// GET /api/workshop/status/:job_id - Get current equipment status
GET /api/workshop/status/:job_id

// PUT /api/workshop/status/:job_id - Update equipment status
PUT /api/workshop/status/:job_id
Body: {
  status: string;
  notes?: string;
}

// GET /api/workshop/status/:job_id/history - Get status history
GET /api/workshop/status/:job_id/history
```

#### Return Logistics

```typescript
// POST /api/workshop/jobs/:id/ready-for-pickup - Mark equipment ready
POST /api/workshop/jobs/:id/ready-for-pickup
Body: {
  notify_customer: boolean;
}

// POST /api/workshop/jobs/:id/schedule-delivery - Schedule delivery
POST /api/workshop/jobs/:id/schedule-delivery
Body: {
  delivery_date: string;
  delivery_technician_id: string;
  delivery_fee?: number;
}

// POST /api/workshop/jobs/:id/mark-returned - Mark equipment as returned
POST /api/workshop/jobs/:id/mark-returned
Body: {
  customer_signature: string;
  return_notes?: string;
}
```

#### Workshop Settings

```typescript
// GET /api/workshop/settings - Get workshop settings
GET /api/workshop/settings

// PUT /api/workshop/settings - Update workshop settings
PUT /api/workshop/settings
Body: {
  max_concurrent_jobs?: number;
  max_jobs_per_technician?: number;
  default_estimated_repair_hours?: number;
  default_pickup_delivery_fee?: number;
  workshop_address?: string;
  workshop_phone?: string;
  send_intake_confirmation?: boolean;
  send_ready_notification?: boolean;
  send_status_updates?: boolean;
}
```

## Data Models

### TypeScript Interfaces

```typescript
export type LocationType = 'on_site' | 'workshop';

export type EquipmentRepairStatus = 
  | 'pending_intake'
  | 'in_transit'
  | 'received'
  | 'in_repair'
  | 'repair_completed'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'returned';

// Extend existing Job interface
export interface Job {
  // ... existing fields
  location_type: LocationType;
  estimated_completion_date?: string;
  pickup_delivery_fee?: number;
  delivery_scheduled_date?: string;
  delivery_technician_id?: string;
  
  // Relations
  equipment_intake?: EquipmentIntake;
  equipment_status?: EquipmentStatus;
}

export interface EquipmentIntake {
  id: string;
  job_id: string;
  company_id: string;
  intake_date: string;
  received_by?: string;
  reported_issue: string;
  visual_condition?: string;
  physical_damage_notes?: string;
  accessories_included?: string;
  customer_signature?: string;
  customer_notes?: string;
  internal_notes?: string;
  estimated_repair_time?: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  photos?: IntakePhoto[];
  received_by_user?: User;
}

export interface EquipmentStatus {
  id: string;
  job_id: string;
  company_id: string;
  current_status: EquipmentRepairStatus;
  pending_intake_at?: string;
  in_transit_at?: string;
  received_at?: string;
  in_repair_at?: string;
  repair_completed_at?: string;
  ready_for_pickup_at?: string;
  out_for_delivery_at?: string;
  returned_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  history?: EquipmentStatusHistory[];
}

export interface EquipmentStatusHistory {
  id: string;
  equipment_status_id: string;
  job_id: string;
  from_status?: EquipmentRepairStatus;
  to_status: EquipmentRepairStatus;
  changed_at: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
  
  // Relations
  changed_by_user?: User;
}

export interface IntakePhoto {
  id: string;
  equipment_intake_id: string;
  photo_url: string;
  photo_type?: string;
  caption?: string;
  taken_at: string;
  uploaded_by?: string;
  created_at: string;
  
  // Relations
  uploaded_by_user?: User;
}

export interface WorkshopSettings {
  id: string;
  company_id: string;
  max_concurrent_jobs: number;
  max_jobs_per_technician: number;
  default_estimated_repair_hours: number;
  default_pickup_delivery_fee: number;
  workshop_address?: string;
  workshop_phone?: string;
  workshop_hours?: any;
  send_intake_confirmation: boolean;
  send_ready_notification: boolean;
  send_status_updates: boolean;
  intake_confirmation_template?: string;
  ready_notification_template?: string;
  status_update_template?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopMetrics {
  total_jobs: number;
  jobs_by_status: Record<EquipmentRepairStatus, number>;
  average_repair_time_hours: number;
  on_time_completion_rate: number;
  current_capacity_utilization: number;
  jobs_per_technician: Array<{
    technician_id: string;
    technician_name: string;
    active_jobs: number;
  }>;
}
```

## Business Logic

### Status Transition Rules

```typescript
// Valid status transitions
const STATUS_TRANSITIONS: Record<EquipmentRepairStatus, EquipmentRepairStatus[]> = {
  'pending_intake': ['in_transit', 'received'],
  'in_transit': ['received'],
  'received': ['in_repair'],
  'in_repair': ['repair_completed', 'received'], // Can go back if more work needed
  'repair_completed': ['ready_for_pickup', 'out_for_delivery'],
  'ready_for_pickup': ['returned'],
  'out_for_delivery': ['returned'],
  'returned': [] // Terminal state
};

// Automatic job status updates based on equipment status
const EQUIPMENT_TO_JOB_STATUS: Record<EquipmentRepairStatus, JobStatus> = {
  'pending_intake': 'pending',
  'in_transit': 'pending',
  'received': 'assigned',
  'in_repair': 'in_progress',
  'repair_completed': 'completed',
  'ready_for_pickup': 'completed',
  'out_for_delivery': 'completed',
  'returned': 'completed'
};
```

### Workshop Queue Logic

```typescript
// Queue prioritization
interface QueueItem {
  job: Job;
  equipment_status: EquipmentStatus;
  intake: EquipmentIntake;
  priority_score: number;
}

function calculatePriorityScore(job: Job, intake: EquipmentIntake): number {
  let score = 0;
  
  // Priority weight
  const priorityWeights = { urgent: 100, high: 75, medium: 50, low: 25 };
  score += priorityWeights[job.priority];
  
  // Days waiting weight (1 point per day)
  const daysWaiting = daysSince(intake.intake_date);
  score += daysWaiting;
  
  // Overdue weight (50 points if past estimated completion)
  if (job.estimated_completion_date && isPast(job.estimated_completion_date)) {
    score += 50;
  }
  
  return score;
}
```

### Notification Triggers

```typescript
// Automatic notifications
const NOTIFICATION_TRIGGERS = {
  // When intake is created
  'intake_created': {
    recipient: 'customer',
    template: 'intake_confirmation',
    message: 'Your equipment has been received at our workshop'
  },
  
  // When status changes to in_repair
  'repair_started': {
    recipient: 'customer',
    template: 'status_update',
    message: 'Repair work has started on your equipment'
  },
  
  // When status changes to ready_for_pickup
  'ready_for_pickup': {
    recipient: 'customer',
    template: 'ready_notification',
    message: 'Your equipment is ready for pickup'
  },
  
  // When delivery is scheduled
  'delivery_scheduled': {
    recipient: 'customer',
    template: 'delivery_notification',
    message: 'Delivery scheduled for your repaired equipment'
  },
  
  // When equipment is returned
  'equipment_returned': {
    recipient: 'customer',
    template: 'return_confirmation',
    message: 'Thank you! Your equipment has been returned'
  }
};
```

## Error Handling

### Validation Errors

- Invalid location type
- Invalid equipment status transition
- Missing required intake information
- Equipment already has intake record
- Job is not a workshop job

### Business Logic Errors

- Workshop capacity exceeded
- Technician already at max jobs
- Cannot claim job (already assigned)
- Cannot mark returned without signature
- Invalid status transition

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

1. **Status Transition Logic**
   - Valid transitions
   - Invalid transitions
   - Automatic job status updates

2. **Priority Calculation**
   - Priority weights
   - Days waiting calculation
   - Overdue detection

3. **Capacity Validation**
   - Workshop capacity checks
   - Technician capacity checks

### Integration Tests

1. **Workshop Job Creation**
   - Create workshop job
   - Verify location type
   - Check default settings applied

2. **Intake Process**
   - Create intake record
   - Upload photos
   - Update equipment status

3. **Status Updates**
   - Update status
   - Verify history recorded
   - Check notifications sent

### End-to-End Tests

1. **Complete Workshop Workflow**
   - Create workshop job
   - Record intake
   - Assign technician
   - Update status through lifecycle
   - Mark as returned

2. **Queue Management**
   - View queue
   - Claim job
   - Verify assignment

## Performance Considerations

### Database Optimization

1. **Indexes**: Created on frequently queried columns (location_type, current_status, intake_date)
2. **Status Timestamps**: Denormalized for quick access without joining history table
3. **Queue Queries**: Optimized with proper indexes and filtering

### Caching Strategy

1. **Workshop Settings**: Cache company workshop settings
2. **Capacity Metrics**: Cache current capacity calculations for 5 minutes
3. **Queue Data**: Cache queue list for 1 minute

## Security Considerations

### Authorization

- Workshop jobs visible to all company users
- Intake records editable by admin/manager only
- Technicians can claim jobs and update status
- Customers can view their equipment status (read-only)

### Data Protection

- Customer signatures encrypted
- Intake photos access controlled
- Status history immutable (audit trail)

## Migration Strategy

### Phase 1: Database Setup
- Add columns to jobs table
- Create new tables (equipment_intake, equipment_status, etc.)
- Create default workshop settings for existing companies

### Phase 2: API Implementation
- Implement workshop job endpoints
- Implement intake management
- Implement status tracking

### Phase 3: Integration
- Update job creation to support location type
- Implement notification triggers
- Add workshop queue views

### Phase 4: UI Development
- Workshop queue page
- Intake form
- Status tracking interface
- Return logistics management

## Future Enhancements

1. **Barcode/QR Code Scanning**: Quick equipment identification during intake
2. **Automated Status Updates**: IoT integration for automatic status tracking
3. **Workshop Layout Management**: Visual workshop floor plan with equipment locations
4. **Repair Time Estimation**: ML-based repair time prediction
5. **Parts Reservation**: Reserve parts for workshop jobs
6. **Batch Processing**: Handle multiple equipment items in single intake
7. **Mobile Workshop App**: Dedicated mobile app for workshop technicians
8. **Customer Self-Service**: Allow customers to track equipment status online
9. **Warranty Integration**: Automatic warranty claim processing
10. **Quality Control Checklist**: Pre-return quality inspection workflow
