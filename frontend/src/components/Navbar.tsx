import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check login status and get user data on component mount and when location changes
        const checkLoginStatus = async () => {
            setIsLoggedIn(AuthService.isLoggedIn());
            try {
                if (AuthService.isLoggedIn()) {
                    // Thử lấy dữ liệu từ API trước
                    const apiUserData = await AuthService.fetchCurrentUser();

                    if (apiUserData) {
                        setCurrentUser(apiUserData);
                    } else {
                        // Sử dụng dữ liệu từ localStorage nếu API thất bại
                        const localUserData = AuthService.getCurrentUser();
                        setCurrentUser(localUserData);
                    }
                }
            } catch (error) {
                console.error('Error getting current user:', error);
                // Sử dụng dữ liệu từ localStorage nếu API thất bại
                const localUserData = AuthService.getCurrentUser();
                setCurrentUser(localUserData);
            }
        };

        checkLoginStatus();

        // Close the profile menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [location]); // Re-run when location changes, which happens after login redirect

    const handleLogout = () => {
        AuthService.logout();
        setIsLoggedIn(false);
        setCurrentUser(null);
        navigate('/login');
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    return (
        <nav className="bg-secondary shadow-md">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="sr-only">Open main menu</span>
                            {/* Hamburger icon */}
                            <svg
                                className="block h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-bold text-primary">
                                CineTicket
                            </Link>
                        </div>
                        <div className="hidden sm:block sm:ml-6">
                            <div className="flex space-x-4">
                                <Link
                                    to="/"
                                    className="text-gray-300 hover:bg-primary hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/movies"
                                    className="text-gray-300 hover:bg-primary hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Movies
                                </Link>
                                <Link
                                    to="/cinemas"
                                    className="text-gray-300 hover:bg-primary hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Cinemas
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        {isLoggedIn ? (
                            <div className="flex items-center relative" ref={profileMenuRef}>
                                <button
                                    onClick={toggleProfileMenu}
                                    className="text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                                >
                                    <span className="mr-1">
                                        {currentUser?.firstName && currentUser?.lastName
                                            ? `${currentUser.firstName} ${currentUser.lastName}`
                                            : currentUser?.email || 'User'}
                                    </span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d={isProfileMenuOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                                        />
                                    </svg>
                                </button>

                                {/* Profile Dropdown Menu */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 top-full w-48 rounded-md shadow-lg bg-dark ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1 bg-secondary rounded-md" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-white"
                                                role="menuitem"
                                            >
                                                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Profile
                                            </Link>
                                            <Link
                                                to="/profile/change-password"
                                                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-white"
                                                role="menuitem"
                                            >
                                                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Change Password
                                            </Link>
                                            <div className="border-t border-gray-700 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-primary hover:text-white w-full text-left"
                                                role="menuitem"
                                            >
                                                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <Link
                                    to="/login"
                                    className="text-gray-300 hover:bg-primary hover:text-white px-3 py-2 rounded-md text-sm font-medium mr-2"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="sm:hidden" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <Link
                            to="/"
                            className="text-gray-300 hover:bg-primary hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Home
                        </Link>
                        <Link
                            to="/movies"
                            className="text-gray-300 hover:bg-primary hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Movies
                        </Link>
                        <Link
                            to="/cinemas"
                            className="text-gray-300 hover:bg-primary hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        >
                            Cinemas
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar; 