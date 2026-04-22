import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalSent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        activeFlows: 0,
        activeContacts: 0
    });

    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Not authenticated');

                const response = await fetch(`${API_BASE_URL}/api/analytics/overview`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch analytics data');
                }

                const data = await response.json();
                setStats(data.stats);
                setChartData(data.chartData);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const maxCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.count), 1) : 1; // Fallback to 1 to avoid div by zero

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#111714]">Analytics Overview</h1>
                        <p className="text-text-secondary text-sm">Track your WhatsApp automation performance</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            Last 7 Days
                        </button>
                    </div>
                </div>

                {/* Metric Cards */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Sent', value: stats.totalSent, icon: 'send', color: 'blue' },
                        { label: 'Delivery Rate', value: stats.totalSent > 0 ? `${((stats.delivered / stats.totalSent) * 100).toFixed(1)}%` : '0%', icon: 'check_circle', color: 'green' },
                        { label: 'Read Rate', value: stats.delivered > 0 ? `${((stats.read / stats.delivered) * 100).toFixed(1)}%` : '0%', icon: 'visibility', color: 'purple' },
                        { label: 'Responses', value: stats.replied, icon: 'forum', color: 'orange' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-[#eef2f0] shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-xl bg-${item.color}-50 flex items-center justify-center mb-4`}>
                                <span className={`material-symbols-outlined text-${item.color}-500 text-[20px]`}>{item.icon}</span>
                            </div>
                            <p className="text-sm font-medium text-text-secondary">{item.label}</p>
                            <h3 className="text-2xl font-bold text-[#111714] mt-1">{item.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Activity Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-[#eef2f0] shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-lg font-bold text-[#111714]">Message Activity</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                                    <span className="text-xs text-text-secondary">Messages Sent</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-64 flex items-end justify-between gap-4">
                            {chartData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="relative w-full flex justify-center">
                                        <div 
                                            className="w-full max-w-[40px] bg-primary/10 rounded-t-lg group-hover:bg-primary/20 transition-all duration-500 ease-out relative"
                                            style={{ height: `${(d.count / maxCount) * 100}%` }}
                                        >
                                            <div 
                                                className="absolute bottom-0 inset-x-0 bg-primary rounded-t-lg transition-all duration-700 delay-100 ease-out"
                                                style={{ height: '30%' }}
                                            ></div>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {d.count} msgs
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Flows */}
                    <div className="bg-white rounded-2xl p-8 border border-[#eef2f0] shadow-sm">
                        <h3 className="text-lg font-bold text-[#111714] mb-6">Device Status</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-green-600">smartphone</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#111714]">Official WABA</p>
                                        <p className="text-xs text-text-secondary">Active & Connected</p>
                                    </div>
                                </div>
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Performance</h4>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Active Contacts', visits: stats.activeContacts, color: 'primary' },
                                        { name: 'Active Flows', visits: stats.activeFlows, color: 'blue' }
                                    ].map((metric, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-[#111714]">{metric.name}</span>
                                                <span className="text-text-secondary">{metric.visits} total</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full bg-${metric.color} rounded-full transition-all duration-1000`}
                                                    style={{ width: `${Math.min((metric.visits / Math.max(stats.activeContacts, 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AnalyticsPage;
