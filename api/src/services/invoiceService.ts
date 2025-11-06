import { query } from '../config/database';

/**
 * Invoice Service
 * Handles invoice calculations for both on-site and workshop jobs
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'labor' | 'part' | 'fee';
}

export interface InvoiceData {
  job_id: string;
  job_number: string;
  location_type: 'on_site' | 'workshop';
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount?: number;
  total: number;
  customer_info: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    billing_address?: string;
  };
  job_info: {
    title: string;
    description: string;
    completed_at?: string;
    technician_name?: string;
  };
}

/**
 * Calculate total cost for a job including parts and fees
 */
export const calculateJobTotal = async (jobId: string): Promise<number> => {
  try {
    // Get job details including pickup/delivery fee
    const jobResult = await query(
      `SELECT 
        location_type, 
        pickup_delivery_fee,
        estimated_duration,
        actual_duration
      FROM jobs 
      WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      throw new Error('Job not found');
    }

    const job = jobResult.rows[0];
    let total = 0;

    // Add parts cost
    const partsResult = await query(
      `SELECT COALESCE(SUM(total_price), 0) as parts_total
       FROM job_parts
       WHERE job_id = $1`,
      [jobId]
    );
    
    const partsTotal = parseFloat(partsResult.rows[0].parts_total || 0);
    total += partsTotal;

    // Add pickup/delivery fee for workshop jobs
    if (job.location_type === 'workshop' && job.pickup_delivery_fee) {
      total += parseFloat(job.pickup_delivery_fee);
    }

    // Note: Labor cost calculation would go here if hourly rates are tracked
    // For now, we're just calculating parts + fees

    return total;
  } catch (error) {
    console.error('Error calculating job total:', error);
    throw error;
  }
};

/**
 * Update job total cost
 */
export const updateJobTotal = async (jobId: string): Promise<number> => {
  try {
    const total = await calculateJobTotal(jobId);

    await query(
      `UPDATE jobs 
       SET total_cost = $1, updated_at = NOW()
       WHERE id = $2`,
      [total, jobId]
    );

    return total;
  } catch (error) {
    console.error('Error updating job total:', error);
    throw error;
  }
};

/**
 * Get invoice data for a job
 */
export const getInvoiceData = async (jobId: string, companyId: string): Promise<InvoiceData> => {
  try {
    // Get job details with customer info
    const jobResult = await query(
      `SELECT 
        j.id,
        j.job_number,
        j.title,
        j.description,
        j.location_type,
        j.completed_at,
        j.pickup_delivery_fee,
        j.total_cost,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company_name as customer_company,
        c.billing_address,
        u.full_name as technician_name
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN technicians t ON j.technician_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE j.id = $1 AND j.company_id = $2`,
      [jobId, companyId]
    );

    if (jobResult.rows.length === 0) {
      throw new Error('Job not found');
    }

    const job = jobResult.rows[0];
    const lineItems: InvoiceLineItem[] = [];

    // Get parts used in the job
    const partsResult = await query(
      `SELECT 
        p.name as part_name,
        jp.quantity_used,
        jp.unit_price,
        jp.total_price
      FROM job_parts jp
      JOIN parts p ON jp.part_id = p.id
      WHERE jp.job_id = $1
      ORDER BY p.name`,
      [jobId]
    );

    // Add parts as line items
    partsResult.rows.forEach(part => {
      lineItems.push({
        description: part.part_name,
        quantity: part.quantity_used,
        unit_price: parseFloat(part.unit_price),
        total: parseFloat(part.total_price),
        type: 'part'
      });
    });

    // Add pickup/delivery fee for workshop jobs
    if (job.location_type === 'workshop' && job.pickup_delivery_fee) {
      const deliveryFee = parseFloat(job.pickup_delivery_fee);
      lineItems.push({
        description: 'Equipment Pickup/Delivery Fee',
        quantity: 1,
        unit_price: deliveryFee,
        total: deliveryFee,
        type: 'fee'
      });
    }

    // Calculate subtotal
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

    const invoiceData: InvoiceData = {
      job_id: job.id,
      job_number: job.job_number,
      location_type: job.location_type,
      line_items: lineItems,
      subtotal,
      total: subtotal, // Tax calculation would be added here if needed
      customer_info: {
        id: job.customer_id,
        name: job.customer_name,
        email: job.customer_email,
        phone: job.customer_phone,
        company_name: job.customer_company,
        billing_address: job.billing_address
      },
      job_info: {
        title: job.title,
        description: job.description,
        completed_at: job.completed_at,
        technician_name: job.technician_name
      }
    };

    return invoiceData;
  } catch (error) {
    console.error('Error getting invoice data:', error);
    throw error;
  }
};

/**
 * Check if a job is ready for invoicing
 */
export const isJobReadyForInvoicing = async (jobId: string): Promise<{ ready: boolean; reason?: string }> => {
  try {
    const jobResult = await query(
      `SELECT 
        status,
        location_type,
        completed_at
      FROM jobs
      WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return { ready: false, reason: 'Job not found' };
    }

    const job = jobResult.rows[0];

    // Job must be completed
    if (job.status !== 'completed') {
      return { ready: false, reason: 'Job is not completed' };
    }

    // For workshop jobs, check if equipment has been returned
    if (job.location_type === 'workshop') {
      const statusResult = await query(
        `SELECT current_status
         FROM equipment_status
         WHERE job_id = $1`,
        [jobId]
      );

      if (statusResult.rows.length > 0) {
        const equipmentStatus = statusResult.rows[0].current_status;
        
        // Equipment should be returned before invoicing
        if (equipmentStatus !== 'returned') {
          return { 
            ready: false, 
            reason: `Equipment status is '${equipmentStatus}'. Equipment must be returned before invoicing.` 
          };
        }
      }
    }

    return { ready: true };
  } catch (error) {
    console.error('Error checking if job is ready for invoicing:', error);
    throw error;
  }
};
