import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  // Log darkMode changes for debugging
  useEffect(() => {
    console.log('HomePage - darkMode changed to:', darkMode);
  }, [darkMode]);

  const handleConnectAccount = () => {
    // Redirect to dashboard where the actual connection happens
    navigate('/dashboard');
  };

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* User Info Bar */}
      <div className="absolute top-5 right-5 flex items-center gap-3">
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
        
        {isLoggedIn && user && (
          <>
            <div className="bg-green-500 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1 rounded text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">WhatsApp Business Platform</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            Connect your WhatsApp Business Account and manage customer communications seamlessly with our powerful platform.
          </p>

          {/* Features Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-8 mb-12 text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Features</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-500 font-bold text-xl mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Connect multiple WhatsApp Business Accounts</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold text-xl mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Receive real-time webhook notifications</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold text-xl mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Manage customer conversations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold text-xl mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Automate responses and workflows</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold text-xl mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Track message delivery and read status</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold text-xl mr-3">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Centralized dashboard for all your accounts</span>
              </li>
            </ul>
          </div>

          {/* Auth Section */}
          {!isLoggedIn ? (
            <div className="mb-12">
              <p className="text-gray-700 dark:text-gray-300 mb-6">Please log in or sign up to connect your WhatsApp Business Account</p>
              <button
                onClick={() => navigate('/auth')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200"
              >
                Login / Sign Up
              </button>
            </div>
          ) : (
            <div className="mb-12">
              <p className="text-gray-700 dark:text-gray-300 mb-6">Welcome back! You're logged in and ready to manage your WhatsApp accounts.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleConnectAccount}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200"
                >
                  Connect Another Account
                </button>
              </div>
            </div>
          )}

          {/* Response Area */}
          <div id="response" className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-left break-all max-w-2xl mx-auto hidden text-gray-900 dark:text-white">
            Your Platform API Key and Account IDs will appear here.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;