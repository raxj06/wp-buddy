import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showDashboardLink, setShowDashboardLink] = useState(false);
  const { login, signup, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  // Log darkMode changes for debugging
  useEffect(() => {
    console.log('AuthPage - darkMode changed to:', darkMode);
  }, [darkMode]);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setShowDashboardLink(true);
    }
  }, []);

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
  };

  const hideMessage = () => {
    setMessage({ text: '', type: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const result = await login(loginData.email, loginData.password);
    
    if (result.success) {
      showMessage('Login successful! Redirecting...', 'success');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      showMessage(result.error, 'error');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    const result = await signup(signupData.name, signupData.email, signupData.password);
    
    if (result.success) {
      showMessage('Account created successfully! Redirecting...', 'success');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      showMessage(result.error, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
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

      <div className="flex flex-col md:flex-row max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700 overflow-hidden">
        {/* Welcome Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-green-500 to-green-600 text-white p-10 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">WhatsApp Business Platform</h1>
          <p className="text-lg mb-8">
            Connect your WhatsApp Business Account and manage customer communications seamlessly.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <span className="font-bold text-xl mr-3">✓</span>
              <span>Connect multiple WhatsApp Business Accounts</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold text-xl mr-3">✓</span>
              <span>Receive real-time webhook notifications</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold text-xl mr-3">✓</span>
              <span>Manage customer conversations</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold text-xl mr-3">✓</span>
              <span>Automate responses and workflows</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold text-xl mr-3">✓</span>
              <span>Track message delivery and read status</span>
            </li>
          </ul>
        </div>
        
        {/* Auth Section */}
        <div className="md:w-1/2 p-10 bg-gray-50 dark:bg-gray-700">
          <div className="max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">Account Access</h2>
            
            <div className="flex mb-8">
              <button
                onClick={() => {
                  setIsLogin(true);
                  hideMessage();
                }}
                className={`flex-1 py-3 font-bold transition-colors rounded-l-lg ${
                  isLogin 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                Login
              </button>
              <div className="w-4"></div>
              <button
                onClick={() => {
                  setIsLogin(false);
                  hideMessage();
                }}
                className={`flex-1 py-3 font-bold transition-colors rounded-r-lg ${
                  !isLogin 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                Sign Up
              </button>
            </div>
            
            {message.text && (
              <div className={`p-4 rounded-lg mb-6 text-center ${
                message.type === 'success' 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
              }`}>
                {message.text}
              </div>
            )}
            
            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLogin}>
                <div className="mb-6">
                  <label htmlFor="loginEmail" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="loginEmail"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="loginPassword" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="loginPassword"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Login
                </button>
              </form>
            ) : (
              // Signup Form
              <form onSubmit={handleSignup}>
                <div className="mb-6">
                  <label htmlFor="signupName" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="signupName"
                    name="name"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="signupEmail" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="signupEmail"
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="signupPassword" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="signupPassword"
                    name="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Create Account
                </button>
              </form>
            )}
            
            {showDashboardLink && (
              <div className="text-center mt-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-green-500 hover:text-green-600 font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;