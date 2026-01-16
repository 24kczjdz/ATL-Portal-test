import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, Button, PageTemplate, Badge } from '../components/ui';
import { 
    FiTool, 
    FiHome, 
    FiCamera,
    FiCheck,
    FiX,
    FiAlertCircle,
    FiCheckCircle,
    FiMapPin,
    FiClock,
    FiCalendar,
    FiUser,
    FiPackage
} from 'react-icons/fi';

// QR Scanner Component with actual camera using html5-qrcode
const QrScannerComponent = ({ onScan, onError, active }) => {
    const scannerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // Clear any existing scanner first
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
        }

        if (!active) {
            // Clear container when inactive
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
            return;
        }

        // Small delay to ensure DOM is ready and previous scanner is fully cleaned up
        const timeoutId = setTimeout(() => {
            // Clear the container contents to remove any leftover UI
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            };

            const scanner = new Html5QrcodeScanner('return-qr-reader', config, false);
            scannerRef.current = scanner;

            scanner.render(
                (decodedText /*, decodedResult */) => {
                    if (onScan) onScan(decodedText);
                },
                (errorMessage) => {
                    if (onError && typeof errorMessage === 'string' && !errorMessage.includes('QR code parse error')) {
                        onError(new Error(errorMessage));
                    }
                }
            );
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
            // Also clear the container on unmount
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [active, onScan, onError]);

    if (!active) return null;

    return (
        <div
            ref={containerRef}
            id="return-qr-reader"
            className="rounded-lg overflow-hidden border border-primary-300 dark:border-gray-600"
        />
    );
};

function ManageBooking() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('bookings');
    const [equipmentBookings, setEquipmentBookings] = useState([]);
    const [venueBookings, setVenueBookings] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLogs, setBookingLogs] = useState([]);

    // QR Return Scanner State
    const [showReturnScanner, setShowReturnScanner] = useState(false);
    const [scannedEquipment, setScannedEquipment] = useState(null);
    const [activeBookingsForEquipment, setActiveBookingsForEquipment] = useState([]);
    const [returnLoading, setReturnLoading] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);
    
    // Manual Return State
    const [selectedEquipmentForReturn, setSelectedEquipmentForReturn] = useState('');
    const [selectedVenueForReturn, setSelectedVenueForReturn] = useState('');
    const [confirmedEquipmentBookings, setConfirmedEquipmentBookings] = useState([]);
    const [confirmedVenueBookings, setConfirmedVenueBookings] = useState([]);

    // Fetch functions
    const fetchEquipmentBookings = async () => {
        const response = await fetch('/api/equipment-bookings/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const data = await response.json();
            setEquipmentBookings(data);
        }
    };

    const fetchVenueBookings = async () => {
        const response = await fetch('/api/venue-bookings/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const data = await response.json();
            setVenueBookings(data);
        }
    };

    const fetchEquipment = async () => {
        const response = await fetch('/api/equipment/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const data = await response.json();
            setEquipment(data);
        }
    };

    const fetchVenues = async () => {
        const response = await fetch('/api/venues/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const data = await response.json();
            setVenues(data);
        }
    };

    const fetchBookingLogs = async () => {
        const response = await fetch('/api/booking-logs?limit=100', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const data = await response.json();
            setBookingLogs(data);
        }
    };

    const fetchConfirmedEquipmentBookings = async () => {
        try {
            const response = await fetch('/api/equipment-bookings/all', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                const confirmed = data.filter(b => b.status === 'confirmed');
                setConfirmedEquipmentBookings(confirmed);
            }
        } catch (error) {
            console.error('Error fetching confirmed equipment bookings:', error);
        }
    };

    const fetchConfirmedVenueBookings = async () => {
        try {
            const response = await fetch('/api/venue-bookings/all', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                const confirmed = data.filter(b => b.status === 'confirmed');
                setConfirmedVenueBookings(confirmed);
            }
        } catch (error) {
            console.error('Error fetching confirmed venue bookings:', error);
        }
    };

    // Combined fetch function for initial data loading
    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchEquipmentBookings(),
                fetchVenueBookings(),
                fetchEquipment(),
                fetchVenues(),
                fetchBookingLogs(),
                fetchConfirmedEquipmentBookings(),
                fetchConfirmedVenueBookings()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data when component mounts and user is admin
    useEffect(() => {
        if (currentUser?.User_Role === 'ATL_ADMIN') {
            fetchAllData();
        }
    }, [currentUser, fetchAllData]);

    // Helper function to validate MongoDB ObjectId format
    const isValidObjectId = (str) => {
        return /^[a-fA-F0-9]{24}$/.test(str);
    };

    // Handle QR Scan for Equipment Return
    const handleReturnScan = async (result) => {
        try {
            if (!result) return;

            // Normalise result into a string
            let rawText = '';

            if (typeof result === 'string') {
                rawText = result;
            } else if (Array.isArray(result)) {
                const first = result[0] || {};
                rawText = first.rawValue || first.text || JSON.stringify(first);
            } else if (typeof result === 'object') {
                rawText = result.text || result.rawValue || JSON.stringify(result);
            } else {
                console.warn('QR return scan result in unexpected format:', result);
                    return;
                }

            const trimmedResult = rawText.trim();

            let equipmentId = null;

            // Check if it's a plain ObjectId string
            if (isValidObjectId(trimmedResult)) {
                equipmentId = trimmedResult;
            } else {
                // Try parsing as JSON
                try {
                    const data = JSON.parse(trimmedResult);
                    equipmentId = data._id?.$oid || data._id || data.id || data.equipmentId;
                } catch (error) {
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

            try {
                // Fetch equipment details
                const equipmentResponse = await fetch(`/api/equipment/${equipmentId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                if (equipmentResponse.ok) {
                    const foundEquipment = await equipmentResponse.json();
                    setScannedEquipment(foundEquipment);
                    
                    // Fetch active bookings for this equipment
                    const bookingsResponse = await fetch(`/api/equipment/${equipmentId}/active-bookings`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });

                    if (bookingsResponse.ok) {
                        const activeBookings = await bookingsResponse.json();
                        setActiveBookingsForEquipment(activeBookings);
                        
                        setScanSuccess(true);
                        setScanMessage(`Found: ${foundEquipment.eqm_name} - ${activeBookings.length} active booking(s)`);
                    }
                } else {
                    setScanSuccess(false);
                    setScanMessage('Equipment not found in database.');
                }
            } catch (error) {
                console.error('Error processing QR scan:', error);
                setScanSuccess(false);
                setScanMessage('Error processing QR code.');
            }
            
            setTimeout(() => setScanMessage(''), 5000);
        } catch (err) {
            console.error('Unexpected error in handleReturnScan:', err, 'raw result:', result);
            setScanSuccess(false);
            setScanMessage('Unexpected error while reading QR code.');
            setTimeout(() => setScanMessage(''), 3000);
        }
    };

    // Handle Equipment Return Submission for a specific booking
    const handleReturnSubmit = async (bookingId) => {
        setReturnLoading(true);
        try {
            const response = await fetch(`/api/equipment-return/${bookingId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ notes: 'Equipment returned via QR scan' })
            });

            if (response.ok) {
                setScanSuccess(true);
                setScanMessage('Equipment return confirmed successfully!');
                
                // Refresh data
                await fetchAllData();
                
                // Update local state
                setActiveBookingsForEquipment(prev => prev.filter(b => b._id !== bookingId));
                
                if (activeBookingsForEquipment.length <= 1) {
                setScannedEquipment(null);
                setShowReturnScanner(false);
                }
            } else {
                const error = await response.json();
                setScanSuccess(false);
                setScanMessage(error.message || 'Error confirming return.');
            }
        } catch (error) {
            console.error('Error processing return:', error);
            setScanSuccess(false);
            setScanMessage('Error processing equipment return.');
        } finally {
            setReturnLoading(false);
            setTimeout(() => setScanMessage(''), 5000);
        }
    };

    // Handle Manual Equipment Return
    const handleManualEquipmentReturn = async () => {
        if (!selectedEquipmentForReturn) {
            alert('Please select an equipment booking to return');
            return;
        }

        setReturnLoading(true);
        try {
            const response = await fetch('/api/equipment-return/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    booking_id: selectedEquipmentForReturn,
                    notes: 'Equipment returned manually via admin panel'
                })
            });

            if (response.ok) {
                alert('Equipment return confirmed successfully!');
                setSelectedEquipmentForReturn('');
                await fetchAllData();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to return equipment'}`);
            }
        } catch (error) {
            console.error('Error processing manual return:', error);
            alert('Error processing equipment return.');
        } finally {
            setReturnLoading(false);
        }
    };

    // Handle Manual Venue Return
    const handleManualVenueReturn = async () => {
        if (!selectedVenueForReturn) {
            alert('Please select a venue booking to return');
            return;
        }

        setReturnLoading(true);
        try {
            const response = await fetch(`/api/venue-return/${selectedVenueForReturn}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    notes: 'Venue returned manually via admin panel'
                })
            });

            if (response.ok) {
                alert('Venue return confirmed successfully!');
                setSelectedVenueForReturn('');
                await fetchAllData();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to return venue'}`);
            }
        } catch (error) {
            console.error('Error processing manual venue return:', error);
            alert('Error processing venue return.');
        } finally {
            setReturnLoading(false);
        }
    };

    // Handle Scanner Errors
    const handleScannerError = (err) => {
        console.error('QR Scanner Error:', err);
        if (err.name === 'NotAllowedError') {
            setScanMessage('Camera access denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
            setScanMessage('No camera detected.');
        }
        setScanSuccess(false);
    };

    // Update booking status (confirm or cancel)
    const updateBookingStatus = async (type, bookingId, newStatus) => {
        try {
            const endpoint = type === 'equipment' ? 'equipment-bookings' : 'venue-bookings';
            const response = await fetch(`/api/${endpoint}/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchAllData();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    // Format date helper
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Format time helper
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Get status badge variant
    const getStatusVariant = (status) => {
        const variants = {
            'pending': 'warning',
            'confirmed': 'primary',
            'cancelled': 'error',
            'completed': 'success',
            'finished': 'success',
            'available': 'success',
            'maintenance': 'warning',
            'out_of_order': 'error'
        };
        return variants[status?.toLowerCase()] || 'neutral';
    };

    // Group equipment by location
    const groupEquipmentByLocation = () => {
        const grouped = {};
        equipment.forEach(item => {
            const location = item.location || 'Unassigned';
            if (!grouped[location]) {
                grouped[location] = [];
            }
            grouped[location].push(item);
        });
        return grouped;
    };

    // Get equipment status badge variant
    const getEquipmentStatusVariant = (status) => {
        const variants = {
            'available': 'success',
            'maintenance': 'warning',
            'out_of_order': 'error'
        };
        return variants[status] || 'neutral';
    };

    // Render booking status action buttons
    const renderStatusActions = (type, booking) => {
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return (
                <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(booking.status)} className="mr-2">
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
                {booking.status === 'pending' && (
                    <>
                        <button
                            onClick={() => updateBookingStatus(type, booking._id, 'confirmed')}
                            className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                            title="Confirm Booking"
                        >
                            <FiCheck className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => updateBookingStatus(type, booking._id, 'cancelled')}
                            className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                            title="Cancel Booking"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </>
                )}
                {booking.status === 'confirmed' && (
                    <button
                        onClick={() => updateBookingStatus(type, booking._id, 'cancelled')}
                        className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                        title="Cancel Booking"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                )}
            </div>
        );
    };

    // Render QR Return Scanner Section
    const renderQrReturnSection = () => (
        <Card className="mb-6">
            <Card.Header>
                <Card.Title className="text-xl font-serif flex items-center">
                    <FiCamera className="mr-2" />
                    Equipment Return Scanner
                </Card.Title>
            </Card.Header>
            <Card.Content>
                <div className="space-y-4">
                    {/* Toggle Scanner Button */}
                    <div className="flex gap-2">
                    <Button
                        type="button"
                        variant={showReturnScanner ? "secondary" : "primary"}
                            className="flex-1 justify-center"
                        onClick={() => {
                            setShowReturnScanner(!showReturnScanner);
                            setScannedEquipment(null);
                                setActiveBookingsForEquipment([]);
                                setScanMessage('');
                        }}
                        icon={FiCamera}
                    >
                            {showReturnScanner ? 'Close Scanner' : 'Scan Equipment for Return'}
                    </Button>
                    </div>

                    {/* Scan Message */}
                    {scanMessage && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 ${
                            scanSuccess 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                        }`}>
                            {scanSuccess ? <FiCheckCircle className="flex-shrink-0" /> : <FiAlertCircle className="flex-shrink-0" />}
                            <span className="text-sm font-medium">{scanMessage}</span>
                        </div>
                    )}

                    {/* Scanner */}
                    {showReturnScanner && (
                        <div className="space-y-4">
                            <QrScannerComponent
                                active={showReturnScanner}
                                onScan={handleReturnScan}
                                onError={handleScannerError}
                            />
                            <p className="text-xs text-center text-primary-500 dark:text-gray-400">
                                Point camera at equipment QR code to confirm return
                            </p>
                        </div>
                    )}

                    {/* Scanned Equipment Details */}
                            {scannedEquipment && (
                        <div className="p-4 bg-primary-50 dark:bg-gray-700/50 rounded-lg border border-primary-200 dark:border-gray-600">
                            <h4 className="font-serif font-semibold text-primary-900 dark:text-white mb-3 flex items-center">
                                <FiPackage className="mr-2" />
                                Scanned Equipment
                                            </h4>
                            <div className="space-y-2 mb-4">
                                <p className="text-sm text-primary-700 dark:text-gray-300">
                                                <strong>Name:</strong> {scannedEquipment.eqm_name}
                                            </p>
                                <p className="text-sm text-primary-700 dark:text-gray-300">
                                                <strong>Category:</strong> {scannedEquipment.eqm_cat} - {scannedEquipment.eqm_type}
                                            </p>
                                <p className="text-sm text-primary-700 dark:text-gray-300">
                                    <strong>Location:</strong> {scannedEquipment.location || 'Unassigned'}
                                </p>
                                <p className="text-sm text-primary-700 dark:text-gray-300">
                                    <strong>Status:</strong>{' '}
                                    <Badge variant={getEquipmentStatusVariant(scannedEquipment.eqm_status)}>
                                        {scannedEquipment.eqm_status}
                                    </Badge>
                                </p>
                            </div>

                            {/* Active Bookings for this Equipment */}
                            {activeBookingsForEquipment.length > 0 ? (
                                <div className="space-y-3">
                                    <h5 className="text-sm font-semibold text-primary-800 dark:text-gray-200">
                                        Active Bookings ({activeBookingsForEquipment.length})
                                    </h5>
                                    {activeBookingsForEquipment.map((booking) => (
                                        <div 
                                            key={booking._id} 
                                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-primary-100 dark:border-gray-600 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-primary-900 dark:text-white">
                                                    {formatDate(booking.eqm_booking_date)} at {booking.eqm_booking_time}
                                                </p>
                                                <p className="text-xs text-primary-600 dark:text-gray-400">
                                                    Duration: {booking.eqm_booking_duration}h • Status: {booking.status}
                                            </p>
                                        </div>
                                        <Button
                                                onClick={() => handleReturnSubmit(booking._id)}
                                            variant="success"
                                                size="sm"
                                            loading={returnLoading}
                                            icon={FiCheck}
                                        >
                                            Confirm Return
                                        </Button>
                                    </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-primary-500 dark:text-gray-400">
                                    <FiAlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">No active bookings found for this equipment.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions when scanner is closed */}
                    {!showReturnScanner && !scannedEquipment && (
                        <div className="text-center text-primary-500 dark:text-gray-400 py-4">
                            <FiCamera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click the button above to scan equipment QR codes for returns</p>
                        </div>
                    )}

                    {/* Manual Return Section */}
                    <div className="mt-6 pt-6 border-t border-primary-200 dark:border-gray-700">
                        <h4 className="font-serif font-semibold text-primary-900 dark:text-white mb-4 flex items-center">
                            <FiPackage className="mr-2" />
                            Manual Return
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                    Select Confirmed Equipment Booking
                                </label>
                                <select
                                    value={selectedEquipmentForReturn}
                                    onChange={(e) => setSelectedEquipmentForReturn(e.target.value)}
                                    className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                                >
                                    <option value="">Select a confirmed booking...</option>
                                    {confirmedEquipmentBookings.map((booking) => (
                                        <option key={booking._id} value={booking._id}>
                                            {booking.equipment?.eqm_name} - {formatDate(booking.eqm_booking_date)} at {booking.eqm_booking_time} ({booking.user?.First_Name} {booking.user?.Last_Name})
                                        </option>
                                    ))}
                                </select>
                                {confirmedEquipmentBookings.length === 0 && (
                                    <p className="text-xs text-primary-500 dark:text-gray-400 mt-2">
                                        No confirmed equipment bookings available for return
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleManualEquipmentReturn}
                                variant="primary"
                                className="w-full"
                                loading={returnLoading}
                                disabled={!selectedEquipmentForReturn || returnLoading}
                                icon={FiCheck}
                            >
                                Mark Equipment as Returned
                            </Button>
                        </div>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );

    // Render Equipment List grouped by location
    const renderEquipmentByLocation = () => {
        const groupedEquipment = groupEquipmentByLocation();
        const locations = Object.keys(groupedEquipment).sort();

        return (
            <Card>
                <Card.Header>
                    <Card.Title className="text-xl font-serif flex items-center">
                        <FiMapPin className="mr-2" />
                        Equipment by Location
                    </Card.Title>
                </Card.Header>
                <Card.Content>
                    <div className="space-y-6">
                        {locations.map((location) => (
                            <div key={location}>
                                <h3 className="text-lg font-serif font-semibold text-primary-800 dark:text-white mb-3 flex items-center">
                                    <FiMapPin className="mr-2 text-primary-500" />
                                    {location}
                                    <span className="ml-2 text-sm font-normal text-primary-500 dark:text-gray-400">
                                        ({groupedEquipment[location].length} items)
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedEquipment[location].map((item) => {
                                        // Find active bookings for this equipment
                                        const activeBookings = equipmentBookings.filter(
                                            b => b.equipment?._id === item._id && 
                                                (b.status === 'pending' || b.status === 'confirmed')
                                        );
                                        const activeBookingCount = activeBookings.length;
                                        
                                        // Get the most recent active booking status
                                        const mostRecentBooking = activeBookings.sort((a, b) => 
                                            new Date(b.createdAt) - new Date(a.createdAt)
                                        )[0];
                                        
                                        // Determine which status to show
                                        const displayStatus = mostRecentBooking 
                                            ? mostRecentBooking.status 
                                            : item.eqm_status;
                                        
                                        // Use the consolidated getStatusVariant function
                                        const displayVariant = getStatusVariant(displayStatus);

                                        return (
                                            <div 
                                                key={item._id} 
                                                className="p-4 bg-primary-50 dark:bg-gray-700/50 rounded-lg border border-primary-200 dark:border-gray-600"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-serif font-medium text-primary-900 dark:text-white">
                                                        {item.eqm_name}
                                                    </h4>
                                                    <Badge variant={displayVariant}>
                                                        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1 text-sm text-primary-600 dark:text-gray-400">
                                                    <p><strong>Category:</strong> {item.eqm_cat}</p>
                                                    <p><strong>Type:</strong> {item.eqm_type}</p>
                                                    {item.eqm_description && (
                                                        <p className="text-xs mt-2 text-primary-500 dark:text-gray-500">
                                                            {item.eqm_description}
                                                        </p>
                                                    )}
                                                    {activeBookingCount > 0 && (
                                                        <p className="mt-2">
                                                            <Badge variant="warning">
                                                                {activeBookingCount} active booking(s) - Unavailable
                                                            </Badge>
                                                        </p>
                                                    )}
                                                    {(item.availability_status === 'unavailable' || item.eqm_status !== 'available') && activeBookingCount === 0 && (
                                                        <p className="mt-2">
                                                            <Badge variant={item.eqm_status === 'maintenance' ? 'warning' : 'error'}>
                                                                {item.eqm_status}
                                                            </Badge>
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-xs text-primary-400 dark:text-gray-500 mt-2">
                                                    ID: {item._id}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card.Content>
            </Card>
        );
    };

    // Render Bookings List
    const renderBookingsList = () => (
        <Card>
            <Card.Header>
                <Card.Title className="text-xl font-serif flex items-center">
                    <FiCalendar className="mr-2" />
                    Equipment Bookings
                </Card.Title>
            </Card.Header>
            <Card.Content>
                {equipmentBookings.length === 0 ? (
                    <div className="text-center py-8">
                        <FiAlertCircle className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="font-literary text-primary-500 dark:text-gray-400">No bookings found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {equipmentBookings.map((booking) => (
                            <div 
                                key={booking._id} 
                                className="p-4 bg-primary-50 dark:bg-gray-700/50 rounded-lg border border-primary-200 dark:border-gray-600"
                            >
                                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FiTool className="text-primary-500" />
                                            <h4 className="font-serif font-medium text-primary-900 dark:text-white">
                                                {booking.equipment?.eqm_name || 'Unknown Equipment'}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-primary-600 dark:text-gray-400">
                                            <p className="flex items-center gap-1">
                                                <FiCalendar className="w-4 h-4" />
                                                {formatDate(booking.eqm_booking_date)}
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <FiClock className="w-4 h-4" />
                                                {booking.eqm_booking_time} ({booking.eqm_booking_duration}h)
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <FiUser className="w-4 h-4" />
                                                {booking.user?.First_Name} {booking.user?.Last_Name}
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <FiMapPin className="w-4 h-4" />
                                                {booking.equipment?.location || 'Unassigned'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {renderStatusActions('equipment', booking)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card.Content>
        </Card>
    );

    // Render Booking Logs
    const renderBookingLogs = () => (
        <Card>
            <Card.Header>
                <Card.Title className="text-xl font-serif flex items-center">
                    <FiClock className="mr-2" />
                    Detailed Booking Activity Log
                </Card.Title>
            </Card.Header>
            <Card.Content>
                {bookingLogs.length === 0 ? (
                    <div className="text-center py-8">
                        <FiAlertCircle className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="font-literary text-primary-500 dark:text-gray-400">No activity logs found</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {bookingLogs.map((log) => {
                            const isEquipment = log.booking_type === 'equipment';
                            const itemName = isEquipment 
                                ? log.booking_details?.equipment_name || log.equipment_id?.eqm_name || 'Equipment'
                                : log.booking_details?.venue_unit || log.venue_id?.venue_unit || 'Venue';
                            const statusChangeTime = log.status_changed_at || log.createdAt;
                            
                            return (
                                <div 
                                    key={log._id} 
                                    className="p-4 bg-primary-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-primary-500"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {isEquipment ? <FiTool className="text-primary-500" /> : <FiHome className="text-primary-500" />}
                                                <p className="text-sm font-medium text-primary-900 dark:text-white">
                                                    {itemName}
                                                </p>
                                                <Badge variant={log.booking_type === 'equipment' ? 'neutral' : 'success'} className="text-xs">
                                                    {log.booking_type === 'equipment' ? 'Equipment' : 'Venue'}
                                                </Badge>
                                            </div>
                                            
                                            {/* Status Change Information */}
                                            <div className="space-y-1 mb-2">
                                                <p className="text-xs text-primary-600 dark:text-gray-400">
                                                    Status Change: <span className="font-medium">{log.previous_status || 'N/A'}</span> → <strong className="font-semibold">{log.new_status}</strong>
                                                </p>
                                                <p className="text-xs text-primary-500 dark:text-gray-500">
                                                    Action: <span className="font-medium capitalize">{log.action}</span>
                                                    {log.admin_id && ` • Admin: ${log.admin_id}`}
                                                </p>
                                                {log.notes && (
                                                    <p className="text-xs text-primary-500 dark:text-gray-500 mt-1 italic">
                                                        Note: {log.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Booking Details */}
                                            <div className="text-xs text-primary-500 dark:text-gray-500 space-y-1 mt-2 pt-2 border-t border-primary-200 dark:border-gray-600">
                                                {isEquipment ? (
                                                    <>
                                                        {log.booking_details?.eqm_booking_date && (
                                                            <p>Booking Date: {formatDate(log.booking_details.eqm_booking_date)} at {log.booking_details.eqm_booking_time} ({log.booking_details.eqm_booking_duration}h)</p>
                                                        )}
                                                        {log.booking_details?.equipment_category && (
                                                            <p>Category: {log.booking_details.equipment_category} - {log.booking_details.equipment_type}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {log.booking_details?.venue_booking_date && (
                                                            <p>Booking Date: {formatDate(log.booking_details.venue_booking_date)} at {log.booking_details.venue_booking_time} ({log.booking_details.venue_booking_duration}h)</p>
                                                        )}
                                                        {log.booking_details?.venue_type && (
                                                            <p>Venue Type: {log.booking_details.venue_type} (Capacity: {log.booking_details.venue_capacity})</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold text-primary-600 dark:text-gray-400 mb-1">
                                                Status Changed
                                            </p>
                                            <span className="text-xs text-primary-400 dark:text-gray-500 whitespace-nowrap">
                                                {formatDateTime(statusChangeTime)}
                                            </span>
                                            {log.createdAt && log.createdAt.getTime() !== statusChangeTime?.getTime() && (
                                                <p className="text-xs text-primary-300 dark:text-gray-600 mt-1">
                                                    Logged: {formatDateTime(log.createdAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card.Content>
        </Card>
    );

    // Render Venue Bookings
    const renderVenueBookings = () => (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <Card.Title className="text-xl font-serif flex items-center">
                        <FiHome className="mr-2" />
                        Venue Bookings
                    </Card.Title>
                </Card.Header>
                <Card.Content>
                    {venueBookings.length === 0 ? (
                        <div className="text-center py-8">
                            <FiAlertCircle className="w-12 h-12 text-primary-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="font-literary text-primary-500 dark:text-gray-400">No venue bookings found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {venueBookings.map((booking) => (
                                <div 
                                    key={booking._id} 
                                    className="p-4 bg-primary-50 dark:bg-gray-700/50 rounded-lg border border-primary-200 dark:border-gray-600"
                                >
                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FiHome className="text-primary-500" />
                                                <h4 className="font-serif font-medium text-primary-900 dark:text-white">
                                                    {booking.venue?.venue_unit || 'Unknown Venue'}
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-primary-600 dark:text-gray-400">
                                                <p className="flex items-center gap-1">
                                                    <FiCalendar className="w-4 h-4" />
                                                    {formatDate(booking.booking_date || booking.venue_booking_date)}
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <FiClock className="w-4 h-4" />
                                                    {booking.booking_time} ({booking.booking_duration}h)
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <FiUser className="w-4 h-4" />
                                                    {booking.user?.First_Name} {booking.user?.Last_Name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {renderStatusActions('venue', booking)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Content>
            </Card>

            {/* Venue Return Section */}
            <Card>
                <Card.Header>
                    <Card.Title className="text-xl font-serif flex items-center">
                        <FiCheck className="mr-2" />
                        Venue Return
                    </Card.Title>
                </Card.Header>
                <Card.Content>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-serif font-medium text-primary-700 dark:text-gray-300 mb-2">
                                Select Confirmed Venue Booking
                            </label>
                            <select
                                value={selectedVenueForReturn}
                                onChange={(e) => setSelectedVenueForReturn(e.target.value)}
                                className="w-full px-4 py-3 font-literary border border-primary-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-primary-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 transition-all duration-300"
                            >
                                <option value="">Select a confirmed venue booking...</option>
                                {confirmedVenueBookings.map((booking) => (
                                    <option key={booking._id} value={booking._id}>
                                        {booking.venue?.venue_unit} - {formatDate(booking.booking_date || booking.venue_booking_date)} at {booking.booking_time} ({booking.user?.First_Name} {booking.user?.Last_Name})
                                    </option>
                                ))}
                            </select>
                            {confirmedVenueBookings.length === 0 && (
                                <p className="text-xs text-primary-500 dark:text-gray-400 mt-2">
                                    No confirmed venue bookings available for return
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={handleManualVenueReturn}
                            variant="primary"
                            className="w-full"
                            loading={returnLoading}
                            disabled={!selectedVenueForReturn || returnLoading}
                            icon={FiCheck}
                        >
                            Mark Venue as Returned
                        </Button>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );

    if (loading) {
        return (
            <PageTemplate
                title="Manage Bookings"
                description="Admin interface for managing equipment and venue bookings"
                loading={true}
            />
        );
    }

    return (
        <PageTemplate
            title="Manage Bookings"
            description="Admin interface for managing equipment and venue bookings"
            icon="⚙️"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Tab Navigation */}
                <Card>
                    <Card.Content className="p-0">
                        <div className="flex flex-wrap border-b border-primary-200 dark:border-gray-700">
                            <Button
                                onClick={() => setActiveTab('bookings')}
                                variant={activeTab === 'bookings' ? 'primary' : 'ghost'}
                                className={`rounded-none border-0 ${
                                    activeTab === 'bookings' 
                                        ? 'border-b-2 border-primary-500' 
                                        : ''
                                }`}
                                icon={FiCalendar}
                            >
                                Bookings
                            </Button>
                            <Button
                                onClick={() => setActiveTab('equipment')}
                                variant={activeTab === 'equipment' ? 'primary' : 'ghost'}
                                className={`rounded-none border-0 ${
                                    activeTab === 'equipment' 
                                        ? 'border-b-2 border-primary-500' 
                                        : ''
                                }`}
                                icon={FiTool}
                            >
                                Equipment
                            </Button>
                            <Button
                                onClick={() => setActiveTab('return')}
                                variant={activeTab === 'return' ? 'primary' : 'ghost'}
                                className={`rounded-none border-0 ${
                                    activeTab === 'return' 
                                        ? 'border-b-2 border-primary-500' 
                                        : ''
                                }`}
                                icon={FiCamera}
                            >
                                Return Scanner
                            </Button>
                            <Button
                                onClick={() => setActiveTab('venue')}
                                variant={activeTab === 'venue' ? 'primary' : 'ghost'}
                                className={`rounded-none border-0 ${
                                    activeTab === 'venue' 
                                        ? 'border-b-2 border-primary-500' 
                                        : ''
                                }`}
                                icon={FiHome}
                            >
                                Venues
                            </Button>
                            <Button
                                onClick={() => setActiveTab('logs')}
                                variant={activeTab === 'logs' ? 'primary' : 'ghost'}
                                className={`rounded-none border-0 ${
                                    activeTab === 'logs' 
                                        ? 'border-b-2 border-primary-500' 
                                        : ''
                                }`}
                                icon={FiClock}
                            >
                                Activity Log
                            </Button>
                        </div>
                    </Card.Content>
                </Card>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'bookings' && renderBookingsList()}
                    
                    {activeTab === 'equipment' && renderEquipmentByLocation()}
                    
                    {activeTab === 'return' && renderQrReturnSection()}
                    
                    {activeTab === 'venue' && renderVenueBookings()}
                    
                    {activeTab === 'logs' && renderBookingLogs()}
                </div>
            </div>
        </PageTemplate>
    );
}

export default ManageBooking;
