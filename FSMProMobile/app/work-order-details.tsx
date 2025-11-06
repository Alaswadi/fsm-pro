import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Job, InventoryItem } from '../src/types';
import { apiService } from '../src/services/api';
import { ImagePickerButton } from '../src/components/ImagePickerButton';
import { Toast } from '../src/components/Toast';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';

export default function WorkOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Job['status']>('scheduled');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<{[key: string]: number}>({});
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Ordered equipment state
  const [orderedEquipment, setOrderedEquipment] = useState<any[]>([]);
  const [orderedEquipmentSummary, setOrderedEquipmentSummary] = useState<any>(null);
  const [isLoadingOrderedEquipment, setIsLoadingOrderedEquipment] = useState(false);
  
  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  // Workshop status state
  const [showWorkshopStatusModal, setShowWorkshopStatusModal] = useState(false);
  const [equipmentStatus, setEquipmentStatus] = useState<any>(null);
  const [equipmentStatusHistory, setEquipmentStatusHistory] = useState<any[]>([]);
  const [selectedEquipmentStatus, setSelectedEquipmentStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingEquipmentStatus, setIsUpdatingEquipmentStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobDetails();
    }
  }, [id]);

  useEffect(() => {
    if (job?.location_type === 'workshop') {
      loadEquipmentStatus();
    }
  }, [job]);

  const loadJobDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getJob(id);
      
      if (response.success && response.data) {
        setJob(response.data);
        setNotes(response.data.notes || '');
        setSelectedStatus(response.data.status);
        // Load ordered equipment after job details are loaded
        loadOrderedEquipment();
      } else {
        Alert.alert('Error', response.error || 'Failed to load job details');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load job details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrderedEquipment = async () => {
    if (!id) return;
    
    try {
      setIsLoadingOrderedEquipment(true);
      const response = await apiService.getWorkOrderInventoryOrders(id);
      
      if (response.success && response.data) {
        setOrderedEquipment(response.data.orders || []);
        setOrderedEquipmentSummary(response.data.summary || null);
      } else {
        console.log('No ordered equipment found or error:', response.error);
        setOrderedEquipment([]);
        setOrderedEquipmentSummary(null);
      }
    } catch (error) {
      console.error('Failed to load ordered equipment:', error);
      setOrderedEquipment([]);
      setOrderedEquipmentSummary(null);
    } finally {
      setIsLoadingOrderedEquipment(false);
    }
  };

  const loadEquipmentStatus = async () => {
    if (!id) return;
    
    try {
      const statusResponse = await apiService.getEquipmentStatus(id);
      if (statusResponse.success && statusResponse.data) {
        setEquipmentStatus(statusResponse.data);
        setSelectedEquipmentStatus(statusResponse.data.current_status);
      }

      const historyResponse = await apiService.getEquipmentStatusHistory(id);
      if (historyResponse.success && historyResponse.data) {
        setEquipmentStatusHistory(historyResponse.data);
      }
    } catch (error) {
      console.error('Failed to load equipment status:', error);
    }
  };

  const handleEquipmentStatusUpdate = async () => {
    if (!id || !selectedEquipmentStatus) return;
    
    setIsUpdatingEquipmentStatus(true);
    try {
      const response = await apiService.updateEquipmentStatus(id, selectedEquipmentStatus, statusNotes);
      
      if (response.success && response.data) {
        setEquipmentStatus(response.data);
        setShowWorkshopStatusModal(false);
        setStatusNotes('');
        showToast('Equipment status updated successfully', 'success');
        await loadEquipmentStatus();
        await loadJobDetails();
      } else {
        Alert.alert('Error', response.error || 'Failed to update equipment status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update equipment status');
    } finally {
      setIsUpdatingEquipmentStatus(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Job['status']) => {
    if (!job) return;
    
    setIsUpdating(true);
    try {
      const response = await apiService.updateJobStatus(job.id, newStatus, notes);
      
      if (response.success && response.data) {
        setJob(response.data);
        setShowStatusModal(false);
        Alert.alert('Success', 'Job status updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update job status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update job status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    if (!job) return;
    
    setIsUpdating(true);
    try {
      const response = await apiService.updateJob(job.id, { notes });
      
      if (response.success && response.data) {
        setJob(response.data);
        setShowNotesModal(false);
        Alert.alert('Success', 'Notes updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update notes');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update notes');
    } finally {
      setIsUpdating(false);
    }
  };

  const loadInventory = async () => {
    try {
      setIsLoadingInventory(true);
      const response = await apiService.getInventory();
      
      if (response.success && response.data) {
        // Extract inventory_items array from the response data (same as inventory tab)
        const inventoryItems = Array.isArray(response.data) ? response.data : (response.data as any).inventory_items || [];
        setInventory(inventoryItems);
      } else {
        setInventory([]); // Reset to empty array on error
        Alert.alert('Error', response.error || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory([]); // Reset to empty array on error
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const handleInventoryQuantityChange = (itemId: string, quantity: number) => {
    setSelectedInventoryItems(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    console.log('🍞 Showing toast:', { message, type, visible: true });
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    console.log('🍞 Hiding toast');
    setToastVisible(false);
  };

  const handleOrderInventory = async () => {
    console.log('🛒 Starting order process...');
    
    // Clear any previous errors
    setOrderError(null);
    
    // Prepare items to order
    const itemsToOrder = Object.entries(selectedInventoryItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = inventory.find(inv => inv.id === itemId);
        return { item_id: itemId, quantity, item };
      });

    console.log('📦 Items to order:', itemsToOrder);

    if (itemsToOrder.length === 0) {
      showToast('Please select at least one item to order.', 'error');
      return;
    }

    // Validate inventory availability
    const insufficientStockItems = itemsToOrder.filter(orderItem => {
      const inventoryItem = orderItem.item;
      return inventoryItem && (inventoryItem.current_stock || 0) < orderItem.quantity;
    });

    if (insufficientStockItems.length > 0) {
      const itemNames = insufficientStockItems.map(item => item.item?.name).join(', ');
      showToast(`Insufficient stock for: ${itemNames}. Please adjust quantities.`, 'error');
      return;
    }

    // Start order processing
    setIsProcessingOrder(true);
    console.log('⏳ Processing order...');

    try {
      // Process the order
      const orderData = {
        work_order_id: id,
        items: itemsToOrder.map(({ item_id, quantity }) => ({ item_id, quantity }))
      };

      console.log('📤 Sending order data:', orderData);
      const response = await apiService.processInventoryOrder(orderData);
      console.log('📥 Received response:', response);

      if (response.success && response.data) {
        console.log('✅ Order successful, updating inventory...');
        
        // Update local inventory state with new stock levels
        const updatedInventory = inventory.map(item => {
          const orderedItem = itemsToOrder.find(orderItem => orderItem.item_id === item.id);
          if (orderedItem) {
            return {
              ...item,
              current_stock: item.current_stock - orderedItem.quantity
            };
          }
          return item;
        });
        setInventory(updatedInventory);

        // Show success message with order details
        const totalItems = response.data.order_summary?.total_items || itemsToOrder.length;
        const orderedItems = response.data.order_summary?.items || [];
        
        // Calculate total value from ordered items
        let totalValue = 0;
        itemsToOrder.forEach((orderItem) => {
          if (orderItem.item) {
            totalValue += orderItem.item.unit_price * orderItem.quantity;
          }
        });
        
        console.log('💰 Calculated total value:', totalValue);
        console.log('📊 Total items:', totalItems);
        
        // Show success toast
        showToast(`✅ Order Placed Successfully! ${totalItems} item(s) ordered for $${totalValue.toFixed(2)}. Stock levels updated.`, 'success');
        
        // Refresh ordered equipment to show the new order
        loadOrderedEquipment();
        
        // Close modal and reset selections after a short delay
        setTimeout(() => {
          console.log('🔄 Closing modal and resetting selections...');
          setShowInventoryModal(false);
          setSelectedInventoryItems({});
        }, 1500); // Give time to read the toast
        
      } else {
        console.error('❌ Order failed - response not successful:', response);
        throw new Error(response.message || 'Failed to process order - invalid response');
      }
    } catch (error) {
      console.error('💥 Order processing error:', error);
      
      // Set error state for display
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setOrderError(errorMessage);
      
      // Show error toast
      showToast(`❌ Order Failed: ${errorMessage}. Please try again.`, 'error');
    } finally {
      setIsProcessingOrder(false);
      console.log('🏁 Order process completed');
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'ordered': return '#3B82F6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending_intake': return '#9CA3AF';
      case 'in_transit': return '#3B82F6';
      case 'received': return '#3B82F6';
      case 'in_repair': return '#F59E0B';
      case 'repair_completed': return '#10B981';
      case 'ready_for_pickup': return '#10B981';
      case 'out_for_delivery': return '#8B5CF6';
      case 'returned': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getValidStatusTransitions = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      'pending_intake': ['in_transit', 'received'],
      'in_transit': ['received'],
      'received': ['in_repair'],
      'in_repair': ['repair_completed', 'received'],
      'repair_completed': ['ready_for_pickup', 'out_for_delivery'],
      'ready_for_pickup': ['returned'],
      'out_for_delivery': ['returned'],
      'returned': []
    };
    return transitions[currentStatus] || [];
  };

  const getPriorityColor = (priority: Job['priority']) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusOptions}>
            {(['scheduled', 'in_progress', 'completed', 'cancelled'] as Job['status'][]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.statusOptionSelected
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <Text style={[
                  styles.statusOptionText,
                  selectedStatus === status && styles.statusOptionTextSelected
                ]}>
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
              onPress={() => handleStatusUpdate(selectedStatus)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderNotesModal = () => (
    <Modal
      visible={showNotesModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNotesModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Notes</Text>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add your notes here..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowNotesModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
              onPress={handleNotesUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderWorkshopStatusModal = () => {
    const validTransitions = equipmentStatus 
      ? getValidStatusTransitions(equipmentStatus.current_status)
      : [];

    return (
      <Modal
        visible={showWorkshopStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkshopStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Equipment Status</Text>
              <TouchableOpacity onPress={() => setShowWorkshopStatusModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.currentStatusSection}>
              <Text style={styles.currentStatusLabel}>Current Status:</Text>
              <View style={[
                styles.currentStatusBadge,
                { backgroundColor: getEquipmentStatusColor(equipmentStatus?.current_status || '') }
              ]}>
                <Text style={styles.currentStatusText}>
                  {equipmentStatus?.current_status?.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.selectStatusLabel}>Select New Status:</Text>
            <View style={styles.statusOptions}>
              {validTransitions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedEquipmentStatus === status && styles.statusOptionSelected
                  ]}
                  onPress={() => setSelectedEquipmentStatus(status)}
                >
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getEquipmentStatusColor(status) }
                  ]} />
                  <Text style={[
                    styles.statusOptionText,
                    selectedEquipmentStatus === status && styles.statusOptionTextSelected
                  ]}>
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.notesLabel}>Notes (optional):</Text>
            <TextInput
              style={styles.notesInput}
              value={statusNotes}
              onChangeText={setStatusNotes}
              placeholder="Add notes about this status change..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowWorkshopStatusModal(false);
                  setStatusNotes('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.updateButton,
                  (isUpdatingEquipmentStatus || !selectedEquipmentStatus) && styles.updateButtonDisabled
                ]}
                onPress={handleEquipmentStatusUpdate}
                disabled={isUpdatingEquipmentStatus || !selectedEquipmentStatus}
              >
                {isUpdatingEquipmentStatus ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Status</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderInventoryModal = () => (
    <Modal
      visible={showInventoryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInventoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Inventory</Text>
            <TouchableOpacity onPress={() => setShowInventoryModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {isLoadingInventory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
              <ThemedText type="body" style={styles.loadingText}>Loading inventory...</ThemedText>
            </View>
          ) : (
            <ScrollView style={styles.inventoryList}>
              {Array.isArray(inventory) && inventory.length > 0 ? (
                inventory.map((item) => (
                  <View key={item.id} style={styles.inventoryItem}>
                    <View style={styles.inventoryItemInfo}>
                      <Text style={styles.inventoryItemName}>{item.name}</Text>
                      <Text style={styles.inventoryItemDescription}>{item.description}</Text>
                      <Text style={styles.inventoryItemStock}>Stock: {item.current_stock}</Text>
                      <Text style={styles.inventoryItemPrice}>${Number(item.unit_price || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => {
                          const current = selectedInventoryItems[item.id] || 0;
                          if (current > 0) {
                            handleInventoryQuantityChange(item.id, current - 1);
                          }
                        }}
                      >
                        <Ionicons name="remove" size={20} color="#6B7280" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>
                        {selectedInventoryItems[item.id] || 0}
                      </Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => {
                          const current = selectedInventoryItems[item.id] || 0;
                          if (current < item.current_stock) {
                            handleInventoryQuantityChange(item.id, current + 1);
                          }
                        }}
                      >
                        <Ionicons name="add" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyInventoryContainer}>
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyInventoryText}>No inventory items available</Text>
                  <Text style={styles.emptyInventorySubtext}>
                    Please check back later or contact your administrator
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          
          {orderError && (
            <View style={styles.orderErrorContainer}>
              <Text style={styles.orderErrorText}>{orderError}</Text>
            </View>
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowInventoryModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.updateButton,
                isProcessingOrder && styles.updateButtonDisabled
              ]}
              onPress={handleOrderInventory}
              disabled={isProcessingOrder}
            >
              {isProcessingOrder ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.updateButtonText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.updateButtonText}>Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.DEFAULT} />
        <ThemedText type="body" style={styles.loadingText}>Loading job details...</ThemedText>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Order Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
              <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
              <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{job.customer_name || 'Not assigned'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Scheduled:</Text>
            <Text style={styles.detailValue}>{formatDate(job.scheduled_date)}</Text>
          </View>
          
          {job.due_date && (
            <View style={styles.detailRow}>
              <Ionicons name="alarm-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Due:</Text>
              <Text style={styles.detailValue}>{formatDate(job.due_date)}</Text>
            </View>
          )}
          
          {job.estimated_duration && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{job.estimated_duration} hours</Text>
            </View>
          )}
          
          {job.equipment_info && (
            <View style={styles.detailRow}>
              <Ionicons name="construct-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Equipment:</Text>
              <Text style={styles.detailValue}>{job.equipment_info}</Text>
            </View>
          )}
        </View>

        {job.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{job.notes}</Text>
          </View>
        )}

        {job.location_type === 'workshop' && equipmentStatus && (
          <View style={styles.workshopStatusSection}>
            <Text style={styles.sectionTitle}>Equipment Status</Text>
            
            <View style={styles.currentEquipmentStatus}>
              <View style={[
                styles.equipmentStatusBadge,
                { backgroundColor: getEquipmentStatusColor(equipmentStatus.current_status) }
              ]}>
                <Ionicons name="construct" size={16} color="white" />
                <Text style={styles.equipmentStatusText}>
                  {equipmentStatus.current_status.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {equipmentStatusHistory.length > 0 && (
              <View style={styles.statusTimeline}>
                <Text style={styles.timelineTitle}>Status History:</Text>
                {equipmentStatusHistory.slice(0, 3).map((history, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={[
                      styles.timelineDot,
                      { backgroundColor: getEquipmentStatusColor(history.to_status) }
                    ]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStatus}>
                        {history.to_status.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {new Date(history.changed_at).toLocaleString()}
                      </Text>
                      {history.notes && (
                        <Text style={styles.timelineNotes}>{history.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => setShowWorkshopStatusModal(true)}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text style={styles.updateStatusButtonText}>Update Equipment Status</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Job Photos</Text>
          <ImagePickerButton
            uploadType="job-attachment"
            buttonText="Add Job Photo"
            onImageSelected={(url) => {
              Alert.alert('Success', 'Photo uploaded successfully');
            }}
            onError={(error) => {
              Alert.alert('Upload Error', error);
            }}
          />
        </View>

        <View style={styles.inventorySection}>
          <Text style={styles.sectionTitle}>Order Inventory</Text>
          <Text style={styles.inventoryDescription}>
            Order parts and materials needed for this work order
          </Text>
          <TouchableOpacity
            style={styles.inventoryButton}
            onPress={() => {
              loadInventory();
              setShowInventoryModal(true);
            }}
          >
            <Ionicons name="cube-outline" size={24} color="#ea2a33" />
            <Text style={styles.inventoryButtonText}>Browse Inventory</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.orderedEquipmentSection}>
          <Text style={styles.sectionTitle}>Ordered Equipment</Text>
          <Text style={styles.inventoryDescription}>
            Equipment and parts ordered for this work order
          </Text>
          
          {isLoadingOrderedEquipment ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Theme.colors.primary.DEFAULT} />
              <ThemedText type="body" style={styles.loadingText}>Loading ordered equipment...</ThemedText>
            </View>
          ) : orderedEquipment.length > 0 ? (
            <>
              {orderedEquipmentSummary && (
                <View style={styles.orderSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Items:</Text>
                    <Text style={styles.summaryValue}>{orderedEquipmentSummary.total_items}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Value:</Text>
                    <Text style={styles.summaryValue}>${Number(orderedEquipmentSummary.total_value || 0).toFixed(2)}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.orderedItemsList}>
                {orderedEquipment.map((order, index) => (
                  <View key={index} style={styles.orderedItem}>
                    <View style={styles.orderedItemHeader}>
                      <View style={styles.orderedItemInfo}>
                        <Text style={styles.orderedItemName}>{order.part_name}</Text>
                        <Text style={styles.orderedItemDetails}>
                          Qty: {order.quantity} × ${Number(order.unit_price || 0).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.orderedItemTotal}>
                        ${((order.quantity || 0) * Number(order.unit_price || 0)).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.orderedItemMeta}>
                      <Text style={styles.orderedItemMetaText}>
                        Ordered by {order.ordered_by_name} on {new Date(order.ordered_at).toLocaleDateString()}
                      </Text>
                      <View style={[styles.orderStatusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                        <Text style={styles.orderStatusBadgeText}>{order.status}</Text>
                      </View>
                    </View>
                    {order.notes && (
                      <Text style={styles.orderedItemNotes}>Note: {order.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No equipment ordered yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Use the "Browse Inventory" button above to order parts and materials
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowStatusModal(true)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#ea2a33" />
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNotesModal(true)}
          >
            <Ionicons name="create-outline" size={24} color="#ea2a33" />
            <Text style={styles.actionButtonText}>Edit Notes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderStatusModal()}
      {renderNotesModal()}
      {renderWorkshopStatusModal()}
      {renderInventoryModal()}
      
      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
        duration={3000}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
  },
  loadingText: {
    marginTop: Theme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
  },
  errorText: {
    color: Theme.colors.error.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  backButton: {
    padding: Theme.spacing.sm,
    marginRight: Theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  descriptionSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginLeft: 8,
  },
  notesSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notesText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  photoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ea2a33',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  statusOptions: {
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  statusOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#ea2a33',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusOptionTextSelected: {
    color: '#ea2a33',
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 24,
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#ea2a33',
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  inventorySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inventoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inventoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#ea2a33',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  inventoryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ea2a33',
  },
  inventoryList: {
    flex: 1,
    marginVertical: 16,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inventoryItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  inventoryItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  inventoryItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  inventoryItemStock: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  inventoryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ea2a33',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quantityButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'center',
  },
  emptyInventoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyInventoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyInventorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  orderErrorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  orderErrorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Ordered Equipment Styles
  orderedEquipmentSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  orderedItemsList: {
    marginTop: 8,
  },
  orderedItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ea2a33',
  },
  orderedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderedItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderedItemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderedItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea2a33',
  },
  orderedItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderedItemMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  orderStatusBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderedItemNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Workshop Status Styles
  workshopStatusSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentEquipmentStatus: {
    marginBottom: 16,
  },
  equipmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  equipmentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  statusTimeline: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  updateStatusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  currentStatusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  currentStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 12,
  },
  currentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  selectStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
});
