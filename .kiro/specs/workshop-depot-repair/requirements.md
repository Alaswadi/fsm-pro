# Requirements Document

## Introduction

This document outlines the requirements for Workshop/Depot Repair functionality in the FSM Pro platform. This feature enables the system to handle scenarios where customer equipment needs to be brought to the company's workshop for repair, rather than being serviced on-site. This includes equipment intake, workshop job management, repair tracking, and equipment return logistics.

## Glossary

- **Workshop Job**: A work order where equipment is repaired at the company's facility rather than at the customer location
- **Equipment Intake**: The process of receiving customer equipment at the workshop and documenting its condition
- **Depot Repair**: Another term for workshop repair, commonly used in field service management
- **Job Location Type**: Classification indicating whether a job is performed on-site or at the workshop
- **Equipment Status**: The current state of equipment in the repair workflow (in-transit, received, in-repair, completed, ready-for-pickup, returned)
- **Intake Form**: Documentation created when equipment arrives at the workshop, including condition assessment and reported issues
- **Workshop Queue**: List of equipment waiting for repair at the workshop
- **Return Logistics**: The process of delivering repaired equipment back to the customer

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to create workshop jobs for equipment that needs repair at our facility, so that I can manage depot repairs separately from on-site service

#### Acceptance Criteria

1. WHEN creating a work order, THE System SHALL allow selecting location type as "on_site" or "workshop"
2. WHERE location type is "workshop", THE System SHALL not require a scheduled date for technician dispatch
3. THE System SHALL allow creating workshop jobs without assigning a technician initially
4. THE System SHALL display workshop jobs separately from on-site jobs in the job list
5. THE System SHALL allow filtering jobs by location type

### Requirement 2

**User Story:** As an admin user, I want to record equipment intake when it arrives at the workshop, so that I can document the equipment condition and customer-reported issues

#### Acceptance Criteria

1. WHEN equipment arrives at the workshop, THE System SHALL allow creating an intake record for the associated job
2. THE System SHALL require documenting equipment serial number, reported issues, and visible condition
3. THE System SHALL allow capturing photos of the equipment during intake
4. THE System SHALL record the intake date and time automatically
5. WHEN an intake record is created, THE System SHALL update the equipment status to "received"

### Requirement 3

**User Story:** As an admin user, I want to track equipment status throughout the workshop repair process, so that I can monitor progress and inform customers

#### Acceptance Criteria

1. THE System SHALL maintain equipment status as "pending_intake", "in_transit", "received", "in_repair", "repair_completed", "ready_for_pickup", "out_for_delivery", or "returned"
2. WHEN a technician is assigned to a workshop job, THE System SHALL update status to "in_repair"
3. WHEN repair work is completed, THE System SHALL update status to "repair_completed"
4. THE System SHALL allow manually updating equipment status with timestamp tracking
5. THE System SHALL display status history showing all status changes with dates and times

### Requirement 4

**User Story:** As a technician, I want to view the workshop repair queue, so that I can see which equipment needs attention

#### Acceptance Criteria

1. THE System SHALL display a workshop queue showing all equipment with status "received" or "in_repair"
2. THE System SHALL show equipment details including customer name, equipment type, reported issue, and priority
3. THE System SHALL allow sorting the queue by priority, intake date, or customer
4. THE System SHALL allow technicians to claim equipment from the queue for repair
5. WHEN a technician claims equipment, THE System SHALL assign the job to that technician and update status to "in_repair"

### Requirement 5

**User Story:** As a technician, I want to update repair progress and document work performed, so that there is a record of the repair process

#### Acceptance Criteria

1. WHEN working on a workshop job, THE System SHALL allow technicians to add progress notes
2. THE System SHALL allow recording parts used during the repair
3. THE System SHALL allow capturing photos of the repair work
4. THE System SHALL track time spent on the repair
5. WHEN repair is complete, THE System SHALL allow marking the job as completed with final notes

### Requirement 6

**User Story:** As an admin user, I want to notify customers when their equipment is ready for pickup or delivery, so that they know when to collect their equipment

#### Acceptance Criteria

1. WHEN equipment status changes to "ready_for_pickup", THE System SHALL send a notification to the customer
2. THE System SHALL include equipment details and pickup instructions in the notification
3. THE System SHALL support notification via email, SMS, or WhatsApp based on customer preference
4. THE System SHALL allow manually triggering customer notifications
5. THE System SHALL track when notifications were sent

### Requirement 7

**User Story:** As an admin user, I want to manage equipment return logistics, so that I can track delivery or pickup of repaired equipment

#### Acceptance Criteria

1. THE System SHALL allow marking equipment as "ready_for_pickup" when repair is complete
2. THE System SHALL allow scheduling delivery for equipment return
3. WHERE delivery is scheduled, THE System SHALL allow assigning a technician for delivery
4. WHEN equipment is picked up or delivered, THE System SHALL allow marking it as "returned"
5. THE System SHALL require customer signature confirmation upon equipment return

### Requirement 8

**User Story:** As an admin user, I want to view workshop performance metrics, so that I can analyze repair efficiency

#### Acceptance Criteria

1. THE System SHALL calculate average repair time for workshop jobs
2. THE System SHALL display count of equipment by status (received, in-repair, completed)
3. THE System SHALL show workshop utilization metrics (jobs per technician)
4. THE System SHALL track on-time completion rate for workshop jobs
5. THE System SHALL allow filtering metrics by date range and equipment type

### Requirement 9

**User Story:** As an admin user, I want to generate invoices for workshop repairs, so that I can bill customers for depot repair services

#### Acceptance Criteria

1. WHEN a workshop job is completed, THE System SHALL make it available for invoicing
2. THE System SHALL include workshop labor charges in the invoice
3. THE System SHALL include parts used during workshop repair in the invoice
4. THE System SHALL allow adding pickup/delivery fees to the invoice
5. THE System SHALL support the same invoicing workflow as on-site jobs

### Requirement 10

**User Story:** As a customer, I want to track the status of my equipment in the workshop, so that I know when it will be ready

#### Acceptance Criteria

1. WHEN a customer logs into the system, THE System SHALL display their equipment currently in the workshop
2. THE System SHALL show current status and estimated completion date
3. THE System SHALL display repair progress notes (customer-visible notes only)
4. THE System SHALL allow customers to view intake photos and condition report
5. THE System SHALL send automatic status update notifications to customers

### Requirement 11

**User Story:** As an admin user, I want to set estimated completion dates for workshop jobs, so that customers have expectations for repair timeline

#### Acceptance Criteria

1. WHEN creating or updating a workshop job, THE System SHALL allow setting an estimated completion date
2. THE System SHALL calculate estimated completion based on typical repair time for equipment type
3. THE System SHALL display days remaining until estimated completion
4. IF estimated completion date passes without job completion, THEN THE System SHALL flag the job as overdue
5. THE System SHALL allow updating estimated completion date with reason for change

### Requirement 12

**User Story:** As an admin user, I want to manage workshop capacity, so that I can avoid overloading the repair facility

#### Acceptance Criteria

1. THE System SHALL allow configuring maximum concurrent workshop jobs
2. WHEN workshop capacity is reached, THE System SHALL display a warning when creating new workshop jobs
3. THE System SHALL display current workshop capacity utilization percentage
4. THE System SHALL allow setting capacity limits per technician
5. THE System SHALL provide recommendations for job scheduling based on capacity
