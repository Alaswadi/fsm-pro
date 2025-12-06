import { Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface WorkOrderTrend {
    week: string;
    weekLabel: string;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
}

interface RevenueTrend {
    month: string;
    monthLabel: string;
    revenue: number;
    jobCount: number;
}

interface TechnicianPerformance {
    id: string;
    name: string;
    employeeId: string;
    completedJobs: number;
    avgRating: number | null;
    avgCompletionTime: number | null; // in hours
    revenue: number;
}

interface TopCustomer {
    id: string;
    name: string;
    companyName: string | null;
    totalWorkOrders: number;
    completedWorkOrders: number;
    totalRevenue: number;
    lastServiceDate: string | null;
}

interface EquipmentAnalytics {
    conditionBreakdown: Array<{
        condition: string;
        count: number;
        color: string;
    }>;
    totalEquipment: number;
    needingMaintenance: number;
    warrantyExpiringSoon: number;
}

// ============================================================================
// WORK ORDER TRENDS
// ============================================================================

export const getWorkOrderTrends = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;
        if (!companyId) {
            return res.status(403).json({
                success: false,
                error: 'No company context found'
            } as ApiResponse);
        }

        // Get weekly work order counts for the last 12 weeks
        const trendsQuery = `
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW() - INTERVAL '11 weeks'),
          date_trunc('week', NOW()),
          '1 week'::interval
        ) as week_start
      )
      SELECT 
        w.week_start,
        TO_CHAR(w.week_start, 'YYYY-"W"IW') as week,
        TO_CHAR(w.week_start, 'Mon DD') as week_label,
        COALESCE(COUNT(j.id), 0)::integer as total,
        COALESCE(COUNT(j.id) FILTER (WHERE j.status = 'completed'), 0)::integer as completed,
        COALESCE(COUNT(j.id) FILTER (WHERE j.status = 'pending'), 0)::integer as pending,
        COALESCE(COUNT(j.id) FILTER (WHERE j.status = 'in_progress'), 0)::integer as in_progress
      FROM weeks w
      LEFT JOIN jobs j ON 
        j.company_id = $1 
        AND date_trunc('week', j.created_at) = w.week_start
      GROUP BY w.week_start
      ORDER BY w.week_start ASC;
    `;

        const result = await query(trendsQuery, [companyId]);

        const trends: WorkOrderTrend[] = result.rows.map(row => ({
            week: row.week,
            weekLabel: row.week_label,
            total: parseInt(row.total) || 0,
            completed: parseInt(row.completed) || 0,
            pending: parseInt(row.pending) || 0,
            inProgress: parseInt(row.in_progress) || 0
        }));

        res.json({
            success: true,
            data: trends
        } as ApiResponse<WorkOrderTrend[]>);

    } catch (error) {
        console.error('Error fetching work order trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch work order trends'
        } as ApiResponse);
    }
};

// ============================================================================
// REVENUE TRENDS
// ============================================================================

export const getRevenueTrends = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;
        if (!companyId) {
            return res.status(403).json({
                success: false,
                error: 'No company context found'
            } as ApiResponse);
        }

        // Get monthly revenue for the last 6 months
        const revenueQuery = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '5 months'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) as month_start
      )
      SELECT 
        m.month_start,
        TO_CHAR(m.month_start, 'YYYY-MM') as month,
        TO_CHAR(m.month_start, 'Mon YYYY') as month_label,
        COALESCE(SUM(j.total_cost), 0)::numeric as revenue,
        COALESCE(COUNT(j.id) FILTER (WHERE j.status = 'completed'), 0)::integer as job_count
      FROM months m
      LEFT JOIN jobs j ON 
        j.company_id = $1 
        AND j.status = 'completed'
        AND date_trunc('month', j.completed_at) = m.month_start
      GROUP BY m.month_start
      ORDER BY m.month_start ASC;
    `;

        const result = await query(revenueQuery, [companyId]);

        const trends: RevenueTrend[] = result.rows.map(row => ({
            month: row.month,
            monthLabel: row.month_label,
            revenue: parseFloat(row.revenue) || 0,
            jobCount: parseInt(row.job_count) || 0
        }));

        res.json({
            success: true,
            data: trends
        } as ApiResponse<RevenueTrend[]>);

    } catch (error) {
        console.error('Error fetching revenue trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue trends'
        } as ApiResponse);
    }
};

// ============================================================================
// TECHNICIAN PERFORMANCE
// ============================================================================

export const getTechnicianPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;
        if (!companyId) {
            return res.status(403).json({
                success: false,
                error: 'No company context found'
            } as ApiResponse);
        }

        const performanceQuery = `
      SELECT 
        t.id,
        u.full_name as name,
        t.employee_id,
        COALESCE(COUNT(j.id) FILTER (WHERE j.status = 'completed'), 0)::integer as completed_jobs,
        ROUND(AVG(j.rating)::numeric, 1) as avg_rating,
        ROUND(AVG(
          CASE 
            WHEN j.completed_at IS NOT NULL AND j.started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) / 3600 
            ELSE NULL 
          END
        )::numeric, 1) as avg_completion_time,
        COALESCE(SUM(j.total_cost) FILTER (WHERE j.status = 'completed'), 0)::numeric as revenue
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN jobs j ON j.technician_id = t.id AND j.company_id = $1
      WHERE t.company_id = $1 AND u.is_active = true
      GROUP BY t.id, u.full_name, t.employee_id
      ORDER BY completed_jobs DESC
      LIMIT 10;
    `;

        const result = await query(performanceQuery, [companyId]);

        const performance: TechnicianPerformance[] = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            employeeId: row.employee_id,
            completedJobs: parseInt(row.completed_jobs) || 0,
            avgRating: row.avg_rating ? parseFloat(row.avg_rating) : null,
            avgCompletionTime: row.avg_completion_time ? parseFloat(row.avg_completion_time) : null,
            revenue: parseFloat(row.revenue) || 0
        }));

        res.json({
            success: true,
            data: performance
        } as ApiResponse<TechnicianPerformance[]>);

    } catch (error) {
        console.error('Error fetching technician performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch technician performance'
        } as ApiResponse);
    }
};

// ============================================================================
// TOP CUSTOMERS
// ============================================================================

export const getTopCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;
        if (!companyId) {
            return res.status(403).json({
                success: false,
                error: 'No company context found'
            } as ApiResponse);
        }

        const customersQuery = `
      SELECT 
        c.id,
        c.name,
        c.company_name,
        COALESCE(COUNT(j.id), 0)::integer as total_work_orders,
        COALESCE(COUNT(j.id) FILTER (WHERE j.status = 'completed'), 0)::integer as completed_work_orders,
        COALESCE(SUM(j.total_cost) FILTER (WHERE j.status = 'completed'), 0)::numeric as total_revenue,
        MAX(j.completed_at) as last_service_date
      FROM customers c
      LEFT JOIN jobs j ON j.customer_id = c.id AND j.company_id = $1
      WHERE c.company_id = $1 AND c.is_active = true
      GROUP BY c.id, c.name, c.company_name
      HAVING COUNT(j.id) > 0
      ORDER BY total_work_orders DESC, total_revenue DESC
      LIMIT 10;
    `;

        const result = await query(customersQuery, [companyId]);

        const customers: TopCustomer[] = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            companyName: row.company_name,
            totalWorkOrders: parseInt(row.total_work_orders) || 0,
            completedWorkOrders: parseInt(row.completed_work_orders) || 0,
            totalRevenue: parseFloat(row.total_revenue) || 0,
            lastServiceDate: row.last_service_date
        }));

        res.json({
            success: true,
            data: customers
        } as ApiResponse<TopCustomer[]>);

    } catch (error) {
        console.error('Error fetching top customers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top customers'
        } as ApiResponse);
    }
};

// ============================================================================
// EQUIPMENT ANALYTICS
// ============================================================================

export const getEquipmentAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;
        if (!companyId) {
            return res.status(403).json({
                success: false,
                error: 'No company context found'
            } as ApiResponse);
        }

        // Get equipment condition breakdown
        const conditionQuery = `
      SELECT 
        COALESCE(ce.condition, 'unknown') as condition,
        COUNT(*)::integer as count
      FROM customer_equipment ce
      JOIN customers c ON ce.customer_id = c.id
      WHERE c.company_id = $1 AND ce.is_active = true
      GROUP BY ce.condition
      ORDER BY count DESC;
    `;

        // Get summary statistics
        const statsQuery = `
      SELECT 
        COUNT(*)::integer as total_equipment,
        COUNT(*) FILTER (
          WHERE ce.last_service_date IS NULL 
          OR ce.last_service_date < NOW() - INTERVAL '6 months'
        )::integer as needing_maintenance,
        COUNT(*) FILTER (
          WHERE ce.warranty_expiry IS NOT NULL 
          AND ce.warranty_expiry BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        )::integer as warranty_expiring_soon
      FROM customer_equipment ce
      JOIN customers c ON ce.customer_id = c.id
      WHERE c.company_id = $1 AND ce.is_active = true;
    `;

        const [conditionResult, statsResult] = await Promise.all([
            query(conditionQuery, [companyId]),
            query(statsQuery, [companyId])
        ]);

        const conditionColors: Record<string, string> = {
            'good': '#10B981',      // Emerald
            'fair': '#F59E0B',      // Amber
            'poor': '#EF4444',      // Red
            'needs_repair': '#DC2626', // Red darker
            'unknown': '#9CA3AF'    // Gray
        };

        const conditionLabels: Record<string, string> = {
            'good': 'Good',
            'fair': 'Fair',
            'poor': 'Poor',
            'needs_repair': 'Needs Repair',
            'unknown': 'Unknown'
        };

        const analytics: EquipmentAnalytics = {
            conditionBreakdown: conditionResult.rows.map(row => ({
                condition: conditionLabels[row.condition] || row.condition,
                count: parseInt(row.count) || 0,
                color: conditionColors[row.condition] || '#9CA3AF'
            })),
            totalEquipment: parseInt(statsResult.rows[0]?.total_equipment) || 0,
            needingMaintenance: parseInt(statsResult.rows[0]?.needing_maintenance) || 0,
            warrantyExpiringSoon: parseInt(statsResult.rows[0]?.warranty_expiring_soon) || 0
        };

        res.json({
            success: true,
            data: analytics
        } as ApiResponse<EquipmentAnalytics>);

    } catch (error) {
        console.error('Error fetching equipment analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch equipment analytics'
        } as ApiResponse);
    }
};
