# Implementation Plan: Reporting & Analytics System

## Overview

This implementation plan breaks down the Reporting & Analytics System into discrete, manageable coding tasks. Each task builds incrementally to create a comprehensive business intelligence platform.

---

## Tasks

- [ ] 1. Database schema and materialized views
  - [ ] 1.1 Create analytics tables
    - Create `report_templates` table with metrics and configuration fields
    - Create `scheduled_reports` table with frequency and recipients
    - Create `analytics_cache` table for performance optimization
    - Create `report_frequency` enum type
    - Add indexes for all new tables
    - Add updated_at triggers
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 1.2 Create materialized views for performance
    - Create `daily_job_stats` materialized view
    - Create `technician_performance_stats` materialized view
    - Create `customer_satisfaction_stats` materialized view
    - Create `equipment_maintenance_stats` materialized view
    - Create unique indexes on all materialized views
    - Create `refresh_analytics_views()` function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 1.3 Create database migration script
    - Write SQL migration file for analytics tables and views
    - Include rollback script
    - Test migration on development database
    - _Requirements: All_

  - [ ] 1.4 Set up materialized view refresh schedule
    - Create cron job to refresh views hourly
    - Implement concurrent refresh to avoid locking
    - Add logging for refresh operations
    - _Requirements: 1.5_

- [ ] 2. TypeScript types and interfaces
  - [ ] 2.1 Define analytics TypeScript types
    - Add `ReportType`, `ReportFrequency`, `GroupingPeriod` types to `api/src/types/index.ts`
    - Create `DashboardKPIs`, `TrendData`, `RevenueAnalytics`, `TechnicianPerformance` interfaces
    - Create `CustomerSatisfactionMetrics`, `EquipmentMaintenanceStats` interfaces
    - Create `ReportTemplate`, `ScheduledReport`, `AnalyticsCache` interfaces
    - Export all new types and interfaces
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Core analytics service
  - [ ] 3.1 Create analytics calculation service
    - Create `api/src/services/analyticsService.ts`
    - Implement `calculateUtilizationRate` function
    - Implement `calculateFirstTimeFixRate` function
    - Implement `calculateCSAT` function
    - Implement `calculateNPS` function
    - Implement `calculateMTBF` function
    - Implement `calculateCLV` function
    - Implement `calculateInventoryTurnover` function
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 3.2 Create caching service
    - Create `api/src/services/cacheService.ts`
    - Implement `generateCacheKey` function
    - Implement `getCachedData` function
    - Implement `setCachedData` function with TTL
    - Implement `invalidateCache` function
    - Use Redis for cache storage
    - _Requirements: 1.5, 12.5_

- [ ] 4. Dashboard and KPIs
  - [ ] 4.1 Create dashboard controller
    - Create `api/src/controllers/dashboardController.ts` (or extend existing)
    - Implement `getDashboardKPIs` function
    - Calculate total revenue, total jobs, completed jobs
    - Calculate avg technician utilization
    - Calculate avg customer satisfaction
    - Count active customers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.2 Implement dashboard trends
    - Add `getDashboardTrends` function
    - Generate revenue trend data
    - Generate jobs trend data
    - Generate satisfaction trend data
    - Support different time periods (daily, weekly, monthly)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.3 Implement real-time metrics
    - Add `getRealtimeMetrics` function
    - Count active jobs
    - Count technicians on jobs
    - Calculate today's revenue
    - Count today's completed jobs
    - Count pending assignments
    - Identify low stock items
    - Count overdue jobs
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 4.4 Create dashboard routes
    - Add GET `/api/analytics/dashboard` route
    - Add GET `/api/analytics/realtime` route
    - Apply authentication middleware
    - Implement caching for dashboard data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 5. Revenue analytics
  - [ ] 5.1 Create revenue analytics controller
    - Create `api/src/controllers/revenueAnalyticsController.ts`
    - Implement `getRevenueAnalytics` function
    - Calculate total revenue for date range
    - Break down revenue by period (daily, weekly, monthly)
    - Break down revenue by type (on-site, workshop, parts, labor)
    - Calculate profit margin
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 5.2 Implement revenue comparisons
    - Calculate month-over-month change
    - Calculate year-over-year change
    - Identify revenue trends
    - _Requirements: 2.4_

  - [ ] 5.3 Implement top customers analysis
    - Query top customers by revenue
    - Calculate revenue contribution percentage
    - _Requirements: 2.5_

  - [ ] 5.4 Implement profitability analysis
    - Add `getProfitabilityAnalysis` function
    - Calculate costs (labor, parts, overhead)
    - Calculate profit margins by job type
    - Identify unprofitable jobs
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 5.5 Create revenue analytics routes
    - Add GET `/api/analytics/revenue` route
    - Add GET `/api/analytics/revenue/trends` route
    - Add GET `/api/analytics/profitability` route
    - Implement caching
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 6. Technician performance analytics
  - [ ] 6.1 Create technician analytics controller
    - Create `api/src/controllers/technicianAnalyticsController.ts`
    - Implement `getTechnicianPerformance` function
    - Calculate utilization rate per technician
    - Count jobs completed per technician
    - Calculate avg job duration per technician
    - Calculate first-time fix rate
    - Calculate avg rating per technician
    - Calculate total revenue per technician
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 6.2 Implement individual technician metrics
    - Add `getTechnicianMetrics` function for single technician
    - Include billable hours and available hours
    - Generate performance trend over time
    - Include customer feedback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 6.3 Create technician analytics routes
    - Add GET `/api/analytics/technicians` route
    - Add GET `/api/analytics/technicians/:id` route
    - Implement caching
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Customer satisfaction analytics
  - [ ] 7.1 Create customer analytics controller
    - Create `api/src/controllers/customerAnalyticsController.ts`
    - Implement `getCustomerSatisfaction` function
    - Calculate overall CSAT score
    - Calculate NPS score
    - Generate satisfaction trend
    - Calculate rating distribution
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.2 Implement feedback analysis
    - Extract common themes from feedback
    - Perform sentiment analysis on feedback
    - Identify at-risk customers (low ratings)
    - _Requirements: 4.4_

  - [ ] 7.3 Implement customer retention analytics
    - Add `getCustomerRetention` function
    - Calculate retention rate
    - Count new customers
    - Count churned customers
    - Identify at-risk customers (no recent jobs)
    - Calculate customer lifetime value
    - Calculate repeat business rate
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 7.4 Create customer analytics routes
    - Add GET `/api/analytics/customers/satisfaction` route
    - Add GET `/api/analytics/customers/retention` route
    - Add GET `/api/analytics/customers/:id/history` route
    - Implement caching
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8. Equipment maintenance analytics
  - [ ] 8.1 Create equipment analytics controller
    - Create `api/src/controllers/equipmentAnalyticsController.ts`
    - Implement `getEquipmentMaintenance` function
    - Query equipment maintenance stats from materialized view
    - Calculate MTBF for each equipment type
    - Identify high-maintenance equipment
    - Calculate reliability by brand
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 8.2 Implement equipment cost analysis
    - Add `getEquipmentCosts` function
    - Calculate total service costs per equipment
    - Calculate avg service cost per equipment type
    - Identify cost trends
    - _Requirements: 5.3_

  - [ ] 8.3 Create equipment analytics routes
    - Add GET `/api/analytics/equipment/maintenance` route
    - Add GET `/api/analytics/equipment/costs` route
    - Implement caching
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Job completion analytics
  - [ ] 9.1 Create job analytics controller
    - Create `api/src/controllers/jobAnalyticsController.ts`
    - Implement `getJobCompletion` function
    - Calculate completion rate
    - Calculate on-time completion rate
    - Calculate avg completion time
    - Generate status distribution
    - Generate priority distribution
    - Calculate cancellation rate
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 9.2 Implement SLA compliance analytics
    - Add `getSLACompliance` function
    - Calculate SLA compliance rate
    - Count breached SLAs
    - Calculate avg response time
    - Show SLA performance by customer
    - Identify at-risk jobs
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 9.3 Create job analytics routes
    - Add GET `/api/analytics/jobs/completion` route
    - Add GET `/api/analytics/jobs/sla` route
    - Implement caching
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 10. Inventory analytics
  - [ ] 10.1 Create inventory analytics controller
    - Create `api/src/controllers/inventoryAnalyticsController.ts`
    - Implement `getInventoryAnalytics` function
    - Identify most used parts
    - Calculate inventory turnover rate
    - Identify slow-moving items
    - Calculate parts cost percentage
    - Track stockout incidents
    - Calculate inventory value
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.2 Create inventory analytics routes
    - Add GET `/api/analytics/inventory` route
    - Implement caching
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Geographic analytics
  - [ ] 11.1 Create geographic analytics controller
    - Create `api/src/controllers/geographicAnalyticsController.ts`
    - Implement `getGeographicPerformance` function
    - Map jobs by location coordinates
    - Calculate revenue by geographic area
    - Calculate avg travel time
    - Identify technician coverage areas
    - Identify underserved areas
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 11.2 Create geographic analytics routes
    - Add GET `/api/analytics/geographic` route
    - Implement caching
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 12. Seasonal trends analytics
  - [ ] 12.1 Create seasonal analytics service
    - Create `api/src/services/seasonalAnalyticsService.ts`
    - Implement `getSeasonalTrends` function
    - Analyze job volume by month and season
    - Identify peak and slow periods
    - Compare year-over-year performance
    - Generate demand forecasts
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 12.2 Create seasonal analytics routes
    - Add GET `/api/analytics/seasonal` route
    - Implement caching
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 13. Custom report builder
  - [ ] 13.1 Create report template controller
    - Create `api/src/controllers/reportTemplateController.ts`
    - Implement `getReportTemplates` function
    - Implement `getReportTemplate` function
    - Implement `createReportTemplate` function
    - Implement `updateReportTemplate` function
    - Implement `deleteReportTemplate` function
    - Validate template configuration
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 13.2 Create report generation service
    - Create `api/src/services/reportGenerationService.ts`
    - Implement `generateReport` function
    - Load report template
    - Apply filters
    - Fetch data for each metric
    - Apply grouping
    - Generate charts
    - Format output
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 13.3 Create report template routes
    - Add GET `/api/analytics/reports/templates` route
    - Add GET `/api/analytics/reports/templates/:id` route
    - Add POST `/api/analytics/reports/templates` route
    - Add PUT `/api/analytics/reports/templates/:id` route
    - Add DELETE `/api/analytics/reports/templates/:id` route
    - Add POST `/api/analytics/reports/generate` route
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14. Report export functionality
  - [ ] 14.1 Install export libraries
    - Install PDFKit for PDF generation
    - Install ExcelJS for Excel generation
    - Install csv-writer for CSV generation
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 14.2 Create export service
    - Create `api/src/services/exportService.ts`
    - Implement `exportToPDF` function with charts
    - Implement `exportToCSV` function
    - Implement `exportToExcel` function with charts
    - Handle large datasets efficiently
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 14.3 Create export controller
    - Create `api/src/controllers/exportController.ts`
    - Implement `exportReportPDF` function
    - Implement `exportReportCSV` function
    - Implement `exportReportExcel` function
    - Return file download response
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 14.4 Create export routes
    - Add POST `/api/analytics/export/pdf` route
    - Add POST `/api/analytics/export/csv` route
    - Add POST `/api/analytics/export/excel` route
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 15. Scheduled reports
  - [ ] 15.1 Create scheduled reports controller
    - Create `api/src/controllers/scheduledReportsController.ts`
    - Implement `getScheduledReports` function
    - Implement `createScheduledReport` function
    - Implement `updateScheduledReport` function
    - Implement `deleteScheduledReport` function
    - Implement `sendReportNow` function
    - _Requirements: 10.5_

  - [ ] 15.2 Create scheduled reports service
    - Create `api/src/services/scheduledReportsService.ts`
    - Implement `calculateNextSendDate` function
    - Implement `sendScheduledReport` function
    - Generate report
    - Export to PDF
    - Send via email to recipients
    - Update last_sent_at and next_send_at
    - _Requirements: 10.5_

  - [ ] 15.3 Create scheduled reports cron job
    - Create `api/src/jobs/scheduledReportsJob.ts`
    - Implement cron job to check for due reports
    - Send reports where next_send_at <= now
    - Handle errors and retries
    - Register cron job in server startup
    - _Requirements: 10.5_

  - [ ] 15.4 Create scheduled reports routes
    - Add GET `/api/analytics/scheduled-reports` route
    - Add POST `/api/analytics/scheduled-reports` route
    - Add PUT `/api/analytics/scheduled-reports/:id` route
    - Add DELETE `/api/analytics/scheduled-reports/:id` route
    - Add POST `/api/analytics/scheduled-reports/:id/send-now` route
    - _Requirements: 10.5_


- [ ] 16. Admin frontend - Analytics dashboard
  - [ ] 16.1 Create main analytics dashboard page
    - Create `admin-frontend/src/pages/Analytics.tsx`
    - Display KPI cards (revenue, jobs, utilization, satisfaction)
    - Show trend charts (revenue, jobs, satisfaction)
    - Add date range selector
    - Auto-refresh every 5 minutes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 16.2 Create real-time metrics widget
    - Create `admin-frontend/src/components/RealtimeMetrics.tsx`
    - Display active jobs count
    - Display technicians on jobs
    - Display today's revenue and completed jobs
    - Display pending assignments
    - Display alerts (overdue jobs, low stock)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 16.3 Create analytics API service
    - Create `admin-frontend/src/services/analyticsService.ts`
    - Implement functions for all analytics endpoints
    - Handle API errors and responses
    - _Requirements: All_

- [ ] 17. Admin frontend - Revenue analytics page
  - [ ] 17.1 Create revenue analytics page
    - Create `admin-frontend/src/pages/RevenueAnalytics.tsx`
    - Display total revenue and profit margin
    - Show revenue by period chart
    - Show revenue by type breakdown (pie chart)
    - Display top customers table
    - Show month-over-month and year-over-year comparisons
    - Add date range and grouping selectors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 17.2 Create profitability analysis view
    - Create `admin-frontend/src/components/ProfitabilityAnalysis.tsx`
    - Display cost breakdown
    - Show profit margins by job type
    - Identify unprofitable jobs
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 18. Admin frontend - Technician performance page
  - [ ] 18.1 Create technician performance page
    - Create `admin-frontend/src/pages/TechnicianPerformance.tsx`
    - Display technician performance table
    - Show utilization rate, jobs completed, avg rating
    - Add sorting and filtering
    - Highlight top performers
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 18.2 Create individual technician detail view
    - Create `admin-frontend/src/components/TechnicianDetailMetrics.tsx`
    - Display detailed metrics for single technician
    - Show performance trend chart
    - Display customer feedback
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 19. Admin frontend - Customer satisfaction page
  - [ ] 19.1 Create customer satisfaction page
    - Create `admin-frontend/src/pages/CustomerSatisfaction.tsx`
    - Display overall CSAT and NPS scores
    - Show satisfaction trend chart
    - Display rating distribution chart
    - Show feedback themes
    - List at-risk customers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 19.2 Create customer retention view
    - Create `admin-frontend/src/components/CustomerRetention.tsx`
    - Display retention metrics
    - Show new vs churned customers
    - List at-risk customers (no recent jobs)
    - Display customer lifetime value
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 20. Admin frontend - Equipment analytics page
  - [ ] 20.1 Create equipment analytics page
    - Create `admin-frontend/src/pages/EquipmentAnalytics.tsx`
    - Display equipment maintenance stats table
    - Show MTBF by equipment type
    - Display service costs by equipment
    - Show reliability by brand chart
    - Identify high-maintenance equipment
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 21. Admin frontend - Job analytics page
  - [ ] 21.1 Create job analytics page
    - Create `admin-frontend/src/pages/JobAnalytics.tsx`
    - Display completion metrics
    - Show status distribution chart
    - Show priority distribution chart
    - Display avg completion time
    - Show cancellation rate and reasons
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 21.2 Create SLA compliance view
    - Create `admin-frontend/src/components/SLACompliance.tsx`
    - Display SLA compliance rate
    - Show breached SLAs
    - Display avg response time
    - Show SLA performance by customer
    - List at-risk jobs
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 22. Admin frontend - Inventory analytics page
  - [ ] 22.1 Create inventory analytics page
    - Create `admin-frontend/src/pages/InventoryAnalytics.tsx`
    - Display most used parts
    - Show inventory turnover rate
    - List slow-moving items
    - Display parts cost percentage
    - Show stockout incidents
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 23. Admin frontend - Geographic analytics page
  - [ ] 23.1 Create geographic analytics page
    - Create `admin-frontend/src/pages/GeographicAnalytics.tsx`
    - Display jobs on map (use Google Maps or Mapbox)
    - Show revenue by area
    - Display avg travel time
    - Show technician coverage areas
    - Identify underserved areas
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 24. Admin frontend - Custom report builder
  - [ ] 24.1 Create report templates list page
    - Create `admin-frontend/src/pages/ReportTemplates.tsx`
    - Display saved report templates
    - Add create, edit, delete actions
    - Show template details (metrics, filters, grouping)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 24.2 Create report builder interface
    - Create `admin-frontend/src/components/ReportBuilder.tsx`
    - Add metric selector (checkboxes for available metrics)
    - Add filter builder (date range, customer, technician, etc.)
    - Add grouping selector (daily, weekly, monthly, etc.)
    - Add chart type selector
    - Preview report data
    - Save as template
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 24.3 Create report viewer
    - Create `admin-frontend/src/components/ReportViewer.tsx`
    - Display report data in tables
    - Display charts based on configuration
    - Add export buttons (PDF, CSV, Excel)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 25. Admin frontend - Report export functionality
  - [ ] 25.1 Implement export actions
    - Add export to PDF functionality
    - Add export to CSV functionality
    - Add export to Excel functionality
    - Show download progress
    - Handle large file downloads
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 26. Admin frontend - Scheduled reports
  - [ ] 26.1 Create scheduled reports page
    - Create `admin-frontend/src/pages/ScheduledReports.tsx`
    - Display list of scheduled reports
    - Show frequency, recipients, next send date
    - Add create, edit, delete actions
    - Add "Send Now" button
    - _Requirements: 10.5_

  - [ ] 26.2 Create scheduled report form
    - Create `admin-frontend/src/components/ScheduledReportForm.tsx`
    - Select report template
    - Select frequency (daily, weekly, monthly, quarterly)
    - Select day/time for sending
    - Add recipient emails (multi-input)
    - Toggle active/inactive
    - _Requirements: 10.5_

- [ ] 27. Admin frontend - Seasonal trends page
  - [ ] 27.1 Create seasonal trends page
    - Create `admin-frontend/src/pages/SeasonalTrends.tsx`
    - Display job volume by month chart
    - Show peak and slow periods
    - Display year-over-year comparison
    - Show demand forecast
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 28. Chart components
  - [ ] 28.1 Create reusable chart components
    - Create `admin-frontend/src/components/charts/LineChart.tsx`
    - Create `admin-frontend/src/components/charts/BarChart.tsx`
    - Create `admin-frontend/src/components/charts/PieChart.tsx`
    - Create `admin-frontend/src/components/charts/AreaChart.tsx`
    - Use Chart.js or Recharts library
    - Support responsive design
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 29. Integration and polish
  - [ ] 29.1 Update navigation and routing
    - Add "Analytics" menu item to admin sidebar with submenu
    - Add submenu items (Dashboard, Revenue, Technicians, Customers, Equipment, Jobs, Inventory, Geographic, Reports)
    - Configure routes for all analytics pages
    - _Requirements: All_

  - [ ] 29.2 Add analytics widgets to main dashboard
    - Add "View Analytics" button to main dashboard
    - Add mini analytics widgets to main dashboard
    - Link to detailed analytics pages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 29.3 Implement error handling and loading states
    - Add loading spinners for data fetching
    - Add error messages for failed requests
    - Add empty states for no data
    - Handle date range validation
    - _Requirements: All_

  - [ ]* 29.4 Add comprehensive logging
    - Log all analytics queries
    - Log report generation
    - Log export operations
    - Log scheduled report sending
    - _Requirements: All_

- [ ]* 30. Testing and documentation
  - [ ]* 30.1 Write unit tests for calculations
    - Test KPI calculation functions
    - Test trend calculation
    - Test grouping logic
    - Test cache key generation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 30.2 Write integration tests for analytics
    - Test dashboard KPIs endpoint
    - Test revenue analytics endpoint
    - Test technician performance endpoint
    - Test report generation
    - Test export functionality
    - _Requirements: All_

  - [ ]* 30.3 Write API documentation
    - Document all analytics endpoints
    - Document all report endpoints
    - Include request/response examples
    - Document caching behavior
    - _Requirements: All_

  - [ ]* 30.4 Create user guide
    - Write guide for viewing analytics
    - Write guide for creating custom reports
    - Write guide for scheduling reports
    - Write guide for exporting data
    - _Requirements: All_
