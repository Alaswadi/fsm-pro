# Implementation Plan: Workshop/Depot Repair System

## Overview

This implementation plan breaks down the Workshop/Depot Repair System into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring the system integrates seamlessly with existing work order management.

---

## Tasks

- [ ] 1. Database schema and migrations
  - [ ] 1.1 Extend jobs table for workshop functionality
    - Add `location_type` column with CHECK constraint ('on_site', 'workshop')
    - Add `estimated_completion_date` column
    - Add `pickup_delivery_fee` column
    - Add `delivery_scheduled_date` column
    - Add `delivery_technician_id` column with foreign key to technicians
    - Create indexes on new columns
    - Set default value 'on_site' for existing jobs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.2, 7.3_

  - [ ] 1.2 Create equipment intake and status tables
    - Create `equipment_repair_status` enum type
    - Create `equipment_intake` table with all fields and constraints
    - Create `equipment_status` table with status timestamps
    - Create `equipment_status_history` table for audit trail
    - Create `intake_photos` table
    - Create `workshop_settings` table
    - Add indexes for all new tables
    - Add updated_at triggers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 1.3 Create database migration script
    - Write SQL migration file to add all workshop tables
    - Include rollback script for safe migration reversal
    - Test migration on development database
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 1.4 Seed default workshop settings for existing companies
    - Write script to create default workshop_settings record for each company
    - Set sensible defaults (max 20 concurrent jobs, 24hr repair time)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 2. TypeScript types and interfaces
  - [ ] 2.1 Define workshop-related TypeScript types
    - Add `LocationType` and `EquipmentRepairStatus` types to `api/src/types/index.ts`
    - Extend `Job` interface with workshop fields
    - Create `EquipmentIntake`, `EquipmentStatus`, `EquipmentStatusHistory`, `IntakePhoto`, `WorkshopSettings`, `WorkshopMetrics` interfaces
    - Export all new types and interfaces
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Workshop settings management
  - [ ] 3.1 Create workshop settings controller
    - Create `api/src/controllers/workshopSettingsController.ts`
    - Implement `getWorkshopSettings` function to fetch company workshop settings
    - Implement `updateWorkshopSettings` function
    - Add validation for settings fields
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 3.2 Create workshop settings routes
    - Create `api/src/routes/workshopSettings.ts`
    - Add GET `/api/workshop/settings` route
    - Add PUT `/api/workshop/settings` route
    - Apply authentication middleware
    - Register routes in main router
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 4. Equipment intake management
  - [ ] 4.1 Create intake service for business logic
    - Create `api/src/services/intakeService.ts`
    - Implement `createIntakeRecord` function with equipment status initialization
    - Implement `validateIntakeData` function
    - Implement `calculateEstimatedCompletion` function based on equipment type
    - Use database transactions for intake creation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.2 Create intake controller
    - Create `api/src/controllers/intakeController.ts`
    - Implement `createIntake` function to record equipment intake
    - Implement `getIntake` function to fetch intake record by job_id
    - Implement `updateIntake` function
    - Validate job is workshop type before creating intake
    - Prevent duplicate intake records for same job
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.3 Implement intake photo upload
    - Add `uploadIntakePhotos` function to intake controller
    - Support multiple photo uploads
    - Store photo URLs in intake_photos table
    - Support photo types (overall, damage, serial_number, accessories)
    - Use existing upload service/storage
    - _Requirements: 2.3_

  - [ ] 4.4 Create intake routes
    - Create `api/src/routes/intake.ts`
    - Add POST `/api/workshop/intake` route
    - Add GET `/api/workshop/intake/:job_id` route
    - Add PUT `/api/workshop/intake/:id` route
    - Add POST `/api/workshop/intake/:id/photos` route with file upload middleware
    - Add GET `/api/workshop/intake/:id/photos` route
    - Register routes in main router
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Equipment status tracking
  - [ ] 5.1 Create status service
    - Create `api/src/services/statusService.ts`
    - Implement `updateEquipmentStatus` function with validation
    - Implement `validateStatusTransition` function using transition rules
    - Implement `recordStatusHistory` function
    - Implement `updateJobStatusFromEquipmentStatus` function
    - Use database transactions for status updates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 5.2 Create status controller
    - Create `api/src/controllers/statusController.ts`
    - Implement `getEquipmentStatus` function
    - Implement `updateStatus` function with transition validation
    - Implement `getStatusHistory` function
    - Automatically update job status when equipment status changes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 5.3 Create status routes
    - Create `api/src/routes/status.ts`
    - Add GET `/api/workshop/status/:job_id` route
    - Add PUT `/api/workshop/status/:job_id` route
    - Add GET `/api/workshop/status/:job_id/history` route
    - Register routes in main router
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Workshop job management
  - [ ] 6.1 Update job creation to support location type
    - Modify `createJob` function in jobs controller
    - Add location_type field to job creation
    - Set default location_type to 'on_site'
    - Allow creating workshop jobs without scheduled_date
    - Initialize equipment_status record for workshop jobs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 6.2 Update job listing to filter by location type
    - Modify `getJobs` function to support location_type filter
    - Add location_type to job list response
    - Include equipment_status for workshop jobs
    - _Requirements: 1.4, 1.5_

  - [ ] 6.3 Create workshop-specific job endpoints
    - Create `api/src/controllers/workshopController.ts`
    - Implement `getWorkshopJobs` function (filters for location_type='workshop')
    - Implement `getWorkshopQueue` function (filters for received/in_repair status)
    - Implement `claimJob` function for technicians to claim from queue
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.4 Create workshop routes
    - Create `api/src/routes/workshop.ts`
    - Add GET `/api/workshop/jobs` route
    - Add GET `/api/workshop/queue` route
    - Add POST `/api/workshop/jobs/:id/claim` route
    - Register routes in main router
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Workshop queue logic
  - [ ] 7.1 Implement queue service
    - Create `api/src/services/queueService.ts`
    - Implement `getWorkshopQueue` function with priority calculation
    - Implement `calculatePriorityScore` function (priority + days waiting + overdue)
    - Implement `sortQueueByPriority` function
    - Support filtering by equipment type, customer, priority
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.2 Implement job claiming logic
    - Add `claimJobFromQueue` function to workshop service
    - Assign technician to job
    - Update equipment status to 'in_repair'
    - Update job status to 'in_progress'
    - Validate technician capacity before claiming
    - _Requirements: 4.4, 4.5_

- [ ] 8. Return logistics management
  - [ ] 8.1 Implement ready-for-pickup functionality
    - Add `markReadyForPickup` function to workshop controller
    - Update equipment status to 'ready_for_pickup'
    - Trigger customer notification
    - Update job status to 'completed'
    - _Requirements: 7.1, 7.4, 7.5_

  - [ ] 8.2 Implement delivery scheduling
    - Add `scheduleDelivery` function to workshop controller
    - Set delivery_scheduled_date and delivery_technician_id
    - Update equipment status to 'out_for_delivery'
    - Add pickup_delivery_fee if specified
    - _Requirements: 7.2, 7.3_

  - [ ] 8.3 Implement equipment return confirmation
    - Add `markEquipmentReturned` function to workshop controller
    - Require customer signature
    - Update equipment status to 'returned'
    - Record return timestamp
    - _Requirements: 7.4, 7.5_

  - [ ] 8.4 Create return logistics routes
    - Add POST `/api/workshop/jobs/:id/ready-for-pickup` route
    - Add POST `/api/workshop/jobs/:id/schedule-delivery` route
    - Add POST `/api/workshop/jobs/:id/mark-returned` route
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Workshop notifications
  - [ ] 9.1 Create workshop notification service
    - Create `api/src/services/workshopNotificationService.ts`
    - Implement `sendIntakeConfirmation` function
    - Implement `sendReadyNotification` function
    - Implement `sendStatusUpdate` function
    - Implement `sendDeliveryNotification` function
    - Use existing notification system (email/SMS/WhatsApp)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.5_

  - [ ] 9.2 Integrate notifications with status changes
    - Trigger intake confirmation when intake is created
    - Trigger status update when equipment status changes
    - Trigger ready notification when marked ready for pickup
    - Trigger delivery notification when delivery is scheduled
    - Check workshop_settings for notification preferences
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.5_

- [ ] 10. Workshop metrics and reporting
  - [ ] 10.1 Create metrics service
    - Create `api/src/services/workshopMetricsService.ts`
    - Implement `calculateAverageRepairTime` function
    - Implement `getJobsByStatus` function
    - Implement `calculateOnTimeCompletionRate` function
    - Implement `getWorkshopUtilization` function
    - Implement `getJobsPerTechnician` function
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 10.2 Create metrics endpoint
    - Add `getWorkshopMetrics` function to workshop controller
    - Support date range filtering
    - Return all key metrics in single response
    - Add GET `/api/workshop/metrics` route
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Workshop capacity management
  - [ ] 11.1 Implement capacity validation
    - Create `api/src/services/capacityService.ts`
    - Implement `checkWorkshopCapacity` function
    - Implement `checkTechnicianCapacity` function
    - Implement `getCapacityUtilization` function
    - Use workshop_settings for capacity limits
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 11.2 Integrate capacity checks
    - Validate capacity when creating workshop jobs
    - Validate capacity when technician claims job
    - Display warnings when approaching capacity limits
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12. Admin frontend - Workshop queue page
  - [ ] 12.1 Create workshop queue page
    - Create `admin-frontend/src/pages/WorkshopQueue.tsx`
    - Display equipment in queue with priority sorting
    - Show customer name, equipment type, reported issue, priority, days waiting
    - Add filters for priority, equipment type, customer
    - Show current capacity utilization
    - Add "Claim Job" button for technicians
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 12.2 Implement queue actions
    - Add claim job functionality
    - Show confirmation dialog before claiming
    - Update queue in real-time after claim
    - Display technician's current workload
    - _Requirements: 4.4, 4.5_

  - [ ] 12.3 Create workshop API service
    - Create `admin-frontend/src/services/workshopService.ts`
    - Implement functions for all workshop API endpoints
    - Handle API errors and responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Admin frontend - Equipment intake form
  - [ ] 13.1 Create intake form component
    - Create `admin-frontend/src/components/EquipmentIntakeForm.tsx`
    - Add fields for reported issue, visual condition, damage notes, accessories
    - Add customer signature capture
    - Add photo upload with preview
    - Support multiple photo types
    - Calculate estimated completion date
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 13.2 Integrate intake form with job detail page
    - Add "Record Intake" button to workshop job detail page
    - Display intake form in modal or separate section
    - Show existing intake record if already created
    - Allow editing intake record
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 13.3 Create intake API service
    - Create `admin-frontend/src/services/intakeService.ts`
    - Implement functions for intake CRUD operations
    - Implement photo upload function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 14. Admin frontend - Status tracking interface
  - [ ] 14.1 Create status timeline component
    - Create `admin-frontend/src/components/EquipmentStatusTimeline.tsx`
    - Display status history as visual timeline
    - Show timestamps for each status change
    - Highlight current status
    - Show who made each status change
    - Display notes for each transition
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 14.2 Create status update component
    - Create `admin-frontend/src/components/UpdateStatusModal.tsx`
    - Add status dropdown with only valid transitions
    - Add notes field for status change reason
    - Show confirmation for status update
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 14.3 Integrate status tracking with job detail page
    - Add status timeline to workshop job detail page
    - Add "Update Status" button
    - Show current equipment status prominently
    - Display estimated completion date
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 14.4 Create status API service
    - Create `admin-frontend/src/services/statusService.ts`
    - Implement functions for status operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 15. Admin frontend - Return logistics interface
  - [ ] 15.1 Create return logistics component
    - Create `admin-frontend/src/components/ReturnLogistics.tsx`
    - Add "Mark Ready for Pickup" button
    - Add "Schedule Delivery" form with date picker and technician selector
    - Add delivery fee input
    - Add "Mark as Returned" button with signature capture
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 15.2 Integrate return logistics with job detail page
    - Show return logistics section for completed repairs
    - Display delivery schedule if set
    - Show return confirmation details
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 16. Admin frontend - Workshop settings page
  - [ ] 16.1 Create workshop settings page
    - Create `admin-frontend/src/pages/WorkshopSettings.tsx`
    - Add form for capacity settings
    - Add workshop location and contact info fields
    - Add notification preferences toggles
    - Add notification template editors
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 16.2 Implement settings save functionality
    - Validate all settings fields
    - Save settings via API
    - Show success/error notifications
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 16.3 Create workshop settings API service
    - Create `admin-frontend/src/services/workshopSettingsService.ts`
    - Implement get and update functions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 17. Admin frontend - Workshop metrics dashboard
  - [ ] 17.1 Create workshop metrics page
    - Create `admin-frontend/src/pages/WorkshopMetrics.tsx`
    - Display KPI cards (avg repair time, on-time rate, capacity utilization)
    - Show jobs by status chart
    - Display jobs per technician table
    - Add date range selector
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 17.2 Create metrics API service
    - Create `admin-frontend/src/services/metricsService.ts`
    - Implement function to fetch workshop metrics
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 18. Admin frontend - Job creation updates
  - [ ] 18.1 Update work order creation form
    - Add location type selector (On-Site / Workshop) to job creation modal
    - Conditionally hide/show scheduled date based on location type
    - Add estimated completion date picker for workshop jobs
    - Add pickup/delivery fee input for workshop jobs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 18.2 Update job list page
    - Add location type badge to job list items
    - Add filter for location type
    - Show equipment status for workshop jobs
    - _Requirements: 1.4, 1.5_

- [ ] 19. Customer portal - Equipment tracking
  - [ ] 19.1 Create customer equipment tracking page
    - Create customer-facing page to view equipment in workshop
    - Display current status with visual timeline
    - Show estimated completion date
    - Display customer-visible repair notes
    - Show intake photos
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 19.2 Add equipment tracking to customer dashboard
    - Show count of equipment currently in workshop
    - Display status of each equipment item
    - Add link to detailed tracking page
    - _Requirements: 10.1, 10.2_

- [ ] 20. Mobile app - Workshop job support
  - [ ] 20.1 Update mobile job list to show location type
    - Add location type badge to job cards
    - Filter workshop jobs separately
    - Show equipment status for workshop jobs
    - _Requirements: 1.4, 1.5_

  - [ ] 20.2 Create workshop queue view for mobile
    - Create mobile-optimized workshop queue screen
    - Allow technicians to claim jobs from mobile
    - Show priority and days waiting
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 20.3 Add status update functionality to mobile
    - Allow technicians to update equipment status from mobile
    - Add quick status update buttons
    - Support adding notes with status changes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 21. Integration and polish
  - [ ] 21.1 Update navigation and routing
    - Add "Workshop Queue" menu item to admin sidebar
    - Add "Workshop Metrics" menu item
    - Add "Workshop Settings" to settings menu
    - Configure routes for all new pages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 21.2 Add dashboard widgets for workshop
    - Add "Equipment in Workshop" KPI card to dashboard
    - Add "Workshop Capacity" KPI card
    - Add "Average Repair Time" KPI card
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 21.3 Update invoicing integration
    - Ensure workshop jobs can be invoiced
    - Include pickup/delivery fees in invoice
    - Support same invoicing workflow as on-site jobs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 21.4 Implement error handling and validation
    - Add comprehensive error handling for all API endpoints
    - Add input validation on frontend forms
    - Display user-friendly error messages
    - Handle edge cases (invalid status transitions, capacity exceeded, etc.)
    - _Requirements: All_

  - [ ]* 21.5 Add comprehensive logging
    - Log all status changes
    - Log intake creation and updates
    - Log job claims and assignments
    - Log notification sending
    - _Requirements: All_

- [ ]* 22. Testing and documentation
  - [ ]* 22.1 Write unit tests for status transition logic
    - Test valid status transitions
    - Test invalid transition rejection
    - Test automatic job status updates
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 22.2 Write integration tests for workshop workflow
    - Test complete intake process
    - Test status updates and history
    - Test queue management
    - Test return logistics
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 22.3 Write API documentation
    - Document all workshop endpoints
    - Document all intake endpoints
    - Document all status endpoints
    - Include request/response examples
    - _Requirements: All_

  - [ ]* 22.4 Create user guide
    - Write guide for creating workshop jobs
    - Write guide for equipment intake process
    - Write guide for managing workshop queue
    - Write guide for return logistics
    - _Requirements: All_
