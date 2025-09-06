import { Request, Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';

// Dashboard statistics interface
interface DashboardStats {
  activeWorkOrders: number;
  availableTechnicians: number;
  totalCustomers: number;
  totalEquipment: number;
  completionRate: number;
  monthlyRevenue: number;
  workOrderTrend: number;
  technicianTrend: number;
  completionTrend: number;
  revenueTrend: number;
  overdueWorkOrders: number;
  equipmentNeedingMaintenance: number;
}

// Recent activity interface
interface RecentActivity {
  id: string;
  type: 'work_order' | 'technician' | 'customer' | 'equipment' | 'completion';
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  timestamp: string;
  relativeTime: string;
}

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Get current period stats
    const currentStatsQuery = `
      WITH current_stats AS (
        SELECT
          -- Work Orders
          (SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND status IN ('assigned', 'in_progress')) as active_work_orders,
          (SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND status IN ('assigned', 'in_progress') AND scheduled_date < NOW()) as overdue_work_orders,
          
          -- Technicians
          (SELECT COUNT(*) FROM technicians t 
           JOIN users u ON t.user_id = u.id 
           WHERE t.company_id = $1 AND u.is_active = true AND t.is_available = true) as available_technicians,
          
          -- Customers
          (SELECT COUNT(*) FROM customers WHERE company_id = $1 AND is_active = true) as total_customers,
          
          -- Equipment
          (SELECT COUNT(*) FROM customer_equipment ce 
           JOIN customers c ON ce.customer_id = c.id 
           WHERE c.company_id = $1 AND ce.is_active = true) as total_equipment,
          
          -- Equipment needing maintenance (last service > 6 months ago or never serviced)
          (SELECT COUNT(*) FROM customer_equipment ce 
           JOIN customers c ON ce.customer_id = c.id 
           WHERE c.company_id = $1 AND ce.is_active = true 
           AND (ce.last_service_date IS NULL OR ce.last_service_date < NOW() - INTERVAL '6 months')) as equipment_needing_maintenance,
          
          -- Completion rate (last 30 days)
          (SELECT 
            CASE 
              WHEN COUNT(*) = 0 THEN 0 
              ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*)), 1)
            END
           FROM jobs 
           WHERE company_id = $1 AND created_at >= NOW() - INTERVAL '30 days') as completion_rate,
          
          -- Monthly revenue (current month)
          (SELECT COALESCE(SUM(total_cost), 0) FROM jobs 
           WHERE company_id = $1 AND status = 'completed' 
           AND DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', NOW())) as monthly_revenue
      )
      SELECT * FROM current_stats;
    `;

    const currentStats = await query(currentStatsQuery, [companyId]);
    const current = currentStats.rows[0];

    // Get previous period stats for trend calculation
    const previousStatsQuery = `
      WITH previous_stats AS (
        SELECT
          -- Work Orders (previous week)
          (SELECT COUNT(*) FROM jobs 
           WHERE company_id = $1 AND status IN ('assigned', 'in_progress')
           AND created_at BETWEEN NOW() - INTERVAL '2 weeks' AND NOW() - INTERVAL '1 week') as prev_active_work_orders,
          
          -- Technicians (previous week - approximate)
          (SELECT COUNT(*) FROM technicians t 
           JOIN users u ON t.user_id = u.id 
           WHERE t.company_id = $1 AND u.is_active = true) as prev_available_technicians,
          
          -- Completion rate (previous 30 days)
          (SELECT 
            CASE 
              WHEN COUNT(*) = 0 THEN 0 
              ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*)), 1)
            END
           FROM jobs 
           WHERE company_id = $1 
           AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days') as prev_completion_rate,
          
          -- Previous month revenue
          (SELECT COALESCE(SUM(total_cost), 0) FROM jobs 
           WHERE company_id = $1 AND status = 'completed' 
           AND DATE_TRUNC('month', completed_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) as prev_monthly_revenue
      )
      SELECT * FROM previous_stats;
    `;

    const previousStats = await query(previousStatsQuery, [companyId]);
    const previous = previousStats.rows[0];

    // Calculate trends
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const stats: DashboardStats = {
      activeWorkOrders: parseInt(current.active_work_orders) || 0,
      availableTechnicians: parseInt(current.available_technicians) || 0,
      totalCustomers: parseInt(current.total_customers) || 0,
      totalEquipment: parseInt(current.total_equipment) || 0,
      completionRate: parseFloat(current.completion_rate) || 0,
      monthlyRevenue: parseFloat(current.monthly_revenue) || 0,
      overdueWorkOrders: parseInt(current.overdue_work_orders) || 0,
      equipmentNeedingMaintenance: parseInt(current.equipment_needing_maintenance) || 0,
      workOrderTrend: calculateTrend(
        parseInt(current.active_work_orders) || 0,
        parseInt(previous.prev_active_work_orders) || 0
      ),
      technicianTrend: 0, // Technician count doesn't change frequently
      completionTrend: calculateTrend(
        parseFloat(current.completion_rate) || 0,
        parseFloat(previous.prev_completion_rate) || 0
      ),
      revenueTrend: calculateTrend(
        parseFloat(current.monthly_revenue) || 0,
        parseFloat(previous.prev_monthly_revenue) || 0
      )
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<DashboardStats>);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    } as ApiResponse);
  }
};

// Get recent activities
export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.company?.id;
    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    const { limit = 10 } = req.query;

    const activitiesQuery = `
      WITH recent_activities AS (
        -- Recent work orders
        SELECT 
          j.id,
          'work_order' as type,
          'ri-file-list-3-line' as icon,
          'bg-blue-100' as icon_bg,
          'text-blue-600' as icon_color,
          CASE 
            WHEN j.status = 'completed' THEN 'Work order completed: ' || j.title
            WHEN j.status = 'assigned' THEN 'New work order assigned: ' || j.title
            ELSE 'Work order updated: ' || j.title
          END as title,
          COALESCE(c.name, 'Unknown Customer') || ' • ' || 
          CASE 
            WHEN j.status = 'completed' THEN 'Completed'
            WHEN j.status = 'assigned' THEN 'Assigned to ' || COALESCE(u.full_name, 'Unassigned')
            ELSE INITCAP(j.status)
          END as subtitle,
          j.updated_at as timestamp
        FROM jobs j
        LEFT JOIN customers c ON j.customer_id = c.id
        LEFT JOIN technicians t ON j.technician_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE j.company_id = $1
        
        UNION ALL
        
        -- Recent customer registrations
        SELECT 
          c.id,
          'customer' as type,
          'ri-user-add-line' as icon,
          'bg-green-100' as icon_bg,
          'text-green-600' as icon_color,
          'New customer registered: ' || c.name as title,
          COALESCE(c.company_name, 'Individual') || ' • ' || COALESCE(c.phone, 'No phone') as subtitle,
          c.created_at as timestamp
        FROM customers c
        WHERE c.company_id = $1 AND c.created_at >= NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        -- Recent technician assignments
        SELECT 
          t.id,
          'technician' as type,
          'ri-user-settings-line' as icon,
          'bg-purple-100' as icon_bg,
          'text-purple-600' as icon_color,
          'Technician availability updated: ' || u.full_name as title,
          CASE WHEN t.is_available THEN 'Now available' ELSE 'Currently unavailable' END as subtitle,
          t.updated_at as timestamp
        FROM technicians t
        JOIN users u ON t.user_id = u.id
        WHERE t.company_id = $1 AND t.updated_at >= NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        -- Recent equipment additions
        SELECT 
          ce.id,
          'equipment' as type,
          'ri-tools-line' as icon,
          'bg-orange-100' as icon_bg,
          'text-orange-600' as icon_color,
          'New equipment added: ' || et.name as title,
          c.name || ' • ' || et.brand || ' ' || et.model as subtitle,
          ce.created_at as timestamp
        FROM customer_equipment ce
        JOIN equipment_types et ON ce.equipment_type_id = et.id
        JOIN customers c ON ce.customer_id = c.id
        WHERE c.company_id = $1 AND ce.created_at >= NOW() - INTERVAL '7 days'
      )
      SELECT 
        id,
        type,
        icon,
        icon_bg,
        icon_color,
        title,
        subtitle,
        timestamp,
        CASE 
          WHEN timestamp >= NOW() - INTERVAL '1 hour' THEN EXTRACT(EPOCH FROM (NOW() - timestamp))::int || ' minutes ago'
          WHEN timestamp >= NOW() - INTERVAL '1 day' THEN EXTRACT(EPOCH FROM (NOW() - timestamp))::int / 3600 || ' hours ago'
          ELSE EXTRACT(EPOCH FROM (NOW() - timestamp))::int / 86400 || ' days ago'
        END as relative_time
      FROM recent_activities
      ORDER BY timestamp DESC
      LIMIT $2;
    `;

    const result = await query(activitiesQuery, [companyId, limit]);
    
    const activities: RecentActivity[] = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      icon: row.icon,
      iconBg: row.icon_bg,
      iconColor: row.icon_color,
      title: row.title,
      subtitle: row.subtitle,
      timestamp: row.timestamp,
      relativeTime: row.relative_time
    }));

    res.json({
      success: true,
      data: activities
    } as ApiResponse<RecentActivity[]>);

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities'
    } as ApiResponse);
  }
};
