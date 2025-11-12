# Requirements Document

## Introduction

This document outlines the requirements for a Flutter-based mobile application for the FSM Pro platform. The application will replace the existing React Native (Expo) mobile app and provide field service technicians and customers with a modern, performant mobile interface for managing work orders, inventory, equipment tracking, and workshop operations. The app will support both iOS and Android platforms and integrate with the existing FSM Pro backend API.

## Glossary

- **FSM_App**: The Flutter mobile application for field service management
- **Backend_API**: The existing Node.js/Express REST API at https://fsmpro.phishsimulator.com/api
- **Technician_User**: A field service technician who performs on-site or workshop repairs
- **Customer_User**: A customer who can view their equipment and work order status
- **Work_Order**: A job or service request assigned to a technician
- **Workshop_Job**: A work order where equipment is brought to the workshop for repair
- **Equipment_Intake**: The process of receiving and documenting equipment condition at workshop
- **Inventory_Item**: Parts and supplies tracked in the system
- **Equipment_Status**: The current state of equipment in the repair workflow

## Requirements

### Requirement 1

**User Story:** As a Technician_User, I want to log into the FSM_App using my email and password, so that I can access my assigned work orders and perform my duties

#### Acceptance Criteria

1. WHEN a Technician_User enters valid credentials and taps the login button, THE FSM_App SHALL authenticate with the Backend_API and store the authentication token securely
2. WHEN authentication succeeds, THE FSM_App SHALL navigate the Technician_User to the work orders screen
3. IF authentication fails, THEN THE FSM_App SHALL display an error message indicating invalid credentials
4. THE FSM_App SHALL display a "Forgot Password?" link that initiates the password reset flow
5. WHILE the FSM_App is authenticating, THE FSM_App SHALL display a loading indicator on the login button

### Requirement 2

**User Story:** As a Technician_User, I want to view my assigned work orders with their status and priority, so that I can plan my work schedule effectively

#### Acceptance Criteria

1. THE FSM_App SHALL display a list of work orders assigned to the authenticated Technician_User
2. WHEN the work orders screen loads, THE FSM_App SHALL fetch work orders from the Backend_API filtered by the current technician's ID
3. THE FSM_App SHALL display each work order with job number, title, customer name, scheduled date, status badge, and priority indicator
4. THE FSM_App SHALL provide filter tabs for "All", "Scheduled", "In Progress", and "Completed" work orders
5. THE FSM_App SHALL provide a search field that filters work orders by job number, title, or customer name
6. WHEN a Technician_User taps on a work order, THE FSM_App SHALL navigate to the work order details screen

### Requirement 3

**User Story:** As a Technician_User, I want to view detailed information about a work order, so that I can understand the job requirements and customer needs

#### Acceptance Criteria

1. THE FSM_App SHALL display work order details including job number, title, description, customer information, equipment details, scheduled date, priority, and current status
2. WHEN the work order details screen loads, THE FSM_App SHALL fetch complete job data from the Backend_API
3. WHERE the work order has equipment assigned, THE FSM_App SHALL display equipment brand, model, serial number, and type
4. THE FSM_App SHALL display customer contact information including name, phone number, email, and address
5. WHERE the work order includes notes, THE FSM_App SHALL display all job notes in chronological order

### Requirement 4

**User Story:** As a Technician_User, I want to update the status of my work orders, so that I can track my progress and communicate with the office

#### Acceptance Criteria

1. THE FSM_App SHALL provide status update buttons for "Start Job", "Complete Job", and "Cancel Job" based on current work order status
2. WHEN a Technician_User taps a status update button, THE FSM_App SHALL send the status change to the Backend_API
3. WHEN a status update succeeds, THE FSM_App SHALL refresh the work order details and display a success message
4. IF a status update fails, THEN THE FSM_App SHALL display an error message and maintain the previous status
5. WHERE a Technician_User completes a job, THE FSM_App SHALL prompt for optional completion notes before submitting

### Requirement 5

**User Story:** As a Technician_User, I want to view available inventory items with stock levels, so that I can check part availability for my jobs

#### Acceptance Criteria

1. THE FSM_App SHALL display a list of inventory items with part number, name, price, and current stock level
2. WHEN the inventory screen loads, THE FSM_App SHALL fetch inventory data from the Backend_API
3. THE FSM_App SHALL provide a search field that filters inventory by part number or name
4. THE FSM_App SHALL display stock level indicators with colors: blue for adequate stock, yellow for low stock, red for critical stock, and gray for out of stock
5. THE FSM_App SHALL display a visual progress bar representing stock level relative to minimum and maximum thresholds
6. WHERE an item is out of stock, THE FSM_App SHALL display "Out of Stock" text in red

### Requirement 6

**User Story:** As a Technician_User, I want to view my profile information and update my availability status, so that I can manage my work schedule

#### Acceptance Criteria

1. THE FSM_App SHALL display the Technician_User's profile including name, role, email, phone, location, skills, and certifications
2. THE FSM_App SHALL display today's summary showing jobs completed count and hours logged
3. THE FSM_App SHALL provide an availability toggle that updates the technician's status between "Available" and "Offline"
4. WHEN a Technician_User changes their availability status, THE FSM_App SHALL send the update to the Backend_API
5. THE FSM_App SHALL provide a logout button that clears authentication data and returns to the login screen

### Requirement 7

**User Story:** As a Technician_User, I want to view the workshop queue of pending repairs, so that I can claim and work on workshop jobs

#### Acceptance Criteria

1. THE FSM_App SHALL display a list of workshop jobs with status "pending_intake", "received", or "in_repair"
2. WHEN the workshop queue screen loads, THE FSM_App SHALL fetch workshop jobs from the Backend_API
3. THE FSM_App SHALL display each workshop job with job number, equipment type, customer name, priority, and current equipment status
4. THE FSM_App SHALL provide a "Claim Job" button for jobs not yet assigned to a technician
5. WHEN a Technician_User taps "Claim Job", THE FSM_App SHALL assign the job to the technician via the Backend_API

### Requirement 8

**User Story:** As a Technician_User, I want to update equipment status during workshop repairs, so that customers and office staff can track repair progress

#### Acceptance Criteria

1. WHERE a work order is a Workshop_Job, THE FSM_App SHALL display equipment status tracking on the work order details screen
2. THE FSM_App SHALL display the current equipment status with timestamp
3. THE FSM_App SHALL provide status transition buttons based on the current status (e.g., "Mark as In Repair", "Mark as Completed")
4. WHEN a Technician_User updates equipment status, THE FSM_App SHALL send the status change to the Backend_API with optional notes
5. THE FSM_App SHALL display equipment status history showing all previous status changes with timestamps

### Requirement 9

**User Story:** As a Customer_User, I want to log into the FSM_App and view my equipment and work orders, so that I can track service requests

#### Acceptance Criteria

1. WHEN a Customer_User logs in with valid credentials, THE FSM_App SHALL authenticate and navigate to the customer dashboard
2. THE FSM_App SHALL display a customer dashboard showing active work orders and equipment list
3. WHEN a Customer_User taps on a work order, THE FSM_App SHALL display work order details including status and equipment information
4. WHERE a work order is a Workshop_Job, THE FSM_App SHALL display current equipment status and repair progress
5. THE FSM_App SHALL allow Customer_User to view their profile and contact information

### Requirement 10

**User Story:** As a user of the FSM_App, I want the app to handle network errors gracefully, so that I understand when connectivity issues occur

#### Acceptance Criteria

1. WHEN the Backend_API is unreachable, THE FSM_App SHALL display a user-friendly error message indicating network connectivity issues
2. WHEN an API request times out after 30 seconds, THE FSM_App SHALL display a timeout error message
3. IF an API request returns a 401 unauthorized error, THEN THE FSM_App SHALL clear authentication data and redirect to the login screen
4. THE FSM_App SHALL provide retry buttons on error screens for failed data fetches
5. WHILE data is loading from the Backend_API, THE FSM_App SHALL display loading indicators

### Requirement 11

**User Story:** As a Technician_User, I want the app to persist my authentication between sessions, so that I don't have to log in every time I open the app

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE FSM_App SHALL store the authentication token in secure local storage
2. WHEN the FSM_App launches, THE FSM_App SHALL check for a valid stored authentication token
3. WHERE a valid token exists, THE FSM_App SHALL navigate directly to the appropriate home screen based on user role
4. WHERE no valid token exists, THE FSM_App SHALL display the login screen
5. WHEN a user logs out, THE FSM_App SHALL remove all stored authentication data

### Requirement 12

**User Story:** As a Technician_User, I want to navigate between different sections of the app using a bottom navigation bar, so that I can quickly access work orders, inventory, and my profile

#### Acceptance Criteria

1. THE FSM_App SHALL display a bottom navigation bar with tabs for "Work Orders", "Inventory", "Workshop Queue", and "Profile"
2. WHEN a Technician_User taps a navigation tab, THE FSM_App SHALL navigate to the corresponding screen
3. THE FSM_App SHALL highlight the currently active tab in the navigation bar
4. WHERE the user is a Customer_User, THE FSM_App SHALL display navigation tabs for "Dashboard", "Work Orders", and "Profile"
5. THE FSM_App SHALL maintain navigation state when switching between tabs
