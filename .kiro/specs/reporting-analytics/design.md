# Design Document: Reporting & Analytics System

## Overview

The Reporting & Analytics System provides comprehensive business intelligence capabilities for FSM Pro, enabling data-driven decision making through KPI tracking, performance metrics, trend analysis, and customizable reports. The system aggregates data from all modules (jobs, customers, technicians, equipment, invoicing) to provide actionable insights.

### Key Design Goals

1. **Comprehensive Insights**: Cover all aspects of business operations
2. **Real-Time Data**: Provide up-to-date metrics and dashboards
3. **Performance**: Efficient queries for large datasets
4. **Flexibility**: Customizable reports and filters
5. **Visualization**: Clear, intuitive charts and graphs
6. **Export Capabilities**: Multiple format support for sharing

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Analytics Dashboard                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Revenue  │  │Technician│  │ Customer │  │Equipment │   │
│  │Analytics │  │Performance│  │Satisfaction│ │ Reports  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Reports  │  │ Metrics  │  │  Export  │  │ Custom   │   │
│  │Controller│  │Controller│  │Controller│  │ Reports  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Analytics │  │  Report  │  │   Chart  │  │  Export  │   │
│  │ Service  │  │ Builder  │  │Generator │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Jobs    │  │Invoices  │  │Customers │  │Equipment │   │
│  │  (read)  │  │  (read)  │  │  (read)  │  │  (read)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                                │
│  │  Report  │  │Analytics │                                │
│  │Templates │  │  Cache   │                                │
│  └──────────┘  └──────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Node.js + Express + TypeScript (existing)
- **Database**: PostgreSQL with materialized views for performance
- **Charting**: Chart.js or Recharts for frontend visualizations
- **Export**: PDFKit for PDF, ExcelJS for Excel exports
- **Caching**: Redis for computed metrics
- **Scheduling**: node-cron for automated reports


## Components and Interfaces

### Database Schema

#### report_templates Table

```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Template details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'revenue', 'technician', 'customer', 'equipment', 'custom'
  
  -- Configuration
  metrics JSONB NOT NULL, -- Array of metrics to include
  filters JSONB, -- Default filters
  grouping VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'technician', 'customer'
  chart_types JSONB, -- Chart configurations
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_report_templates_company_id ON report_templates(company_id);
CREATE INDEX idx_report_templates_report_type ON report_templates(report_type);
```

#### scheduled_reports Table

```sql
CREATE TYPE report_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');

CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  report_template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE NOT NULL,
  
  -- Schedule details
  frequency report_frequency NOT NULL,
  day_of_week INTEGER, -- 0-6 for weekly reports
  day_of_month INTEGER, -- 1-31 for monthly reports
  time_of_day TIME NOT NULL DEFAULT '09:00:00',
  
  -- Recipients
  recipient_emails TEXT[] NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_company_id ON scheduled_reports(company_id);
CREATE INDEX idx_scheduled_reports_next_send_at ON scheduled_reports(next_send_at);
CREATE INDEX idx_scheduled_reports_is_active ON scheduled_reports(is_active);
```

#### analytics_cache Table

```sql
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Cache key
  cache_key VARCHAR(255) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  
  -- Cached data
  data JSONB NOT NULL,
  
  -- Cache metadata
  date_range_start DATE,
  date_range_end DATE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, cache_key)
);

CREATE INDEX idx_analytics_cache_company_id ON analytics_cache(company_id);
CREATE INDEX idx_analytics_cache_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires_at ON analytics_cache(expires_at);
```

### Materialized Views for Performance

```sql
-- Daily job statistics
CREATE MATERIALIZED VIEW daily_job_stats AS
SELECT 
  company_id,
  DATE(created_at) as date,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_jobs,
  AVG(actual_duration) FILTER (WHERE actual_duration IS NOT NULL) as avg_duration,
  SUM(total_cost) FILTER (WHERE total_cost IS NOT NULL) as total_revenue
FROM jobs
GROUP BY company_id, DATE(created_at);

CREATE UNIQUE INDEX idx_daily_job_stats_company_date ON daily_job_stats(company_id, date);

-- Technician performance stats
CREATE MATERIALIZED VIEW technician_performance_stats AS
SELECT 
  t.company_id,
  t.id as technician_id,
  t.user_id,
  COUNT(j.id) as total_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'completed') as completed_jobs,
  AVG(j.actual_duration) FILTER (WHERE j.actual_duration IS NOT NULL) as avg_job_duration,
  AVG(j.rating) FILTER (WHERE j.rating IS NOT NULL) as avg_rating,
  SUM(j.total_cost) FILTER (WHERE j.total_cost IS NOT NULL) as total_revenue
FROM technicians t
LEFT JOIN jobs j ON t.id = j.technician_id
GROUP BY t.company_id, t.id, t.user_id;

CREATE UNIQUE INDEX idx_tech_perf_stats_company_tech ON technician_performance_stats(company_id, technician_id);

-- Customer satisfaction stats
CREATE MATERIALIZED VIEW customer_satisfaction_stats AS
SELECT 
  c.company_id,
  c.id as customer_id,
  COUNT(j.id) as total_jobs,
  AVG(j.rating) FILTER (WHERE j.rating IS NOT NULL) as avg_rating,
  COUNT(j.id) FILTER (WHERE j.rating >= 4) as positive_ratings,
  COUNT(j.id) FILTER (WHERE j.rating <= 2) as negative_ratings,
  MAX(j.completed_at) as last_job_date,
  SUM(j.total_cost) FILTER (WHERE j.total_cost IS NOT NULL) as total_spent
FROM customers c
LEFT JOIN jobs j ON c.id = j.customer_id
GROUP BY c.company_id, c.id;

CREATE UNIQUE INDEX idx_cust_sat_stats_company_cust ON customer_satisfaction_stats(company_id, customer_id);

-- Equipment maintenance stats
CREATE MATERIALIZED VIEW equipment_maintenance_stats AS
SELECT 
  ce.company_id,
  ce.equipment_type_id,
  et.name as equipment_name,
  et.brand,
  et.model,
  COUNT(j.id) as total_services,
  AVG(j.total_cost) FILTER (WHERE j.total_cost IS NOT NULL) as avg_service_cost,
  SUM(j.total_cost) FILTER (WHERE j.total_cost IS NOT NULL) as total_service_cost,
  AVG(EXTRACT(EPOCH FROM (j.completed_at - j.started_at))/3600) FILTER (WHERE j.completed_at IS NOT NULL AND j.started_at IS NOT NULL) as avg_repair_hours
FROM customer_equipment ce
JOIN equipment_types et ON ce.equipment_type_id = et.id
LEFT JOIN jobs j ON ce.id = j.equipment_id
GROUP BY ce.company_id, ce.equipment_type_id, et.name, et.brand, et.model;

CREATE UNIQUE INDEX idx_equip_maint_stats_company_type ON equipment_maintenance_stats(company_id, equipment_type_id);

-- Refresh function for all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_job_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY technician_performance_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY customer_satisfaction_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY equipment_maintenance_stats;
END;
$ LANGUAGE plpgsql;
```


### API Endpoints

#### Dashboard & KPIs

```typescript
// GET /api/analytics/dashboard - Main analytics dashboard
GET /api/analytics/dashboard?date_from=2024-01-01&date_to=2024-12-31

Response: {
  kpis: {
    total_revenue: number;
    total_jobs: number;
    completed_jobs: number;
    avg_technician_utilization: number;
    avg_customer_satisfaction: number;
    active_customers: number;
  },
  trends: {
    revenue_trend: Array<{date: string, value: number}>;
    jobs_trend: Array<{date: string, value: number}>;
    satisfaction_trend: Array<{date: string, value: number}>;
  },
  alerts: Array<{type: string, message: string, severity: string}>;
}

// GET /api/analytics/realtime - Real-time operational metrics
GET /api/analytics/realtime

Response: {
  active_jobs: number;
  technicians_on_jobs: number;
  today_revenue: number;
  today_completed_jobs: number;
  pending_assignments: number;
  low_stock_items: number;
  overdue_jobs: number;
}
```

#### Revenue Analytics

```typescript
// GET /api/analytics/revenue - Revenue analysis
GET /api/analytics/revenue?date_from=2024-01-01&date_to=2024-12-31&group_by=month

Response: {
  total_revenue: number;
  revenue_by_period: Array<{period: string, revenue: number, jobs: number}>;
  revenue_by_type: {
    on_site: number;
    workshop: number;
    parts: number;
    labor: number;
  };
  profit_margin: number;
  top_customers: Array<{customer_id: string, name: string, revenue: number}>;
  comparisons: {
    mom_change: number; // Month-over-month
    yoy_change: number; // Year-over-year
  };
}

// GET /api/analytics/revenue/trends - Revenue trends
GET /api/analytics/revenue/trends?period=12months

// GET /api/analytics/profitability - Profit analysis
GET /api/analytics/profitability?date_from=2024-01-01&date_to=2024-12-31
```

#### Technician Performance

```typescript
// GET /api/analytics/technicians - Technician performance overview
GET /api/analytics/technicians?date_from=2024-01-01&date_to=2024-12-31

Response: {
  technicians: Array<{
    technician_id: string;
    name: string;
    utilization_rate: number;
    jobs_completed: number;
    avg_job_duration: number;
    first_time_fix_rate: number;
    avg_rating: number;
    total_revenue: number;
  }>;
  avg_utilization: number;
  top_performer: {technician_id: string, name: string};
}

// GET /api/analytics/technicians/:id - Individual technician metrics
GET /api/analytics/technicians/:id?date_from=2024-01-01&date_to=2024-12-31

Response: {
  technician_id: string;
  name: string;
  metrics: {
    utilization_rate: number;
    billable_hours: number;
    available_hours: number;
    jobs_completed: number;
    avg_job_duration: number;
    first_time_fix_rate: number;
    avg_rating: number;
    total_revenue: number;
  };
  performance_trend: Array<{date: string, jobs: number, rating: number}>;
  customer_feedback: Array<{job_id: string, rating: number, feedback: string}>;
}
```

#### Customer Analytics

```typescript
// GET /api/analytics/customers/satisfaction - Customer satisfaction metrics
GET /api/analytics/customers/satisfaction?date_from=2024-01-01&date_to=2024-12-31

Response: {
  overall_csat: number;
  nps_score: number;
  satisfaction_trend: Array<{date: string, score: number}>;
  rating_distribution: {1: number, 2: number, 3: number, 4: number, 5: number};
  feedback_themes: Array<{theme: string, count: number, sentiment: string}>;
  at_risk_customers: Array<{customer_id: string, name: string, last_rating: number}>;
}

// GET /api/analytics/customers/retention - Customer retention metrics
GET /api/analytics/customers/retention?date_from=2024-01-01&date_to=2024-12-31

Response: {
  retention_rate: number;
  new_customers: number;
  churned_customers: number;
  at_risk_customers: Array<{customer_id: string, name: string, days_since_last_job: number}>;
  customer_lifetime_value: number;
  repeat_business_rate: number;
}

// GET /api/analytics/customers/:id/history - Customer analytics
GET /api/analytics/customers/:id/history
```

#### Equipment Analytics

```typescript
// GET /api/analytics/equipment/maintenance - Equipment maintenance analysis
GET /api/analytics/equipment/maintenance?date_from=2024-01-01&date_to=2024-12-31

Response: {
  equipment_types: Array<{
    equipment_type_id: string;
    name: string;
    brand: string;
    model: string;
    total_services: number;
    avg_service_cost: number;
    total_service_cost: number;
    mtbf: number; // Mean time between failures
    avg_repair_hours: number;
  }>;
  high_maintenance_equipment: Array<{equipment_id: string, service_count: number}>;
  reliability_by_brand: Array<{brand: string, failure_rate: number}>;
}

// GET /api/analytics/equipment/costs - Equipment cost analysis
GET /api/analytics/equipment/costs?date_from=2024-01-01&date_to=2024-12-31
```

#### Job Analytics

```typescript
// GET /api/analytics/jobs/completion - Job completion metrics
GET /api/analytics/jobs/completion?date_from=2024-01-01&date_to=2024-12-31

Response: {
  total_jobs: number;
  completed_jobs: number;
  completion_rate: number;
  on_time_completion_rate: number;
  avg_completion_time: number;
  status_distribution: {pending: number, assigned: number, in_progress: number, completed: number, cancelled: number};
  jobs_by_priority: {low: number, medium: number, high: number, urgent: number};
  cancellation_rate: number;
  cancellation_reasons: Array<{reason: string, count: number}>;
}

// GET /api/analytics/jobs/sla - SLA compliance metrics
GET /api/analytics/jobs/sla?date_from=2024-01-01&date_to=2024-12-31

Response: {
  sla_compliance_rate: number;
  breached_slas: number;
  avg_response_time: number;
  sla_by_customer: Array<{customer_id: string, name: string, compliance_rate: number}>;
  at_risk_jobs: Array<{job_id: string, customer: string, time_remaining: number}>;
}
```

#### Parts & Inventory Analytics

```typescript
// GET /api/analytics/inventory - Inventory analytics
GET /api/analytics/inventory?date_from=2024-01-01&date_to=2024-12-31

Response: {
  most_used_parts: Array<{part_id: string, name: string, quantity_used: number, revenue: number}>;
  inventory_turnover_rate: number;
  slow_moving_items: Array<{part_id: string, name: string, days_in_stock: number}>;
  parts_cost_percentage: number;
  stockout_incidents: Array<{part_id: string, name: string, jobs_affected: number}>;
  inventory_value: number;
}
```

#### Geographic Analytics

```typescript
// GET /api/analytics/geographic - Geographic performance
GET /api/analytics/geographic?date_from=2024-01-01&date_to=2024-12-31

Response: {
  jobs_by_location: Array<{lat: number, lng: number, count: number, revenue: number}>;
  revenue_by_area: Array<{area: string, revenue: number, jobs: number}>;
  avg_travel_time: number;
  coverage_areas: Array<{technician_id: string, area: string, job_count: number}>;
  underserved_areas: Array<{area: string, demand: number, coverage: number}>;
}
```

#### Custom Reports

```typescript
// GET /api/analytics/reports/templates - List report templates
GET /api/analytics/reports/templates

// POST /api/analytics/reports/templates - Create custom report template
POST /api/analytics/reports/templates
Body: {
  name: string;
  description?: string;
  report_type: string;
  metrics: string[];
  filters?: object;
  grouping?: string;
  chart_types?: object;
  is_public?: boolean;
}

// GET /api/analytics/reports/templates/:id - Get report template
GET /api/analytics/reports/templates/:id

// PUT /api/analytics/reports/templates/:id - Update report template
PUT /api/analytics/reports/templates/:id

// DELETE /api/analytics/reports/templates/:id - Delete report template
DELETE /api/analytics/reports/templates/:id

// POST /api/analytics/reports/generate - Generate report from template
POST /api/analytics/reports/generate
Body: {
  template_id: string;
  date_from: string;
  date_to: string;
  filters?: object;
}
```

#### Report Export

```typescript
// POST /api/analytics/export/pdf - Export report as PDF
POST /api/analytics/export/pdf
Body: {
  report_type: string;
  data: object;
  include_charts: boolean;
}

// POST /api/analytics/export/csv - Export report as CSV
POST /api/analytics/export/csv
Body: {
  report_type: string;
  data: object;
}

// POST /api/analytics/export/excel - Export report as Excel
POST /api/analytics/export/excel
Body: {
  report_type: string;
  data: object;
  include_charts: boolean;
}
```

#### Scheduled Reports

```typescript
// GET /api/analytics/scheduled-reports - List scheduled reports
GET /api/analytics/scheduled-reports

// POST /api/analytics/scheduled-reports - Create scheduled report
POST /api/analytics/scheduled-reports
Body: {
  report_template_id: string;
  frequency: string;
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  recipient_emails: string[];
}

// PUT /api/analytics/scheduled-reports/:id - Update scheduled report
PUT /api/analytics/scheduled-reports/:id

// DELETE /api/analytics/scheduled-reports/:id - Delete scheduled report
DELETE /api/analytics/scheduled-reports/:id

// POST /api/analytics/scheduled-reports/:id/send-now - Send report immediately
POST /api/analytics/scheduled-reports/:id/send-now
```


## Data Models

### TypeScript Interfaces

```typescript
export type ReportType = 'revenue' | 'technician' | 'customer' | 'equipment' | 'job' | 'inventory' | 'custom';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type GroupingPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DashboardKPIs {
  total_revenue: number;
  total_jobs: number;
  completed_jobs: number;
  avg_technician_utilization: number;
  avg_customer_satisfaction: number;
  active_customers: number;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface RevenueAnalytics {
  total_revenue: number;
  revenue_by_period: Array<{
    period: string;
    revenue: number;
    jobs: number;
  }>;
  revenue_by_type: {
    on_site: number;
    workshop: number;
    parts: number;
    labor: number;
  };
  profit_margin: number;
  top_customers: Array<{
    customer_id: string;
    name: string;
    revenue: number;
  }>;
  comparisons: {
    mom_change: number;
    yoy_change: number;
  };
}

export interface TechnicianPerformance {
  technician_id: string;
  name: string;
  utilization_rate: number;
  jobs_completed: number;
  avg_job_duration: number;
  first_time_fix_rate: number;
  avg_rating: number;
  total_revenue: number;
}

export interface CustomerSatisfactionMetrics {
  overall_csat: number;
  nps_score: number;
  satisfaction_trend: TrendData[];
  rating_distribution: Record<number, number>;
  feedback_themes: Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  at_risk_customers: Array<{
    customer_id: string;
    name: string;
    last_rating: number;
  }>;
}

export interface EquipmentMaintenanceStats {
  equipment_type_id: string;
  name: string;
  brand: string;
  model: string;
  total_services: number;
  avg_service_cost: number;
  total_service_cost: number;
  mtbf: number;
  avg_repair_hours: number;
}

export interface ReportTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  report_type: ReportType;
  metrics: string[];
  filters?: Record<string, any>;
  grouping?: string;
  chart_types?: Record<string, string>;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  company_id: string;
  report_template_id: string;
  frequency: ReportFrequency;
  day_of_week?: number;
  day_of_month?: number;
  time_of_day: string;
  recipient_emails: string[];
  is_active: boolean;
  last_sent_at?: string;
  next_send_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  report_template?: ReportTemplate;
}

export interface AnalyticsCache {
  id: string;
  company_id: string;
  cache_key: string;
  metric_type: string;
  data: any;
  date_range_start?: string;
  date_range_end?: string;
  expires_at: string;
  created_at: string;
}
```

## Business Logic

### KPI Calculations

```typescript
// Technician Utilization Rate
function calculateUtilizationRate(
  billableHours: number,
  availableHours: number
): number {
  if (availableHours === 0) return 0;
  return (billableHours / availableHours) * 100;
}

// First-Time Fix Rate
function calculateFirstTimeFixRate(
  totalJobs: number,
  jobsFixedFirstTime: number
): number {
  if (totalJobs === 0) return 0;
  return (jobsFixedFirstTime / totalJobs) * 100;
}

// Customer Satisfaction Score (CSAT)
function calculateCSAT(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const positiveRatings = ratings.filter(r => r >= 4).length;
  return (positiveRatings / ratings.length) * 100;
}

// Net Promoter Score (NPS)
function calculateNPS(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const promoters = ratings.filter(r => r >= 4).length;
  const detractors = ratings.filter(r => r <= 2).length;
  return ((promoters - detractors) / ratings.length) * 100;
}

// Mean Time Between Failures (MTBF)
function calculateMTBF(
  totalOperatingHours: number,
  numberOfFailures: number
): number {
  if (numberOfFailures === 0) return Infinity;
  return totalOperatingHours / numberOfFailures;
}

// Customer Lifetime Value (CLV)
function calculateCLV(
  avgRevenuePerJob: number,
  avgJobsPerYear: number,
  avgCustomerLifespanYears: number,
  profitMargin: number
): number {
  return avgRevenuePerJob * avgJobsPerYear * avgCustomerLifespanYears * profitMargin;
}

// Inventory Turnover Rate
function calculateInventoryTurnover(
  costOfGoodsSold: number,
  avgInventoryValue: number
): number {
  if (avgInventoryValue === 0) return 0;
  return costOfGoodsSold / avgInventoryValue;
}
```

### Caching Strategy

```typescript
interface CacheConfig {
  key: string;
  ttl: number; // Time to live in seconds
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  'dashboard_kpis': { key: 'dashboard_kpis', ttl: 300 }, // 5 minutes
  'revenue_analytics': { key: 'revenue_analytics', ttl: 600 }, // 10 minutes
  'technician_performance': { key: 'tech_perf', ttl: 600 },
  'customer_satisfaction': { key: 'cust_sat', ttl: 600 },
  'equipment_stats': { key: 'equip_stats', ttl: 1800 }, // 30 minutes
  'realtime_metrics': { key: 'realtime', ttl: 60 }, // 1 minute
};

// Cache key generation
function generateCacheKey(
  metricType: string,
  companyId: string,
  dateFrom?: string,
  dateTo?: string,
  additionalParams?: Record<string, any>
): string {
  const params = [metricType, companyId, dateFrom, dateTo];
  if (additionalParams) {
    params.push(JSON.stringify(additionalParams));
  }
  return params.filter(Boolean).join(':');
}
```

### Report Generation Logic

```typescript
interface ReportGenerationOptions {
  templateId: string;
  dateFrom: string;
  dateTo: string;
  filters?: Record<string, any>;
  format?: 'json' | 'pdf' | 'csv' | 'excel';
}

async function generateReport(options: ReportGenerationOptions): Promise<any> {
  // 1. Load report template
  const template = await loadReportTemplate(options.templateId);
  
  // 2. Apply filters
  const filters = { ...template.filters, ...options.filters };
  
  // 3. Fetch data for each metric
  const data = await Promise.all(
    template.metrics.map(metric => fetchMetricData(metric, options.dateFrom, options.dateTo, filters))
  );
  
  // 4. Apply grouping
  const groupedData = applyGrouping(data, template.grouping);
  
  // 5. Generate charts
  const charts = generateCharts(groupedData, template.chart_types);
  
  // 6. Format output
  return formatReport(groupedData, charts, options.format);
}
```

## Error Handling

### Validation Errors

- Invalid date range (from > to)
- Missing required parameters
- Invalid metric type
- Invalid grouping period
- Invalid report template configuration

### Business Logic Errors

- No data available for date range
- Insufficient data for calculation
- Division by zero in calculations
- Invalid cache key

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

1. **KPI Calculations**
   - Utilization rate calculation
   - CSAT and NPS calculation
   - MTBF calculation
   - CLV calculation

2. **Data Aggregation**
   - Grouping by period
   - Filtering logic
   - Trend calculation

3. **Cache Management**
   - Cache key generation
   - Cache expiration
   - Cache invalidation

### Integration Tests

1. **Report Generation**
   - Generate revenue report
   - Generate technician performance report
   - Apply filters correctly
   - Export to different formats

2. **Scheduled Reports**
   - Schedule creation
   - Report sending
   - Email delivery

3. **Materialized Views**
   - View refresh
   - Data accuracy
   - Performance

### End-to-End Tests

1. **Complete Analytics Workflow**
   - View dashboard
   - Drill down into specific metrics
   - Generate custom report
   - Export report
   - Schedule automated delivery

## Performance Considerations

### Database Optimization

1. **Materialized Views**: Pre-computed aggregations for common queries
2. **Indexes**: Comprehensive indexing on date, company_id, and foreign keys
3. **Query Optimization**: Use EXPLAIN ANALYZE to optimize slow queries
4. **Partitioning**: Consider table partitioning for large historical data

### Caching Strategy

1. **Redis Cache**: Cache computed metrics with appropriate TTL
2. **Cache Warming**: Pre-compute common reports during off-peak hours
3. **Incremental Updates**: Update caches incrementally rather than full refresh
4. **Cache Invalidation**: Clear cache when underlying data changes

### Scalability

1. **Background Jobs**: Use job queue for report generation
2. **Async Processing**: Generate large reports asynchronously
3. **Pagination**: Paginate large result sets
4. **Data Archiving**: Archive old data to separate tables

## Security Considerations

### Authorization

- Company-level data isolation
- Role-based access to sensitive metrics
- Report template sharing controls
- Scheduled report recipient validation

### Data Protection

- Anonymize sensitive customer data in exports
- Audit trail for report access
- Secure report delivery (encrypted emails)
- Access logging for compliance

## Migration Strategy

### Phase 1: Database Setup
- Create analytics tables
- Create materialized views
- Set up refresh schedules
- Create indexes

### Phase 2: Core Analytics API
- Implement dashboard KPIs
- Implement revenue analytics
- Implement technician performance
- Implement customer satisfaction

### Phase 3: Advanced Features
- Custom report builder
- Export functionality
- Scheduled reports
- Geographic analytics

### Phase 4: UI Development
- Analytics dashboard
- Report pages
- Custom report builder UI
- Export and scheduling UI

## Future Enhancements

1. **Predictive Analytics**: ML-based forecasting for demand, revenue, churn
2. **Anomaly Detection**: Automatic detection of unusual patterns
3. **Benchmarking**: Compare performance against industry standards
4. **Mobile Analytics App**: Dedicated mobile app for executives
5. **Real-Time Dashboards**: WebSocket-based live updates
6. **Advanced Visualizations**: Interactive charts, heat maps, network graphs
7. **Natural Language Queries**: Ask questions in plain English
8. **Automated Insights**: AI-generated insights and recommendations
9. **Integration with BI Tools**: Export to Tableau, Power BI, etc.
10. **Multi-Company Comparison**: Compare performance across multiple companies
