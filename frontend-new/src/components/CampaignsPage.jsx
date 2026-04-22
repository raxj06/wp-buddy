import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const CampaignsPage = () => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Broadcast State
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [variableMapping, setVariableMapping] = useState({}); // { "1": "ColumnName" }
    const [uploading, setUploading] = useState(false);

    // Meta Template Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        headerType: 'NONE', // NONE, TEXT, IMAGE, DOCUMENT, VIDEO
        headerText: '',
        bodyText: '',
        footerText: '',
        buttons: [] // Array of { type: 'QUICK_REPLY', text: '' } or { type: 'URL', text: '', url: '' }
    });

    const [bodyVariables, setBodyVariables] = useState({}); // { '1': 'example value' }

    // Extract variables from body text automatically
    useEffect(() => {
        const matches = formData.bodyText.match(/\{\{([0-9]+)\}\}/g);
        if (matches) {
            const vars = {};
            // unique numbers
            const uniqueNums = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].sort((a, b) => Number(a) - Number(b));
            uniqueNums.forEach(num => {
                vars[num] = bodyVariables[num] || ''; // keep existing or empty
            });
            setBodyVariables(vars);
        } else {
            setBodyVariables({});
        }
    }, [formData.bodyText]);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
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

    const handleAddButton = (type) => {
        if (formData.buttons.length >= 3) {
            alert("Maximum 3 buttons allowed.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            buttons: [...prev.buttons, type === 'URL' ? { type: 'URL', text: '', url: '' } : { type: 'QUICK_REPLY', text: '' }]
        }));
    };

    const handleRemoveButton = (index) => {
        setFormData(prev => ({
            ...prev,
            buttons: prev.buttons.filter((_, i) => i !== index)
        }));
    };

    const handleButtonChange = (index, field, value) => {
        setFormData(prev => {
            const newButtons = [...prev.buttons];
            newButtons[index][field] = value;
            return { ...prev, buttons: newButtons };
        });
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();

        // Basic template name validation (lowercase and underscores only)
        if (!/^[a-z0-9_]+$/.test(formData.name)) {
            alert("Template name can only contain lowercase letters, numbers, and underscores.");
            return;
        }

        // Validate variables
        const varKeys = Object.keys(bodyVariables);
        for (let k of varKeys) {
            if (!bodyVariables[k]) {
                alert(`Please provide an example value for variable {{${k}}}`);
                return;
            }
        }

        // Validate buttons
        for (let btn of formData.buttons) {
            if (!btn.text) {
                alert("All buttons must have text."); return;
            }
            if (btn.type === 'URL' && !btn.url) {
                alert("URL buttons must have a URL starting with https://"); return;
            }
        }

        try {
            const token = localStorage.getItem('token');

            // Build the payload mapping exactly to our backend which maps to Meta API
            const payload = {
                name: formData.name,
                category: formData.category,
                language: formData.language,
                components: []
            };

            // 1. Header component
            if (formData.headerType === 'TEXT' && formData.headerText) {
                payload.components.push({ type: 'HEADER', format: 'TEXT', text: formData.headerText });
            } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType)) {
                // Meta API requires an example handle or id for media headers during creation
                payload.components.push({
                    type: 'HEADER',
                    format: formData.headerType,
                    example: { header_handle: ["https://scontent.xx.fbcdn.net/v/t39.8562-6/315629420_X_X.jpg"] } // Dummy for approval
                });
            }

            // 2. Body component
            const bodyComponent = { type: 'BODY', text: formData.bodyText };
            if (varKeys.length > 0) {
                // Meta API requires body_text examples as array of arrays
                const exampleValues = varKeys.sort((a, b) => Number(a) - Number(b)).map(k => bodyVariables[k]);
                bodyComponent.example = { body_text: [exampleValues] };
            }
            payload.components.push(bodyComponent);

            // 3. Footer component
            if (formData.footerText) {
                payload.components.push({ type: 'FOOTER', text: formData.footerText });
            }

            // 4. Buttons component
            if (formData.buttons.length > 0) {
                payload.components.push({
                    type: 'BUTTONS',
                    buttons: formData.buttons.map(btn => {
                        if (btn.type === 'URL') return { type: 'URL', text: btn.text, url: btn.url };
                        return { type: 'QUICK_REPLY', text: btn.text };
                    })
                });
            }

            const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload) // Backend must be updated to accept `components` directly!
            });

            const data = await res.json();
            if (data.success) {
                setCampaigns([data.campaign, ...campaigns]);
                setShowCreate(false);
                alert("Message template submitted to Meta for approval!");
                setFormData({ name: '', category: 'MARKETING', language: 'en_US', headerType: 'NONE', headerText: '', bodyText: '', footerText: '', buttons: [] });
            } else {
                alert("Failed to create template: " + data.error);
            }
        } catch (error) {
            console.error("Error creating campaign:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvFile(file);

        // Parse headers
        const reader = new FileReader();
        reader.onload = (event) => {
            const firstLine = event.target.result.split('\n')[0];
            const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            setCsvHeaders(headers);
        };
        reader.readAsText(file.slice(0, 5000)); // Just read the start for headers
    };

    const getVariablesFromTemplate = (template) => {
        if (!template || !template.components) return [];
        const body = template.components.find(c => c.type === 'BODY');
        if (!body || !body.text) return [];
        const matches = body.text.match(/\{\{([0-9]+)\}\}/g);
        if (!matches) return [];
        return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))].sort((a, b) => Number(a) - Number(b));
    };

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        if (!csvFile || !selectedTemplate) {
            alert("Please select a file and a template.");
            return;
        }

        const templateVars = getVariablesFromTemplate(selectedTemplate);
        if (templateVars.length > 0) {
            for (const v of templateVars) {
                if (!variableMapping[v]) {
                    alert(`Please map variable {{${v}}} to a CSV column.`);
                    return;
                }
            }
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('file', csvFile);
            data.append('templateName', selectedTemplate.name);
            data.append('templateLanguage', selectedTemplate.language);
            data.append('variableMapping', JSON.stringify(variableMapping));

            const response = await fetch(`${API_BASE_URL}/api/campaigns/broadcast`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            const result = await response.json();
            
                            if (result.success) {
                alert(result.message);
                setShowCsvModal(false);
                setCsvFile(null);
                setCsvHeaders([]);
                setVariableMapping({});
                setSelectedTemplate(null);
            } else {
                alert(`Broadcast failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Error uploading CSV:", error);
            alert("An error occurred during broadcast.");
        } finally {
            setUploading(false);
        }
    };

    // Helper to extract variables for list view preview if needed
    const getVarCount = (camp) => getVariablesFromTemplate(camp).length;

    // Helper for Meta status colors
    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'approved') return 'bg-green-100 text-green-700';
        if (s === 'rejected') return 'bg-red-100 text-red-700';
        if (s === 'pending') return 'bg-yellow-100 text-yellow-700';
        if (s === 'paused') return 'bg-orange-100 text-orange-800';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                {!showCreate ? (
                    <>
                        {/* Campaigns List View */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#111714]">Campaigns (Message Templates)</h1>
                                <p className="text-text-secondary text-sm">Create and manage your WhatsApp message templates</p>
                            </div>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="px-4 py-2 bg-primary hover:bg-[#1ac759] text-[#111714] rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Create Template
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-[#eef2f0] shadow-sm overflow-hidden py-16 text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                    <span className="material-symbols-outlined text-3xl">sms</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#111714] mb-2">No Templates Found</h3>
                                <p className="text-text-secondary max-w-md mx-auto mb-6">Create an approved message template to initiate outbound conversations with users.</p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Create Template →
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-[#eef2f0] shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#f4f7f5] text-[#111714] font-medium border-b border-[#eef2f0]">
                                        <tr>
                                            <th className="px-6 py-4">Template Name</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Language</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#eef2f0]">
                                        {campaigns.map((camp) => (
                                            <tr key={camp.id} className="hover:bg-[#f8fafa] transition-colors">
                                                <td className="px-6 py-4 font-medium text-[#111714]">
                                                    {camp.name}
                                                    {camp.rejected_reason && (
                                                        <div className="text-xs text-red-500 font-normal mt-1">Reason: {camp.rejected_reason}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary">{camp.category}</td>
                                                <td className="px-6 py-4 text-text-secondary">{camp.language}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${getStatusStyle(camp.status)}`}>
                                                        {camp.status || 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {camp.status === 'approved' && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedTemplate(camp);
                                                                setShowCsvModal(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-[#111714] rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">campaign</span>
                                                            Blast
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    /* Create Template Wizard */
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to List
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Message Template</h1>
                            <p className="text-gray-500 text-sm">Templates must be approved by Meta before they can be sent.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                {/* Basic Info */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Template Basics</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Template Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value.toLowerCase() })}
                                                className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="e.g. summer_sale_2025"
                                                pattern="[a-z0-9_]+"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Lowercase and underscores only.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                                >
                                                    <option value="MARKETING">Marketing</option>
                                                    <option value="UTILITY">Utility</option>
                                                    <option value="AUTHENTICATION">Authentication</option>
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">Utility templates must not contain promotions.</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                                                <select
                                                    value={formData.language}
                                                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                                                    className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                                                >
                                                    <option value="en_US">English (US)</option>
                                                    <option value="en_GB">English (UK)</option>
                                                    <option value="es">Spanish</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Builder */}
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Message Components</h3>

                                    {/* HEADER */}
                                    <div className="mb-6 pb-6 border-b border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Header (Optional)</label>
                                            <select
                                                value={formData.headerType}
                                                onChange={e => setFormData({ ...formData, headerType: e.target.value })}
                                                className="rounded-lg border-gray-200 py-1 px-2 text-xs bg-gray-50"
                                            >
                                                <option value="NONE">None</option>
                                                <option value="TEXT">Text</option>
                                                <option value="IMAGE">Image</option>
                                                <option value="DOCUMENT">Document</option>
                                                <option value="VIDEO">Video</option>
                                            </select>
                                        </div>
                                        {formData.headerType === 'TEXT' && (
                                            <input
                                                type="text"
                                                value={formData.headerText}
                                                maxLength={60}
                                                onChange={e => setFormData({ ...formData, headerText: e.target.value })}
                                                className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Add short header text..."
                                            />
                                        )}
                                        {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(formData.headerType) && (
                                            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                                                {formData.headerType} upload will be prompted when sending this template. A sample will be attached for Meta's review.
                                            </div>
                                        )}
                                    </div>

                                    {/* BODY */}
                                    <div className="mb-6 pb-6 border-b border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Body Text <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.bodyText}
                                            onChange={e => setFormData({ ...formData, bodyText: e.target.value })}
                                            rows={5}
                                            maxLength={1024}
                                            className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Write your message here... Use {{1}}, {{2}} to add dynamic variables."
                                        />

                                        {/* Variable Examples Map */}
                                        {Object.keys(bodyVariables).length > 0 && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <p className="text-xs font-bold text-gray-700 mb-2">Provide Example Values for Meta Review</p>
                                                {Object.keys(bodyVariables).map(num => (
                                                    <div key={num} className="flex items-center gap-2 mb-2 last:mb-0">
                                                        <span className="text-sm font-mono text-gray-500 w-12">{`{{${num}}}`}</span>
                                                        <input
                                                            type="text"
                                                            value={bodyVariables[num]}
                                                            onChange={e => setBodyVariables({ ...bodyVariables, [num]: e.target.value })}
                                                            placeholder="Example value (e.g. Raj)"
                                                            className="flex-1 rounded-lg border-gray-200 px-3 py-1 text-sm focus:ring-1 focus:ring-green-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* FOOTER */}
                                    <div className="mb-6 pb-6 border-b border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Footer (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.footerText}
                                            maxLength={60}
                                            onChange={e => setFormData({ ...formData, footerText: e.target.value })}
                                            className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-500"
                                            placeholder="Small grey text at the bottom. e.g. Reply STOP to unsubscribe."
                                        />
                                    </div>

                                    {/* BUTTONS */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Buttons (Max 3)</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAddButton('QUICK_REPLY')}
                                                    disabled={formData.buttons.length >= 3}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors disabled:opacity-50"
                                                >
                                                    + Quick Reply
                                                </button>
                                                <button
                                                    onClick={() => handleAddButton('URL')}
                                                    disabled={formData.buttons.length >= 3}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors disabled:opacity-50"
                                                >
                                                    + URL
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.buttons.map((btn, index) => (
                                                <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <div className="flex gap-2 items-center">
                                                        <span className="material-symbols-outlined text-gray-400 text-sm">
                                                            {btn.type === 'URL' ? 'link' : 'reply'}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={btn.text}
                                                            maxLength={20}
                                                            onChange={e => handleButtonChange(index, 'text', e.target.value)}
                                                            className="w-1/3 rounded-lg border-gray-200 px-3 py-1 text-sm focus:ring-1 focus:ring-green-500"
                                                            placeholder="Button Text"
                                                        />
                                                        {btn.type === 'URL' && (
                                                            <input
                                                                type="url"
                                                                value={btn.url}
                                                                onChange={e => handleButtonChange(index, 'url', e.target.value)}
                                                                className="flex-1 rounded-lg border-gray-200 px-3 py-1 text-sm focus:ring-1 focus:ring-green-500"
                                                                placeholder="https://example.com"
                                                            />
                                                        )}
                                                        <button
                                                            onClick={() => handleRemoveButton(index)}
                                                            className="text-red-400 hover:text-red-600 p-1 ml-auto"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.buttons.length === 0 && (
                                                <p className="text-xs text-gray-400 italic">No buttons added.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleCreateCampaign}
                                        disabled={!formData.name || !formData.bodyText}
                                        className="px-8 py-3 bg-primary hover:bg-[#1ac759] disabled:opacity-50 disabled:cursor-not-allowed text-[#111714] rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1"
                                    >
                                        Submit for Approval
                                    </button>
                                </div>
                            </div>

                            {/* Preview Panel */}
                            <div className="md:col-span-1">
                                <div className="sticky top-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Preview</h3>
                                    <div className="bg-[#efeae2] rounded-3xl p-4 shadow-inner border-[8px] border-gray-800 min-h-[500px] flex flex-col justify-end relative overflow-hidden bg-[url('https://wallpapers.com/images/hd/whatsapp-chat-background-pfwxxs7d72pbl81v.jpg')] bg-cover">
                                        <div className="absolute top-0 inset-x-0 h-12 bg-gray-800 rounded-t-xl flex items-center px-4 justify-between z-10">
                                            <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
                                            <div className="h-2 w-16 bg-gray-700 rounded-full"></div>
                                            <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
                                        </div>

                                        <div className="bg-white rounded-2xl rounded-tl-none shadow shadow-black/10 self-start w-[90%] mt-12 mb-2 relative overflow-hidden">
                                            {/* Header Preview */}
                                            {formData.headerType === 'TEXT' && formData.headerText && (
                                                <div className="px-3 pt-3 pb-1">
                                                    <h4 className="font-bold text-gray-900">{formData.headerText}</h4>
                                                </div>
                                            )}
                                            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType) && (
                                                <div className="h-32 bg-gray-200 flex items-center justify-center border-b border-gray-100">
                                                    <span className="material-symbols-outlined text-gray-400 text-4xl">
                                                        {formData.headerType === 'IMAGE' ? 'image' : formData.headerType === 'VIDEO' ? 'movie' : 'description'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Body Preview */}
                                            <div className="p-3 pb-1">
                                                <p className="text-[14.5px] text-gray-800 whitespace-pre-wrap leading-snug font-sans">
                                                    {formData.bodyText ?
                                                        formData.bodyText.replace(/\{\{([0-9]+)\}\}/g, (m, c1) => `[${bodyVariables[c1] || m}]`)
                                                        : "Your message preview will appear here..."
                                                    }
                                                </p>
                                            </div>

                                            {/* Footer Preview */}
                                            {formData.footerText && (
                                                <div className="px-3 pb-2 pt-1">
                                                    <p className="text-[12px] text-gray-400">{formData.footerText}</p>
                                                </div>
                                            )}

                                            <span className="text-[10px] text-gray-400 float-right px-2 pb-1">12:00</span>
                                        </div>

                                        {/* Buttons Preview */}
                                        {formData.buttons.length > 0 && (
                                            <div className="flex flex-col gap-[2px] w-[90%] self-start rounded-b-xl overflow-hidden shadow mb-2">
                                                {formData.buttons.map((btn, i) => (
                                                    <div key={i} className="bg-white py-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 text-[#00a884] font-medium border-t border-gray-100/50">
                                                        <span className="material-symbols-outlined text-[16px]">{btn.type === 'URL' ? 'open_in_new' : 'reply'}</span>
                                                        <span className="text-[14px]">{btn.text || 'Button'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Broadcast CSV Modal */}
            {showCsvModal && selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-[#eef2f0] flex justify-between items-center bg-[#f9fbfb]">
                            <div>
                                <h3 className="text-lg font-bold text-[#111714]">Blast Template</h3>
                                <p className="text-xs text-text-secondary mt-1">Sending: <strong>{selectedTemplate.name}</strong></p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCsvModal(false);
                                    setCsvFile(null);
                                    setCsvHeaders([]);
                                    setVariableMapping({});
                                    setSelectedTemplate(null);
                                }}
                                className="text-text-secondary hover:text-[#111714]"
                                disabled={uploading}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleBroadcastSubmit} className="p-6 space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-[#111714]">Upload Audience CSV</label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const csvContent = "data:text/csv;charset=utf-8,Name,Phone\nJohn Doe,1234567890\nJane Smith,0987654321";
                                            const encodedUri = encodeURI(csvContent);
                                            const link = document.createElement("a");
                                            link.setAttribute("href", encodedUri);
                                            link.setAttribute("download", "wappy_sample_audience.csv");
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">download</span>
                                        Download Sample
                                    </button>
                                </div>
                                <div className="border-2 border-dashed border-[#dce5df] rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                                    <input 
                                        type="file" 
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        id="csv-upload-campaign"
                                        disabled={uploading}
                                    />
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${csvFile ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                            <span className="material-symbols-outlined text-2xl">
                                                {csvFile ? 'task_alt' : 'upload_file'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-[#111714]">
                                            {csvFile ? csvFile.name : "Choose CSV file"}
                                        </span>
                                        <span className="text-xs text-text-secondary mt-1">
                                            {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : "Drop your file here or click to browse"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {csvHeaders.length > 0 && getVariablesFromTemplate(selectedTemplate).length > 0 && (
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">Personalize Variables</h4>
                                    {getVariablesFromTemplate(selectedTemplate).map(v => (
                                        <div key={v} className="flex items-center gap-3">
                                            <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {"{{"}{v}{"}}"}
                                            </span>
                                            <span className="text-xs text-gray-400">maps to</span>
                                            <select
                                                value={variableMapping[v] || ""}
                                                onChange={(e) => setVariableMapping({ ...variableMapping, [v]: e.target.value })}
                                                className="flex-1 h-8 rounded-lg border-gray-200 text-xs px-2 focus:ring-1 focus:ring-primary"
                                                required
                                            >
                                                <option value="">Select CSV Column...</option>
                                                {csvHeaders.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-200 flex gap-2">
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                <div>
                                    {getVariablesFromTemplate(selectedTemplate).length > 0 
                                        ? "Each variable will be replaced by the value from its mapped CSV column for every contact." 
                                        : "This will immediately queue messages to the Meta API for all valid phone numbers in your CSV."
                                    }
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCsvModal(false);
                                        setCsvFile(null);
                                        setCsvHeaders([]);
                                        setVariableMapping({});
                                        setSelectedTemplate(null);
                                    }}
                                    className="flex-1 h-10 rounded-xl border border-[#dce5df] bg-white text-[#111714] font-medium hover:bg-gray-50 transition-colors"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-10 rounded-xl bg-primary text-[#111714] font-bold hover:bg-[#1ac759] transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    disabled={!csvFile || uploading}
                                >
                                    {uploading ? (
                                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                            Send Blast
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CampaignsPage;
