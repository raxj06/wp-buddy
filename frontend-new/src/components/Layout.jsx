import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'bg-primary/10 text-primary font-bold' : 'text-text-main hover:bg-gray-100';
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                            <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-[#111714] whitespace-nowrap">Wapp Flo</h1>
                            <p className="text-xs text-text-secondary whitespace-nowrap">Business API</p>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    <Link to="/dashboard" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/dashboard')}`}>
                        <span className="material-symbols-outlined mr-3">dashboard</span>
                        Dashboard
                    </Link>
                    <Link to="/inbox" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/inbox')}`}>
                        <span className="material-symbols-outlined mr-3">chat</span>
                        Inbox
                    </Link>
                    <Link to="/automation" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/automation')}`}>
                        <span className="material-symbols-outlined mr-3">smart_toy</span>
                        Automation
                    </Link>
                    <Link to="/campaigns" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/campaigns')}`}>
                        <span className="material-symbols-outlined mr-3">campaign</span>
                        Campaigns
                    </Link>
                    <Link to="/contacts" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/contacts')}`}>
                        <span className="material-symbols-outlined mr-3">contacts</span>
                        Contacts
                    </Link>
                    <Link to="/analytics" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/analytics')}`}>
                        <span className="material-symbols-outlined mr-3">bar_chart</span>
                        Analytics
                    </Link>
                    <Link to="/settings" className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${isActive('/settings')}`}>
                        <span className="material-symbols-outlined mr-3">settings</span>
                        Settings
                    </Link>
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 md:px-8">
                    <div className="md:hidden">
                        <Link to="/" className="text-xl font-bold text-[#111714]">Wapp Flo</Link>
                    </div>

                    <div className="flex items-center space-x-4 ml-auto">
                        <button className="p-2 text-gray-400 hover:text-primary transition-colors relative">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">U</div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
