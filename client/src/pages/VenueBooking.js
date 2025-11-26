import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Badge, PageTemplate } from '../components/ui';
import { FiCalendar, FiClock, FiHome, FiX, FiCheck, FiAlertCircle, FiDollarSign } from 'react-icons/fi';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

function VenueBooking() {

    const [venues, setVenues] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState('');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingDuration, setBookingDuration] = useState(1);
    const [bookingDesc, setBookingDesc] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [totalPay, setTotalPay] = useState(0);

    const calculateTotalPay = useCallback(() => {
        if (selectedVenue && bookingDuration && venues.length > 0) {
            const venue = venues.find(v => v._id === selectedVenue);
            if (venue && venue.venue_hourly_rate) {
                const duration = Math.max(1, parseInt(bookingDuration) || 1);
                const rate = parseFloat(venue.venue_hourly_rate) || 0;
                setTotalPay(rate * duration);
            } else {
                setTotalPay(0);
            }
        } else {
            setTotalPay(0);
        }
    }, [selectedVenue, bookingDuration, venues]);

    useEffect(() => {
        fetchVenues();
        fetchUserBookings();
    }, []);

    useEffect(() => {
        calculateTotalPay();
    }, [selectedVenue, bookingDuration, calculateTotalPay]);

    const fetchVenues = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/venues', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVenues(data);
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBookings = async () => {
        try {
            const response = await fetch('/api/venue-bookings/user', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/venue-bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    venue_id: selectedVenue,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    booking_duration: bookingDuration,
                    booking_desc: bookingDesc,
                    total_pay: totalPay
                })
            });

            if (response.ok) {
                alert('Venue booking submitted successfully!');
                setSelectedVenue('');
                setBookingDate('');
                setBookingTime('');
                setBookingDuration(1);
                setBookingDesc('');
                setTotalPay(0);
                fetchUserBookings();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('Error submitting booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const response = await fetch(`/api/venue-bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('Booking cancelled successfully');
                fetchUserBookings();
            } else {
                alert('Error cancelling booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Error cancelling booking');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return localDate.toLocaleDateString();
    };

    const formatStatus = (status) => {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'cancelled': 'Cancelled',
            'completed': 'Completed'
        };
        return statusMap[status] || status;
    };

    const getStatusVariant = (status) => {
        const variants = {
            'pending': 'warning',
            'confirmed': 'success',
            'cancelled': 'error',
            'completed': 'neutral'
        };
        return variants[status] || 'neutral';
    };

    const getSelectedVenue = () => {
        return venues.find(v => v._id === selectedVenue);
    };

    if (loading) {
        return (
            <PageTemplate
                title="Venue Booking"
                description="Reserve lab spaces and meeting rooms"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Venue Booking"
            description="Reserve lab spaces and meeting rooms"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Booking Form */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-xl font-serif flex items-center">
                            <FiHome className="mr-2" />
                            New Venue Booking
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <form onSubmit={handleSubmitBooking} className="space-y-6">
                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Venue
                                </label>
                                <select
                                    value={selectedVenue}
                                    onChange={(e) => setSelectedVenue(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                >
                                    <option value="">Select Venue</option>
                                    {venues.map((venue) => (
                                        <option key={venue._id} value={venue._id}>
                                            {venue.venue_unit} - {venue.venue_type} (Capacity: {venue.venue_capacity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedVenue && (
                                <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
                                    <Card.Content className="p-4">
                                        <h4 className="font-serif font-medium text-primary-900 dark:text-white mb-2 flex items-center">
                                            <FiHome className="mr-2" />
                                            Venue Details
                                        </h4>
                                        <div className="space-y-2 text-sm font-literary text-primary-600 dark:text-gray-300">
                                            <p>{getSelectedVenue()?.venue_desc}</p>
                                            <p>Fixed Equipment: {getSelectedVenue()?.venue_fixed_equipment?.join(', ') || 'None'}</p>
                                            <p className="flex items-center font-serif font-medium text-primary-700 dark:text-primary-300">
                                                <FiDollarSign className="mr-1" />
                                                Hourly Rate: ${getSelectedVenue()?.venue_hourly_rate}
                                            </p>
                                        </div>
                                    </Card.Content>
                                </Card>
                            )}

                            <Input
                                label="Date"
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                icon={FiCalendar}
                            />

                            <Input
                                label="Time"
                                type="time"
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                required
                                icon={FiClock}
                            />

                            <Input
                                label="Duration (hours)"
                                type="number"
                                min="1"
                                max="24"
                                value={bookingDuration}
                                onChange={(e) => setBookingDuration(parseInt(e.target.value) || 1)}
                                required
                                helperText="Maximum 24 hours per booking"
                            />

                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={bookingDesc}
                                    onChange={(e) => setBookingDesc(e.target.value)}
                                    rows="3"
                                    placeholder="Purpose of booking..."
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white placeholder-primary-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                />
                            </div>

                            {selectedVenue && (
                                <Card className="bg-gradient-to-r from-success-50 to-info-50 dark:from-success-900/20 dark:to-info-900/20 border-success-200 dark:border-success-700">
                                    <Card.Content className="p-4">
                                        <h3 className="text-lg font-serif font-semibold text-success-900 dark:text-white mb-3 flex items-center">
                                            <FiDollarSign className="mr-2" />
                                            Cost Breakdown
                                        </h3>
                                        {(() => {
                                            const venue = venues.find(v => v._id === selectedVenue);
                                            if (venue) {
                                                return (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-literary text-success-700 dark:text-success-300">
                                                            Venue: {venue.venue_unit} ({venue.venue_type})
                                                        </p>
                                                        <p className="text-sm font-literary text-success-700 dark:text-success-300">
                                                            Hourly Rate: ${venue.venue_hourly_rate}/hour
                                                        </p>
                                                        <p className="text-sm font-literary text-success-700 dark:text-success-300">
                                                            Duration: {bookingDuration} hour{bookingDuration > 1 ? 's' : ''}
                                                        </p>
                                                        <div className="border-t border-success-200 dark:border-success-700 pt-3 mt-3">
                                                            <p className="text-xl font-serif font-bold text-success-900 dark:text-white">
                                                                Total Cost: ${totalPay.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                            })()}
                                    </Card.Content>
                                </Card>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                loading={submitting}
                                disabled={submitting}
                                icon={FiCheck}
                            >
                                {submitting ? 'Submitting...' : 'Submit Booking'}
                            </Button>
                        </form>
                    </Card.Content>
                </Card>

                {/* Calendar */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-xl font-serif flex items-center">
                            <FiCalendar className="mr-2" />
                            Availability Calendar
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <AvailabilityCalendar 
                            type="venue"
                            itemId={selectedVenue}
                            onDateSelect={(date) => setBookingDate(date)}
                        />
                    </Card.Content>
                </Card>

                {/* My Bookings */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-xl font-serif flex items-center">
                            <FiHome className="mr-2" />
                            My Venue Bookings
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        {bookings.length === 0 ? (
                            <div className="text-center py-8">
                                <FiAlertCircle className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="font-literary text-primary-500 dark:text-gray-400">No bookings found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <Card key={booking._id} className="border-primary-200 dark:border-gray-700">
                                        <Card.Content className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h3 className="font-serif font-medium text-primary-900 dark:text-white">
                                                        {booking.venue?.venue_unit} - {booking.venue?.venue_type}
                                                    </h3>
                                                    <div className="text-sm font-sans text-primary-600 dark:text-gray-400 space-y-1">
                                                        <p><FiCalendar className="inline w-4 h-4 mr-2" />{formatDate(booking.booking_date)} at {booking.booking_time}</p>
                                                        <p><FiClock className="inline w-4 h-4 mr-2" />Duration: {booking.booking_duration} hour(s)</p>
                                                        {booking.booking_desc && (
                                                            <p className="font-literary">Purpose: {booking.booking_desc}</p>
                                                        )}
                                                        <p><FiDollarSign className="inline w-4 h-4 mr-2" />Total Cost: ${booking.total_pay}</p>
                                                    </div>
                                                    <Badge variant={getStatusVariant(booking.status)}>
                                                        {formatStatus(booking.status)}
                                                    </Badge>
                                                </div>
                                                {booking.status === 'pending' && (
                                                    <Button
                                                        onClick={() => handleCancelBooking(booking._id)}
                                                        variant="danger"
                                                        size="sm"
                                                        icon={FiX}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </Card.Content>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Card.Content>
                </Card>
            </div>
        </PageTemplate>
    );
}

export default VenueBooking;