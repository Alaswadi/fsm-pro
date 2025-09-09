import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/database';
import { ApiResponse, User } from '../types';
import emailService from '../services/emailService';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse);
    }

    // Get user from database
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );


    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse);
    }

    const user = userResult.rows[0];


    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      } as ApiResponse);
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const options: any = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
    const token = (jwt as any).sign(payload, jwtSecret, options);

    // Remove sensitive data
    const { password_hash, email_verification_token, password_reset_token, ...userResponse } = user;

    res.json({
      success: true,
      data: {
        user: userResponse,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, role = 'customer' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      } as ApiResponse);
    }

    // Check if user already exists
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const userResult = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, true, false)
       RETURNING id, email, full_name, phone, role, is_active, email_verified, created_at, updated_at`,
      [email, passwordHash, full_name, phone, role]
    );

    const user = userResult.rows[0];

    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'User created successfully.'
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting here if needed
    return res.json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Remove sensitive data before sending
    const { password_hash, email_verification_token, password_reset_token, ...userResponse } = user;

    return res.json({
      success: true,
      data: userResponse
    } as ApiResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Initiate password reset - generates token and sends email
export const initiatePasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      } as ApiResponse);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      } as ApiResponse);
    }

    // Sanitize email (trim and lowercase)
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if user exists and is active
    const userResult = await query(
      'SELECT id, email, full_name, is_active, role FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      } as ApiResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Send password reset email
    const isForTechnician = user.role === 'technician';
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email,
      user.full_name,
      resetToken,
      undefined, // companyId - will be determined by email service
      isForTechnician
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email. Please try again later.'
      } as ApiResponse);
    }

    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    } as ApiResponse);

  } catch (error) {
    console.error('Password reset initiation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Complete password reset - verify token and update password
export const completePasswordReset = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      } as ApiResponse);
    }

    // Validate token format (should be 64 character hex string)
    const tokenRegex = /^[a-f0-9]{64}$/;
    if (!tokenRegex.test(token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token format'
      } as ApiResponse);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      } as ApiResponse);
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        error: 'Password must be less than 128 characters'
      } as ApiResponse);
    }

    // Check for basic password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      } as ApiResponse);
    }

    // Find user with valid reset token
    const userResult = await query(
      `SELECT id, email, full_name, password_reset_token, password_reset_expires
       FROM users
       WHERE password_reset_token = $1
       AND is_active = true`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token'
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    // Check if token has expired
    if (!user.password_reset_expires || new Date(user.password_reset_expires) <= new Date()) {
      // Clear expired token
      await query(
        'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
        [user.id]
      );

      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new password reset.'
      } as ApiResponse);
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    } as ApiResponse);

  } catch (error) {
    console.error('Password reset completion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

// Admin-initiated password reset for technicians
export const adminInitiatePasswordReset = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;
    const adminUser = (req as any).user;

    // Verify admin permissions
    if (!['super_admin', 'admin', 'manager'].includes(adminUser.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      } as ApiResponse);
    }

    // Get technician details
    const technicianResult = await query(
      `SELECT u.id, u.email, u.full_name, u.is_active, t.company_id
       FROM users u
       JOIN technicians t ON u.id = t.user_id
       WHERE t.id = $1 AND u.role = 'technician'`,
      [technicianId]
    );

    if (technicianResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Technician not found'
      } as ApiResponse);
    }

    const technician = technicianResult.rows[0];

    if (!technician.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Cannot reset password for inactive technician'
      } as ApiResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for admin-initiated resets

    // Store reset token in database
    await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, technician.id]
    );

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      technician.email,
      technician.full_name,
      resetToken,
      technician.company_id,
      true // isForTechnician = true
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email. Please try again later.'
      } as ApiResponse);
    }

    return res.json({
      success: true,
      message: `Password reset email sent to ${technician.email}`,
      data: {
        technicianName: technician.full_name,
        email: technician.email
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Admin password reset initiation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
