import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [responseMessage, setResponseMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [authCode, setAuthCodeState] = useState(null);
  const [sessionInfo, setSessionInfoState] = useState(null);
  const navigate = useNavigate();
  
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

  // Log darkMode changes for debugging
  useEffect(() => {
    console.log('DashboardPage - darkMode changed to:', darkMode);
  }, [darkMode]);

  // Log authCode and sessionInfo changes for debugging
  useEffect(() => {
    console.log('authCode changed to:', authCode);
  }, [authCode]);

  useEffect(() => {
    console.log('sessionInfo changed to:', sessionInfo);
  }, [sessionInfo]);

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
    if (!user) {
      navigate('/auth');
    } else {
      fetchConnectedAccounts();
    }
  }, [user, navigate, fetchConnectedAccounts]);

  // Logout function
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

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
    console.log('Full response object:', JSON.stringify(response, null, 2));

    // Check if we have a proper response with code
    if (response.authResponse && response.authResponse.code) {
      const code = response.authResponse.code;
      console.log('Setting authCode in state:', code);
      setAuthCode(code); // Make sure we're setting the code correctly
      setResponseMessage('Authorization complete. Retrieving session info...');
      console.log('Received auth code from FB.login callback:', code);
      // Check if we also have the 'sessionInfo' from the listener
      setTimeout(() => {
        tryToSendToServer();
      }, 100); // Small delay to ensure state is updated
    } else if (response.status === 'not_authorized' || response.status === 'unknown') {
      setResponseMessage('User cancelled login or did not fully authorize.');
      console.log('Facebook login not authorized or unknown status:', response.status);
      console.log('Full response details:', JSON.stringify(response, null, 2));
    } else {
      setResponseMessage('Unexpected response from Facebook login.');
      console.log('Unexpected Facebook login response:', response);
      if (response.authResponse) {
        console.log('Auth response details:', JSON.stringify(response.authResponse, null, 2));
      }
      if (response.status) {
        console.log('Facebook login status:', response.status);
      }
    }
  };

  // Session logging message event listener
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('Received message event:', event);
      console.log('Event origin:', event.origin);
      console.log('Event data:', event.data);
      
      // Ensure the message is from Facebook
      if (event.origin !== "https://www.facebook.com" && 
          event.origin !== "https://staticxx.facebook.com") {
        console.log('Ignoring message from non-Facebook origin:', event.origin);
        return;
      }

      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message data:', data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('Received Message Event:', data);
          // When the user finishes, the event type is 'FINISH'
          if (data.event === 'FINISH' || data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') {
            setSessionInfo(data.data);
            console.log('Received session info from message event');
            // Check if we also have the 'code' from the other callback
            setTimeout(() => {
              tryToSendToServer();
            }, 100); // Small delay to ensure state is updated
          } else {
            console.log('Received WA_EMBEDDED_SIGNUP event but not FINISH:', data.event);
          }
        }
      } catch (e) {
        // Handle non-JSON messages which may contain the code
        console.log('Non-JSON message received:', event.data);
        // Check if this message contains a code parameter
        if (typeof event.data === 'string' && event.data.includes('code=')) {
          // Extract code from the query string
          const urlParams = new URLSearchParams(event.data);
          const code = urlParams.get('code');
          if (code) {
            console.log('Extracted code from non-JSON message:', code);
            setAuthCode(code);
            // Check if we also have the 'sessionInfo' from the other callback
            setTimeout(() => {
              tryToSendToServer();
            }, 100); // Small delay to ensure state is updated
          }
        }
      }
    };

    console.log('Adding message event listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('Removing message event listener');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Gatekeeper Function - sends data to your backend ONLY when both 'code' and 'sessionInfo' are ready
  const tryToSendToServer = () => {
    const currentAuthCode = authCodeRef.current;
    const currentSessionInfo = sessionInfoRef.current;
    
    console.log('Checking if ready to send to server - authCode:', currentAuthCode ? 'YES' : 'NO', 'sessionInfo:', currentSessionInfo ? 'YES' : 'NO');
    console.log('Current authCode value:', currentAuthCode);
    console.log('Current sessionInfo value:', currentSessionInfo);
    
    // Add additional validation
    if (currentAuthCode && currentSessionInfo) {
      // Validate that sessionInfo has the required fields
      if (currentSessionInfo.phone_number_id && currentSessionInfo.waba_id) {
        setResponseMessage('Account info received. Finalizing setup...');
        console.log('Sending data to server:', { code: currentAuthCode, sessionInfo: currentSessionInfo });
        sendDataToServer({ code: currentAuthCode, sessionInfo: currentSessionInfo });
        // Clear the variables after sending
        setAuthCodeState(null);
        setSessionInfoState(null);
      } else {
        console.log('Session info missing required fields:', currentSessionInfo);
        setResponseMessage('❌ Error: Session info is missing required fields. Please try again.');
      }
    } else {
      console.log('Not ready to send to server yet - waiting for both authCode and sessionInfo');
      // Optionally provide feedback to the user
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
      console.log('Sending data to server:', data);
      const token = localStorage.getItem('token');
      const response = await fetch('/complete-onboarding-v4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      console.log('Server response status:', response.status);
      const responseData = await response.json();
      console.log('Server response data:', responseData);
      
      if (responseData.success) {
        // Truncate the long-lived access token for display
        const truncatedToken = responseData.longLivedAccessToken 
          ? `${responseData.longLivedAccessToken.substring(0, 30)}...` 
          : 'N/A';
          
        setResponseMessage(`✅ Account Linked Successfully!
        
Platform API Key: ${responseData.platformApiKey}
WhatsApp Business Account ID (WABA ID): ${responseData.wabaId}
Phone Number ID: ${responseData.phoneNumberId}
Long-Lived Access Token: ${truncatedToken}`);
        
        // Refresh accounts list
        console.log('Refreshing accounts list...');
        setTimeout(() => {
          fetchConnectedAccounts();
        }, 3000); // Increase delay to ensure the database is updated
      } else {
        console.error('Server returned error:', responseData.error);
        setResponseMessage(`❌ Error: ${responseData.error || 'An unknown error occurred.'}`);
      }
    } catch (error) {
      console.error('Error communicating with backend:', error);
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
      } else {
        console.error('Error fetching account details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  };

  // Close modal
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold mr-3">
              W
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">WhatsApp Business Platform</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            {user && (
              <>
                <div className="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900 dark:text-white">{user.name}</span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Dashboard</h1>

        {/* Connect Account Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect WhatsApp Account</h2>
            <button
              onClick={launchWhatsAppSignup}
              className="mt-4 md:mt-0 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
            >
              Connect Account
            </button>
          </div>
          {responseMessage && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm text-gray-900 dark:text-white overflow-x-auto">
              <pre className="whitespace-pre-wrap break-words">{responseMessage}</pre>
            </div>
          )}
        </div>

        {/* Connected Accounts Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Connected Accounts</h2>
          
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">No WhatsApp accounts connected yet</p>
              <button
                onClick={launchWhatsAppSignup}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
              >
                Connect Your First Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(account => (
                <div key={account.waba_id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow dark:bg-gray-700 dark:hover:bg-gray-600">
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">WhatsApp Business Account</h3>
                  <div className="space-y-3 mb-6">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">WABA ID:</span>
                      <span className="font-mono ml-2 text-gray-900 dark:text-white">{account.waba_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Phone ID:</span>
                      <span className="font-mono ml-2 text-gray-900 dark:text-white">{account.phone_number_id || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => showAccountDetails(account.waba_id)}
                    className="w-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Account Details Modal */}
      {showModal && selectedAccount && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100 border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Account Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">WhatsApp Business Account</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">WABA ID:</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded mr-2 text-gray-900 dark:text-white">{selectedAccount.waba_id}</span>
                    <button
                      id="copyWabaIdBtn"
                      onClick={() => copyToClipboard(selectedAccount.waba_id, 'copyWabaIdBtn')}
                      className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 px-3 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center text-gray-900 dark:text-white"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Phone Number ID:</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded mr-2 text-gray-900 dark:text-white">
                      {selectedAccount.phone_number_id || 'N/A'}
                    </span>
                    {selectedAccount.phone_number_id && (
                      <button
                        id="copyPhoneNumberBtn"
                        onClick={() => copyToClipboard(selectedAccount.phone_number_id, 'copyPhoneNumberBtn')}
                        className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 px-3 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center text-gray-900 dark:text-white"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">API Credentials</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Platform API Key:</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded mr-2 text-gray-900 dark:text-white">
                      {selectedAccount.platform_api_key ? selectedAccount.platform_api_key.substring(0, 15) + '...' : '••••••••'}
                    </span>
                    {selectedAccount.platform_api_key && (
                      <button
                        id="copyApiKeyBtn"
                        onClick={() => copyToClipboard(selectedAccount.platform_api_key, 'copyApiKeyBtn')}
                        className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 px-3 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center text-gray-900 dark:text-white"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Access Token:</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded mr-2 text-gray-900 dark:text-white">
                      {selectedAccount.access_token ? selectedAccount.access_token.substring(0, 15) + '...' : '••••••••'}
                    </span>
                    {selectedAccount.access_token && (
                      <button
                        id="copyTokenBtn"
                        onClick={() => copyToClipboard(selectedAccount.access_token, 'copyTokenBtn')}
                        className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 px-3 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center text-gray-900 dark:text-white"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">Account Information</h3>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300 block mb-1">Created At:</span>
                  <span className="text-gray-800 dark:text-gray-200">{new Date(selectedAccount.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end">
              <button
                onClick={closeModal}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-lg transition duration-200 shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;