import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../features/auth/authSlice';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    // Close sidebar on route change
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
        onClose();
    };

    // Base menu items that are always shown
    const baseMenuItems = [
        { label: 'Home', path: '/' },
        { label: 'Find Doctors', path: '/doctors' },
    ];

    // Authenticated menu items (admin goes to admin dashboard only)
    const authenticatedMenuItems = [
        {
            label: 'Dashboard',
            path: user?.role === 'doctor' ? '/doctor/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/dashboard',
        },
        { label: 'Notifications', path: '/notifications' },
        { label: 'Medical Records', path: '/medical-records' },
        { label: 'Prescriptions', path: '/prescriptions' },
        { label: 'Payment History', path: '/payments/history' },
        { label: 'Profile', path: '/profile' },
    ];

    // Unauthenticated menu items
    const unauthenticatedMenuItems = [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
    ];

    // Combine menu items based on authentication state
    const menuItems = [
        ...baseMenuItems,
        ...(isAuthenticated ? authenticatedMenuItems : unauthenticatedMenuItems),
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 z-40 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-background border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-8 md:p-12">
                    <div className="flex justify-end mb-12">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                        >
                            <span className="sr-only">Close menu</span>
                            <svg className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex-1 flex flex-col justify-center space-y-6">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="group flex items-center space-x-4 text-3xl md:text-5xl font-display font-medium text-primary hover:opacity-100 opacity-60 transition-all duration-300"
                            >
                                <span className="text-sm font-sans font-medium text-secondary group-hover:text-primary transition-colors transform -translate-y-2">+</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        {isAuthenticated && (
                            <>
                                {user?.role === 'admin' && (
                                    <>
                                        <Link
                                            to="/admin/analytics"
                                            className="group flex items-center space-x-4 text-2xl md:text-3xl font-display font-medium text-primary hover:opacity-100 opacity-60 transition-all duration-300"
                                        >
                                            <span className="text-sm font-sans font-medium text-secondary group-hover:text-primary transition-colors transform -translate-y-2">+</span>
                                            <span>Analytics</span>
                                        </Link>
                                        <Link
                                            to="/admin/audit-logs"
                                            className="group flex items-center space-x-4 text-2xl md:text-3xl font-display font-medium text-primary hover:opacity-100 opacity-60 transition-all duration-300"
                                        >
                                            <span className="text-sm font-sans font-medium text-secondary group-hover:text-primary transition-colors transform -translate-y-2">+</span>
                                            <span>Audit Logs</span>
                                        </Link>
                                    </>
                                )}
                                {user?.role === 'doctor' && (
                                    <>
                                        <Link
                                            to="/appointments/doctor/schedule"
                                            className="group flex items-center space-x-4 text-2xl md:text-3xl font-display font-medium text-primary hover:opacity-100 opacity-60 transition-all duration-300"
                                        >
                                            <span className="text-sm font-sans font-medium text-secondary group-hover:text-primary transition-colors transform -translate-y-2">+</span>
                                            <span>My Schedule</span>
                                        </Link>
                                        <Link
                                            to="/profile/availability"
                                            className="group flex items-center space-x-4 text-2xl md:text-3xl font-display font-medium text-primary hover:opacity-100 opacity-60 transition-all duration-300"
                                        >
                                            <span className="text-sm font-sans font-medium text-secondary group-hover:text-primary transition-colors transform -translate-y-2">+</span>
                                            <span>Availability</span>
                                        </Link>
                                    </>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="group flex items-center space-x-4 text-3xl md:text-5xl font-display font-medium text-primary hover:opacity-100 opacity-60 transition-all duration-300 text-left"
                                >
                                    <span className="text-sm font-sans font-medium text-secondary group-hover:text-primary transition-colors transform -translate-y-2">+</span>
                                    <span>Logout</span>
                                </button>
                            </>
                        )}
                    </nav>

                    <div className="mt-auto space-y-4">
                        <div className="text-sm font-sans text-secondary uppercase tracking-widest mb-4">Contact</div>
                        <p className="text-primary text-lg">info@netrudoc.com</p>
                        <p className="text-primary text-lg">+1 (555) 123-4567</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
