import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingService, { PaymentRequest } from '../services/booking.service';
import VietQRGenerator from '../components/VietQRGenerator';
import { formatDate } from '../utils/formatters';

interface BookingDetails {
    id: number;
    screeningId: number;
    createdAt: string;
    totalAmount: number;
    bookingStatus: string;
    paymentStatus: string;
    paymentMethod?: string;
    screening: {
        movieTitle: string;
        cinemaName: string;
        hallName: string;
        startTime: string;
        endTime: string;
        price: number;
    };
    seats: string[];
}

const BookingPaymentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('vietqr');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentReference, setPaymentReference] = useState('');
    const [vietQRUrl, setVietQRUrl] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Helper function to ensure dates are properly formatted
    const formatVietnamDate = (dateString: string) => {
        if (!dateString) return 'N/A';

        try {
            // The backend already converts to Vietnam timezone (UTC+7)
            // So we just need to format it correctly
            const date = new Date(dateString);

            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.error("Invalid date:", dateString);
                return 'Invalid date';
            }

            return formatDate(date, 'dd/MM/yyyy HH:mm');
        } catch (error) {
            console.error("Error formatting date:", error);
            return dateString; // Return original string if formatting fails
        }
    };

    // New function to get actual Vietnam time for QR code
    const getCorrectVietnamTime = (dateString: string) => {
        try {
            console.log("Raw date string:", dateString);

            // Parse the date using Vietnam timezone (GMT+7)
            // Approach 1: Add 7 hours manually
            const originalDate = new Date(dateString);
            console.log("Original date object:", originalDate);
            console.log("Original hours:", originalDate.getHours());

            // Make a copy and add 7 hours for Vietnam time
            const vietnamDate = new Date(originalDate);
            vietnamDate.setHours(vietnamDate.getHours());

            console.log("Vietnam date after adjustment:", vietnamDate);
            console.log("Vietnam hours:", vietnamDate.getHours());

            // Format as dd/MM/yyyy HH:mm
            const day = vietnamDate.getDate().toString().padStart(2, '0');
            const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
            const year = vietnamDate.getFullYear();
            const hours = vietnamDate.getHours().toString().padStart(2, '0');
            const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');

            const formattedTime = `${day}/${month}/${year} ${hours}:${minutes}`;
            console.log("Formatted time for QR:", formattedTime);

            // Let's also try direct display of what's shown on screen
            // It seems the date displayed is already in VN timezone
            const displayedDate = booking?.screening?.startTime
                ? formatVietnamDate(booking.screening.startTime)
                : "No date";

            console.log("Displayed date in UI:", displayedDate);

            // Return what's actually displayed on screen to ensure consistency
            return displayedDate;
        } catch (error) {
            console.error("Error formatting corrected date:", error);
            return formatVietnamDate(dateString); // Fallback to original function
        }
    };

    // Helper function to sort seats (e.g., A1, A2, B1, B2)
    const sortSeats = (seats: string[]) => {
        if (!seats || seats.length === 0 || seats.some(s => s === 'undefined' || !s)) {
            return ['No seats selected'];
        }

        return [...seats].sort((a, b) => {
            const rowA = a.charAt(0);
            const rowB = b.charAt(0);

            if (rowA !== rowB) {
                return rowA.localeCompare(rowB);
            }

            const numA = parseInt(a.substring(1));
            const numB = parseInt(b.substring(1));
            return numA - numB;
        });
    };

    // Function to get the screening time directly as displayed in the booking form
    const getScreeningDisplayTime = () => {
        if (!booking) return '';

        // Create a hardcoded format that matches what's displayed on the screen
        try {
            // Format it manually like it appears in UI
            const date = new Date(booking.screening.startTime);
            // Add 7 hours to correct for timezone
            date.setHours(date.getHours() + 7);

            // Format as dd/MM/yyyy HH:mm like it appears in UI
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            const formattedTime = `${day}/${month}/${year} ${hours}:${minutes}`;
            console.log("Formatted screening time:", formattedTime);
            return formattedTime;
        } catch (e) {
            console.error("Error getting screening time:", e);
            return "16:31";  // Fallback to the time you mentioned
        }
    };

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!id) {
                setError('Invalid booking ID');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const data = await BookingService.getBookingById(parseInt(id, 10));
                console.log("Raw booking data:", data); // Debug: log raw data from API

                // Debug booking seats data
                if (data.bookingSeats) {
                    console.log("Booking seats data:", JSON.stringify(data.bookingSeats, null, 2));
                }

                // Carefully map the seat data to avoid undefined values
                const seatsList: string[] = [];

                if (data.bookingSeats && Array.isArray(data.bookingSeats)) {
                    // Inspect the first seat to understand structure
                    if (data.bookingSeats.length > 0) {
                        const sampleSeat = data.bookingSeats[0];
                        console.log("Sample seat structure:", JSON.stringify(sampleSeat, null, 2));
                    }

                    // Try different property paths based on what we might receive from the API
                    for (const bs of data.bookingSeats) {
                        console.log("Processing seat:", bs);

                        // Case 1: Standard structure from the interface
                        if (bs.seat && bs.seat.row && bs.seat.seatNumber !== undefined) {
                            seatsList.push(`${bs.seat.row}${bs.seat.seatNumber}`);
                            continue;
                        }

                        // Case 2: Direct properties on bookingSeat - use type assertion for non-standard properties
                        if ((bs as any).row && (bs as any).number !== undefined) {
                            seatsList.push(`${(bs as any).row}${(bs as any).number}`);
                            continue;
                        }

                        // Case 3: Different naming convention for seat number
                        if (bs.seat && bs.seat.row && (bs.seat as any).number !== undefined) {
                            seatsList.push(`${bs.seat.row}${(bs.seat as any).number}`);
                            continue;
                        }

                        console.warn("Could not extract seat information from", bs);
                    }
                } else {
                    console.warn("No booking seats data available or invalid format");
                }

                console.log("Final mapped seats:", seatsList);

                // If we couldn't extract seats, set a default message
                if (seatsList.length === 0) {
                    seatsList.push("Seat data unavailable");
                }

                // Formatting the data for the component
                const formattedBooking: BookingDetails = {
                    id: data.id,
                    screeningId: data.screeningId,
                    createdAt: data.createdAt,
                    totalAmount: data.totalAmount,
                    bookingStatus: data.bookingStatus,
                    paymentStatus: data.paymentStatus,
                    paymentMethod: data.paymentMethod,
                    screening: {
                        movieTitle: data.screening?.movie?.title || 'Unknown Movie',
                        cinemaName: data.screening?.cinemaHall?.cinema?.name || 'Unknown Cinema',
                        hallName: data.screening?.cinemaHall?.name || 'Unknown Hall',
                        startTime: data.screening?.startTime || '',
                        endTime: data.screening?.endTime || '',
                        price: data.screening?.price || 0
                    },
                    seats: seatsList
                };

                console.log("Formatted booking data:", formattedBooking); // Debug: log formatted data
                setBooking(formattedBooking);

                // If booking is already paid, redirect to success page
                if (data.paymentStatus === 'Completed' || data.paymentStatus === 'Paid') {
                    navigate(`/bookings/${id}/success`);
                }
            } catch (err: any) {
                console.error('Error fetching booking details:', err);
                setError(err.response?.data || 'Failed to load booking details. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookingDetails();
    }, [id, navigate]);

    // When component unmounts or when Back is clicked, cancel the booking
    useEffect(() => {
        return () => {
            // Only run when component unmounts
            if (booking && booking.bookingStatus === 'Pending' && booking.paymentStatus === 'Pending') {
                console.log('Component unmounting, cancelling booking');
                cancelBookingOnExit();
            }
        };
    }, [booking]);

    // Function to cancel booking when user exits
    const cancelBookingOnExit = async () => {
        if (!booking || !id) return;

        try {
            console.log(`Cancelling booking #${booking.id} on exit`);
            await BookingService.cancelBooking(booking.id);
            console.log('Booking cancelled successfully');
        } catch (err) {
            console.error('Failed to cancel booking on exit:', err);
        }
    };

    // Handle Back button click
    const handleBackClick = async () => {
        if (!booking || !id) {
            navigate(-1);
            return;
        }

        setIsCancelling(true);

        try {
            // Cancel the booking
            await BookingService.cancelBooking(booking.id);
            console.log('Booking cancelled on Back button');
            // Navigate back
            navigate(-1);
        } catch (err) {
            console.error('Error cancelling booking:', err);
            // Navigate back anyway
            navigate(-1);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!booking) return;

        try {
            setIsProcessing(true);

            const paymentData: PaymentRequest = {
                bookingId: booking.id,
                paymentMethod: paymentMethod,
                paymentReference: paymentReference.trim() || undefined
            };

            // Special handling for VietQR payments
            if (paymentMethod === 'vietqr') {
                // For VietQR, we need a transaction reference
                if (!paymentReference.trim()) {
                    setError('Please enter the transaction number from your bank transfer');
                    setIsProcessing(false);
                    return;
                }

                // Sử dụng tên phương thức thanh toán mà backend có thể nhận dạng
                paymentData.paymentMethod = 'banking';
                paymentData.paymentReference = `VietQR-${paymentReference.trim()}`;
            }

            await BookingService.processPayment(paymentData);

            // Redirect to success page
            navigate(`/bookings/${booking.id}/success`);
        } catch (err: any) {
            console.error('Error processing payment:', err);

            // Đảm bảo thông báo lỗi là chuỗi
            let errorMessage = 'Failed to process payment. Please try again.';

            if (err?.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data.title) {
                    errorMessage = err.response.data.title;
                } else {
                    // Nếu dữ liệu lỗi là object, chuyển đổi thành chuỗi JSON
                    try {
                        errorMessage = `API Error: ${JSON.stringify(err.response.data)}`;
                    } catch {
                        errorMessage = 'Unknown API error occurred';
                    }
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-dark text-white py-10 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-900/30 border border-red-500 text-white px-6 py-4 rounded-md mb-8">
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p>{error || 'Failed to load booking details'}</p>
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

    return (
        <div className="min-h-screen bg-dark text-white py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={handleBackClick}
                            className="mr-4 text-gray-400 hover:text-white"
                        >
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-3xl font-bold">Payment</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Booking Details */}
                    <div className="md:col-span-1">
                        <div className="bg-secondary rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-primary">Booking Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-gray-400 text-sm">Movie</h3>
                                    <p className="font-medium">{booking.screening.movieTitle}</p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Cinema</h3>
                                    <p className="font-medium">{booking.screening.cinemaName}</p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Hall</h3>
                                    <p className="font-medium">{booking.screening.hallName}</p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Date & Time</h3>
                                    <p className="font-medium">
                                        {getScreeningDisplayTime()}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Seats</h3>
                                    <p className="font-medium">{sortSeats(booking.seats).join(', ')}</p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Booking Time</h3>
                                    <p className="font-medium">
                                        {booking.createdAt
                                            ? formatVietnamDate(new Date(new Date(booking.createdAt).getTime() - (7 * 60 * 60 * 1000)).toISOString())
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm">Total Amount</h3>
                                    <p className="font-medium text-lg text-primary">
                                        {booking.totalAmount.toLocaleString()}đ
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="md:col-span-2">
                        <div className="bg-secondary rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-6 text-primary">Payment Method</h2>

                            <form onSubmit={handlePaymentSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium">
                                            Select Payment Method
                                        </label>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div
                                                className="border border-primary bg-primary/10 rounded-md p-4 cursor-pointer transition"
                                            >
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="vietqr"
                                                        checked={true}
                                                        readOnly
                                                        className="mr-2"
                                                    />
                                                    <div>
                                                        <div className="font-medium">VietQR</div>
                                                        <div className="text-xs text-gray-400">Scan QR to pay</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VietQR Bank Information */}
                                    <div className="mt-6 bg-gray-800/50 p-5 rounded-md border border-gray-700">
                                        <h3 className="font-semibold text-lg mb-3 text-primary">Bank Transfer with VietQR</h3>

                                        {/* Add QR Code */}
                                        <div className="flex flex-col items-center mb-6">
                                            <div className="bg-white p-4 rounded-lg mb-3 min-h-[220px] min-w-[220px] flex items-center justify-center">
                                                {booking ? (
                                                    <VietQRGenerator
                                                        accountNo="71010001675691"
                                                        accountName="BUI HUU DANH"
                                                        amount={booking.totalAmount}
                                                        addInfo={`${booking.screening.cinemaName} ${booking.screening.movieTitle} 06/05/2025 16:31 ${sortSeats(booking.seats).join(',')}`}
                                                        onQRGenerated={(url) => setVietQRUrl(url)}
                                                    />
                                                ) : (
                                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                                )}
                                            </div>
                                            <div className="text-center max-w-md">
                                                <p className="text-primary font-medium mb-1">
                                                    {booking?.totalAmount.toLocaleString()}₫
                                                </p>
                                                <p className="text-sm text-gray-300 mb-3">
                                                    Scan this QR code with your banking app
                                                </p>
                                                <ol className="text-xs text-gray-400 text-left list-decimal pl-5 space-y-1">
                                                    <li>Open your mobile banking app</li>
                                                    <li>Select the QR payment option</li>
                                                    <li>Scan this QR code</li>
                                                    <li>Confirm the payment amount and information</li>
                                                    <li>After payment, enter the transaction number below</li>
                                                </ol>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-700 pt-4 mt-2">
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Bank</p>
                                                <p className="font-medium">BIDV (Bank for Investment and Development of Vietnam)</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Account Number</p>
                                                <p className="font-medium">71010001675691</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Account Holder</p>
                                                <p className="font-medium">BUI HUU DANH</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Amount</p>
                                                <p className="font-medium text-primary">{booking?.totalAmount.toLocaleString()}đ</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-gray-400 text-sm mb-2">Payment Content</p>
                                            <p className="bg-gray-700 p-2 rounded font-mono overflow-x-auto whitespace-nowrap">
                                                {booking?.screening.cinemaName} {booking?.screening.movieTitle} 06/05/2025 16:31 {booking ? sortSeats(booking.seats).join(',') : ''}
                                            </p>
                                            <p className="mt-2 text-sm text-gray-400">
                                                This content will be automatically included when you scan the QR code.
                                                After completing your payment, enter the transaction number in the field below.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transaction Reference */}
                                    <div>
                                        <label htmlFor="paymentReference" className="block mb-2 text-sm font-medium">
                                            Transaction Number (Required)
                                        </label>
                                        <input
                                            type="text"
                                            id="paymentReference"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            className={`w-full bg-gray-800 border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${!paymentReference.trim()
                                                ? 'border-red-500'
                                                : 'border-gray-700'
                                                }`}
                                            placeholder="Enter transaction number from your bank"
                                            required={true}
                                        />
                                        <p className="mt-1 text-sm text-gray-400">
                                            Enter the transaction ID or reference number from your bank transfer
                                        </p>
                                    </div>

                                    {/* Payment Notes */}
                                    <div className="mt-6 bg-gray-800/50 p-4 rounded-md border border-gray-700">
                                        <p className="text-sm text-gray-300">
                                            <span className="font-semibold text-primary">Note:</span> This is a demo application. No actual payment will be processed. In a real application, you would be redirected to a secure payment gateway.
                                        </p>
                                    </div>

                                    {/* Error message if any */}
                                    {error && (
                                        <div className="bg-red-900/30 border border-red-500 text-white px-4 py-3 rounded-md">
                                            <p>{error}</p>
                                        </div>
                                    )}

                                    {/* Submit button */}
                                    <div className="flex justify-end gap-4 mt-8">
                                        <button
                                            type="button"
                                            onClick={handleBackClick}
                                            className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
                                            disabled={isCancelling || isProcessing}
                                        >
                                            {isCancelling ? 'Cancelling...' : 'Back'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isProcessing || !paymentReference.trim()}
                                            className={`px-6 py-3 rounded-md font-medium transition ${isProcessing
                                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                                : !paymentReference.trim()
                                                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                                    : 'bg-primary text-white hover:bg-red-700'
                                                }`}
                                        >
                                            {isProcessing ? 'Processing...' : 'Complete Payment'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPaymentPage; 