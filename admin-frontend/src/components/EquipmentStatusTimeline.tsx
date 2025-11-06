import React from 'react';
import type { EquipmentStatus, EquipmentStatusHistory, EquipmentRepairStatus } from '../types/workshop';

interface EquipmentStatusTimelineProps {
  equipmentStatus: EquipmentStatus;
  statusHistory?: EquipmentStatusHistory[];
}

const EquipmentStatusTimeline: React.FC<EquipmentStatusTimelineProps> = ({
  equipmentStatus,
  statusHistory = [],
}) => {
  // Define all possible statuses in order
  const statusFlow: EquipmentRepairStatus[] = [
    'pending_intake',
    'in_transit',
    'received',
    'in_repair',
    'repair_completed',
    'ready_for_pickup',
    'out_for_delivery',
    'returned',
  ];

  // Status display configuration
  const statusConfig: Record<EquipmentRepairStatus, { label: string; icon: string; color: string }> = {
    pending_intake: { label: 'Pending Intake', icon: 'ri-time-line', color: 'gray' },
    in_transit: { label: 'In Transit', icon: 'ri-truck-line', color: 'blue' },
    received: { label: 'Received', icon: 'ri-inbox-line', color: 'blue' },
    in_repair: { label: 'In Repair', icon: 'ri-tools-line', color: 'purple' },
    repair_completed: { label: 'Repair Completed', icon: 'ri-checkbox-circle-line', color: 'green' },
    ready_for_pickup: { label: 'Ready for Pickup', icon: 'ri-hand-heart-line', color: 'green' },
    out_for_delivery: { label: 'Out for Delivery', icon: 'ri-truck-line', color: 'blue' },
    returned: { label: 'Returned', icon: 'ri-check-double-line', color: 'green' },
  };

  // Get timestamp for a status
  const getStatusTimestamp = (status: EquipmentRepairStatus): string | undefined => {
    const fieldMap: Record<EquipmentRepairStatus, keyof EquipmentStatus> = {
      pending_intake: 'pending_intake_at',
      in_transit: 'in_transit_at',
      received: 'received_at',
      in_repair: 'in_repair_at',
      repair_completed: 'repair_completed_at',
      ready_for_pickup: 'ready_for_pickup_at',
      out_for_delivery: 'out_for_delivery_at',
      returned: 'returned_at',
    };

    const field = fieldMap[status];
    return equipmentStatus[field] as string | undefined;
  };

  // Get history entry for a status
  const getHistoryForStatus = (status: EquipmentRepairStatus): EquipmentStatusHistory | undefined => {
    return statusHistory.find(h => h.to_status === status);
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get relative time
  const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  // Determine if status is completed
  const isStatusCompleted = (status: EquipmentRepairStatus): boolean => {
    const timestamp = getStatusTimestamp(status);
    return !!timestamp;
  };

  // Determine if status is current
  const isCurrentStatus = (status: EquipmentRepairStatus): boolean => {
    return equipmentStatus.current_status === status;
  };

  // Get color classes
  const getColorClasses = (status: EquipmentRepairStatus) => {
    const config = statusConfig[status];
    const isCompleted = isStatusCompleted(status);
    const isCurrent = isCurrentStatus(status);

    if (isCurrent) {
      return {
        bg: `bg-${config.color}-100`,
        border: `border-${config.color}-500`,
        text: `text-${config.color}-700`,
        icon: `text-${config.color}-600`,
        dot: `bg-${config.color}-500`,
      };
    }

    if (isCompleted) {
      return {
        bg: `bg-${config.color}-50`,
        border: `border-${config.color}-300`,
        text: `text-${config.color}-600`,
        icon: `text-${config.color}-500`,
        dot: `bg-${config.color}-400`,
      };
    }

    return {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-400',
      icon: 'text-gray-300',
      dot: 'bg-gray-200',
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Status Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {statusFlow.map((status, index) => {
            const config = statusConfig[status];
            const timestamp = getStatusTimestamp(status);
            const history = getHistoryForStatus(status);
            const isCompleted = isStatusCompleted(status);
            const isCurrent = isCurrentStatus(status);
            const colors = getColorClasses(status);

            return (
              <div key={status} className="relative flex items-start">
                {/* Status dot */}
                <div className="relative z-10 flex items-center justify-center">
                  <div
                    className={`w-12 h-12 rounded-full border-2 ${colors.border} ${colors.bg} flex items-center justify-center ${
                      isCurrent ? 'ring-4 ring-opacity-20 ring-' + config.color + '-500' : ''
                    }`}
                  >
                    <i className={`${config.icon} text-xl ${colors.icon}`}></i>
                  </div>
                </div>

                {/* Status content */}
                <div className="ml-4 flex-1 pb-6">
                  <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-semibold ${colors.text}`}>
                            {config.label}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        {timestamp && (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-gray-600">
                              {formatDate(timestamp)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getRelativeTime(timestamp)}
                            </p>
                          </div>
                        )}

                        {history?.changed_by && (
                          <p className="text-xs text-gray-500 mt-1">
                            Changed by: User #{history.changed_by.substring(0, 8)}
                          </p>
                        )}

                        {history?.notes && (
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-gray-200">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Note:</span> {history.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {isCompleted && (
                        <div className={`ml-2 ${colors.dot} rounded-full p-1`}>
                          <i className="ri-check-line text-white text-xs"></i>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Current Status:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {statusConfig[equipmentStatus.current_status].label}
            </span>
          </div>
          {equipmentStatus.updated_at && (
            <div className="text-gray-500">
              Last updated: {getRelativeTime(equipmentStatus.updated_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentStatusTimeline;
