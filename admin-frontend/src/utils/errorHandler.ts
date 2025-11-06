import { toast } from 'react-hot-toast';

/**
 * Error handler utility for consistent error handling across the application
 */

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error: any, defaultMessage: string = 'An error occurred'): void => {
  console.error('API Error:', error);

  // Extract error message from various error formats
  let errorMessage = defaultMessage;

  if (error?.response?.data?.error) {
    errorMessage = error.response.data.error;
  } else if (error?.error) {
    errorMessage = error.error;
  } else if (error?.message) {
    errorMessage = error.message;
  }

  // Show toast notification
  toast.error(errorMessage);
};

/**
 * Handle validation errors
 */
export const handleValidationErrors = (errors: ValidationError[]): void => {
  if (errors.length === 0) return;

  // Show first error as toast
  toast.error(errors[0].message);

  // Log all errors for debugging
  console.error('Validation errors:', errors);
};

/**
 * Validate required fields
 */
export const validateRequired = (
  value: any,
  fieldName: string
): ValidationError | null => {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'Invalid email format',
    };
  }
  return null;
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): ValidationError | null => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return {
      field: 'phone',
      message: 'Invalid phone number format',
    };
  }
  return null;
};

/**
 * Validate number range
 */
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationError | null => {
  if (value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return null;
};

/**
 * Validate date format and range
 */
export const validateDate = (
  date: string,
  fieldName: string,
  minDate?: Date,
  maxDate?: Date
): ValidationError | null => {
  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return {
      field: fieldName,
      message: `Invalid date format for ${fieldName}`,
    };
  }

  if (minDate && parsedDate < minDate) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be before ${minDate.toLocaleDateString()}`,
    };
  }

  if (maxDate && parsedDate > maxDate) {
    return {
      field: fieldName,
      message: `${fieldName} cannot be after ${maxDate.toLocaleDateString()}`,
    };
  }

  return null;
};

/**
 * Validate workshop intake form
 */
export const validateIntakeForm = (data: {
  job_id?: string;
  reported_issue?: string;
  visual_condition?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  const jobIdError = validateRequired(data.job_id, 'Job ID');
  if (jobIdError) errors.push(jobIdError);

  const reportedIssueError = validateRequired(data.reported_issue, 'Reported Issue');
  if (reportedIssueError) errors.push(reportedIssueError);

  return errors;
};

/**
 * Validate delivery scheduling form
 */
export const validateDeliveryForm = (data: {
  delivery_date?: string;
  delivery_technician_id?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  const dateError = validateRequired(data.delivery_date, 'Delivery Date');
  if (dateError) {
    errors.push(dateError);
  } else if (data.delivery_date) {
    const dateValidation = validateDate(
      data.delivery_date,
      'Delivery Date',
      new Date() // Cannot schedule delivery in the past
    );
    if (dateValidation) errors.push(dateValidation);
  }

  const technicianError = validateRequired(data.delivery_technician_id, 'Delivery Technician');
  if (technicianError) errors.push(technicianError);

  return errors;
};

/**
 * Validate equipment return form
 */
export const validateReturnForm = (data: {
  customer_signature?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  const signatureError = validateRequired(data.customer_signature, 'Customer Signature');
  if (signatureError) errors.push(signatureError);

  return errors;
};

/**
 * Validate workshop settings form
 */
export const validateWorkshopSettings = (data: {
  max_concurrent_jobs?: number;
  max_jobs_per_technician?: number;
  default_estimated_repair_hours?: number;
  default_pickup_delivery_fee?: number;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.max_concurrent_jobs !== undefined) {
    const maxJobsError = validateNumberRange(
      data.max_concurrent_jobs,
      1,
      1000,
      'Max Concurrent Jobs'
    );
    if (maxJobsError) errors.push(maxJobsError);
  }

  if (data.max_jobs_per_technician !== undefined) {
    const maxPerTechError = validateNumberRange(
      data.max_jobs_per_technician,
      1,
      100,
      'Max Jobs Per Technician'
    );
    if (maxPerTechError) errors.push(maxPerTechError);
  }

  if (data.default_estimated_repair_hours !== undefined) {
    const repairHoursError = validateNumberRange(
      data.default_estimated_repair_hours,
      1,
      1000,
      'Default Estimated Repair Hours'
    );
    if (repairHoursError) errors.push(repairHoursError);
  }

  if (data.default_pickup_delivery_fee !== undefined) {
    const deliveryFeeError = validateNumberRange(
      data.default_pickup_delivery_fee,
      0,
      10000,
      'Default Pickup/Delivery Fee'
    );
    if (deliveryFeeError) errors.push(deliveryFeeError);
  }

  return errors;
};

/**
 * Check if capacity is exceeded
 */
export const checkCapacityExceeded = (
  currentJobs: number,
  maxJobs: number
): boolean => {
  return currentJobs >= maxJobs;
};

/**
 * Check if approaching capacity (80% or more)
 */
export const checkApproachingCapacity = (
  currentJobs: number,
  maxJobs: number
): boolean => {
  return (currentJobs / maxJobs) >= 0.8;
};

/**
 * Get capacity warning message
 */
export const getCapacityWarningMessage = (
  currentJobs: number,
  maxJobs: number
): string | null => {
  if (checkCapacityExceeded(currentJobs, maxJobs)) {
    return 'Workshop is at full capacity. Cannot accept new jobs.';
  }

  if (checkApproachingCapacity(currentJobs, maxJobs)) {
    return `Workshop is approaching capacity (${currentJobs}/${maxJobs} jobs). Consider prioritizing existing work.`;
  }

  return null;
};

/**
 * Validate status transition
 */
export const validateStatusTransition = (
  currentStatus: string,
  newStatus: string
): ValidationError | null => {
  const validTransitions: Record<string, string[]> = {
    'pending_intake': ['in_transit', 'received'],
    'in_transit': ['received'],
    'received': ['in_repair'],
    'in_repair': ['repair_completed', 'received'],
    'repair_completed': ['ready_for_pickup', 'out_for_delivery'],
    'ready_for_pickup': ['returned'],
    'out_for_delivery': ['returned'],
    'returned': [],
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    return {
      field: 'status',
      message: `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedTransitions.join(', ') || 'none'}`,
    };
  }

  return null;
};
