import express from 'express';
import Venue from '../api/models/Venue.js';
import VenueBooking from '../api/models/VenueBooking.js';
import BookingLog from '../api/models/BookingLog.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all venues (accessible to all authenticated users)
router.get('/venues', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Venues route called');
    console.log('🔍 User:', req.user ? 'exists' : 'undefined');
    
    // Show all available venues to all authenticated users
    const query = {
      venue_status: { $ne: 'out_of_order' }
    };
    
    console.log('🔍 Query:', query);
    const venues = await Venue.find(query);
    console.log('🔍 Found venues:', venues.length, 'for all users');
    res.json(venues);
  } catch (error) {
    console.error('❌ Error fetching venues:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create venue booking
router.post('/venue-bookings', authMiddleware, async (req, res) => {
  try {
    const { venue_id, booking_date, booking_time, booking_duration, booking_desc, total_pay } = req.body;
    const user_id = req.user.User_ID;
    
    // Check if venue exists and is available
    const venue = await Venue.findById(venue_id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    if (venue.venue_status === 'out_of_order') {
      return res.status(400).json({ message: 'Venue is out of order' });
    }
    
    // Check for conflicting bookings
    const bookingDateObj = new Date(booking_date);
    const conflictingBooking = await VenueBooking.findOne({
      venue_id,
      booking_date: bookingDateObj,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (conflictingBooking) {
      return res.status(400).json({ message: 'Venue is already booked for this date' });
    }
    
    const booking = new VenueBooking({
      booking_date: bookingDateObj,
      booking_time,
      booking_duration,
      booking_desc,
      total_pay,
      venue_id,
      user_id
    });
    
    await booking.save();
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating venue booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's venue bookings
router.get('/venue-bookings/user', authMiddleware, async (req, res) => {
  try {
    const bookings = await VenueBooking.find({ user_id: req.user.User_ID })
      .sort({ booking_date: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user venue bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete (cancel) venue booking
router.delete('/venue-bookings/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await VenueBooking.findOne({
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
    console.error('Error cancelling venue booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get venue availability for calendar (specific venue)
router.get('/venue-bookings/availability/:venueId', authMiddleware, async (req, res) => {
  try {
    const { venueId } = req.params;
    const { year, month } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const bookings = await VenueBooking.find({
      venue_id: venueId,
      booking_date: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] }
    }).select('booking_date booking_time booking_duration status');
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching venue availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
// Get all venues (Admin only - no access restrictions)
router.get('/venues/all', adminMiddleware, async (req, res) => {
  try {
    const venues = await Venue.find({});
    console.log(`🔍 Admin fetched ${venues.length} venues (all)`);
    res.json(venues);
  } catch (error) {
    console.error('Error fetching all venues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all venue bookings (Admin only)
router.get('/venue-bookings/all', adminMiddleware, async (req, res) => {
  try {
    const bookings = await VenueBooking.find()
      .populate('venue_id', 'venue_unit venue_type venue_capacity venue_hourly_rate')
      .populate({
        path: 'user_id',
        select: 'First_Name Last_Name Email_Address',
        model: 'USER',
        localField: 'user_id',
        foreignField: 'User_ID'
      })
      .sort({ booking_date: -1 });
    
    // Transform the data to match the frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking.toObject(),
      venue: booking.venue_id,
      user: booking.user_id
    }));
    
    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching all venue bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update venue booking status (Admin only) - Creates a log entry
router.patch('/venue-bookings/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const booking = await VenueBooking.findById(req.params.id).populate('venue_id');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const previousStatus = booking.status;
    const venue = booking.venue_id;
    
    // Create a booking log entry
    const bookingLog = new BookingLog({
      booking_id: booking._id,
      booking_type: 'venue',
      venue_id: venue?._id,
      user_id: booking.user_id,
      admin_id: req.user.User_ID,
      action: status,
      previous_status: previousStatus,
      new_status: status,
      notes: notes || '',
      status_changed_at: new Date(),
      booking_details: {
        venue_booking_date: booking.booking_date,
        venue_booking_time: booking.booking_time,
        venue_booking_duration: booking.booking_duration,
        venue_unit: venue?.venue_unit,
        venue_type: venue?.venue_type,
        venue_capacity: venue?.venue_capacity,
        booking_desc: booking.booking_desc,
        total_pay: booking.total_pay
      }
    });
    
    await bookingLog.save();
    
    // Update the booking status
    booking.status = status;
    await booking.save();
    
    res.json({ 
      message: 'Venue booking status updated successfully',
      log_id: bookingLog._id
    });
  } catch (error) {
    console.error('Error updating venue booking status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create venue (Admin only)
router.post('/venues', adminMiddleware, async (req, res) => {
  try {
    console.log('🔍 Creating venue with data:', req.body);
    console.log('🔍 User creating venue:', req.user?.User_ID);
    
    // Validate required fields
    const { venue_type, venue_unit, venue_capacity, venue_hourly_rate } = req.body;
    if (!venue_type || !venue_unit || !venue_capacity || venue_hourly_rate === undefined) {
      console.log('❌ Missing required fields:', { venue_type, venue_unit, venue_capacity, venue_hourly_rate });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['venue_type', 'venue_unit', 'venue_capacity', 'venue_hourly_rate']
      });
    }

    const venue = new Venue(req.body);
    console.log('🔍 Venue model created, saving...');
    await venue.save();
    console.log('✅ Venue saved successfully:', venue._id);
    res.status(201).json(venue);
  } catch (error) {
    console.error('❌ Error creating venue:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update venue (Admin only)
router.put('/venues/:id', adminMiddleware, async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete venue (Admin only)
router.delete('/venues/:id', adminMiddleware, async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pricing Management Routes (Admin only)

// Get all venues with pricing info (Admin only)
router.get('/venues/pricing', adminMiddleware, async (req, res) => {
  try {
    const venues = await Venue.find({})
      .select('venue_unit venue_type venue_capacity venue_hourly_rate venue_status')
      .sort({ venue_unit: 1 });
    
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venue pricing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update venue pricing (Admin only)
router.patch('/venues/:id/pricing', adminMiddleware, async (req, res) => {
  try {
    const { venue_hourly_rate } = req.body;
    
    if (venue_hourly_rate < 0) {
      return res.status(400).json({ message: 'Hourly rate cannot be negative' });
    }
    
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { venue_hourly_rate, updatedAt: new Date() },
      { new: true }
    ).select('venue_unit venue_type venue_hourly_rate updatedAt');
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ 
      message: 'Venue pricing updated successfully',
      venue
    });
  } catch (error) {
    console.error('Error updating venue pricing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update pricing (Admin only)
router.patch('/venues/pricing/bulk', adminMiddleware, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { venue_id, venue_hourly_rate }
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { venue_id, venue_hourly_rate } = update;
      
      if (venue_hourly_rate < 0) {
        results.push({ venue_id, error: 'Hourly rate cannot be negative' });
        continue;
      }
      
      try {
        const venue = await Venue.findByIdAndUpdate(
          venue_id,
          { venue_hourly_rate, updatedAt: new Date() },
          { new: true }
        ).select('venue_unit venue_hourly_rate');
        
        if (venue) {
          results.push({ venue_id, success: true, venue });
        } else {
          results.push({ venue_id, error: 'Venue not found' });
        }
      } catch (err) {
        results.push({ venue_id, error: err.message });
      }
    }
    
    res.json({ 
      message: 'Bulk pricing update completed',
      results
    });
  } catch (error) {
    console.error('Error in bulk pricing update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate booking cost (for frontend pricing preview)
router.get('/venues/:id/calculate-cost', authMiddleware, async (req, res) => {
  try {
    const { duration } = req.query; // Duration in hours
    
    const venue = await Venue.findById(req.params.id)
      .select('venue_unit venue_hourly_rate');
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    const totalCost = venue.venue_hourly_rate * parseFloat(duration);
    
    res.json({
      venue_unit: venue.venue_unit,
      hourly_rate: venue.venue_hourly_rate,
      duration: parseFloat(duration),
      total_cost: totalCost
    });
  } catch (error) {
    console.error('Error calculating venue cost:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark venue as returned (Admin only)
router.post('/venue-return/:bookingId', adminMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;
    const booking = await VenueBooking.findById(req.params.bookingId).populate('venue_id');
    
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
    const venue = booking.venue_id;
    
    // Create a booking log entry for return
    const bookingLog = new BookingLog({
      booking_id: booking._id,
      booking_type: 'venue',
      venue_id: venue?._id,
      user_id: booking.user_id,
      admin_id: req.user.User_ID,
      action: 'returned',
      previous_status: previousStatus,
      new_status: 'completed',
      notes: notes || 'Venue returned manually',
      status_changed_at: new Date(),
      booking_details: {
        venue_booking_date: booking.booking_date,
        venue_booking_time: booking.booking_time,
        venue_booking_duration: booking.booking_duration,
        venue_unit: venue?.venue_unit,
        venue_type: venue?.venue_type,
        venue_capacity: venue?.venue_capacity,
        booking_desc: booking.booking_desc,
        total_pay: booking.total_pay
      }
    });
    
    await bookingLog.save();
    
    // Update the booking status to completed
    booking.status = 'completed';
    await booking.save();
    
    res.json({ 
      message: 'Venue return confirmed successfully',
      log_id: bookingLog._id,
      booking: booking
    });
  } catch (error) {
    console.error('Error processing venue return:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active venue bookings (for return management)
router.get('/venues/:id/active-bookings', adminMiddleware, async (req, res) => {
  try {
    const bookings = await VenueBooking.find({
      venue_id: req.params.id,
      status: { $in: ['pending', 'confirmed'] }
    }).populate({
      path: 'user_id',
      select: 'First_Name Last_Name Email_Address',
      model: 'USER',
      localField: 'user_id',
      foreignField: 'User_ID'
    }).sort({ booking_date: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching active venue bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;