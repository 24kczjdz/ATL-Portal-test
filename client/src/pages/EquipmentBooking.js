import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, PageTemplate } from '../components/ui';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import { Scanner } from '@yudiel/react-qr-scanner';

import { FiCalendar, FiClock, FiTool, FiX, FiCheck, FiAlertCircle, FiCamera, FiCheckCircle } from 'react-icons/fi';

const QrScannerComponent = ({ onScan, onError, active }) => {
    if (!active) return null;
    
    // The delay prop (300ms) helps prevent rapid, duplicate scans.
    const previewStyle = { width: '100%' };

    /* REPLACE THIS BLOCK with your actual library component */
    
    // Example using @yudiel/react-qr-scanner:
    
    
    return (
        <div className="rounded-lg overflow-hidden border border-primary-300 dark:border-gray-600">
            <Scanner
                onDecode={(result) => onScan(result)}
                onError={onError}
                constraints={{ video: { facingMode: 'environment' } }}
                containerStyle={previewStyle}
            />
        </div>
    );
    
};


function EquipmentBooking() {

    const [equipment, setEquipment] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState('');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingDuration, setBookingDuration] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // NEW STATE: To toggle the QR scanner view
    const [showScanner, setShowScanner] = useState(false);
    const [scanSuccess, setScanSuccess] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    useEffect(() => {
        fetchEquipment();
        fetchUserBookings();
    }, []);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/equipment', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEquipment(data);
            }
        } catch (error) {
            console.error('Error fetching equipment:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBookings = async () => {
        try {
            const response = await fetch('/api/equipment-bookings/user', {
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
    
    // Helper function to validate MongoDB ObjectId format (24 hex characters)
    const isValidObjectId = (str) => {
        return /^[a-fA-F0-9]{24}$/.test(str);
    };

    // NEW FUNCTION: Handles the result from the QR code scanner
    const handleScan = (result) => {
        // Stop scanning immediately after the first successful result
        if (result) {
            let equipmentId = null;
            
            // Try to extract the equipment ID from the QR code
            // Support multiple formats:
            // 1. Plain MongoDB ObjectId string (24 hex characters) - e.g., "507f1f77bcf86cd799439011"
            // 2. JSON with _id field - e.g., {"_id": "507f1f77bcf86cd799439011"}
            // 3. MongoDB Extended JSON - e.g., {"_id": {"$oid": "507f1f77bcf86cd799439011"}}
            
            const trimmedResult = result.trim();
            
            // Check if it's a plain ObjectId string
            if (isValidObjectId(trimmedResult)) {
                equipmentId = trimmedResult;
            } else {
                // Try parsing as JSON
                try {
                    const data = JSON.parse(trimmedResult);
                    // Handle MongoDB Extended JSON format
                    equipmentId = data._id?.$oid || data._id || data.id || data.equipmentId;
                } catch (error) {
                    // Not valid JSON - check if it might contain an ObjectId somewhere
                    const objectIdMatch = trimmedResult.match(/[a-fA-F0-9]{24}/);
                    if (objectIdMatch) {
                        equipmentId = objectIdMatch[0];
                    }
                }
            }
            
            if (!equipmentId || !isValidObjectId(equipmentId)) {
                setScanSuccess(false);
                setScanMessage('Invalid QR code format. Expected a valid equipment ID.');
                setTimeout(() => setScanMessage(''), 3000);
                return;
            }

            // Find the equipment in the local state
            const foundEquipment = equipment.find(item => item._id === equipmentId);

            if (foundEquipment) {
                setSelectedEquipment(equipmentId);
                setShowScanner(false); // Close the scanner after a successful scan
                setScanSuccess(true);
                setScanMessage(`Equipment Selected: ${foundEquipment.eqm_name}`);
                // Clear message after 5 seconds
                setTimeout(() => {
                    setScanMessage('');
                    setScanSuccess(false);
                }, 5000);
            } else {
                // Equipment not found locally - it might not be available or doesn't exist
                setScanSuccess(false);
                setScanMessage('Equipment not found. It may not be available or does not exist.');
                setTimeout(() => setScanMessage(''), 3000);
            }
        }
    };
    
    // NEW FUNCTION: Handles scanner errors (e.g., camera access denied)
    const handleError = (err) => {
        console.error('QR Scanner Error:', err);
        // Optionally, inform the user if the camera cannot be accessed
        if (err.name === 'NotAllowedError') {
             alert('Camera access denied. Please manually select equipment.');
        } else if (err.name === 'NotFoundError') {
             // For devices without a camera
             alert('No camera detected. Please manually select equipment.');
        }
        setShowScanner(false); // Fallback to dropdown on major error
    };


    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/equipment-bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    equipment_id: selectedEquipment,
                    eqm_booking_date: bookingDate,
                    eqm_booking_time: bookingTime,
                    eqm_booking_duration: bookingDuration
                })
            });

            if (response.ok) {
                alert('Equipment booking submitted successfully!');
                setSelectedEquipment('');
                setBookingDate('');
                setBookingTime('');
                setBookingDuration(1);
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
            const response = await fetch(`/api/equipment-bookings/${bookingId}`, {
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

    if (loading) {
        return (
            <PageTemplate
                title="Equipment Booking"
                description="Reserve lab equipment for your projects"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Equipment Booking"
            description="Reserve lab equipment for your projects"
        >

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Booking Form */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-xl font-serif flex items-center">
                            <FiTool className="mr-2" />
                            New Equipment Booking
                        </Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <form onSubmit={handleSubmitBooking} className="space-y-6">
                            
                            {/* Equipment Selection Label */}
                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Equipment
                                </label>
                                
                                {/* Selection Method Toggle */}
                                <div className="flex gap-2 mb-3">
                                    <Button
                                        type="button"
                                        variant={!showScanner ? "primary" : "neutral"}
                                        size="sm"
                                        className="flex-1 justify-center"
                                        onClick={() => setShowScanner(false)}
                                    >
                                        Select from List
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={showScanner ? "primary" : "neutral"}
                                        size="sm"
                                        className="flex-1 justify-center"
                                        onClick={() => setShowScanner(true)}
                                        icon={FiCamera}
                                    >
                                        Scan QR Code
                                    </Button>
                                </div>

                                {/* Scan Result Message */}
                                {scanMessage && (
                                    <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 ${
                                        scanSuccess 
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}>
                                        {scanSuccess ? <FiCheckCircle className="flex-shrink-0" /> : <FiAlertCircle className="flex-shrink-0" />}
                                        <span className="text-sm font-medium">{scanMessage}</span>
                                    </div>
                                )}

                                {/* QR Scanner Component */}
                                {showScanner && (
                                    <div className="space-y-3">
                                        <QrScannerComponent
                                            active={showScanner}
                                            onScan={handleScan}
                                            onError={handleError}
                                        />
                                        <p className="text-xs text-primary-500 dark:text-gray-400 text-center">
                                            Point your camera at the equipment QR code
                                        </p>
                                    </div>
                                )}
                                
                                {/* Dropdown List */}
                                {!showScanner && (
                                    <select
                                        value={selectedEquipment}
                                        onChange={(e) => setSelectedEquipment(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                    >
                                        <option value="">Select Equipment</option>
                                        {equipment.map((item) => (
                                            <option key={item._id} value={item._id}>
                                                {item.eqm_name} ({item.eqm_cat} - {item.eqm_type})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Currently Selected Equipment Display */}
                                {selectedEquipment && (
                                    <div className="mt-3 p-3 bg-primary-50 dark:bg-gray-700/50 rounded-lg border border-primary-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-primary-500 dark:text-gray-400 mb-1">Selected Equipment</p>
                                                <p className="font-serif font-medium text-primary-900 dark:text-white">
                                                    {equipment.find(e => e._id === selectedEquipment)?.eqm_name}
                                                </p>
                                                <p className="text-xs text-primary-600 dark:text-gray-400 mt-0.5">
                                                    {equipment.find(e => e._id === selectedEquipment)?.eqm_cat} - {equipment.find(e => e._id === selectedEquipment)?.eqm_type}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedEquipment('')}
                                                icon={FiX}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* The rest of the form (Date, Time, Duration) */}

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
                                onChange={(e) => setBookingDuration(parseInt(e.target.value))}
                                required
                                helperText="Maximum 24 hours per booking"
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                loading={submitting}
                                // Ensure booking cannot be submitted if no equipment is selected
                                disabled={submitting || !selectedEquipment} 
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
                            type="equipment"
                            itemId={selectedEquipment}
                            onDateSelect={(date) => setBookingDate(date)}
                        />
                    </Card.Content>
                </Card>

                {/* My Bookings */}
                <Card>
                    <Card.Header>
                        <Card.Title className="text-xl font-serif flex items-center">
                            <FiTool className="mr-2" />
                            My Equipment Bookings
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
                                                    <h3 className="font-serif font-medium text-primary-900 dark:text-white">{booking.equipment?.eqm_name}</h3>
                                                    <p className="text-sm font-literary text-primary-600 dark:text-gray-400">
                                                        {booking.equipment?.eqm_cat} - {booking.equipment?.eqm_type}
                                                    </p>
                                                    <div className="text-sm font-sans text-primary-600 dark:text-gray-400 space-y-1">
                                                        <p><FiCalendar className="inline w-4 h-4 mr-2" />{formatDate(booking.eqm_booking_date)} at {booking.eqm_booking_time}</p>
                                                        <p><FiClock className="inline w-4 h-4 mr-2" />Duration: {booking.eqm_booking_duration} hour(s)</p>
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

export default EquipmentBooking;
// import React, { useState, useEffect } from 'react';
// import { Card, Button, Input, Badge, PageTemplate } from '../components/ui';
// import { FiCalendar, FiClock, FiTool, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
// import AvailabilityCalendar from '../components/AvailabilityCalendar';

// function EquipmentBooking() {

//     const [equipment, setEquipment] = useState([]);
//     const [bookings, setBookings] = useState([]);
//     const [selectedEquipment, setSelectedEquipment] = useState('');
//     const [bookingDate, setBookingDate] = useState('');
//     const [bookingTime, setBookingTime] = useState('');
//     const [bookingDuration, setBookingDuration] = useState(1);
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);

//     useEffect(() => {
//         fetchEquipment();
//         fetchUserBookings();
//     }, []);

//     const fetchEquipment = async () => {
//         try {
//             setLoading(true);
//             const response = await fetch('/api/equipment', {
//                 headers: {
//                     'Authorization': `Bearer ${localStorage.getItem('token')}`
//                 }
//             });
//             if (response.ok) {
//                 const data = await response.json();
//                 setEquipment(data);
//             }
//         } catch (error) {
//             console.error('Error fetching equipment:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchUserBookings = async () => {
//         try {
//             const response = await fetch('/api/equipment-bookings/user', {
//                 headers: {
//                     'Authorization': `Bearer ${localStorage.getItem('token')}`
//                 }
//             });
//             if (response.ok) {
//                 const data = await response.json();
//                 setBookings(data);
//             }
//         } catch (error) {
//             console.error('Error fetching bookings:', error);
//         }
//     };

//     const handleSubmitBooking = async (e) => {
//         e.preventDefault();
//         setSubmitting(true);

//         try {
//             const response = await fetch('/api/equipment-bookings', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${localStorage.getItem('token')}`
//                 },
//                 body: JSON.stringify({
//                     equipment_id: selectedEquipment,
//                     eqm_booking_date: bookingDate,
//                     eqm_booking_time: bookingTime,
//                     eqm_booking_duration: bookingDuration
//                 })
//             });

//             if (response.ok) {
//                 alert('Equipment booking submitted successfully!');
//                 setSelectedEquipment('');
//                 setBookingDate('');
//                 setBookingTime('');
//                 setBookingDuration(1);
//                 fetchUserBookings();
//             } else {
//                 const error = await response.json();
//                 alert(`Error: ${error.message}`);
//             }
//         } catch (error) {
//             console.error('Error submitting booking:', error);
//             alert('Error submitting booking');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const handleCancelBooking = async (bookingId) => {
//         if (!window.confirm('Are you sure you want to cancel this booking?')) return;

//         try {
//             const response = await fetch(`/api/equipment-bookings/${bookingId}`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${localStorage.getItem('token')}`
//                 }
//             });

//             if (response.ok) {
//                 alert('Booking cancelled successfully');
//                 fetchUserBookings();
//             } else {
//                 alert('Error cancelling booking');
//             }
//         } catch (error) {
//             console.error('Error cancelling booking:', error);
//             alert('Error cancelling booking');
//         }
//     };

//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
//         return localDate.toLocaleDateString();
//     };

//     const formatStatus = (status) => {
//         const statusMap = {
//             'pending': 'Pending',
//             'confirmed': 'Confirmed',
//             'cancelled': 'Cancelled',
//             'completed': 'Completed'
//         };
//         return statusMap[status] || status;
//     };

//     const getStatusVariant = (status) => {
//         const variants = {
//             'pending': 'warning',
//             'confirmed': 'success',
//             'cancelled': 'error',
//             'completed': 'neutral'
//         };
//         return variants[status] || 'neutral';
//     };

//     if (loading) {
//         return (
//             <PageTemplate
//                 title="Equipment Booking"
//                 description="Reserve lab equipment for your projects"
//                 loading={true}
//             />
//         );
//     }

//     return (
//         <PageTemplate
//             title="Equipment Booking"
//             description="Reserve lab equipment for your projects"
//         >

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Booking Form */}
//                 <Card>
//                     <Card.Header>
//                         <Card.Title className="text-xl font-serif flex items-center">
//                             <FiTool className="mr-2" />
//                             New Equipment Booking
//                         </Card.Title>
//                     </Card.Header>
//                     <Card.Content>
//                         <form onSubmit={handleSubmitBooking} className="space-y-6">
//                             <div>
//                                 <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
//                                     Equipment
//                                 </label>
//                                 <select
//                                     value={selectedEquipment}
//                                     onChange={(e) => setSelectedEquipment(e.target.value)}
//                                     required
//                                     className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
//                                 >
//                                     <option value="">Select Equipment</option>
//                                     {equipment.map((item) => (
//                                         <option key={item._id} value={item._id}>
//                                             {item.eqm_name} ({item.eqm_cat} - {item.eqm_type})
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             <Input
//                                 label="Date"
//                                 type="date"
//                                 value={bookingDate}
//                                 onChange={(e) => setBookingDate(e.target.value)}
//                                 min={new Date().toISOString().split('T')[0]}
//                                 required
//                                 icon={FiCalendar}
//                             />

//                             <Input
//                                 label="Time"
//                                 type="time"
//                                 value={bookingTime}
//                                 onChange={(e) => setBookingTime(e.target.value)}
//                                 required
//                                 icon={FiClock}
//                             />

//                             <Input
//                                 label="Duration (hours)"
//                                 type="number"
//                                 min="1"
//                                 max="24"
//                                 value={bookingDuration}
//                                 onChange={(e) => setBookingDuration(parseInt(e.target.value))}
//                                 required
//                                 helperText="Maximum 24 hours per booking"
//                             />

//                             <Button
//                                 type="submit"
//                                 variant="primary"
//                                 className="w-full"
//                                 loading={submitting}
//                                 disabled={submitting}
//                                 icon={FiCheck}
//                             >
//                                 {submitting ? 'Submitting...' : 'Submit Booking'}
//                             </Button>
//                         </form>
//                     </Card.Content>
//                 </Card>

//                 {/* Calendar */}
//                 <Card>
//                     <Card.Header>
//                         <Card.Title className="text-xl font-serif flex items-center">
//                             <FiCalendar className="mr-2" />
//                             Availability Calendar
//                         </Card.Title>
//                     </Card.Header>
//                     <Card.Content>
//                         <AvailabilityCalendar 
//                             type="equipment"
//                             itemId={selectedEquipment}
//                             onDateSelect={(date) => setBookingDate(date)}
//                         />
//                     </Card.Content>
//                 </Card>

//                 {/* My Bookings */}
//                 <Card>
//                     <Card.Header>
//                         <Card.Title className="text-xl font-serif flex items-center">
//                             <FiTool className="mr-2" />
//                             My Equipment Bookings
//                         </Card.Title>
//                     </Card.Header>
//                     <Card.Content>
//                         {bookings.length === 0 ? (
//                             <div className="text-center py-8">
//                                 <FiAlertCircle className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
//                                 <p className="font-literary text-primary-500 dark:text-gray-400">No bookings found</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-4">
//                                 {bookings.map((booking) => (
//                                     <Card key={booking._id} className="border-primary-200 dark:border-gray-700">
//                                         <Card.Content className="p-4">
//                                             <div className="flex justify-between items-start">
//                                                 <div className="space-y-2">
//                                                     <h3 className="font-serif font-medium text-primary-900 dark:text-white">{booking.equipment?.eqm_name}</h3>
//                                                     <p className="text-sm font-literary text-primary-600 dark:text-gray-400">
//                                                         {booking.equipment?.eqm_cat} - {booking.equipment?.eqm_type}
//                                                     </p>
//                                                     <div className="text-sm font-sans text-primary-600 dark:text-gray-400 space-y-1">
//                                                         <p><FiCalendar className="inline w-4 h-4 mr-2" />{formatDate(booking.eqm_booking_date)} at {booking.eqm_booking_time}</p>
//                                                         <p><FiClock className="inline w-4 h-4 mr-2" />Duration: {booking.eqm_booking_duration} hour(s)</p>
//                                                     </div>
//                                                     <Badge variant={getStatusVariant(booking.status)}>
//                                                         {formatStatus(booking.status)}
//                                                     </Badge>
//                                                 </div>
//                                                 {booking.status === 'pending' && (
//                                                     <Button
//                                                         onClick={() => handleCancelBooking(booking._id)}
//                                                         variant="danger"
//                                                         size="sm"
//                                                         icon={FiX}
//                                                     >
//                                                         Cancel
//                                                     </Button>
//                                                 )}
//                                             </div>
//                                         </Card.Content>
//                                     </Card>
//                                 ))}
//                             </div>
//                         )}
//                     </Card.Content>
//                 </Card>
//             </div>
//         </PageTemplate>
//     );
// }

// export default EquipmentBooking;