import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [authCode, setAuthCodeState] = useState(null);
  const [sessionInfo, setSessionInfoState] = useState(null);

  // Refs to store current values
  const authCodeRef = useRef(authCode);
  const sessionInfoRef = useRef(sessionInfo);

  // Update refs when state changes
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

  // Fetch connected accounts - memoized to prevent unnecessary re-renders
  const fetchConnectedAccounts = useCallback(async () => {
    try {
      console.log('Fetching connected accounts...');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Fetched accounts data:', data);

      if (data.success) {
        console.log('Setting accounts state with:', data.accounts);
        setAccounts(data.accounts);
      } else {
        console.error('Error fetching accounts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  }, []);

  // Check if user is logged in and fetch accounts
  useEffect(() => {
    if (user) {
      fetchConnectedAccounts();
    }
  }, [user, fetchConnectedAccounts]);

  // Connect WhatsApp account
  const launchWhatsAppSignup = () => {
    setResponseMessage('Launching pop-up...');

    // Initialize Facebook SDK if not already loaded
    if (typeof window.FB === 'undefined') {
      console.log('Loading Facebook SDK...');
      // Load Facebook SDK
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.onload = () => {
        console.log('Facebook SDK loaded, initializing...');
        window.FB.init({
          appId: '1138116971586519',
          cookie: true,
          xfbml: true,
          version: 'v24.0'
        });
        console.log('Facebook SDK initialized, launching signup...');
        launchSignup();
      };
      script.onerror = () => {
        console.error('Failed to load Facebook SDK');
        setResponseMessage('❌ Error: Failed to load Facebook SDK. Please try again.');
      };
      document.head.appendChild(script);
    } else {
      console.log('Facebook SDK already loaded, launching signup...');
      launchSignup();
    }
  };

  const launchSignup = () => {
    console.log('Launching Facebook signup...');
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

  // Facebook login callback
  const fbLoginCallback = (response) => {
    console.log('FB Login Response:', response);

    if (response.authResponse && response.authResponse.code) {
      const code = response.authResponse.code;
      console.log('Setting authCode in state:', code);
      setAuthCode(code);
      setResponseMessage('Authorization complete. Retrieving session info...');
      setTimeout(() => {
        tryToSendToServer();
      }, 100);
    } else if (response.status === 'not_authorized' || response.status === 'unknown') {
      setResponseMessage('User cancelled login or did not fully authorize.');
    } else {
      setResponseMessage('Unexpected response from Facebook login.');
    }
  };

  // Session logging message event listener
  useEffect(() => {
    const handleMessage = (event) => {
      // Ensure the message is from Facebook
      if (event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://staticxx.facebook.com") {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
            setSessionInfo(data.data);
            console.log('Received session info from message event');
            setTimeout(() => {
              tryToSendToServer();
            }, 100);
          }
        }
      } catch (e) {
        // Handle non-JSON messages which may contain the code
        if (typeof event.data === 'string' && event.data.includes('code=')) {
          const urlParams = new URLSearchParams(event.data);
          const code = urlParams.get('code');
          if (code) {
            setAuthCode(code);
            setTimeout(() => {
              tryToSendToServer();
            }, 100);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Gatekeeper Function
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
        setResponseMessage('❌ Error: Session info is missing required fields. Please try again.');
      }
    } else {
      if (!currentAuthCode && !currentSessionInfo) {
        setResponseMessage('Waiting for authorization and session information...');
      } else if (!currentAuthCode) {
        setResponseMessage('Waiting for authorization code...');
      } else if (!currentSessionInfo) {
        setResponseMessage('Waiting for session information...');
      }
    }
  };

  // Backend Communication
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
        setTimeout(() => {
          fetchConnectedAccounts();
        }, 3000);
      } else {
        setResponseMessage(`❌ Error: ${responseData.error || 'An unknown error occurred.'}`);
      }
    } catch (error) {
      setResponseMessage('❌ Failed to communicate with the backend server.');
    }
  };

  // Show account details in modal
  const showAccountDetails = async (wabaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/whatsapp/accounts/${wabaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSelectedAccount(data.account);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
  };

  // Copy to clipboard
  const copyToClipboard = (text, elementId) => {
    navigator.clipboard.writeText(text).then(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = '✅ Copied!';
        setTimeout(() => {
          element.textContent = '📋 Copy';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard.');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-white/70">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards - Matching Stitch Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-ai-cyan">
          <div className="text-sm font-medium text-gray-500 dark:text-white/60 mb-1">Total Sent</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">124,502</div>
          <div className="text-xs text-green-500 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +12.5% vs last month
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-ai-purple">
          <div className="text-sm font-medium text-gray-500 dark:text-white/60 mb-1">Delivery Rate</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">98.2%</div>
          <div className="text-xs text-green-500 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +0.8% vs last month
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-ai-pink">
          <div className="text-sm font-medium text-gray-500 dark:text-white/60 mb-1">Read Rate</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">84.5%</div>
          <div className="text-xs text-red-500 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            -2.1% vs last month
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-ai-teal">
          <div className="text-sm font-medium text-gray-500 dark:text-white/60 mb-1">Conversions</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">3,201</div>
          <div className="text-xs text-green-500 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +5.4% vs last month
          </div>
        </div>
      </div>

      {/* Connect Account Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connected Accounts</h2>
              <button
                onClick={launchWhatsAppSignup}
                className="bg-gradient-primary hover:bg-gradient-secondary text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-300 hover:scale-105"
              >
                + Connect Account
              </button>
            </div>

            {responseMessage && (
              <div className="bg-gray-50 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 p-4 rounded-lg font-mono text-sm text-gray-900 dark:text-white overflow-x-auto mb-6">
                <pre className="whitespace-pre-wrap break-words">{responseMessage}</pre>
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Accounts Connected</h3>
                <p className="text-gray-500 dark:text-white/60 mt-1">Connect your first WhatsApp Business account to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div key={account.waba_id} className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700 hover:border-ai-cyan transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white truncate">WABA: {account.waba_id.substring(0, 10)}...</p>
                        <p className="text-sm text-gray-500 dark:text-white/60">{account.phone_number_id ? 'Phone: ' + account.phone_number_id.substring(0, 10) + '...' : 'No Phone ID'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => showAccountDetails(account.waba_id)}
                      className="text-sm font-medium text-ai-cyan hover:text-ai-teal transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setResponseMessage('This feature is coming soon!')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-white group-hover:text-gray-900">New Campaign</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <button
                onClick={() => setResponseMessage('This feature is coming soon!')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-white group-hover:text-gray-900">Add Contact</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <button
                onClick={() => setResponseMessage('This feature is coming soon!')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-white group-hover:text-gray-900">Automation</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Modal */}
      {showModal && selectedAccount && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-8 border-b border-gray-200 dark:border-white/20 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Details</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">WABA ID</h3>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{selectedAccount.waba_id}</code>
                  <button onClick={() => copyToClipboard(selectedAccount.waba_id, 'waba_copy')} id="waba_copy" className="text-blue-500 hover:text-blue-600 text-sm font-medium">Copy</button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Phone Number ID</h3>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">{selectedAccount.phone_number_id || 'N/A'}</code>
                  {selectedAccount.phone_number_id && <button onClick={() => copyToClipboard(selectedAccount.phone_number_id, 'phone_copy')} id="phone_copy" className="text-blue-500 hover:text-blue-600 text-sm font-medium">Copy</button>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Access Token</h3>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm truncate max-w-md">{selectedAccount.access_token ? selectedAccount.access_token.substring(0, 40) + '...' : 'N/A'}</code>
                  {selectedAccount.access_token && <button onClick={() => copyToClipboard(selectedAccount.access_token, 'token_copy')} id="token_copy" className="text-blue-500 hover:text-blue-600 text-sm font-medium">Copy</button>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/20 flex justify-end">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;