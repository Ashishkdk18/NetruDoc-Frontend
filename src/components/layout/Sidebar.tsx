import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../features/auth/authSlice';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    // Close sidebar on route change
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    const handleLogout = () => {
        dispatch(logout());
        onClose();
    };

    interface MenuItem {
        label: string;
        sub: string;
        path: string;
        num: string;
        icon: React.ReactNode;
        onClick?: () => void;
    }

    const menuItems: MenuItem[] = [
        {
            label: 'Home',
            sub: 'DASHBOARD',
            path: '/',
            num: '01',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            label: 'Find Doctors',
            sub: 'BROWSE SPECIALISTS',
            path: '/doctors',
            num: '02',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
    ];

    const generateAuthItems = (): MenuItem[] => {
        if (!isAuthenticated) {
            return [
                {
                    label: 'Login',
                    sub: 'ACCESS ACCOUNT',
                    path: '/login',
                    num: '03',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                },
                {
                    label: 'Register',
                    sub: 'CREATE ACCOUNT',
                    path: '/register',
                    num: '04',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                }
            ];
        }

        const items: MenuItem[] = [
            {
                label: 'Dashboard',
                sub: 'MY OVERVIEW',
                path: user?.role === 'doctor' ? '/doctor/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/dashboard',
                num: '03',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                        <rect x="3" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="14" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="14" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="3" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )
            },
            {
                label: 'Notifications',
                sub: 'RECENT ALERTS',
                path: '/notifications',
                num: '04',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )
            },
        ];

        // Role specific items
        if (user?.role === 'admin') {
            items.push(
                {
                    label: 'Analytics',
                    sub: 'SYSTEM STATS',
                    path: '/admin/analytics',
                    num: '05',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                },
                {
                    label: 'Audit Logs',
                    sub: 'SECURITY',
                    path: '/admin/audit-logs',
                    num: '06',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                }
            );
        } else if (user?.role === 'doctor') {
            items.push(
                {
                    label: 'Schedule',
                    sub: 'APPOINTMENTS',
                    path: '/appointments/doctor/schedule',
                    num: '05',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                },
                {
                    label: 'Availability',
                    sub: 'WORKING HOURS',
                    path: '/profile/availability',
                    num: '06',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                }
            );
        } else {
            // Patient specific (or general authenticated)
            items.push(
                {
                    label: 'Medical Records',
                    sub: 'HEALTH HISTORY',
                    path: '/medical-records',
                    num: '05',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                },
                {
                    label: 'Prescriptions',
                    sub: 'MEDICATIONS',
                    path: '/prescriptions',
                    num: '06',
                    icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="m8.5 8.5 7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )
                }
            );
        }

        // Add common trailing items
        const nextNum = items.length + 3;
        items.push(
            {
                label: 'Profile',
                sub: 'PERSONAL INFO',
                path: '/profile',
                num: String(nextNum).padStart(2, '0'),
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )
            },
            {
                label: 'Logout',
                sub: 'EXIT ACCOUNT',
                path: '#',
                num: String(nextNum + 1).padStart(2, '0'),
                onClick: handleLogout,
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )
            }
        );

        return items;
    };

    const allItems: MenuItem[] = [...menuItems, ...generateAuthItems()];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity duration-300 z-[2000] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-[#f3f2f0] shadow-2xl z-[2001] transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full p-6 md:p-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center space-x-3">
                            <div className="bg-[#6b6b5d] p-2 rounded-xl text-white">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                                    <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                                    <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-2xl font-display font-semibold text-[#3a3a3a]">NetruDoc</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#e5e4de] rounded-full transition-colors group"
                        >
                            <svg className="w-8 h-8 text-[#3a3a3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Items - Scrollable Area */}
                    <nav className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar transition-all">
                        {allItems.map((item) => {
                            const isActive = location.pathname === item.path;

                            if (item.onClick) {
                                return (
                                    <button
                                        key={item.label}
                                        onClick={item.onClick}
                                        className={`w-full group flex items-center p-4 rounded-[1.5rem] transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-[#e5e4de] shadow-sm' 
                                            : 'hover:bg-[#e5e4de]/50'
                                        }`}
                                    >
                                        <div className="w-16 h-16 shrink-0 bg-[#e5e4de] rounded-2xl flex items-center justify-center text-[#3a3a3a] mr-5">
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-2xl font-display font-medium text-[#3a3a3a] leading-tight uppercase">
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] font-sans font-bold text-[#8a8a8a] tracking-widest mt-1 uppercase">
                                                {item.sub}
                                            </span>
                                        </div>
                                        <span className="ml-auto text-sm font-sans font-medium text-[#ababab]/60 pr-2">
                                            {item.num}
                                        </span>
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`w-full group flex items-center p-4 rounded-[1.5rem] transition-all duration-300 ${
                                        isActive 
                                        ? 'bg-[#e5e4de] shadow-sm' 
                                        : 'hover:bg-[#e5e4de]/50'
                                    }`}
                                >
                                    <div className="w-16 h-16 shrink-0 bg-[#e5e4de] rounded-2xl flex items-center justify-center text-[#3a3a3a] mr-5">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-2xl font-display font-medium text-[#3a3a3a] leading-tight uppercase">
                                            {item.label}
                                        </span>
                                        <span className="text-[10px] font-sans font-bold text-[#8a8a8a] tracking-widest mt-1 uppercase">
                                            {item.sub}
                                        </span>
                                    </div>
                                    <span className="ml-auto text-sm font-sans font-medium text-[#ababab]/60 pr-2">
                                        {item.num}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Contact Section - Sticks to bottom but stays in flex flow */}
                    <div className="mt-8 pt-4 shrink-0 bg-[#e5e4de] rounded-[2rem] p-8 space-y-6">
                        <div>
                            <span className="text-[10px] font-sans font-bold text-[#8a8a8a] tracking-[0.2em] uppercase block mb-4">
                                Contact
                            </span>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-3 group cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-[#ababab]" />
                                    <span className="text-[#3a3a3a] font-medium">info@netrudoc.com</span>
                                </li>
                                <li className="flex items-center space-x-3 group cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-[#ababab]" />
                                    <span className="text-[#3a3a3a] font-medium">+1 (555) 123-4567</span>
                                </li>
                            </ul>
                        </div>

                        {/* Status Badge */}
                        <div className="inline-flex items-center space-x-2 bg-[#f3f2f0]/60 border border-[#d1d1ca] py-2 px-4 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-[#a3c2a3] animate-pulse" />
                            <span className="text-xs font-sans text-[#6b6b5d] font-semibold">
                                Doctors available now
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
