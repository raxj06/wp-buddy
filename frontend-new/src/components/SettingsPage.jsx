import React, { useState } from 'react';
import Layout from './Layout';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('team');

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 ">Settings & Team Admin</h1>
                        <p className="text-gray-500 mt-1">Manage your team, billing, and API preferences</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-white  border border-gray-200  rounded-lg text-gray-700  font-medium hover:bg-gray-50  transition-colors">Documentation</button>
                        <button className="px-4 py-2 bg-white  border border-gray-200  rounded-lg text-gray-700  font-medium hover:bg-gray-50  transition-colors">Support</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
                    {['Business Profile', 'WhatsApp API Config', 'Team Members', 'Billing'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab === 'Team Members' ? 'team' : tab.toLowerCase().replace(/ /g, '-'))}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${(activeTab === 'team' && tab === 'Team Members') || activeTab === tab.toLowerCase().replace(/ /g, '-')
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                                    : 'bg-white  text-gray-600  hover:bg-gray-50 '
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* Acme Corp Section */}
                    <div className="bg-white  rounded-2xl border border-gray-200  p-6 md:p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-blue-100  rounded-2xl flex items-center justify-center text-blue-600 text-2xl font-bold mr-6">
                                    AC
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 ">Acme Corporation</h2>
                                    <p className="text-gray-500">Business ID: 883920192</p>
                                </div>
                            </div>
                            <button className="text-sm text-green-600 font-medium hover:underline">Edit Profile</button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-gray-100 ">
                            <div>
                                <h3 className="font-bold text-gray-900  mb-2">Role Permissions</h3>
                                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                    Admins have full access to billing and team management. Editors can manage campaigns and chats. Viewers have read-only access.
                                </p>
                                <a href="#" className="text-sm text-green-500 font-medium hover:text-green-600">Learn more about roles →</a>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900  mb-2">Pending Invites</h3>
                                <div className="bg-yellow-50  rounded-xl p-4 border border-yellow-100 ">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        <div>
                                            <p className="text-sm text-gray-800  font-medium">You have 1 pending invite.</p>
                                            <p className="text-xs text-gray-500 mt-1">Invites expire after 7 days. You can resend the invitation link or revoke it at any time.</p>
                                            <button className="text-xs text-yellow-600  font-bold mt-2 uppercase tracking-wide">Manage invites</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Team Members List (Placeholder) */}
                    <div className="bg-white  rounded-2xl border border-gray-200  shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200  flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 ">Team Members</h3>
                            <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20">Invite Member</button>
                        </div>
                        <table className="w-full text-left text-sm text-gray-500 ">
                            <thead className="bg-gray-50  text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Last Active</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 ">
                                <tr className="hover:bg-gray-50  transition-colors">
                                    <td className="px-6 py-4 flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-linear-to-r from-pink-500 to-rose-500 mr-3"></div>
                                        <span className="font-medium text-gray-900 ">John Doe (You)</span>
                                    </td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-green-100  text-green-700  text-xs font-bold">Admin</span></td>
                                    <td className="px-6 py-4">Just now</td>
                                    <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-gray-600">Edit</button></td>
                                </tr>
                                <tr className="hover:bg-gray-50  transition-colors">
                                    <td className="px-6 py-4 flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-linear-to-r from-blue-400 to-indigo-500 mr-3"></div>
                                        <span className="font-medium text-gray-900 ">Sarah Smith</span>
                                    </td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-blue-100  text-blue-700  text-xs font-bold">Editor</span></td>
                                    <td className="px-6 py-4">2 hours ago</td>
                                    <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-gray-600">Edit</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
