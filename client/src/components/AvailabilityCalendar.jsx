import React, { useState, useEffect, useCallback } from 'react';
import { Card, LoadingSpinner } from './ui';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

function AvailabilityCalendar({ type, itemId, onDateSelect }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!itemId) return;
        
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const endpoint = type === 'equipment' ? 'equipment-bookings' : 'venue-bookings';
            
            const response = await fetch(
                `/api/${endpoint}/availability/${itemId}?year=${year}&month=${month}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    }, [itemId, currentDate, type]);

    useEffect(() => {
        if (itemId) {
            fetchBookings();
        }
    }, [itemId, currentDate, fetchBookings]);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isDateBooked = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(date);
        
        return bookings.some(booking => {
            const bookingDateStr = booking.eqm_booking_date || booking.booking_date;
            const bookingDate = new Date(bookingDateStr);
            const bookingLocalDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
            return formatDate(bookingLocalDate) === dateStr && booking.status !== 'cancelled';
        });
    };

    const isPastDate = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const getBookingsForDay = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(date);
        
        return bookings.filter(booking => {
            const bookingDateStr = booking.eqm_booking_date || booking.booking_date;
            const bookingDate = new Date(bookingDateStr);
            const bookingLocalDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
            return formatDate(bookingLocalDate) === dateStr && booking.status !== 'cancelled';
        });
    };

    const handleDateClick = (day) => {
        if (isPastDate(day)) return;
        
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (onDateSelect) {
            onDateSelect(formatDate(date));
        }
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isBooked = isDateBooked(day);
            const isPast = isPastDate(day);
            const dayBookings = getBookingsForDay(day);
            
            let dayClass = 'h-8 w-8 flex items-center justify-center rounded-md text-xs font-serif cursor-pointer border transition-all duration-200 ';
            
            if (isPast) {
                dayClass += 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed border-gray-200 dark:border-gray-700';
            } else if (isBooked) {
                dayClass += 'bg-error-100 dark:bg-error-900/20 text-error-800 dark:text-error-300 border-error-200 dark:border-error-700 hover:bg-error-200 dark:hover:bg-error-900/30';
            } else {
                dayClass += 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-300 border-success-200 dark:border-success-700 hover:bg-success-200 dark:hover:bg-success-900/30';
            }

            days.push(
                <div
                    key={day}
                    className="relative"
                    title={dayBookings.length > 0 ? `${dayBookings.length} booking(s)` : 'Available'}
                >
                    <div
                        className={dayClass}
                        onClick={() => handleDateClick(day)}
                    >
                        {day}
                    </div>
                    {dayBookings.length > 0 && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (!itemId) {
        return (
            <Card>
                <Card.Content className="p-8 text-center">
                    <FiCalendar className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="font-literary text-primary-500 dark:text-gray-400">
                        Select an item to view availability calendar
                    </p>
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card>
            <Card.Content className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-primary-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 text-primary-600 dark:text-gray-300"
                        disabled={loading}
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <h3 className="text-lg font-serif font-semibold text-primary-900 dark:text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-primary-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 text-primary-600 dark:text-gray-300"
                        disabled={loading}
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-8">
                        <LoadingSpinner size="lg" />
                        <p className="font-literary text-primary-500 dark:text-gray-400 mt-4">
                            Loading availability...
                        </p>
                    </div>
                )}

                {/* Week days header */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                    {weekDays.map(day => (
                        <div key={day} className="h-8 flex items-center justify-center text-xs font-serif font-semibold text-primary-700 dark:text-gray-300">
                            {day}
                        </div>
                    ))}
                </div>

            <div className="grid grid-cols-7 gap-2">
                {renderCalendarDays()}
            </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-success-100 dark:bg-success-900/20 border border-success-200 dark:border-success-700 rounded"></div>
                        <span className="font-literary text-primary-600 dark:text-gray-300">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-error-100 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded"></div>
                        <span className="font-literary text-primary-600 dark:text-gray-300">Booked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"></div>
                        <span className="font-literary text-primary-600 dark:text-gray-300">Past</span>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
}

export default AvailabilityCalendar;