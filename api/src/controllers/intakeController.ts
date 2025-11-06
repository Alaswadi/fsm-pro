import { Response } from 'express';
import { query } from '../config/database';
import { ApiResponse, AuthRequest } from '../types';
import { createIntakeRecord } from '../services/intakeService';
import { sendIntakeConfirmation } from '../services/workshopNotificationService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Create equipment intake record
 * POST /api/workshop/intake
 */
export const createIntake = async (req: AuthRequest, res: Response) => {
  try {
    const {
      job_id,
      reported_issue,
      visual_condition,
      physical_damage_notes,
      accessories_included,
      customer_signature,
      customer_notes,
      internal_notes,
      estimated_repair_time
    } = req.body;

    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Validate required fields
    if (!job_id) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      } as ApiResponse);
    }

    if (!reported_issue) {
      return res.status(400).json({
        success: false,
        error: 'Reported issue is required'
      } as ApiResponse);
    }

    // Verify job exists and is a workshop job
    const jobCheckQuery = `
      SELECT id, location_type, company_id
      FROM jobs
      WHERE id = $1 AND company_id = $2
    `;
    const jobResult = await query(jobCheckQuery, [job_id, companyId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      } as ApiResponse);
    }

    const job = jobResult.rows[0];
    if (job.location_type !== 'workshop') {
      return res.status(400).json({
        success: false,
        error: 'Can only create intake records for workshop jobs'
      } as ApiResponse);
    }

    // Check for duplicate intake record
    const existingIntakeQuery = `
      SELECT id FROM equipment_intake WHERE job_id = $1
    `;
    const existingIntake = await query(existingIntakeQuery, [job_id]);

    if (existingIntake.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Intake record already exists for this job'
      } as ApiResponse);
    }

    // Create intake record using service
    const intakeData = {
      job_id,
      company_id: companyId,
      received_by: userId,
      reported_issue,
      visual_condition,
      physical_damage_notes,
      accessories_included,
      customer_signature,
      customer_notes,
      internal_notes,
      estimated_repair_time
    };

    const intake = await createIntakeRecord(intakeData);

    // Fetch complete intake data with relations
    const completeIntakeQuery = `
      SELECT
        ei.*,
        u.full_name as received_by_name,
        u.email as received_by_email
      FROM equipment_intake ei
      LEFT JOIN users u ON ei.received_by = u.id
      WHERE ei.id = $1
    `;
    const completeResult = await query(completeIntakeQuery, [intake.id]);
    const completeIntake = completeResult.rows[0];

    // Send intake confirmation notification
    try {
      await sendIntakeConfirmation(job_id, companyId);
    } catch (notificationError) {
      console.error('Failed to send intake confirmation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: {
        ...completeIntake,
        received_by_user: completeIntake.received_by_name ? {
          id: completeIntake.received_by,
          full_name: completeIntake.received_by_name,
          email: completeIntake.received_by_email
        } : null
      },
      message: 'Equipment intake record created successfully'
    } as ApiResponse);

  } catch (error: any) {
    console.error('Error creating intake:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create intake record'
    } as ApiResponse);
  }
};

/**
 * Get intake record by job ID
 * GET /api/workshop/intake/:job_id
 */
export const getIntake = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Fetch intake record with relations
    const intakeQuery = `
      SELECT
        ei.*,
        u.full_name as received_by_name,
        u.email as received_by_email,
        u.phone as received_by_phone
      FROM equipment_intake ei
      LEFT JOIN users u ON ei.received_by = u.id
      WHERE ei.job_id = $1 AND ei.company_id = $2
    `;
    const result = await query(intakeQuery, [job_id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Intake record not found'
      } as ApiResponse);
    }

    const intake = result.rows[0];

    // Fetch intake photos
    const photosQuery = `
      SELECT
        ip.*,
        u.full_name as uploaded_by_name
      FROM intake_photos ip
      LEFT JOIN users u ON ip.uploaded_by = u.id
      WHERE ip.equipment_intake_id = $1
      ORDER BY ip.taken_at DESC
    `;
    const photosResult = await query(photosQuery, [intake.id]);

    res.json({
      success: true,
      data: {
        ...intake,
        received_by_user: intake.received_by_name ? {
          id: intake.received_by,
          full_name: intake.received_by_name,
          email: intake.received_by_email,
          phone: intake.received_by_phone
        } : null,
        photos: photosResult.rows.map(photo => ({
          ...photo,
          uploaded_by_user: photo.uploaded_by_name ? {
            id: photo.uploaded_by,
            full_name: photo.uploaded_by_name
          } : null
        }))
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching intake:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intake record'
    } as ApiResponse);
  }
};

/**
 * Update intake record
 * PUT /api/workshop/intake/:id
 */
export const updateIntake = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      reported_issue,
      visual_condition,
      physical_damage_notes,
      accessories_included,
      customer_signature,
      customer_notes,
      internal_notes,
      estimated_repair_time
    } = req.body;

    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if intake exists and belongs to company
    const existingIntakeQuery = `
      SELECT * FROM equipment_intake
      WHERE id = $1 AND company_id = $2
    `;
    const existingResult = await query(existingIntakeQuery, [id, companyId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Intake record not found'
      } as ApiResponse);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (reported_issue !== undefined) {
      updateFields.push(`reported_issue = $${paramIndex}`);
      updateValues.push(reported_issue);
      paramIndex++;
    }

    if (visual_condition !== undefined) {
      updateFields.push(`visual_condition = $${paramIndex}`);
      updateValues.push(visual_condition);
      paramIndex++;
    }

    if (physical_damage_notes !== undefined) {
      updateFields.push(`physical_damage_notes = $${paramIndex}`);
      updateValues.push(physical_damage_notes);
      paramIndex++;
    }

    if (accessories_included !== undefined) {
      updateFields.push(`accessories_included = $${paramIndex}`);
      updateValues.push(accessories_included);
      paramIndex++;
    }

    if (customer_signature !== undefined) {
      updateFields.push(`customer_signature = $${paramIndex}`);
      updateValues.push(customer_signature);
      paramIndex++;
    }

    if (customer_notes !== undefined) {
      updateFields.push(`customer_notes = $${paramIndex}`);
      updateValues.push(customer_notes);
      paramIndex++;
    }

    if (internal_notes !== undefined) {
      updateFields.push(`internal_notes = $${paramIndex}`);
      updateValues.push(internal_notes);
      paramIndex++;
    }

    if (estimated_repair_time !== undefined) {
      updateFields.push(`estimated_repair_time = $${paramIndex}`);
      updateValues.push(estimated_repair_time);
      paramIndex++;
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) { // Only updated_at field
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      } as ApiResponse);
    }

    // Add WHERE clause parameters
    updateValues.push(id, companyId);

    const updateQuery = `
      UPDATE equipment_intake
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedIntake = result.rows[0];

    res.json({
      success: true,
      data: updatedIntake,
      message: 'Intake record updated successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error updating intake:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update intake record'
    } as ApiResponse);
  }
};

// Configure multer for intake photo uploads
const uploadsDir = path.join(__dirname, '../../uploads');
const intakePhotosDir = path.join(uploadsDir, 'intake-photos');

// Create directory if it doesn't exist
if (!fs.existsSync(intakePhotosDir)) {
  fs.mkdirSync(intakePhotosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, intakePhotosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `intake-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Multiple file upload middleware for intake photos
export const uploadIntakePhotosMiddleware = upload.array('photos', 10); // Max 10 photos

/**
 * Upload intake photos
 * POST /api/workshop/intake/:id/photos
 */
export const uploadIntakePhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { photo_type, caption } = req.body;
    const companyId = req.company?.id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Check if intake exists and belongs to company
    const intakeCheckQuery = `
      SELECT id, company_id FROM equipment_intake
      WHERE id = $1 AND company_id = $2
    `;
    const intakeResult = await query(intakeCheckQuery, [id, companyId]);

    if (intakeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Intake record not found'
      } as ApiResponse);
    }

    // Check if files were uploaded
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No photos provided'
      } as ApiResponse);
    }

    // Insert photo records into database
    const uploadedPhotos = [];
    for (const file of files) {
      const photoUrl = `/uploads/intake-photos/${file.filename}`;
      
      const insertPhotoQuery = `
        INSERT INTO intake_photos (
          equipment_intake_id,
          photo_url,
          photo_type,
          caption,
          uploaded_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const photoResult = await query(insertPhotoQuery, [
        id,
        photoUrl,
        photo_type || null,
        caption || null,
        userId || null
      ]);

      uploadedPhotos.push({
        ...photoResult.rows[0],
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      });
    }

    res.status(201).json({
      success: true,
      data: uploadedPhotos,
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`
    } as ApiResponse);

  } catch (error: any) {
    console.error('Error uploading intake photos:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload photos'
    } as ApiResponse);
  }
};

/**
 * Get intake photos
 * GET /api/workshop/intake/:id/photos
 */
export const getIntakePhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.id;

    if (!companyId) {
      return res.status(403).json({
        success: false,
        error: 'No company context found'
      } as ApiResponse);
    }

    // Verify intake exists and belongs to company
    const intakeCheckQuery = `
      SELECT id FROM equipment_intake
      WHERE id = $1 AND company_id = $2
    `;
    const intakeResult = await query(intakeCheckQuery, [id, companyId]);

    if (intakeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Intake record not found'
      } as ApiResponse);
    }

    // Fetch photos
    const photosQuery = `
      SELECT
        ip.*,
        u.full_name as uploaded_by_name,
        u.email as uploaded_by_email
      FROM intake_photos ip
      LEFT JOIN users u ON ip.uploaded_by = u.id
      WHERE ip.equipment_intake_id = $1
      ORDER BY ip.taken_at DESC
    `;
    const photosResult = await query(photosQuery, [id]);

    const photos = photosResult.rows.map(photo => ({
      ...photo,
      uploaded_by_user: photo.uploaded_by_name ? {
        id: photo.uploaded_by,
        full_name: photo.uploaded_by_name,
        email: photo.uploaded_by_email
      } : null
    }));

    res.json({
      success: true,
      data: photos
    } as ApiResponse);

  } catch (error) {
    console.error('Error fetching intake photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos'
    } as ApiResponse);
  }
};
