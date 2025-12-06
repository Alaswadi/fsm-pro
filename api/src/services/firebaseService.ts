import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Firebase Admin SDK service for sending push notifications

let firebaseApp: admin.app.App | null = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Looks for service account credentials in multiple locations
 */
export const initializeFirebase = (): boolean => {
    if (isInitialized) {
        return true;
    }

    try {
        // Try to find service account file
        const possiblePaths = [
            path.join(__dirname, '../../firebase-service-account.json'),
            path.join(__dirname, '../../../firebase-service-account.json'),
            path.join(process.cwd(), 'firebase-service-account.json'),
        ];

        let serviceAccountPath: string | null = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                serviceAccountPath = p;
                break;
            }
        }

        if (serviceAccountPath) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            isInitialized = true;
            console.log('🔥 Firebase Admin SDK initialized successfully');
            return true;
        } else {
            // Check for environment variable
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                isInitialized = true;
                console.log('🔥 Firebase Admin SDK initialized from environment variable');
                return true;
            }

            console.warn('⚠️ Firebase service account not found. Push notifications disabled.');
            console.warn('   Place firebase-service-account.json in the api/ folder to enable.');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error);
        return false;
    }
};

/**
 * Send push notification to a single device
 */
export const sendNotification = async (
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    if (!isInitialized) {
        console.warn('Firebase not initialized, skipping notification');
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const message: admin.messaging.Message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: 'high',
                notification: {
                    channelId: 'fsm_pro_high_importance',
                    priority: 'high',
                    defaultSound: true,
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log(`📤 Push notification sent: ${response}`);
        return { success: true, messageId: response };
    } catch (error: any) {
        console.error('❌ Failed to send push notification:', error.message);

        // Handle invalid token
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return { success: false, error: 'invalid_token' };
        }

        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to multiple devices
 */
export const sendToMultiple = async (
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> => {
    if (!isInitialized || fcmTokens.length === 0) {
        return { successCount: 0, failureCount: fcmTokens.length };
    }

    try {
        const message: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: 'high',
                notification: {
                    channelId: 'fsm_pro_high_importance',
                    priority: 'high',
                    defaultSound: true,
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`📤 Multicast sent: ${response.successCount} success, ${response.failureCount} failed`);
        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (error: any) {
        console.error('❌ Failed to send multicast notification:', error.message);
        return { successCount: 0, failureCount: fcmTokens.length };
    }
};

/**
 * Send work order assignment notification to technician
 */
export const sendWorkOrderAssignmentNotification = async (
    technicianFcmToken: string,
    workOrderDetails: {
        jobNumber: string;
        title: string;
        customerName: string;
        priority: string;
        scheduledDate?: string;
    }
): Promise<boolean> => {
    const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        urgent: '🔴'
    }[workOrderDetails.priority] || '🔵';

    const title = `${priorityEmoji} New Work Order Assigned`;
    const body = `${workOrderDetails.title}\nCustomer: ${workOrderDetails.customerName}`;

    const data = {
        type: 'work_order_assigned',
        jobNumber: workOrderDetails.jobNumber,
        priority: workOrderDetails.priority,
        ...(workOrderDetails.scheduledDate && { scheduledDate: workOrderDetails.scheduledDate }),
    };

    const result = await sendNotification(technicianFcmToken, title, body, data);
    return result.success;
};

// Export initialization status checker
export const isFirebaseInitialized = (): boolean => isInitialized;
