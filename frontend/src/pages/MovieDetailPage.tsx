import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MovieService, { Movie } from '../services/movie.service';
import AuthService from '../services/auth.service';

interface Screening {
    id: number;
    startTime: string;
    endTime: string;
    price: number;
    status: string;
    cinemaHall: {
        id: number;
        name: string;
        cinema: {
            id: number;
            name: string;
            address: string;
        };
    };
}

const MovieDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [screenings, setScreenings] = useState<Screening[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isLoggedIn = AuthService.isLoggedIn();
    const isMounted = useRef(true);
    const navigate = useNavigate();

    // Debug effect to track loading state changes
    useEffect(() => {
        console.log(`Loading state changed to: ${isLoading}`);
    }, [isLoading]);

    const fetchMovieAndScreenings = async () => {
        if (!id) return;

        try {
            if (isMounted.current) {
                console.log('Setting loading state to true');
                setIsLoading(true);
                setError(null); // Clear previous error on retry
            }
            const movieId = parseInt(id);
            console.log(`Fetching movie with ID: ${movieId}`);

            // First fetch movie data
            const movieData = await MovieService.getMovieById(movieId);
            if (!movieData) {
                console.error(`Movie with ID ${movieId} was not found in the database`);
                if (isMounted.current) {
                    setError(`Không tìm thấy phim với ID ${movieId}. Phim này có thể đã bị xóa hoặc chưa được thêm vào hệ thống.`);
                    setIsLoading(false);
                }
                return;
            }

            console.log(`Successfully fetched movie: ${movieData.title}`);
            if (isMounted.current) setMovie(movieData);

            // Then fetch screenings in a try-catch block to avoid blocking if screenings fail
            try {
                const screeningsData = await MovieService.getScreeningsByMovie(movieId);
                console.log(`Fetched ${screeningsData.length} screenings for movie ID ${movieId}`);
                if (isMounted.current) setScreenings(screeningsData);
            } catch (screeningErr) {
                console.error('Error fetching screenings:', screeningErr);
                // Don't set error state, just log the error and continue with empty screenings
                if (isMounted.current) setScreenings([]);
            }

            // Always set loading to false after both data fetches complete or error
            if (isMounted.current) {
                console.log('Setting loading state to false after successful data fetch');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error in MovieDetailPage:', err);
            if (isMounted.current) {
                console.log('Setting loading state to false after error');
                setError('Không thể tải thông tin phim. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Set mounted flag to true when component mounts
        isMounted.current = true;

        // Add a small delay to avoid fetching during navigation transitions
        const timer = setTimeout(() => {
            if (isMounted.current) {
                console.log('Starting data fetch after navigation stabilization');
                fetchMovieAndScreenings();
            }
        }, 50); // Small delay to ensure component is stable

        // Cleanup function to handle component unmounting during data fetching
        return () => {
            console.log('MovieDetailPage unmounting, cleaning up fetch operations');
            clearTimeout(timer);
            isMounted.current = false;
        };
    }, [id]);

    // Group screenings by cinema
    const screeningsByCinema = screenings.reduce((acc, screening) => {
        const cinemaId = screening.cinemaHall.cinema.id;
        if (!acc[cinemaId]) {
            acc[cinemaId] = {
                cinema: screening.cinemaHall.cinema,
                screenings: []
            };
        }
        acc[cinemaId].screenings.push(screening);
        return acc;
    }, {} as Record<number, { cinema: { id: number; name: string; address: string }; screenings: Screening[] }>);

    // Format date for display
    const formatDate = (dateString: string) => {
        const vietnamOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
        const dateInVietnamTime = new Date(new Date(dateString).getTime() - vietnamOffset);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return dateInVietnamTime.toLocaleDateString('en-US', options);
    };

    const handleBookSeats = (screeningId: number) => {
        navigate(`/screenings/${screeningId}/seats`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-300">Đang tải thông tin phim...</p>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-dark">
                <div className="text-center py-10 max-w-md px-4">
                    <p className="text-red-500 mb-4">{error || 'Movie not found'}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={fetchMovieAndScreenings}
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                        >
                            Thử lại
                        </button>
                        <Link
                            to="/movies"
                            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            Quay lại danh sách phim
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link to="/movies" className="text-primary hover:underline flex items-center">
                        <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Quay lại danh sách phim
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Movie Poster */}
                    <div className="lg:w-1/3">
                        <img
                            src={movie.posterUrl || '/placeholder-poster.jpg'}
                            alt={movie.title}
                            className="w-full h-auto rounded-lg shadow-lg"
                        />
                    </div>

                    {/* Movie Details */}
                    <div className="lg:w-2/3">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{movie.title}</h1>

                        <div className="flex flex-wrap gap-4 mb-6">
                            <span className="bg-secondary text-gray-300 px-3 py-1 rounded-full text-sm">
                                {movie.durationMinutes} phút
                            </span>
                            <span className="bg-secondary text-gray-300 px-3 py-1 rounded-full text-sm">
                                {movie.genres || movie.genre || 'Chưa xác định'}
                            </span>
                            {movie.language && (
                                <span className="bg-secondary text-gray-300 px-3 py-1 rounded-full text-sm">
                                    {movie.language}
                                </span>
                            )}
                            <span className="bg-secondary text-gray-300 px-3 py-1 rounded-full text-sm">
                                {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-white mb-2">Nội dung</h2>
                            <p className="text-gray-300">{movie.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {movie.director && (
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-2">Đạo diễn</h2>
                                    <p className="text-gray-300">{movie.director}</p>
                                </div>
                            )}
                            {movie.actors && (
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-2">Diễn viên</h2>
                                    <p className="text-gray-300">{movie.actors}</p>
                                </div>
                            )}
                        </div>

                        {movie.trailerUrl && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-white mb-2">Trailer</h2>
                                <iframe
                                    width="100%"
                                    height="315"
                                    src={movie.trailerUrl}
                                    title="Trailer"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                    </div>
                </div>

                {/* Screenings Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Lịch chiếu phim</h2>

                    {Object.values(screeningsByCinema).length === 0 ? (
                        <div className="bg-secondary rounded-lg p-6">
                            <p className="text-gray-300 text-center">Không có suất chiếu nào cho phim này.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.values(screeningsByCinema).map(({ cinema, screenings }) => (
                                <div key={cinema.id} className="bg-secondary rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-4">
                                        {cinema.name} - {cinema.address}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {screenings.map((screening) => (
                                            <div key={screening.id} className="border border-gray-700 rounded-lg p-4 hover:bg-secondary/80 transition-colors">
                                                <div className="mb-2">
                                                    <span className="text-primary font-medium">
                                                        {formatDate(screening.startTime)}
                                                    </span>
                                                </div>
                                                <div className="mb-2">
                                                    <span className="text-sm text-gray-400">Phòng:</span>{' '}
                                                    <span className="text-white">{screening.cinemaHall.name}</span>
                                                </div>
                                                <div className="mb-3">
                                                    <span className="text-sm text-gray-400">Giá:</span>{' '}
                                                    <span className="text-white font-medium">{screening.price.toLocaleString()}đ</span>
                                                </div>
                                                <button
                                                    onClick={() => handleBookSeats(screening.id)}
                                                    className="w-full bg-primary text-white py-2 rounded hover:bg-red-700 transition"
                                                >
                                                    Đặt vé
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetailPage;