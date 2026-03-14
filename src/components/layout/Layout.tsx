import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import NotificationDropdown from '../../features/notifications/components/NotificationDropdown';

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
        setIsUserMenuOpen(false);
    };

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.user-menu')) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    return (
        <div className="min-h-screen flex flex-col bg-background text-primary selection:bg-accent selection:text-white">
            {/* Sticky Header */}
            <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 md:px-12 md:py-6 flex justify-between items-center transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-transparent">
                <Link to="/" className="z-30 text-2xl font-display font-bold tracking-tighter hover:opacity-70 transition-opacity">
                    NetruDoc<span className="text-accent">.</span>
                </Link>

                <div className="flex items-center space-x-4">
                    {isAuthenticated && (
                        <>
                            <NotificationDropdown />
                            <div className="relative user-menu">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 text-sm font-medium uppercase tracking-widest hover:text-accent transition-colors"
                                >
                                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span>{user?.name}</span>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-background border border-gray-200 rounded-md shadow-lg z-50">
                                        <div className="py-1">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-primary hover:bg-gray-50"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                to="/notifications"
                                                className="block px-4 py-2 text-sm text-primary hover:bg-gray-50"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                Notifications
                                            </Link>
                                            <Link
                                                to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                                                className="block px-4 py-2 text-sm text-primary hover:bg-gray-50"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-gray-50"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="group flex items-center space-x-2 text-sm font-medium uppercase tracking-widest hover:text-accent transition-colors"
                    >
                        <span>Menu</span>
                        <div className="w-8 h-8 flex flex-col justify-center items-end space-y-1.5 p-1.5">
                            <span className="w-full h-0.5 bg-current transform origin-right transition-all group-hover:w-3/4"></span>
                            <span className="w-3/4 h-0.5 bg-current transform origin-right transition-all group-hover:w-full"></span>
                        </div>
                    </button>
                </div>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <main className="flex-1 pt-24 pb-12 px-6 md:px-12 max-w-[1920px] mx-auto w-full">
                {children}
            </main>

            {/* Footer (Simplified for now) */}
            <footer className="px-6 py-12 md:px-12 border-t border-gray-200 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="text-sm text-secondary">
                        © 2025 NetruDoc. All rights reserved.
                    </div>
                    <div className="flex space-x-6 text-sm">
                        <a href="#" className="hover:underline">Privacy</a>
                        <a href="#" className="hover:underline">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
