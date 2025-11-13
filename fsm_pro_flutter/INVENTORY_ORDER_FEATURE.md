# Inventory Order Feature Implementation

## Overview
Added the ability for technicians to order inventory items directly from work order details screen in the Flutter mobile app. This feature matches the functionality already present in the React Native app (FSMProMobile).

## Changes Made

### 1. API Layer (`lib/data/services/api_service.dart`)
- **Added** `processInventoryOrder()` method to handle inventory order API calls
- **Endpoint**: `POST /api/inventory/order`
- **Parameters**: 
  - `workOrderId`: The work order to associate the order with
  - `items`: List of items with `item_id` and `quantity`

### 2. API Constants (`lib/core/constants/api_constants.dart`)
- **Added** `inventoryOrder` endpoint constant: `/inventory/order`

### 3. Repository Layer (`lib/data/repositories/inventory_repository.dart`)
- **Added** `processInventoryOrder()` method
- Returns `Result<Map<String, dynamic>>` with order summary
- Handles errors and wraps them in user-friendly messages

### 4. Provider Layer (`lib/providers/inventory_provider.dart`)
- **Added** `processInventoryOrder()` method
- Takes `workOrderId` and `selectedItems` map
- Automatically refreshes inventory after successful order to update stock levels
- Returns boolean indicating success/failure

### 5. UI Components

#### New Widget: `lib/ui/widgets/inventory/inventory_order_dialog.dart`
A full-featured dialog for browsing and ordering inventory:
- **Search functionality** - Filter items by name, part number, or description
- **Stock level indicators** - Color-coded stock status (adequate, low, critical, out of stock)
- **Quantity controls** - Increment/decrement buttons with validation
- **Real-time totals** - Shows total items and total value
- **Order processing** - Handles API calls with loading states and error handling
- **Responsive design** - Works on different screen sizes

#### Updated Screen: `lib/ui/screens/work_orders/work_order_details_screen.dart`
- **Added** inventory order card section
- **Displays** only for assigned or in-progress work orders
- **Shows** "Browse Inventory" button to open the order dialog
- **Refreshes** work order details after successful order

## User Flow

1. Technician views work order details
2. If work order is assigned or in progress, they see an "Order Inventory" card
3. Clicking "Browse Inventory" opens the inventory order dialog
4. Technician can:
   - Search for items
   - See stock levels and prices
   - Adjust quantities using +/- buttons
   - View total items and cost
5. Click "Place Order" to submit
6. Success message shown and dialog closes
7. Work order details refreshed to reflect the order

## Features

### Search & Filter
- Search across item name, part number, and description
- Real-time filtering as user types

### Stock Level Indicators
Items are color-coded based on stock levels:
- **Green (Adequate)**: Stock above 150% of minimum
- **Yellow (Low)**: Stock between minimum and 150% of minimum
- **Orange (Critical)**: Stock at or below minimum level
- **Red (Out of Stock)**: No stock available

### Validation
- Prevents ordering zero items
- Limits quantity to available stock
- Shows clear error messages
- Validates stock availability before processing

### Error Handling
- Network errors gracefully handled
- User-friendly error messages
- Automatic retry suggestions
- Session expiration handling

## API Integration

### Request Format
```json
{
  "work_order_id": "uuid",
  "items": [
    {
      "item_id": "uuid",
      "quantity": 2
    }
  ]
}
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "work_order_id": "uuid",
    "order_summary": {
      "total_items": 5,
      "items": [
        {
          "item_id": "uuid",
          "item_name": "Part Name",
          "quantity_ordered": 2,
          "previous_stock": 50,
          "new_stock": 48
        }
      ]
    },
    "message": "Order processed successfully"
  }
}
```

## Testing Checklist

- [ ] Can open inventory dialog from work order details
- [ ] Search filters inventory correctly
- [ ] Quantity controls work properly
- [ ] Cannot order more than available stock
- [ ] Total price calculates correctly
- [ ] Order submission works
- [ ] Success message displays
- [ ] Dialog closes after successful order
- [ ] Work order refreshes after order
- [ ] Error messages display properly
- [ ] Loading states show during API calls
- [ ] Stock levels update after order

## Future Enhancements

Potential improvements for future iterations:
1. Order history view in work order details
2. Ability to cancel/modify pending orders
3. Barcode scanning for quick item selection
4. Favorites/frequently ordered items
5. Bulk import from CSV
6. Order templates for common repairs
7. Push notifications when orders are fulfilled
8. Integration with supplier ordering system

## Notes

- This feature is only available for assigned and in-progress work orders
- The dialog uses the inventory provider for state management
- Stock levels are automatically refreshed after placing an order
- The implementation follows the existing pattern from the React Native app (FSMProMobile)
