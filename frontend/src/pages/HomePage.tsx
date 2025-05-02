import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MovieService, { Movie } from '../services/movie.service';
import MovieCard from '../components/MovieCard';

const HomePage: React.FC = () => {
    const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
    const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
    const [isLoadingNowShowing, setIsLoadingNowShowing] = useState(true);
    const [isLoadingComingSoon, setIsLoadingComingSoon] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                // Fetch now showing movies
                setIsLoadingNowShowing(true);
                const nowShowing = await MovieService.getNowShowingMovies();
                setNowShowingMovies(nowShowing.slice(0, 6)); // Limit to 6 movies for display
                setIsLoadingNowShowing(false);

                // Fetch coming soon movies
                setIsLoadingComingSoon(true);
                const comingSoon = await MovieService.getComingSoonMovies();
                setComingSoonMovies(comingSoon.slice(0, 6)); // Limit to 6 movies for display
                setIsLoadingComingSoon(false);
            } catch (err) {
                console.error('Error fetching movies:', err);
                setError('Failed to load movies. Please try again later.');
                setIsLoadingNowShowing(false);
                setIsLoadingComingSoon(false);
            }
        };

        fetchMovies();
    }, []);

    // Hero section with banner
    const HeroSection = () => (
        <div className="relative h-96 bg-dark mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black">
                <div className="container mx-auto h-full flex items-center px-4">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Experience Movies Like Never Before</h1>
                        <p className="text-xl text-gray-300 mb-8">Book your tickets now and enjoy the latest blockbusters in premium comfort.</p>
                        <Link
                            to="/movies"
                            className="bg-primary text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-red-700 transition"
                        >
                            Browse All Movies
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    // Movie section component for reuse
    const MovieSection = ({
        title,
        movies,
        isLoading,
        viewAllLink
    }: {
        title: string;
        movies: Movie[];
        isLoading: boolean;
        viewAllLink: string
    }) => (
        <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <Link to={viewAllLink} className="text-primary hover:text-red-400 font-medium">
                    View All
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : movies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            ) : (
                <div className="bg-secondary/50 rounded-lg p-8 text-center">
                    <p className="text-gray-400">No movies available at the moment.</p>
                </div>
            )}
        </section>
    );

    return (
        <div className="bg-dark text-white">
            <HeroSection />

            <div className="container mx-auto px-4 py-6">
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-white px-6 py-4 rounded-md mb-8">
                        <h2 className="text-xl font-bold mb-2">Error</h2>
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 bg-primary text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <MovieSection
                    title="Now Showing"
                    movies={nowShowingMovies}
                    isLoading={isLoadingNowShowing}
                    viewAllLink="/movies?filter=now-showing"
                />

                <MovieSection
                    title="Coming Soon"
                    movies={comingSoonMovies}
                    isLoading={isLoadingComingSoon}
                    viewAllLink="/movies?filter=coming-soon"
                />

                {/* Cinema section - teaser for cinemas */}
                <section className="mb-16">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Our Cinemas</h2>
                        <Link to="/cinemas" className="text-primary hover:text-red-400 font-medium">
                            View All
                        </Link>
                    </div>

                    <div className="bg-secondary rounded-lg overflow-hidden">
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-semibold mb-4">Discover Our Premium Cinemas</h3>
                            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                                Experience movies in ultimate comfort with state-of-the-art technology and premium seating at our cinemas across the city.
                            </p>
                            <Link
                                to="/cinemas"
                                className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-red-700 transition"
                            >
                                Explore Cinemas
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default HomePage; 