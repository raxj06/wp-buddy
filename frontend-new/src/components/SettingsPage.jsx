import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { API_BASE_URL } from '../config';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('business-profile');
    
    // Profile State
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    // WABA Config State
    const [accounts, setAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
    const [showAddAccount, setShowAddAccount] = useState(false);
    
    const [newAccount, setNewAccount] = useState({
        wabaId: '',
        phoneNumberId: '',
        accessToken: ''
    });
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [accountError, setAccountError] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchProfile();
        fetchAccounts();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProfile({
                    name: data.user.name,
                    email: data.user.email
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchAccounts = async () => {
        setIsLoadingAccounts(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/whatsapp/accounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setIsLoadingAccounts(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: profile.name })
            });
            const data = await res.json();
            if (data.success) {
                alert('Profile updated successfully!');
            } else {
                alert(data.error || 'Failed to update profile');
            }
        } catch (error) {
            alert('Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        setIsSavingAccount(true);
        setAccountError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/whatsapp/accounts`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAccount)
            });
            const data = await res.json();
            if (data.success) {
                setShowAddAccount(false);
                setNewAccount({ wabaId: '', phoneNumberId: '', accessToken: '' });
                fetchAccounts();
            } else {
                setAccountError(data.error || 'Failed to add account');
            }
        } catch (error) {
            setAccountError('Failed to add account');
        } finally {
            setIsSavingAccount(false);
        }
    };

    const handleRemoveAccount = async (wabaId) => {
        if (!window.confirm('Are you sure you want to remove this WhatsApp account? This will break campaigns.')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/whatsapp/accounts/${wabaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchAccounts();
            } else {
                alert(data.error || 'Failed to remove account');
            }
        } catch (error) {
            alert('Failed to remove account');
        }
    };

    const renderBusinessProfile = () => (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Business Profile</h2>
            <form onSubmit={handleUpdateProfile} className="max-w-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company / User Name</label>
                    <input 
                        type="text" 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={profile.email}
                        disabled
                        className="w-full bg-gray-50 text-gray-500 border border-gray-200 rounded-lg px-4 py-2 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email address cannot be changed.</p>
                </div>
                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSavingProfile}
                        className="px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderWhatsAppConfig = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Connected Accounts</h2>
                    <button 
                        onClick={() => setShowAddAccount(!showAddAccount)}
                        className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                        {showAddAccount ? 'Cancel' : '+ Link Account'}
                    </button>
                </div>

                {showAddAccount && (
                    <form onSubmit={handleAddAccount} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Link Manual WABA Config</h3>
                        {accountError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{accountError}</div>}
                        <div className="space-y-4 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WABA ID (WhatsApp Business Account ID)</label>
                                <input required type="text" placeholder="e.g. 103982984928" value={newAccount.wabaId} onChange={e => setNewAccount({...newAccount, wabaId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                                <input required type="text" placeholder="e.g. 104593859345" value={newAccount.phoneNumberId} onChange={e => setNewAccount({...newAccount, phoneNumberId: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Access Token</label>
                                <input required type="password" placeholder="EAAI..." value={newAccount.accessToken} onChange={e => setNewAccount({...newAccount, accessToken: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                            </div>
                            <button disabled={isSavingAccount} type="submit" className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 mt-2">
                                {isSavingAccount ? 'Verifying...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                )}

                {isLoadingAccounts ? (
                    <div className="py-8 text-center text-gray-500">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        <p className="text-gray-500 font-medium">No WhatsApp accounts connected</p>
                        <p className="text-sm text-gray-400 mt-1">Click the button above to link your WABA securely.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-green-300 transition-colors">
                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.573-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">WABA ID: {acc.waba_id}</h3>
                                            <p className="text-sm text-gray-500">Phone ID: {acc.phone_number_id}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Test Connection</button>
                                    <button onClick={() => handleRemoveAccount(acc.waba_id)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderTeamMembers = () => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Team Members</h3>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20">Invite Member</button>
            </div>
            <div className="p-12 text-center text-gray-500">
                <p>Team management feature is currently in development.</p>
            </div>
        </div>
    );

    const renderBilling = () => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-12 text-center text-gray-500">
            <p>Billing integration is currently in development.</p>
        </div>
    );

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings & Team Admin</h1>
                        <p className="text-gray-500 mt-1">Manage your team, billing, and API preferences</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
                    {['Business Profile', 'WhatsApp API Config', 'Team Members', 'Billing'].map((tab) => {
                        const tabId = tab.toLowerCase().replace(/ /g, '-');
                        return (
                            <button
                                key={tabId}
                                onClick={() => setActiveTab(tabId)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tabId
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-6">
                    {activeTab === 'business-profile' && renderBusinessProfile()}
                    {activeTab === 'whatsapp-api-config' && renderWhatsAppConfig()}
                    {activeTab === 'team-members' && renderTeamMembers()}
                    {activeTab === 'billing' && renderBilling()}
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
