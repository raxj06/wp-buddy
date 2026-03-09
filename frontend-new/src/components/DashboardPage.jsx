import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [responseMessage, setResponseMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [authCode, setAuthCodeState] = useState(null);
    const [sessionInfo, setSessionInfoState] = useState(null);

    // Refs to store current values for event listeners
    const authCodeRef = useRef(authCode);
    const sessionInfoRef = useRef(sessionInfo);

    useEffect(() => {
        authCodeRef.current = authCode;
    }, [authCode]);

    useEffect(() => {
        sessionInfoRef.current = sessionInfo;
    }, [sessionInfo]);

    const setAuthCode = (code) => {
        console.log('setAuthCode called with:', code);
        setAuthCodeState(code);
    };

    const setSessionInfo = (info) => {
        console.log('setSessionInfo called with:', info);
        setSessionInfoState(info);
    };

    // Fetch connected accounts
    const fetchConnectedAccounts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/whatsapp/accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setAccounts(data.accounts);
            } else {
                console.error('Error fetching accounts:', data.error);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchConnectedAccounts();
        }
    }, [user, fetchConnectedAccounts]);

    // Connect WhatsApp account logic
    const launchWhatsAppSignup = () => {
        setResponseMessage('Launching pop-up...');
        if (typeof window.FB === 'undefined') {
            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.onload = () => {
                window.FB.init({
                    appId: '1138116971586519',
                    cookie: true,
                    xfbml: true,
                    version: 'v24.0'
                });
                launchSignup();
            };
            document.head.appendChild(script);
        } else {
            launchSignup();
        }
    };

    const launchSignup = () => {
        window.FB.login(fbLoginCallback, {
            config_id: '1314536956275303',
            response_type: 'code',
            override_default_response_type: true,
            extras: {
                "featureType": "whatsapp_business_app_onboarding",
                "sessionInfoVersion": "3"
            },
            scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management'
        });
    };

    const fbLoginCallback = (response) => {
        if (response.authResponse && response.authResponse.code) {
            const code = response.authResponse.code;
            setAuthCode(code);
            setResponseMessage('Authorization complete. Retrieving session info...');
            setTimeout(tryToSendToServer, 100);
        } else {
            setResponseMessage('User cancelled login or did not fully authorize.');
        }
    };

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== "https://www.facebook.com" && event.origin !== "https://staticxx.facebook.com") return;
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'WA_EMBEDDED_SIGNUP' && (data.event === 'FINISH' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING')) {
                    setSessionInfo(data.data);
                    setTimeout(tryToSendToServer, 100);
                }
            } catch (e) {
                if (typeof event.data === 'string' && event.data.includes('code=')) {
                    const urlParams = new URLSearchParams(event.data);
                    const code = urlParams.get('code');
                    if (code) {
                        setAuthCode(code);
                        setTimeout(tryToSendToServer, 100);
                    }
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const tryToSendToServer = () => {
        const currentAuthCode = authCodeRef.current;
        const currentSessionInfo = sessionInfoRef.current;

        if (currentAuthCode && currentSessionInfo) {
            if (currentSessionInfo.phone_number_id && currentSessionInfo.waba_id) {
                setResponseMessage('Account info received. Finalizing setup...');
                sendDataToServer({ code: currentAuthCode, sessionInfo: currentSessionInfo });
                setAuthCodeState(null);
                setSessionInfoState(null);
            } else {
                setResponseMessage('❌ Error: Session info is missing required fields.');
            }
        }
    };

    const sendDataToServer = async (data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/complete-onboarding-v4', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (responseData.success) {
                setResponseMessage('✅ Account Linked Successfully!');
                setTimeout(fetchConnectedAccounts, 3000);
            } else {
                setResponseMessage(`❌ Error: ${responseData.error}`);
            }
        } catch (error) {
            setResponseMessage('❌ Failed to communicate with server.');
        }
    };

    const showAccountDetails = async (wabaId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/whatsapp/accounts/${wabaId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSelectedAccount(data.account);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error details:', error);
        }
    };

    // Mock data for demo
    const recentConversations = [
        {
            id: 1,
            name: 'Sarah Wilson',
            phone: '+1 (555) 123-4567',
            message: 'I need help with my order #4821...',
            time: '2 min ago'
        },
        {
            id: 2,
            name: 'Michael Chen',
            phone: '+1 (555) 987-6543',
            message: 'Thanks for the quick response!',
            time: '1 hour ago'
        },
        {
            id: 3,
            name: 'Emma Davis',
            phone: '+1 (555) 333-2222',
            message: 'Is the black color back in stock?',
            time: '3 hours ago'
        },
        {
            id: 4,
            name: 'David Miller',
            phone: '+1 (555) 777-8888',
            message: 'Appointment confirmed for tomorrow.',
            time: '5 hours ago'
        }
    ];

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#111714] mb-2">Welcome back, {user?.name || 'Alex'}</h1>
                    <p className="text-text-secondary">Here is your daily activity overview for today.</p>
                </div>

                {/* Response Message */}
                {responseMessage && (
                    <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                        {responseMessage}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-text-secondary text-sm font-medium mb-2">Messages Sent</p>
                        <h3 className="text-3xl font-bold text-[#111714]">12,450</h3>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-text-secondary text-sm font-medium mb-2">Delivered Rate</p>
                        <h3 className="text-3xl font-bold text-[#111714]">98.5%</h3>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-text-secondary text-sm font-medium mb-2">Read Rate</p>
                        <h3 className="text-3xl font-bold text-[#111714]">84%</h3>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-text-secondary text-sm font-medium mb-2">Active Chats</p>
                        <h3 className="text-3xl font-bold text-[#111714]">342</h3>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Message Volume */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-2 text-[#111714]">Message Volume</h3>
                        <p className="text-sm text-text-secondary mb-6">Total interactions over the last 7 days</p>

                        {/* Chart Placeholder */}
                        <div className="h-64 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl flex items-center justify-center border border-primary/10">
                            <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-3 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-sm text-text-secondary">Chart visualization coming soon</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Conversations */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-[#111714]">Recent Conversations</h3>
                            <Link to="/inbox" className="text-sm font-bold text-primary hover:text-[#16a34a] transition-colors">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {recentConversations.map(conv => (
                                <div key={conv.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-bold text-sm">{conv.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-sm text-[#111714]">{conv.name}</h4>
                                            <span className="text-xs text-text-secondary flex-shrink-0">{conv.time}</span>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-1">{conv.phone}</p>
                                        <p className="text-sm text-gray-600 truncate">{conv.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* WhatsApp Account Connection */}
                {accounts.length === 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-lg mb-2 text-[#111714]">Connect Your WhatsApp Business Account</h3>
                                <p className="text-sm text-text-secondary">Link your WhatsApp Business API to start sending messages</p>
                            </div>
                            <button
                                onClick={launchWhatsAppSignup}
                                className="px-6 py-3 bg-primary hover:bg-[#1bc458] text-[#111714] rounded-lg font-bold transition-colors shadow-sm flex-shrink-0"
                            >
                                + Connect Account
                            </button>
                        </div>
                    </div>
                )}

                {/* Connected Accounts List */}
                {accounts.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-[#111714]">Connected WhatsApp Accounts</h3>
                            <button
                                onClick={launchWhatsAppSignup}
                                className="px-4 py-2 bg-primary hover:bg-[#1bc458] text-[#111714] rounded-lg text-sm font-bold transition-colors shadow-sm"
                            >
                                + Add Another
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            {accounts.map(acc => (
                                <div key={acc.waba_id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-sm text-[#111714]">WABA: {acc.waba_id.substring(0, 12)}...</p>
                                        <p className="text-xs text-text-secondary">{acc.phone_number_id ? `Phone: ${acc.phone_number_id}` : 'No Phone ID'}</p>
                                    </div>
                                    <button
                                        onClick={() => showAccountDetails(acc.waba_id)}
                                        className="text-xs text-primary font-bold hover:underline"
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Account Modal */}
            {showModal && selectedAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-[#111714]">Account Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">WABA ID</label>
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded text-[#111714]">{selectedAccount.waba_id}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Access Token</label>
                                <p className="font-mono text-sm bg-gray-100 p-2 rounded truncate text-[#111714]">{selectedAccount.access_token?.substring(0, 20)}...</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-[#111714] font-medium">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DashboardPage;
