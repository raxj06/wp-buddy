import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleConnectAccount = () => {
    navigate('/dashboard');
  };

  const isLoggedIn = !!user;

  return (
    <div className={`min-h-screen bg-gradient-ai dark:bg-gradient-dark-ai transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-ai-purple/20 to-ai-pink/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-ai-cyan/20 to-ai-teal/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-ai-purple/10 to-ai-pink/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">WhatsApp AI</h1>
            <p className="text-sm text-white/70">Business Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          {isLoggedIn && user && (
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2">
              <div className="w-8 h-8 bg-gradient-success rounded-full flex items-center justify-center font-bold text-white text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-white text-sm">{user.name}</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.reload();
                }}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              WhatsApp
              <span className="block bg-gradient-to-r from-ai-cyan to-ai-teal bg-clip-text text-transparent">
                AI Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your business communications with our intelligent WhatsApp integration platform. 
              Connect, automate, and scale like never before.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-slide-up">
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-2">2+</div>
              <div className="text-white/70">Connected Accounts</div>
            </div>
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-white/70">Uptime</div>
            </div>
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/70">Support</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: '🤖', title: 'AI-Powered Automation', desc: 'Smart responses and workflow automation' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Comprehensive insights and reporting' },
              { icon: '🔗', title: 'Multi-Account Management', desc: 'Connect unlimited WhatsApp accounts' },
              { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized for speed and performance' },
              { icon: '🔒', title: 'Enterprise Security', desc: 'Bank-level encryption and security' },
              { icon: '🌐', title: 'Global Scale', desc: 'Worldwide reach and reliability' }
            ].map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 hover:shadow-glow group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="animate-scale-in">
            {!isLoggedIn ? (
              <div className="space-y-6">
                <p className="text-white/80 text-lg">Ready to revolutionize your business communications?</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-primary hover:bg-gradient-secondary text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 hover:scale-105 hover:shadow-glow-pink"
                >
                  Get Started Now
                </button>
                <p className="text-white/60 text-sm">Free to start • No credit card required</p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-white/80 text-lg">Welcome back! Ready to manage your WhatsApp accounts?</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-success hover:bg-gradient-primary text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-glow"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleConnectAccount}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 hover:scale-105"
                  >
                    Connect Another Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-ai-cyan/30 rounded-full animate-bounce-slow"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-ai-pink/30 rounded-full animate-bounce-slow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-ai-teal/30 rounded-full animate-bounce-slow" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

export default HomePage;