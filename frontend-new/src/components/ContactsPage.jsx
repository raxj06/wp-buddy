import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';

const ContactsPage = () => {
    const { logout } = useAuth(); // Assuming useAuth provides a token or we get it from localStorage
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [wabaId, setWabaId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        tags: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // 1. Fetch WABA ID (needed for creating contacts)
            const accountsRes = await fetch('/api/whatsapp/accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const accountsData = await accountsRes.json();
            if (accountsData.success && accountsData.accounts.length > 0) {
                setWabaId(accountsData.accounts[0].waba_id);
            }

            // 2. Fetch Contacts
            const contactsRes = await fetch('/api/contacts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const contactsData = await contactsRes.json();
            if (contactsData.success) {
                setContacts(contactsData.contacts);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateContact = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("You must be logged in.");
                return;
            }

            if (!wabaId) {
                alert("No WhatsApp Business Account connected. Please connect one in Settings.");
                return;
            }

            const payload = {
                wabaId: wabaId,
                phoneNumber: formData.phoneNumber,
                name: formData.name,
                email: formData.email,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                attributes: {}
            };

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                // Add new contact to list
                setContacts([data.contact, ...contacts]);
                setShowModal(false);
                setFormData({ name: '', phoneNumber: '', email: '', tags: '' });
                alert("Contact added successfully!");
            } else {
                alert("Failed to add contact: " + data.error);
            }
        } catch (error) {
            console.error("Error creating contact:", error);
            alert("An error occurred.");
        }
    };

    const handleCsvUpload = async (e) => {
        e.preventDefault();
        
        if (!csvFile) {
            alert("Please select a CSV file first.");
            return;
        }

        if (!wabaId) {
            alert("No WhatsApp Business Account connected.");
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('file', csvFile);
            data.append('wabaId', wabaId);

            const response = await fetch('/api/contacts/upload', {
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
                fetchInitialData(); // Reload the list
            } else {
                alert(`Upload failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Error uploading CSV:", error);
            alert("An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#111714]">Contacts</h1>
                        <p className="text-text-secondary text-sm">Manage your audience and customers</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCsvModal(true)}
                            className="px-4 py-2 bg-white border border-[#dce5df] hover:bg-gray-50 text-[#111714] rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">upload_file</span>
                            Import CSV
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary hover:bg-[#1ac759] text-[#111714] rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Contact
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#eef2f0] shadow-sm overflow-hidden py-16 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <span className="material-symbols-outlined text-3xl">groups</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#111714] mb-2">No Contacts Yet</h3>
                        <p className="text-text-secondary max-w-md mx-auto mb-6">Start building your audience by adding contacts manually.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-primary font-bold hover:underline"
                        >
                            Add Contact Now →
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-[#eef2f0] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#f4f7f5] text-[#111714] font-medium border-b border-[#eef2f0]">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Phone Number</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Tags</th>
                                        <th className="px-6 py-4">Date Added</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eef2f0]">
                                    {contacts.map((contact) => (
                                        <tr key={contact.id} className="hover:bg-[#f8fafa] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#111714]">
                                                {contact.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {contact.phone_number}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {contact.email || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    {contact.tags && contact.tags.length > 0 ? (
                                                        contact.tags.map((tag, i) => (
                                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-text-secondary italic text-xs">No tags</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary text-xs">
                                                {new Date(contact.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-[#eef2f0] flex justify-between items-center bg-[#f9fbfb]">
                            <h3 className="text-lg font-bold text-[#111714]">Add New Contact</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-text-secondary hover:text-[#111714]"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateContact} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#111714] mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full h-10 rounded-lg border border-[#dce5df] px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#111714] mb-1">Phone Number *</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full h-10 rounded-lg border border-[#dce5df] px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder="e.g. 15551234567"
                                    required
                                />
                                <p className="text-xs text-text-secondary mt-1">Include country code without +</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#111714] mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full h-10 rounded-lg border border-[#dce5df] px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder="jane@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#111714] mb-1">Tags</label>
                                <input
                                    type="text"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    className="w-full h-10 rounded-lg border border-[#dce5df] px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder="e.g. VIP, Customer, Lead (comma separated)"
                                />
                            </div>

                            {!wabaId && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                                    Warning: No WhatsApp Account connected. You may not be able to message this contact.
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 h-10 rounded-xl border border-[#dce5df] bg-white text-[#111714] font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-10 rounded-xl bg-primary text-[#111714] font-bold hover:bg-[#1ac759] transition-colors shadow-lg shadow-primary/20"
                                >
                                    Save Contact
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import CSV Modal */}
            {showCsvModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-[#eef2f0] flex justify-between items-center bg-[#f9fbfb]">
                            <h3 className="text-lg font-bold text-[#111714]">Import Contacts from CSV</h3>
                            <button
                                onClick={() => {
                                    setShowCsvModal(false);
                                    setCsvFile(null);
                                }}
                                className="text-text-secondary hover:text-[#111714]"
                                disabled={uploading}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCsvUpload} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#111714] mb-2">Upload CSV File</label>
                                <div className="border-2 border-dashed border-[#dce5df] rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="file" 
                                        accept=".csv"
                                        onChange={(e) => setCsvFile(e.target.files[0])}
                                        className="hidden" 
                                        id="csv-upload"
                                        disabled={uploading}
                                    />
                                    <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                                        <span className="material-symbols-outlined text-4xl text-primary mb-2">csv</span>
                                        <span className="text-sm font-medium text-[#111714]">
                                            {csvFile ? csvFile.name : "Click to select a file"}
                                        </span>
                                        <span className="text-xs text-text-secondary mt-1">Must include a 'Phone' or 'Phone Number' column</span>
                                    </label>
                                </div>
                            </div>
                            
                            {!wabaId && (
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                                    Warning: No WhatsApp Account connected. Bulk import requires an active account.
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCsvModal(false);
                                        setCsvFile(null);
                                    }}
                                    className="flex-1 h-10 rounded-xl border border-[#dce5df] bg-white text-[#111714] font-medium hover:bg-gray-50 transition-colors"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-10 rounded-xl bg-primary text-[#111714] font-bold hover:bg-[#1ac759] transition-colors shadow-lg shadow-primary/20 flex items-center justify-center"
                                    disabled={!csvFile || uploading || !wabaId}
                                >
                                    {uploading ? (
                                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    ) : (
                                        "Import Contacts"
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

export default ContactsPage;
