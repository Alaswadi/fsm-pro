import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { workshopSettingsService } from '../services/workshopSettingsService';
import type { WorkshopSettings } from '../types/workshop';

interface WorkshopSettingsState {
  settings: WorkshopSettings | null;
  loading: boolean;
  saving: boolean;
  formData: {
    max_concurrent_jobs: number;
    max_jobs_per_technician: number;
    default_estimated_repair_hours: number;
    default_pickup_delivery_fee: number;
    workshop_address: string;
    workshop_phone: string;
    send_intake_confirmation: boolean;
    send_ready_notification: boolean;
    send_status_updates: boolean;
    intake_confirmation_template: string;
    ready_notification_template: string;
    status_update_template: string;
  };
}

const WorkshopSettings: React.FC = () => {
  const [state, setState] = useState<WorkshopSettingsState>({
    settings: null,
    loading: true,
    saving: false,
    formData: {
      max_concurrent_jobs: 20,
      max_jobs_per_technician: 5,
      default_estimated_repair_hours: 24,
      default_pickup_delivery_fee: 0,
      workshop_address: '',
      workshop_phone: '',
      send_intake_confirmation: true,
      send_ready_notification: true,
      send_status_updates: true,
      intake_confirmation_template: '',
      ready_notification_template: '',
      status_update_template: '',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await workshopSettingsService.getWorkshopSettings();

      if (response.success && response.data) {
        const settings = response.data;
        setState(prev => ({
          ...prev,
          settings,
          formData: {
            max_concurrent_jobs: settings.max_concurrent_jobs,
            max_jobs_per_technician: settings.max_jobs_per_technician,
            default_estimated_repair_hours: settings.default_estimated_repair_hours,
            default_pickup_delivery_fee: settings.default_pickup_delivery_fee,
            workshop_address: settings.workshop_address || '',
            workshop_phone: settings.workshop_phone || '',
            send_intake_confirmation: settings.send_intake_confirmation,
            send_ready_notification: settings.send_ready_notification,
            send_status_updates: settings.send_status_updates,
            intake_confirmation_template: settings.intake_confirmation_template || '',
            ready_notification_template: settings.ready_notification_template || '',
            status_update_template: settings.status_update_template || '',
          },
          loading: false,
        }));
      } else {
        toast.error(response.error || 'Failed to load workshop settings');
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading workshop settings:', error);
      toast.error('Failed to load workshop settings');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleInputChange = (field: keyof WorkshopSettingsState['formData'], value: any) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
    }));
  };

  const handleToggleChange = (field: keyof WorkshopSettingsState['formData']) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: !prev.formData[field],
      },
    }));
  };

  const validateForm = (): boolean => {
    const { max_concurrent_jobs, max_jobs_per_technician, default_estimated_repair_hours, default_pickup_delivery_fee } = state.formData;

    if (max_concurrent_jobs < 1) {
      toast.error('Maximum concurrent jobs must be at least 1');
      return false;
    }

    if (max_jobs_per_technician < 1) {
      toast.error('Maximum jobs per technician must be at least 1');
      return false;
    }

    if (default_estimated_repair_hours < 1) {
      toast.error('Default estimated repair hours must be at least 1');
      return false;
    }

    if (default_pickup_delivery_fee < 0) {
      toast.error('Default pickup/delivery fee cannot be negative');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setState(prev => ({ ...prev, saving: true }));

      const response = await workshopSettingsService.updateWorkshopSettings(state.formData);

      if (response.success) {
        toast.success('Workshop settings saved successfully');
        loadSettings(); // Reload to get updated data
      } else {
        toast.error(response.error || 'Failed to save workshop settings');
      }
    } catch (error) {
      console.error('Error saving workshop settings:', error);
      toast.error('Failed to save workshop settings');
    } finally {
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  const handleReset = () => {
    if (state.settings) {
      setState(prev => ({
        ...prev,
        formData: {
          max_concurrent_jobs: state.settings!.max_concurrent_jobs,
          max_jobs_per_technician: state.settings!.max_jobs_per_technician,
          default_estimated_repair_hours: state.settings!.default_estimated_repair_hours,
          default_pickup_delivery_fee: state.settings!.default_pickup_delivery_fee,
          workshop_address: state.settings!.workshop_address || '',
          workshop_phone: state.settings!.workshop_phone || '',
          send_intake_confirmation: state.settings!.send_intake_confirmation,
          send_ready_notification: state.settings!.send_ready_notification,
          send_status_updates: state.settings!.send_status_updates,
          intake_confirmation_template: state.settings!.intake_confirmation_template || '',
          ready_notification_template: state.settings!.ready_notification_template || '',
          status_update_template: state.settings!.status_update_template || '',
        },
      }));
      toast.success('Form reset to saved values');
    }
  };

  if (state.loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading workshop settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workshop Settings</h1>
        <p className="text-gray-600 mt-1">Configure workshop capacity, location, and notification preferences</p>
      </div>

      <div className="space-y-6">
        {/* Capacity Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Concurrent Jobs
              </label>
              <input
                type="number"
                min="1"
                value={state.formData.max_concurrent_jobs}
                onChange={(e) => handleInputChange('max_concurrent_jobs', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of jobs the workshop can handle at once</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Jobs Per Technician
              </label>
              <input
                type="number"
                min="1"
                value={state.formData.max_jobs_per_technician}
                onChange={(e) => handleInputChange('max_jobs_per_technician', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of jobs each technician can work on</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Estimated Repair Hours
              </label>
              <input
                type="number"
                min="1"
                value={state.formData.default_estimated_repair_hours}
                onChange={(e) => handleInputChange('default_estimated_repair_hours', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Default time estimate for repairs (in hours)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Pickup/Delivery Fee ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.formData.default_pickup_delivery_fee}
                onChange={(e) => handleInputChange('default_pickup_delivery_fee', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Default fee for equipment pickup or delivery</p>
            </div>
          </div>
        </div>

        {/* Workshop Location & Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workshop Location & Contact</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workshop Address
              </label>
              <textarea
                rows={3}
                value={state.formData.workshop_address}
                onChange={(e) => handleInputChange('workshop_address', e.target.value)}
                placeholder="Enter workshop address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workshop Phone
              </label>
              <input
                type="tel"
                value={state.formData.workshop_phone}
                onChange={(e) => handleInputChange('workshop_phone', e.target.value)}
                placeholder="Enter workshop phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Send Intake Confirmation</label>
                <p className="text-xs text-gray-500">Notify customers when equipment is received</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChange('send_intake_confirmation')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  state.formData.send_intake_confirmation ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.formData.send_intake_confirmation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Send Ready Notification</label>
                <p className="text-xs text-gray-500">Notify customers when equipment is ready for pickup</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChange('send_ready_notification')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  state.formData.send_ready_notification ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.formData.send_ready_notification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Send Status Updates</label>
                <p className="text-xs text-gray-500">Notify customers when equipment status changes</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleChange('send_status_updates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  state.formData.send_status_updates ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.formData.send_status_updates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Templates</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intake Confirmation Template
              </label>
              <textarea
                rows={4}
                value={state.formData.intake_confirmation_template}
                onChange={(e) => handleInputChange('intake_confirmation_template', e.target.value)}
                placeholder="Your equipment has been received at our workshop. We will begin the repair process shortly."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Message sent when equipment is received</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ready Notification Template
              </label>
              <textarea
                rows={4}
                value={state.formData.ready_notification_template}
                onChange={(e) => handleInputChange('ready_notification_template', e.target.value)}
                placeholder="Your equipment is ready for pickup at our workshop. Please contact us to schedule a pickup time."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Message sent when equipment is ready for pickup</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Update Template
              </label>
              <textarea
                rows={4}
                value={state.formData.status_update_template}
                onChange={(e) => handleInputChange('status_update_template', e.target.value)}
                placeholder="Your equipment status has been updated. Current status: {status}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Message sent when equipment status changes. Use {'{status}'} as placeholder</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={handleReset}
            disabled={state.saving}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={state.saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {state.saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="ri-save-line"></i>
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkshopSettings;
