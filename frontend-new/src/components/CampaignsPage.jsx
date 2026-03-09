import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';

const CampaignsPage = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // New Campaign Form State
    const [formData, setFormData] = useState({
        name: '',
        templateName: '',
        scheduledAt: '',
        selectedTags: []
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/campaigns', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.campaigns);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: formData.name,
                templateName: formData.templateName || 'hello_world', // Default for now
                scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : new Date().toISOString(),
                audienceFilter: { tags: formData.selectedTags }
            };

            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setCampaigns([data.campaign, ...campaigns]);
                setShowCreate(false);
                alert("Campaign created successfully!");
                setFormData({ name: '', templateName: '', scheduledAt: '', selectedTags: [] });
            } else {
                alert("Failed to create campaign: " + data.error);
            }
        } catch (error) {
            console.error("Error creating campaign:", error);
        }
    };

    const toggleTag = (tag) => {
        if (formData.selectedTags.includes(tag)) {
            setFormData(prev => ({ ...prev, selectedTags: prev.selectedTags.filter(t => t !== tag) }));
        } else {
            setFormData(prev => ({ ...prev, selectedTags: [...prev.selectedTags, tag] }));
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                {!showCreate ? (
                    <>
                        {/* Campaigns List View */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#111714]">Campaigns</h1>
                                <p className="text-text-secondary text-sm">Manage and schedule your marketing broadcasts</p>
                            </div>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="px-4 py-2 bg-primary hover:bg-[#1ac759] text-[#111714] rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                New Campaign
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-[#eef2f0] shadow-sm overflow-hidden py-16 text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                    <span className="material-symbols-outlined text-3xl">campaign</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#111714] mb-2">No Campaigns Yet</h3>
                                <p className="text-text-secondary max-w-md mx-auto mb-6">Create your first broadcast campaign to engage your audience.</p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Create Campaign →
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-[#eef2f0] shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#f4f7f5] text-[#111714] font-medium border-b border-[#eef2f0]">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Template</th>
                                            <th className="px-6 py-4">Scheduled For</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#eef2f0]">
                                        {campaigns.map((camp) => (
                                            <tr key={camp.id} className="hover:bg-[#f8fafa] transition-colors">
                                                <td className="px-6 py-4 font-medium text-[#111714]">{camp.name}</td>
                                                <td className="px-6 py-4 text-text-secondary">{camp.template_name}</td>
                                                <td className="px-6 py-4 text-text-secondary">
                                                    {new Date(camp.scheduled_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${camp.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            camp.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {(camp.status || 'Draft').toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    /* Create Campaign Wizard */
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to List
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Campaign</h1>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                {/* Basic Info */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Campaign Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="e.g. Summer Sale Announcement"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                                            <input
                                                type="text"
                                                value={formData.templateName}
                                                onChange={e => setFormData({ ...formData, templateName: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="hello_world"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Audience Selection */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Target Audience</h3>
                                    <p className="text-gray-500 text-sm mb-6">Select tags to include contacts.</p>

                                    <div className="space-y-3">
                                        {['vip-customers', 'new-leads', 'newsletter-subscribers', 'past-buyers', 'test'].map((tag) => (
                                            <label key={tag} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.selectedTags.includes(tag) ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedTags.includes(tag)}
                                                    onChange={() => toggleTag(tag)}
                                                    className="w-5 h-5 text-green-500 rounded border-gray-300 focus:ring-green-500"
                                                />
                                                <span className="ml-3 font-medium text-gray-700 capitalize">{tag.replace('-', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleCreateCampaign}
                                        className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1"
                                    >
                                        Create Campaign
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CampaignsPage;
