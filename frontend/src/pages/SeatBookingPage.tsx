import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScreeningService, { ScreeningSeat, RowSeats, ScreeningSeatsResponse } from '../services/screening.service';
import BookingService, { CreateBookingRequest } from '../services/booking.service';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/formatters';

const SeatBookingPage: React.FC = () => {
    const { id: screeningId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [screeningData, setScreeningData] = useState<ScreeningSeatsResponse | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<ScreeningSeat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchScreeningData = async () => {
            if (!screeningId) {
                setError('Invalid screening ID');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const data = await ScreeningService.getScreeningSeats(parseInt(screeningId, 10));
                setScreeningData(data);
            } catch (err: any) {
                console.error('Error fetching screening data:', err);
                setError(err.response?.data || 'Failed to load screening data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchScreeningData();
    }, [screeningId]);

    const handleSeatClick = (seat: ScreeningSeat) => {
        if (seat.isBooked) return; // Cannot select already booked seats

        const isSeatSelected = selectedSeats.some(s => s.id === seat.id);

        if (isSeatSelected) {
            // Remove seat from selection
            setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            // Check for constraints
            const rowSeats = seatsByRow.find(rowData => rowData.row === seat.row)?.seats || [];

            // Rule: Prevent leaving one empty seat between selected seats
            const selectedSeatIds = selectedSeats.map(s => s.id);
            const allSeats = [...selectedSeatIds, seat.id].sort((a, b) => a - b);
            const hasGap = allSeats.some((id, index) => {
                const nextId = allSeats[index + 1];
                return nextId && nextId - id === 2; // Check for a gap of 1 seat
            });

            if (hasGap) {
                alert('Cannot select this seat due to seating constraints (one empty seat between selected seats).');
                return;
            }

            // Add seat to selection (max 8 seats)
            if (selectedSeats.length < 8) {
                setSelectedSeats([...selectedSeats, seat]);
            } else {
                alert('Bạn chỉ có thể chọn tối đa 8 ghế cho một lần đặt');
            }
        }
    };

    const getSeatClass = (seat: ScreeningSeat) => {
        if (seat.isBooked) {
            return 'bg-gray-500 text-gray-300 cursor-not-allowed';
        }

        const isSelected = selectedSeats.some(s => s.id === seat.id);

        if (isSelected) {
            return 'bg-green-500 text-white cursor-pointer hover:bg-green-600';
        }

        // Different colors based on seat type
        switch (seat.seatType) {
            case 'VIP':
                return 'bg-purple-700 text-white cursor-pointer hover:bg-purple-800';
            default:
                return 'bg-gray-700 text-white cursor-pointer hover:bg-gray-800';
        }
    };

    const handleBookingSubmit = async () => {
        if (!isAuthenticated) {
            // Redirect to login page with a redirect back to this page
            navigate(`/login?redirect=/screenings/${screeningId}/seats`);
            return;
        }

        if (selectedSeats.length === 0) {
            alert('Vui lòng chọn ít nhất một ghế');
            return;
        }

        try {
            setIsSubmitting(true);

            const bookingData: CreateBookingRequest = {
                screeningId: parseInt(screeningId!, 10),
                seatIds: selectedSeats.map(seat => seat.id)
            };

            const response = await BookingService.createBooking(bookingData);

            // Redirect to payment page or booking confirmation
            navigate(`/bookings/${response.id}/payment`);
        } catch (err: any) {
            console.error('Error creating booking:', err);
            setError(err.response?.data || 'Failed to create booking. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateTotalPrice = () => {
        if (!screeningData) return 0;
        return selectedSeats.length * screeningData.screening.price;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !screeningData) {
        return (
            <div className="min-h-screen bg-dark text-white py-10 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-900/30 border border-red-500 text-white px-6 py-4 rounded-md mb-8">
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p>{error || 'Failed to load screening data'}</p>
                        <div className="mt-4 flex space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { screening, seatsByRow } = screeningData;
    console.log(seatsByRow);

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Movie and Screening Info */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="mr-4 text-gray-400 hover:text-white"
                        >
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-3xl font-bold">{screening.movieTitle}</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Movie Poster */}
                        <div className="md:col-span-1">
                            <div className="bg-gray-800 rounded-lg overflow-hidden h-80">
                                {screening.moviePoster ? (
                                    <img
                                        src={screening.moviePoster}
                                        alt={screening.movieTitle}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <svg className="h-24 w-24 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Screening Details */}
                        <div className="md:col-span-2">
                            <div className="bg-secondary rounded-lg p-6">
                                <h2 className="text-xl font-semibold mb-4 text-primary">Screening Details</h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Cinema:</span>
                                        <span className="font-medium">{screening.cinemaName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Hall:</span>
                                        <span className="font-medium">{screening.hallName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Date & Time:</span>
                                        <span className="font-medium">
                                            {formatDate(new Date(screening.startTime), 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Price per Seat:</span>
                                        <span className="font-medium">{screening.price.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Available Seats:</span>
                                        <span className="font-medium">{screeningData.availableSeats}/{screeningData.totalSeats}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seat Selection Area */}
                <div className="mb-8">
                    <div className="bg-secondary rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-6 text-primary">Select Your Seats</h2>

                        {/* Screen */}
                        <div className="w-full h-8 bg-gray-800 rounded mb-10 flex items-center justify-center">
                            <span className="text-xs text-gray-500">SCREEN</span>
                        </div>

                        {/* Seat Legend */}
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            <div className="flex items-center">
                                <div className="w-8 h-6 bg-gray-700 rounded-sm mr-2"></div>
                                <span className="text-sm">Standard</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-6 bg-purple-700 rounded-sm mr-2"></div>
                                <span className="text-sm">VIP</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-6 bg-green-500 rounded-sm mr-2"></div>
                                <span className="text-sm">Selected</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-6 bg-gray-500 rounded-sm mr-2"></div>
                                <span className="text-sm">Booked</span>
                            </div>
                        </div>

                        {/* Seats Layout */}
                        <div className="overflow-x-auto mb-8">
                            <div className="inline-block min-w-full">
                                <div className="flex flex-col items-center">
                                    {seatsByRow.map((rowData: RowSeats) => (
                                        <div key={rowData.row} className="flex mb-2 items-center">
                                            <div className="w-8 h-8 flex items-center justify-center text-gray-400 mr-2">
                                                {rowData.row}
                                            </div>
                                            <div className="flex gap-2">
                                                {rowData.seats.map((seat: ScreeningSeat) => (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => handleSeatClick(seat)}
                                                        disabled={seat.isBooked}
                                                        className={`w-12 h-8 rounded-sm flex items-center justify-center text-xs font-medium transition-colors ${getSeatClass(seat)}`}
                                                        title={`${seat.row}${seat.number} - ${seat.seatType}`}
                                                    >
                                                        {`${seat.row}${seat.number}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Summary */}
                <div className="mb-8">
                    <div className="bg-secondary rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-primary">Booking Summary</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span>Selected Seats:</span>
                                <span>
                                    {selectedSeats.length > 0
                                        ? selectedSeats
                                            .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number)
                                            .map(seat => `${seat.row}${seat.number}`)
                                            .join(', ')
                                        : 'None'}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total Price:</span>
                                <span className="text-primary">{calculateTotalPrice().toLocaleString()}đ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleBookingSubmit}
                        disabled={selectedSeats.length === 0 || isSubmitting}
                        className={`px-6 py-3 rounded-md font-medium transition ${selectedSeats.length === 0 || isSubmitting
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-red-700'
                            }`}
                    >
                        {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeatBookingPage; 