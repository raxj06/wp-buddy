import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const result = await login(loginData.email, loginData.password);
        if (result.success) {
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => navigate('/dashboard'), 1500);
        } else {
            showMessage(result.error || 'Login failed', 'error');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        const result = await signup(signupData.name, signupData.email, signupData.password);
        if (result.success) {
            showMessage('Account created successfully! Redirecting...', 'success');
            setTimeout(() => navigate('/dashboard'), 1500);
        } else {
            showMessage(result.error || 'Signup failed', 'error');
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { width: '0%', label: '', color: '' };
        if (password.length < 6) return { width: '25%', label: 'Weak', color: 'bg-red-400' };
        if (password.length < 10) return { width: '50%', label: 'Fair', color: 'bg-yellow-400' };
        if (password.length < 14) return { width: '75%', label: 'Good', color: 'bg-blue-400' };
        return { width: '100%', label: 'Strong', color: 'bg-primary' };
    };

    const passwordStrength = getPasswordStrength(isLogin ? loginData.password : signupData.password);

    return (
        <div className="min-h-screen bg-background-light flex items-center justify-center p-4 md:p-6">
            {/* Main Card Container */}
            <div className="w-full max-w-[1100px] min-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#eef2f0]">

                {/* LEFT PANEL: Progress & Branding */}
                <div className="relative w-full md:w-4/12 lg:w-1/3 bg-[#f4f7f5] p-8 md:p-10 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-[#eef2f0]">
                    {/* Abstract background pattern */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                    </div>

                    {/* Header / Logo */}
                    <div className="relative z-10">
                        <Link to="/" className="flex items-center gap-3 text-[#111714] mb-12">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">W Buddy</h2>
                        </Link>

                        {/* Vertical Stepper */}
                        <div className="flex flex-col gap-0">
                            {/* Step 1: Active */}
                            <div className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-[#111714] z-10 shadow-sm shadow-primary/30">
                                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                                    </div>
                                    <div className="w-[2px] h-12 bg-primary/30 my-1"></div>
                                </div>
                                <div className="pt-1 pb-8">
                                    <h3 className="text-[#111714] font-bold text-base leading-none mb-1">Account Setup</h3>
                                    <p className="text-text-secondary text-sm">Create your login details</p>
                                </div>
                            </div>

                            {/* Step 2: Upcoming */}
                            <div className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-[#dce5df] text-text-secondary z-10">
                                        <span className="material-symbols-outlined text-[18px]">domain_verification</span>
                                    </div>
                                    <div className="w-[2px] h-12 bg-[#dce5df] my-1"></div>
                                </div>
                                <div className="pt-1 pb-8 opacity-60">
                                    <h3 className="text-[#111714] font-medium text-base leading-none mb-1">Business Verification</h3>
                                    <p className="text-text-secondary text-sm">Verify your business identity</p>
                                </div>
                            </div>

                            {/* Step 3: Upcoming */}
                            <div className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-[#dce5df] text-text-secondary z-10">
                                        <span className="material-symbols-outlined text-[18px]">api</span>
                                    </div>
                                </div>
                                <div className="pt-1 opacity-60">
                                    <h3 className="text-[#111714] font-medium text-base leading-none mb-1">Connect WhatsApp API</h3>
                                    <p className="text-text-secondary text-sm">Link your phone number</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Helper Link */}
                    <div className="relative z-10 mt-8 md:mt-0">
                        <a className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors" href="#">
                            <span className="material-symbols-outlined text-[18px]">support_agent</span>
                            Need help setting up?
                        </a>
                    </div>
                </div>

                {/* RIGHT PANEL: Auth Form */}
                <div className="w-full md:w-8/12 lg:w-2/3 p-8 md:p-14 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        {/* Message Banner */}
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Headlines */}
                        <div className="mb-8 text-center md:text-left">
                            <h1 className="text-[#111714] text-3xl font-bold leading-tight mb-2">
                                {isLogin ? 'Welcome back' : 'Welcome to W Buddy'}
                            </h1>
                            <p className="text-text-secondary text-base">
                                {isLogin
                                    ? 'Sign in to access your dashboard and manage conversations.'
                                    : 'Start automating your WhatsApp Business conversations today.'}
                            </p>
                        </div>

                        {/* Social Login */}
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 bg-white border border-[#dce5df] rounded-xl h-12 text-[#111714] text-base font-medium hover:bg-[#f6f8f7] transition-colors mb-6"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-[1px] bg-[#dce5df] flex-1"></div>
                            <span className="text-sm text-text-secondary font-medium">Or continue with email</span>
                            <div className="h-[1px] bg-[#dce5df] flex-1"></div>
                        </div>

                        {/* Form */}
                        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
                            {/* Full Name Field (Signup Only) */}
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label className="text-[#111714] text-sm font-medium">Full Name</label>
                                    <div className="relative">
                                        <input
                                            name="name"
                                            type="text"
                                            value={signupData.name}
                                            onChange={handleSignupChange}
                                            className="w-full h-12 rounded-xl border border-[#dce5df] bg-white px-4 pl-11 text-[#111714] placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                            placeholder="e.g. John Doe"
                                            required
                                        />
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">badge</span>
                                    </div>
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <label className="text-[#111714] text-sm font-medium">
                                    {isLogin ? 'Email Address' : 'Work Email Address'}
                                </label>
                                <div className="relative">
                                    <input
                                        name="email"
                                        type="email"
                                        value={isLogin ? loginData.email : signupData.email}
                                        onChange={isLogin ? handleLoginChange : handleSignupChange}
                                        className="w-full h-12 rounded-xl border border-[#dce5df] bg-white px-4 pl-11 text-[#111714] placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                        placeholder="name@company.com"
                                        required
                                    />
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">mail</span>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <label className="text-[#111714] text-sm font-medium">Password</label>
                                <div className="relative group">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={isLogin ? loginData.password : signupData.password}
                                        onChange={isLogin ? handleLoginChange : handleSignupChange}
                                        className="w-full h-12 rounded-xl border border-[#dce5df] bg-white px-4 pl-11 pr-12 text-[#111714] placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                        placeholder="Min. 8 characters"
                                        required
                                    />
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">lock</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-[#111714] transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>

                                {/* Password Strength Meter (Signup Only) */}
                                {!isLogin && (
                                    <div className="flex gap-1 items-center mt-1">
                                        <div className="h-1 flex-1 bg-[#dce5df] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} rounded-full transition-all duration-300`}
                                                style={{ width: passwordStrength.width }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-text-secondary ml-2">{passwordStrength.label}</span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full h-12 bg-primary hover:bg-[#1ac759] text-[#111714] font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                                >
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                </button>
                            </div>

                            {/* Terms (Signup Only) */}
                            {!isLogin && (
                                <p className="text-xs text-center text-text-secondary mt-4 leading-relaxed">
                                    By creating an account, you agree to our{' '}
                                    <a className="underline hover:text-[#111714]" href="#">Terms of Service</a> and{' '}
                                    <a className="underline hover:text-[#111714]" href="#">Privacy Policy</a>.
                                </p>
                            )}
                        </form>

                        {/* Footer Link */}
                        <div className="mt-8 text-center">
                            <p className="text-[#111714] text-sm">
                                {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-primary font-bold hover:underline ml-1"
                                >
                                    {isLogin ? 'Sign up' : 'Log in'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
