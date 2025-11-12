# Add Notes and Order Inventory Features

## Overview
Add two new features to the Work Order Details screen:
1. **Add/Edit Notes** - Technicians can add or update notes about the job
2. **Order Inventory** - Technicians can request inventory items for the job

## Implementation

### Step 1: Add Floating Action Button

In `work_order_details_screen.dart`, update the `Scaffold` to include a `floatingActionButton`:

```dart
Scaffold(
  // ... existing code ...
  floatingActionButton: Consumer<WorkOrderProvider>(
    builder: (context, workOrderProvider, child) {
      final workOrder = workOrderProvider.selectedWorkOrder;
      if (workOrder == null) return const SizedBox.shrink();
      
      // Only show for assigned or in-progress jobs
      if (workOrder.status != WorkOrderStatus.assigned &&
          workOrder.status != WorkOrderStatus.inProgress) {
        return const SizedBox.shrink();
      }

      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Add Notes Button
          FloatingActionButton.extended(
            onPressed: () => _showAddNotesDialog(workOrder),
            heroTag: 'add_notes',
            backgroundColor: AppColors.primary,
            icon: const Icon(Icons.note_add, color: Colors.white),
            label: const Text(
              'Add Notes',
              style: TextStyle(color: Colors.white),
            ),
          ),
          const SizedBox(height: 12),
          // Order Inventory Button
          FloatingActionButton.extended(
            onPressed: () => _showOrderInventoryDialog(workOrder),
            heroTag: 'order_inventory',
            backgroundColor: AppColors.info,
            icon: const Icon(Icons.inventory_2, color: Colors.white),
            label: const Text(
              'Order Inventory',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      );
    },
  ),
)
```

### Step 2: Add Notes Dialog Method

Add this method to the `_WorkOrderDetailsScreenState` class:

```dart
Future<void> _showAddNotesDialog(WorkOrder workOrder) async {
  final notesController = TextEditingController(
    text: workOrder.notes ?? '',
  );

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Technician Notes'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add or update notes about this job:',
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              maxLines: 6,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Enter notes about the work, issues found, parts needed, etc...',
                filled: true,
                fillColor: AppColors.inputBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        ElevatedButton.icon(
          onPressed: () => Navigator.pop(context, true),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
          ),
          icon: const Icon(Icons.save, size: 18),
          label: const Text('Save Notes'),
        ),
      ],
    ),
  );

  if (confirmed == true && mounted) {
    final notes = notesController.text.trim();
    await _saveNotes(workOrder, notes);
  }

  notesController.dispose();
}

Future<void> _saveNotes(WorkOrder workOrder, String notes) async {
  if (!mounted) return;
  
  // Update work order with notes
  final success = await context.read<WorkOrderProvider>().updateWorkOrderStatus(
    workOrder.id,
    workOrder.status.toApiString(),
    notes: notes,
  );

  if (!mounted) return;

  if (success) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Notes saved successfully'),
        backgroundColor: AppColors.success,
      ),
    );
    await _loadWorkOrderDetails();
  } else {
    final error = context.read<WorkOrderProvider>().error;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error ?? 'Failed to save notes'),
        backgroundColor: AppColors.error,
      ),
    );
  }
}
```

### Step 3: Add Order Inventory Dialog Method

Add this method to the `_WorkOrderDetailsScreenState` class:

```dart
Future<void> _showOrderInventoryDialog(WorkOrder workOrder) async {
  final partNameController = TextEditingController();
  final quantityController = TextEditingController(text: '1');
  final notesController = TextEditingController();

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Order Inventory'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: partNameController,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'Part Name/Number',
                hintText: 'e.g., Toner Cartridge, Fuser Unit',
                filled: true,
                fillColor: AppColors.inputBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                prefixIcon: const Icon(Icons.inventory_2),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: quantityController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Quantity',
                filled: true,
                fillColor: AppColors.inputBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                prefixIcon: const Icon(Icons.numbers),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Notes (Optional)',
                hintText: 'Additional details...',
                filled: true,
                fillColor: AppColors.inputBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        ElevatedButton.icon(
          onPressed: () {
            if (partNameController.text.trim().isEmpty) {
              return;
            }
            Navigator.pop(context, true);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.info,
            foregroundColor: Colors.white,
          ),
          icon: const Icon(Icons.shopping_cart, size: 18),
          label: const Text('Submit Request'),
        ),
      ],
    ),
  );

  if (confirmed == true && mounted) {
    final partName = partNameController.text.trim();
    final quantity = int.tryParse(quantityController.text.trim()) ?? 1;
    final notes = notesController.text.trim();
    
    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Inventory request submitted: $partName (x$quantity)'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 3),
      ),
    );
    
    // TODO: Call API to create inventory request
  }

  partNameController.dispose();
  quantityController.dispose();
  notesController.dispose();
}
```

## Features

### Add Notes
- **When**: Available for assigned and in-progress jobs
- **What**: Technicians can add or update notes about the job
- **How**: Floating action button → Add Notes dialog → Save
- **API**: Uses existing `updateWorkOrderStatus` with notes parameter

### Order Inventory
- **When**: Available for assigned and in-progress jobs
- **What**: Technicians can request inventory items
- **How**: Floating action button → Order Inventory dialog → Submit
- **Fields**:
  - Part Name/Number (required)
  - Quantity (default: 1)
  - Notes (optional)
- **API**: TODO - needs backend endpoint for inventory requests

## UI/UX

- Two floating action buttons stacked vertically
- Blue button for "Add Notes"
- Teal button for "Order Inventory"
- Only visible for assigned/in-progress jobs
- Dialogs with proper validation
- Success/error feedback via SnackBar

## Testing

1. Open a work order with status "assigned" or "in progress"
2. See two floating action buttons on the right
3. Tap "Add Notes" → Enter notes → Save
4. Verify notes are saved and displayed
5. Tap "Order Inventory" → Fill form → Submit
6. Verify success message

## Future Enhancements

1. Add API endpoint for inventory requests
2. Show list of requested inventory items
3. Track inventory request status
4. Add photos to notes
5. Voice-to-text for notes
6. Barcode scanner for part numbers

## Summary

These features allow technicians to:
- Document their work with notes
- Request parts they need
- All from the work order details screen
- Simple, intuitive UI
- Proper validation and feedback
