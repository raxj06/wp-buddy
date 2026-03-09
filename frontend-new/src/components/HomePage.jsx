import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-background-light text-text-main overflow-x-hidden">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-[#f0f4f2] bg-surface-light/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-[#111714]">W Buddy</span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex flex-1 items-center justify-center gap-8">
                            <a className="text-sm font-medium text-[#111714] hover:text-primary transition-colors" href="#features">Features</a>
                            <a className="text-sm font-medium text-[#111714] hover:text-primary transition-colors" href="#pricing">Pricing</a>
                            <a className="text-sm font-medium text-[#111714] hover:text-primary transition-colors" href="#resources">Resources</a>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Link to="/auth" className="hidden sm:flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-[#111714] bg-[#f0f4f2] hover:bg-[#e0e4e2] transition-colors">
                                Login
                            </Link>
                            <Link to="/auth" className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-[#111714] bg-primary hover:bg-[#1bc458] transition-colors shadow-sm">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-12 pb-16 lg:pt-24 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        {/* Hero Content */}
                        <div className="flex-1 flex flex-col gap-6 max-w-2xl text-center lg:text-left items-center lg:items-start">
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                Official Meta Business Partner
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-[#111714]">
                                Supercharge your WhatsApp Business with <span className="text-primary">W Buddy</span>
                            </h1>

                            <p className="text-lg text-text-secondary leading-relaxed max-w-lg">
                                The all-in-one platform for Broadcasting, Automation, and CRM on the official WhatsApp API. Engage customers where they live.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start">
                                <Link to="/auth" className="flex min-w-[160px] h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-bold text-[#111714] shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                                    Start Free Trial
                                </Link>
                                <button className="flex min-w-[160px] h-12 items-center justify-center rounded-lg border border-[#dce5df] bg-surface-light px-6 text-base font-bold text-[#111714] hover:bg-gray-50 transition-all">
                                    <span className="material-symbols-outlined mr-2 text-lg">calendar_month</span>
                                    Book Demo
                                </button>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-text-secondary pt-4">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                                    <span>14-day free trial</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="flex-1 w-full relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-full aspect-[4/3] rounded-2xl bg-surface-light border border-[#f0f4f2] shadow-2xl overflow-hidden flex items-center justify-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
                                <div className="relative bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-xl flex flex-col items-center gap-4 max-w-sm text-center">
                                    <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Campaign Launched!</h3>
                                        <p className="text-sm text-gray-500">Your message was sent to 5,230 contacts.</p>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Trusted By */}
            <section className="py-10 border-y border-[#f0f4f2] bg-surface-light">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-8">Trusted by growth teams at</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <span className="text-xl font-black text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">diamond</span> AcmeCorp</span>
                        <span className="text-xl font-black text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">bolt</span> FastScale</span>
                        <span className="text-xl font-black text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">verified_user</span> SecureNet</span>
                        <span className="text-xl font-black text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">payments</span> PayFlow</span>
                        <span className="text-xl font-black text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">public</span> GlobalTech</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 lg:py-32 bg-background-light" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-12 items-start justify-between mb-16">
                        <div className="max-w-xl">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#111714] mb-4">
                                Everything you need to scale on WhatsApp
                            </h2>
                            <p className="text-lg text-text-secondary">
                                Powerful tools designed for the modern enterprise. We handle the complexity so you can focus on the conversation.
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <a className="inline-flex items-center font-bold text-primary hover:text-green-600 transition-colors" href="#features">
                                View all features <span className="material-symbols-outlined ml-1">arrow_forward</span>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group relative flex flex-col gap-6 rounded-2xl border border-[#dce5df] bg-surface-light p-8 hover:border-primary/50 transition-all hover:shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-[#111714] transition-colors">
                                <span className="material-symbols-outlined text-3xl">campaign</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#111714] mb-2">Broadcast Campaigns</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Send personalized multimedia messages to thousands instantly. Achieve open rates up to 98% compared to email.
                                </p>
                            </div>
                            <ul className="space-y-2 mt-auto pt-4 border-t border-gray-100">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-primary text-base">check</span> Template Management
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-primary text-base">check</span> Smart Scheduling
                                </li>
                            </ul>
                        </div>

                        {/* Feature 2 */}
                        <div className="group relative flex flex-col gap-6 rounded-2xl border border-[#dce5df] bg-surface-light p-8 hover:border-primary/50 transition-all hover:shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-[#111714] transition-colors">
                                <span className="material-symbols-outlined text-3xl">smart_toy</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#111714] mb-2">AI Chatbot</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Automate support 24/7 with no-code flows. Let AI handle the FAQs while your agents focus on high-value deals.
                                </p>
                            </div>
                            <ul className="space-y-2 mt-auto pt-4 border-t border-gray-100">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-primary text-base">check</span> Visual Flow Builder
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-primary text-base">check</span> Auto-Handoff
                                </li>
                            </ul>
                        </div>

                        {/* Feature 3 */}
                        <div className="group relative flex flex-col gap-6 rounded-2xl border border-[#dce5df] bg-surface-light p-8 hover:border-primary/50 transition-all hover:shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-[#111714] transition-colors">
                                <span className="material-symbols-outlined text-3xl">contacts</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#111714] mb-2">Built-in CRM</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Manage contacts, track conversions, and label conversations in one unified inbox designed for teams.
                                </p>
                            </div>
                            <ul className="space-y-2 mt-auto pt-4 border-t border-gray-100">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-primary text-base">check</span> Contact Tagging
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-primary text-base">check</span> Team Roles
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works / Timeline */}
            <section className="py-20 lg:py-32 bg-surface-light relative overflow-hidden">
                {/* Background decorative element */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1fdb64 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Simple Setup</span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#111714]">Get started in minutes</h2>
                    </div>
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-gray-200 via-primary to-gray-200 -z-10"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-100 group-hover:border-primary transition-colors flex items-center justify-center mb-6 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl text-primary">api</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#111714] mb-2">1. Connect API</h3>
                                <p className="text-sm text-text-secondary">Link your Facebook Business Manager to get your official WhatsApp API key.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-100 group-hover:border-primary transition-colors flex items-center justify-center mb-6 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#111714] mb-2">2. Upload Contacts</h3>
                                <p className="text-sm text-text-secondary">Import your customer lists via CSV or sync directly with your existing CRM.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-100 group-hover:border-primary transition-colors flex items-center justify-center mb-6 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl text-primary">rocket_launch</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#111714] mb-2">3. Launch Campaign</h3>
                                <p className="text-sm text-text-secondary">Create your message template, set the schedule, and watch the replies roll in.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Large CTA */}
            <section className="py-20 bg-background-light">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-3xl bg-[#111714] overflow-hidden px-6 py-16 sm:px-12 sm:py-20 text-center">
                        {/* Abstract Glow */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight max-w-2xl">
                                Ready to revolutionize your customer communication?
                            </h2>
                            <p className="text-lg text-gray-400 max-w-xl">
                                Join 2,000+ businesses using W Buddy to drive sales and support on WhatsApp.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <Link to="/auth" className="flex h-14 min-w-[180px] items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-[#111714] hover:bg-[#1bc458] transition-colors shadow-lg">
                                    Get Started Free
                                </Link>
                                <button className="flex h-14 min-w-[180px] items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-8 text-lg font-bold text-white hover:bg-white/20 transition-colors">
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface-light border-t border-[#f0f4f2] pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-[#111714]">
                                    <span className="material-symbols-outlined">chat_bubble</span>
                                </div>
                                <span className="text-xl font-bold text-[#111714]">W Buddy</span>
                            </div>
                            <p className="text-sm text-text-secondary max-w-xs mb-6">
                                The leading WhatsApp Business API solution for modern enterprises. Built for scale, reliability, and ease of use.
                            </p>
                            <div className="flex gap-4">
                                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">post_add</span></a>
                                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111714] mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-text-secondary">
                                <li><a className="hover:text-primary" href="#features">Broadcasting</a></li>
                                <li><a className="hover:text-primary" href="#features">Chatbot Flow</a></li>
                                <li><a className="hover:text-primary" href="#features">Shared Inbox</a></li>
                                <li><a className="hover:text-primary" href="#features">API Docs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111714] mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-text-secondary">
                                <li><a className="hover:text-primary" href="#">About Us</a></li>
                                <li><a className="hover:text-primary" href="#">Careers</a></li>
                                <li><a className="hover:text-primary" href="#">Partners</a></li>
                                <li><a className="hover:text-primary" href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#111714] mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm text-text-secondary">
                                <li><a className="hover:text-primary" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-primary" href="#">Terms of Service</a></li>
                                <li><a className="hover:text-primary" href="#">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-[#f0f4f2] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">© 2024 W Buddy Inc. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            System Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
