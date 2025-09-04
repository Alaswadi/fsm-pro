import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { ApiResponse, User } from '../types';

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
