import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { workshopService } from '../services/workshopService';
import { apiService } from '../services/api';
import type { Job } from '../types';
import type { EquipmentRepairStatus } from '../types/workshop';

interface ReturnLogisticsProps {
  job: Job;
  currentStatus: EquipmentRepairStatus;
  onSuccess: () => void;
}

interface Technician {
  id: string;
  employee_id: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

const ReturnLogistics: React.FC<ReturnLogisticsProps> = ({
  job,
  currentStatus,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  
  // Schedule Delivery State
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTechnicianId, setDeliveryTechnicianId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  
  // Mark as Returned State
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [customerSignature, setCustomerSignature] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Load technicians when delivery form is shown
  useEffect(() => {
    if (showDeliveryForm && technicians.length === 0) {
      loadTechnicians();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeliveryForm]);

  const loadTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const response = await apiService.getTechnicians();
      if (response.success && response.data) {
        setTechnicians(response.data);
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
      toast.error('Failed to load technicians');
    } finally {
      setLoadingTechnicians(false);
    }
  };

  // Handle Mark Ready for Pickup
  const handleMarkReadyForPickup = async () => {
    try {
      setLoading(true);
      const response = await workshopService.markReadyForPickup(job.id, {
        notify_customer: true,
      });

      if (response.success) {
        toast.success('Equipment marked as ready for pickup. Customer has been notified.');
        onSuccess();
      } else {
        toast.error(response.error || 'Failed to mark equipment as ready');
      }
    } catch (error: any) {
      console.error('Error marking ready for pickup:', error);
      toast.error(error.message || 'Failed to mark equipment as ready');
    } finally {
      setLoading(false);
    }
  };

  // Handle Schedule Delivery
  const handleScheduleDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryDate || !deliveryTechnicianId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await workshopService.scheduleDelivery(job.id, {
        delivery_date: deliveryDate,
        delivery_technician_id: deliveryTechnicianId,
        delivery_fee: deliveryFee ? parseFloat(deliveryFee) : undefined,
      });

      if (response.success) {
        toast.success('Delivery scheduled successfully');
        setShowDeliveryForm(false);
        setDeliveryDate('');
        setDeliveryTechnicianId('');
        setDeliveryFee('');
        onSuccess();
      } else {
        toast.error(response.error || 'Failed to schedule delivery');
      }
    } catch (error: any) {
      console.error('Error scheduling delivery:', error);
      toast.error(error.message || 'Failed to schedule delivery');
    } finally {
      setLoading(false);
    }
  };

  // Signature Canvas Functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setCustomerSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCustomerSignature('');
  };

  // Handle Mark as Returned
  const handleMarkReturned = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerSignature) {
      toast.error('Customer signature is required');
      return;
    }

    try {
      setLoading(true);
      const response = await workshopService.markEquipmentReturned(job.id, {
        customer_signature: customerSignature,
        return_notes: returnNotes.trim() || undefined,
      });

      if (response.success) {
        toast.success('Equipment marked as returned successfully');
        setShowReturnForm(false);
        setCustomerSignature('');
        setReturnNotes('');
        onSuccess();
      } else {
        toast.error(response.error || 'Failed to mark equipment as returned');
      }
    } catch (error: any) {
      console.error('Error marking equipment as returned:', error);
      toast.error(error.message || 'Failed to mark equipment as returned');
    } finally {
      setLoading(false);
    }
  };

  // Determine what actions are available based on current status
  const canMarkReadyForPickup = currentStatus === 'repair_completed';
  const canScheduleDelivery = currentStatus === 'repair_completed';
  const canMarkReturned = currentStatus === 'ready_for_pickup' || currentStatus === 'out_for_delivery';
  const isReturned = currentStatus === 'returned';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Return Logistics</h3>
        {isReturned && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
            <i className="ri-check-double-line mr-1"></i>
            Equipment Returned
          </span>
        )}
      </div>

      {/* Display delivery schedule if set */}
      {job.delivery_scheduled_date && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <i className="ri-truck-line text-blue-600 text-xl mr-3 mt-0.5"></i>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Delivery Scheduled</p>
              <p className="text-sm text-blue-700 mt-1">
                {new Date(job.delivery_scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {job.technician && (
                <p className="text-sm text-blue-600 mt-1">
                  Technician: {job.technician.user?.full_name || 'Assigned'}
                </p>
              )}
              {job.pickup_delivery_fee && job.pickup_delivery_fee > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Delivery Fee: ${job.pickup_delivery_fee.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Display return confirmation if returned */}
      {isReturned && job.equipment_status?.returned_at && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <i className="ri-check-double-line text-green-600 text-xl mr-3 mt-0.5"></i>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Equipment Returned</p>
              <p className="text-sm text-green-700 mt-1">
                Returned on {new Date(job.equipment_status.returned_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isReturned && (
        <div className="flex flex-wrap gap-3">
          {/* Mark Ready for Pickup Button */}
          {canMarkReadyForPickup && !showDeliveryForm && !showReturnForm && (
            <button
              onClick={handleMarkReadyForPickup}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <i className="ri-hand-heart-line mr-2"></i>
                  Mark Ready for Pickup
                </>
              )}
            </button>
          )}

          {/* Schedule Delivery Button */}
          {canScheduleDelivery && !showDeliveryForm && !showReturnForm && (
            <button
              onClick={() => setShowDeliveryForm(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <i className="ri-truck-line mr-2"></i>
              Schedule Delivery
            </button>
          )}

          {/* Mark as Returned Button */}
          {canMarkReturned && !showDeliveryForm && !showReturnForm && (
            <button
              onClick={() => setShowReturnForm(true)}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <i className="ri-check-double-line mr-2"></i>
              Mark as Returned
            </button>
          )}
        </div>
      )}

      {/* Schedule Delivery Form */}
      {showDeliveryForm && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <form onSubmit={handleScheduleDelivery} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Schedule Delivery</h4>
              <button
                type="button"
                onClick={() => setShowDeliveryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Delivery Date */}
            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Technician Selector */}
            <div>
              <label htmlFor="deliveryTechnician" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Technician <span className="text-red-500">*</span>
              </label>
              {loadingTechnicians ? (
                <div className="text-sm text-gray-500">Loading technicians...</div>
              ) : (
                <select
                  id="deliveryTechnician"
                  value={deliveryTechnicianId}
                  onChange={(e) => setDeliveryTechnicianId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a technician</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.user?.full_name || 'Unknown'} (#{tech.employee_id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Delivery Fee */}
            <div>
              <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="deliveryFee"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeliveryForm(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !deliveryDate || !deliveryTechnicianId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line mr-2"></i>
                    Schedule Delivery
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mark as Returned Form */}
      {showReturnForm && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <form onSubmit={handleMarkReturned} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Mark Equipment as Returned</h4>
              <button
                type="button"
                onClick={() => {
                  setShowReturnForm(false);
                  clearSignature();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Customer Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Signature <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">Sign above using your mouse or touchscreen</p>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Signature
                </button>
              </div>
            </div>

            {/* Return Notes */}
            <div>
              <label htmlFor="returnNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Return Notes (Optional)
              </label>
              <textarea
                id="returnNotes"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about the equipment return..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReturnForm(false);
                  clearSignature();
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !customerSignature}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-check-double-line mr-2"></i>
                    Confirm Return
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info message when no actions available */}
      {!canMarkReadyForPickup && !canScheduleDelivery && !canMarkReturned && !isReturned && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <i className="ri-information-line text-yellow-600 text-xl mr-3 mt-0.5"></i>
            <div>
              <p className="text-sm font-medium text-yellow-800">No actions available</p>
              <p className="text-sm text-yellow-700 mt-1">
                Return logistics actions will be available once the repair is completed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnLogistics;
