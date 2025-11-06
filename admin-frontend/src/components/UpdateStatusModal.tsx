import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { EquipmentRepairStatus } from '../types/workshop';

interface UpdateStatusModalProps {
  isOpen: boolean;
  currentStatus: EquipmentRepairStatus;
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  currentStatus,
  jobId,
  onClose,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<EquipmentRepairStatus>(currentStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
      setNotes('');
      setShowConfirmation(false);
    }
  }, [isOpen, currentStatus]);

  // Valid status transitions based on design document
  const statusTransitions: Record<EquipmentRepairStatus, EquipmentRepairStatus[]> = {
    pending_intake: ['in_transit', 'received'],
    in_transit: ['received'],
    received: ['in_repair'],
    in_repair: ['repair_completed', 'received'], // Can go back if more work needed
    repair_completed: ['ready_for_pickup', 'out_for_delivery'],
    ready_for_pickup: ['returned'],
    out_for_delivery: ['returned'],
    returned: [], // Terminal state
  };

  // Status display configuration
  const statusConfig: Record<EquipmentRepairStatus, { label: string; icon: string; description: string }> = {
    pending_intake: {
      label: 'Pending Intake',
      icon: 'ri-time-line',
      description: 'Equipment is awaiting intake processing',
    },
    in_transit: {
      label: 'In Transit',
      icon: 'ri-truck-line',
      description: 'Equipment is being transported to workshop',
    },
    received: {
      label: 'Received',
      icon: 'ri-inbox-line',
      description: 'Equipment has been received at workshop',
    },
    in_repair: {
      label: 'In Repair',
      icon: 'ri-tools-line',
      description: 'Equipment is currently being repaired',
    },
    repair_completed: {
      label: 'Repair Completed',
      icon: 'ri-checkbox-circle-line',
      description: 'Repair work has been completed',
    },
    ready_for_pickup: {
      label: 'Ready for Pickup',
      icon: 'ri-hand-heart-line',
      description: 'Equipment is ready for customer pickup',
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      icon: 'ri-truck-line',
      description: 'Equipment is being delivered to customer',
    },
    returned: {
      label: 'Returned',
      icon: 'ri-check-double-line',
      description: 'Equipment has been returned to customer',
    },
  };

  // Get valid next statuses
  const validNextStatuses = statusTransitions[currentStatus] || [];

  // Handle status change
  const handleStatusChange = (status: EquipmentRepairStatus) => {
    setSelectedStatus(status);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStatus === currentStatus) {
      toast.error('Please select a different status');
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  // Handle confirmed update
  const handleConfirmedUpdate = async () => {
    try {
      setLoading(true);

      // Import statusService dynamically to avoid circular dependencies
      const { statusService } = await import('../services/statusService');

      const response = await statusService.updateStatus(jobId, {
        status: selectedStatus,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        toast.success('Equipment status updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Update Equipment Status</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Current status: <span className="font-medium">{statusConfig[currentStatus].label}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select New Status <span className="text-red-500">*</span>
              </label>

              {validNextStatuses.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-information-line text-yellow-600 text-xl mr-3 mt-0.5"></i>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">No valid transitions available</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        The current status "{statusConfig[currentStatus].label}" cannot be changed to another status.
                        {currentStatus === 'returned' && ' This is a terminal state.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {validNextStatuses.map((status) => {
                    const config = statusConfig[status];
                    const isSelected = selectedStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(status)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                          >
                            <i
                              className={`${config.icon} text-xl ${
                                isSelected ? 'text-blue-600' : 'text-gray-600'
                              }`}
                            ></i>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`text-sm font-semibold ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}
                              >
                                {config.label}
                              </h4>
                              {isSelected && (
                                <i className="ri-check-line text-blue-600 text-xl"></i>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any notes about this status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes will be recorded in the status history
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || validNextStatuses.length === 0 || selectedStatus === currentStatus}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="ri-refresh-line mr-2"></i>
                    Update Status
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <i className="ri-question-line text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirm Status Update
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to change the status from{' '}
                <span className="font-semibold">{statusConfig[currentStatus].label}</span> to{' '}
                <span className="font-semibold">{statusConfig[selectedStatus].label}</span>?
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={handleCancelConfirmation}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedUpdate}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateStatusModal;
