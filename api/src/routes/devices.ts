import { Router, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/devices/register
 * Register FCM token for push notifications
 */
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { fcm_token } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        if (!fcm_token) {
            return res.status(400).json({
                success: false,
                error: 'FCM token is required'
            });
        }

        // Update user's FCM token
        await query(
            'UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2',
            [fcm_token, userId]
        );

        console.log(`📱 FCM token registered for user ${userId}`);

        return res.json({
            success: true,
            message: 'Device registered for push notifications'
        });
    } catch (error) {
        console.error('Error registering device:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to register device'
        });
    }
});

/**
 * DELETE /api/devices/unregister
 * Remove FCM token (e.g., on logout)
 */
router.delete('/unregister', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        // Clear user's FCM token
        await query(
            'UPDATE users SET fcm_token = NULL, updated_at = NOW() WHERE id = $1',
            [userId]
        );

        console.log(`📱 FCM token unregistered for user ${userId}`);

        return res.json({
            success: true,
            message: 'Device unregistered from push notifications'
        });
    } catch (error) {
        console.error('Error unregistering device:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to unregister device'
        });
    }
});

export default router;
