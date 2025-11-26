import express from 'express';
import Equipment from '../api/models/Equipment.js';
import EquipmentBooking from '../api/models/EquipmentBooking.js';
import BookingLog from '../api/models/BookingLog.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all equipment (accessible to all authenticated users)
router.get('/equipment', authMiddleware, async (req, res) => {
  try {
    // Show all available equipment to all authenticated users
    const query = {
      eqm_status: { $ne: 'out_of_order' }
    };
    
    const equipment = await Equipment.find(query);
    console.log(`🔍 Found ${equipment.length} equipment items for all users`);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create equipment booking
router.post('/equipment-bookings', authMiddleware, async (req, res) => {
  try {
    const { equipment_id, eqm_booking_date, eqm_booking_time, eqm_booking_duration } = req.body;
    const user_id = req.user.User_ID;
    
    // Check if equipment exists and is available
    const equipment = await Equipment.findById(equipment_id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    if (equipment.eqm_status === 'out_of_order') {
      return res.status(400).json({ message: 'Equipment is out of order' });
    }
    
    // Check for conflicting bookings
    const bookingDate = new Date(eqm_booking_date);
    const conflictingBooking = await EquipmentBooking.findOne({
      equipment_id,
      eqm_booking_date: bookingDate,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (conflictingBooking) {
      return res.status(400).json({ message: 'Equipment is already booked for this date' });
    }
    
    const booking = new EquipmentBooking({
      eqm_booking_date: bookingDate,
      eqm_booking_time,
      eqm_booking_duration,
      equipment_id,
      user_id
    });
    
    await booking.save();
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating equipment booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's equipment bookings
router.get('/equipment-bookings/user', authMiddleware, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({ user_id: req.user.User_ID })
      .sort({ eqm_booking_date: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete (cancel) equipment booking
router.delete('/equipment-bookings/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await EquipmentBooking.findOne({
      _id: req.params.id,
      user_id: req.user.User_ID
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending bookings' });
    }
    
    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get equipment availability for calendar (specific equipment)
router.get('/equipment-bookings/availability/:equipmentId', authMiddleware, async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { year, month } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const bookings = await EquipmentBooking.find({
      equipment_id: equipmentId,
      eqm_booking_date: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] }
    }).select('eqm_booking_date eqm_booking_time eqm_booking_duration status');
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching equipment availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get all equipment (Admin only - no access restrictions)
router.get('/equipment/all', adminMiddleware, async (req, res) => {
  try {
    const equipment = await Equipment.find({});
    console.log(`🔍 Admin fetched ${equipment.length} equipment items (all)`);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching all equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all equipment bookings (Admin only)
router.get('/equipment-bookings/all', adminMiddleware, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find()
      .populate('equipment_id', 'eqm_name eqm_cat eqm_type')
      .populate({
        path: 'user_id',
        select: 'First_Name Last_Name Email_Address',
        model: 'USER',
        localField: 'user_id',
        foreignField: 'User_ID'
      })
      .sort({ eqm_booking_date: -1 });
    
    // Transform the data to match the frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      equipment: booking.equipment_id,
      user: booking.user_id
    }));
    
    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (Admin only) - Creates a log entry
router.patch('/equipment-bookings/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await EquipmentBooking.findById(req.params.id).populate('equipment_id');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const previousStatus = booking.status;
    const equipment = booking.equipment_id;
    
    // Create a booking log entry
    const bookingLog = new BookingLog({
      booking_id: booking._id,
      booking_type: 'equipment',
      equipment_id: equipment?._id,
      user_id: booking.user_id,
      admin_id: req.user.User_ID,
      action: status,
      previous_status: previousStatus,
      new_status: status,
      notes: notes || '',
      booking_details: {
        eqm_booking_date: booking.eqm_booking_date,
        eqm_booking_time: booking.eqm_booking_time,
        eqm_booking_duration: booking.eqm_booking_duration,
        equipment_name: equipment?.eqm_name,
        equipment_category: equipment?.eqm_cat,
        equipment_type: equipment?.eqm_type,
        location: equipment?.location
      }
    });
    
    await bookingLog.save();
    
    // Update the booking status
    booking.status = status;
    await booking.save();
    
    res.json({ 
      message: 'Booking status updated successfully',
      log_id: bookingLog._id
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create equipment (Admin only)
router.post('/equipment', adminMiddleware, async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update equipment (Admin only)
router.put('/equipment/:id', adminMiddleware, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete equipment (Admin only)
router.delete('/equipment/:id', adminMiddleware, async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single equipment by ID (for QR scanning)
router.get('/equipment/:id', authMiddleware, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking logs for a specific booking
router.get('/booking-logs/:bookingId', adminMiddleware, async (req, res) => {
  try {
    const logs = await BookingLog.find({ booking_id: req.params.bookingId })
      .sort({ createdAt: -1 });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching booking logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all booking logs (Admin only)
router.get('/booking-logs', adminMiddleware, async (req, res) => {
  try {
    const { equipment_id, action, limit = 100 } = req.query;
    
    const query = {};
    if (equipment_id) query.equipment_id = equipment_id;
    if (action) query.action = action;
    
    const logs = await BookingLog.find(query)
      .populate('equipment_id', 'eqm_name eqm_cat eqm_type location')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching booking logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark equipment as returned via QR scan (Admin only)
router.post('/equipment-return/:bookingId', adminMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;
    const booking = await EquipmentBooking.findById(req.params.bookingId).populate('equipment_id');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot return a cancelled booking' });
    }
    
    const previousStatus = booking.status;
    const equipment = booking.equipment_id;
    
    // Create a booking log entry for return
    const bookingLog = new BookingLog({
      booking_id: booking._id,
      booking_type: 'equipment',
      equipment_id: equipment?._id,
      user_id: booking.user_id,
      admin_id: req.user.User_ID,
      action: 'returned',
      previous_status: previousStatus,
      new_status: 'completed',
      notes: notes || 'Equipment returned via QR scan',
      booking_details: {
        eqm_booking_date: booking.eqm_booking_date,
        eqm_booking_time: booking.eqm_booking_time,
        eqm_booking_duration: booking.eqm_booking_duration,
        equipment_name: equipment?.eqm_name,
        equipment_category: equipment?.eqm_cat,
        equipment_type: equipment?.eqm_type,
        location: equipment?.location
      }
    });
    
    await bookingLog.save();
    
    // Update the booking status to completed
    booking.status = 'completed';
    await booking.save();
    
    res.json({ 
      message: 'Equipment return confirmed successfully',
      log_id: bookingLog._id,
      booking: booking
    });
  } catch (error) {
    console.error('Error processing equipment return:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active bookings for an equipment (for return scanning)
router.get('/equipment/:id/active-bookings', adminMiddleware, async (req, res) => {
  try {
    const bookings = await EquipmentBooking.find({
      equipment_id: req.params.id,
      status: { $in: ['pending', 'confirmed'] }
    }).populate({
      path: 'user_id',
      select: 'First_Name Last_Name Email_Address',
      model: 'USER',
      localField: 'user_id',
      foreignField: 'User_ID'
    }).sort({ eqm_booking_date: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching active bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;