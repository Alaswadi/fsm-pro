import { Router, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { sendNotification, isFirebaseInitialized } from '../services/firebaseService';

const router = Router();

/**
 * GET /api/devices/status
 * Get Firebase initialization status and registered devices count
 */
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;

        // Check Firebase status
        const firebaseReady = isFirebaseInitialized();

        // Count registered devices for the company
        const result = await query(
            `SELECT COUNT(*) as count FROM users u
       WHERE u.fcm_token IS NOT NULL`,
            []
        );

        const registeredDevices = parseInt(result.rows[0].count);

        return res.json({
            success: true,
            data: {
                firebase_initialized: firebaseReady,
                registered_devices: registeredDevices,
                message: firebaseReady
                    ? 'Firebase is ready to send notifications'
                    : 'Firebase is NOT initialized - check firebase-service-account.json'
            }
        });
    } catch (error) {
        console.error('Error checking device status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check status'
        });
    }
});

/**
 * GET /api/devices/list
 * List all users with registered FCM tokens
 */
router.get('/list', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.company?.id;

        // Get all users with FCM tokens for this company
        const result = await query(
            `SELECT u.id, u.full_name, u.email, u.role, 
              SUBSTRING(u.fcm_token, 1, 20) || '...' as fcm_token_preview,
              u.updated_at
       FROM users u
       WHERE u.fcm_token IS NOT NULL
       ORDER BY u.updated_at DESC`,
            []
        );

        return res.json({
            success: true,
            data: {
                devices: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error listing devices:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to list devices'
        });
    }
});

/**
 * POST /api/devices/test-notification
 * Send a test notification to a specific user or all registered devices
 */
router.post('/test-notification', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { user_id, title, body } = req.body;

        // Check Firebase status first
        if (!isFirebaseInitialized()) {
            return res.status(503).json({
                success: false,
                error: 'Firebase is not initialized. Make sure firebase-service-account.json exists in the api/ folder.',
                firebase_initialized: false
            });
        }

        const notificationTitle = title || '🧪 Test Notification';
        const notificationBody = body || 'This is a test notification from FSM Pro Admin';

        let tokensToNotify: { userId: string; fcmToken: string; userName: string }[] = [];

        if (user_id) {
            // Send to specific user
            const result = await query(
                'SELECT id, full_name, fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL',
                [user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found or has no registered device'
                });
            }

            tokensToNotify = result.rows.map(row => ({
                userId: row.id,
                fcmToken: row.fcm_token,
                userName: row.full_name
            }));
        } else {
            // Send to all registered devices
            const result = await query(
                'SELECT id, full_name, fcm_token FROM users WHERE fcm_token IS NOT NULL',
                []
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No devices registered for push notifications'
                });
            }

            tokensToNotify = result.rows.map(row => ({
                userId: row.id,
                fcmToken: row.fcm_token,
                userName: row.full_name
            }));
        }

        // Send notifications
        const results = await Promise.all(
            tokensToNotify.map(async ({ userId, fcmToken, userName }) => {
                try {
                    const result = await sendNotification(
                        fcmToken,
                        notificationTitle,
                        notificationBody,
                        { type: 'test', timestamp: new Date().toISOString() }
                    );

                    console.log(`📤 Test notification to ${userName}: ${result.success ? 'SUCCESS' : 'FAILED'}`);

                    return {
                        userId,
                        userName,
                        success: result.success,
                        error: result.error,
                        messageId: result.messageId
                    };
                } catch (error: any) {
                    return {
                        userId,
                        userName,
                        success: false,
                        error: error.message
                    };
                }
            })
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return res.json({
            success: successCount > 0,
            data: {
                total: results.length,
                success_count: successCount,
                failure_count: failureCount,
                results
            },
            message: `Sent ${successCount}/${results.length} notifications successfully`
        });

    } catch (error) {
        console.error('Error sending test notification:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send test notification',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

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

