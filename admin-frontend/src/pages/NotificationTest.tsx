import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Notifications as NotificationsIcon,
    PhoneAndroid as PhoneIcon
} from '@mui/icons-material';
import api from '../services/api';

interface Device {
    id: string;
    full_name: string;
    email: string;
    role: string;
    fcm_token_preview: string;
    updated_at: string;
}

interface NotificationResult {
    userId: string;
    userName: string;
    success: boolean;
    error?: string;
    messageId?: string;
}

interface FirebaseStatus {
    firebase_initialized: boolean;
    registered_devices: number;
    message: string;
}

const NotificationTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<FirebaseStatus | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [results, setResults] = useState<NotificationResult[]>([]);
    const [title, setTitle] = useState('🧪 Test Notification');
    const [body, setBody] = useState('This is a test notification from FSM Pro Admin');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get('/devices/status');
            setStatus(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch status');
        } finally {
            setLoading(false);
        }
    };

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/devices/list');
            setDevices(response.data.data.devices || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch devices');
        } finally {
            setLoading(false);
        }
    };

    const sendTestNotification = async (userId?: string) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            setResults([]);

            const response = await api.post('/devices/test-notification', {
                user_id: userId,
                title,
                body
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setResults(response.data.data.results || []);
            } else {
                setError(response.data.error);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send notification');
            if (err.response?.data?.firebase_initialized === false) {
                setStatus(prev => prev ? { ...prev, firebase_initialized: false } : null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchDevices();
    }, []);

    const refresh = () => {
        fetchStatus();
        fetchDevices();
        setResults([]);
        setError(null);
        setSuccess(null);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Push Notification Test
                </Typography>
                <IconButton onClick={refresh} disabled={loading}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            {/* Status Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Firebase Status
                            </Typography>
                            {status ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {status.firebase_initialized ? (
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label="Initialized"
                                            color="success"
                                        />
                                    ) : (
                                        <Chip
                                            icon={<ErrorIcon />}
                                            label="Not Initialized"
                                            color="error"
                                        />
                                    )}
                                    <Typography variant="body2" color="text.secondary">
                                        {status.message}
                                    </Typography>
                                </Box>
                            ) : (
                                <CircularProgress size={20} />
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Registered Devices
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon color="primary" />
                                <Typography variant="h4">
                                    {status?.registered_devices ?? '...'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Firebase Not Initialized Warning */}
            {status && !status.firebase_initialized && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Firebase is not initialized!</strong> Make sure:
                    <ul style={{ margin: '8px 0' }}>
                        <li>firebase-service-account.json exists in the api/ folder</li>
                        <li>The API server was restarted after adding the file</li>
                        <li>The service account JSON is valid (from Firebase Console → Project Settings → Service Accounts)</li>
                    </ul>
                </Alert>
            )}

            {/* Test Notification Form */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Send Test Notification
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Notification Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Notification Body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                    />
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        onClick={() => sendTestNotification()}
                        disabled={loading || !status?.firebase_initialized}
                    >
                        Send to All Devices ({devices.length})
                    </Button>
                </Box>
            </Paper>

            {/* Results */}
            {results.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Notification Results
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>User</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Error/Message ID</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {results.map((result) => (
                                    <TableRow key={result.userId}>
                                        <TableCell>{result.userName}</TableCell>
                                        <TableCell>
                                            {result.success ? (
                                                <Chip size="small" label="Sent" color="success" />
                                            ) : (
                                                <Chip size="small" label="Failed" color="error" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {result.error || result.messageId || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Registered Devices Table */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Registered Devices
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Token Preview</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {devices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No devices registered yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                devices.map((device) => (
                                    <TableRow key={device.id}>
                                        <TableCell>{device.full_name}</TableCell>
                                        <TableCell>{device.email}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={device.role} />
                                        </TableCell>
                                        <TableCell>
                                            <code style={{ fontSize: '0.75rem' }}>
                                                {device.fcm_token_preview}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Send test to this device">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => sendTestNotification(device.id)}
                                                    disabled={loading || !status?.firebase_initialized}
                                                >
                                                    <SendIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default NotificationTest;
