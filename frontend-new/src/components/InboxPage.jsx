import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';

const InboxPage = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [wabaData, setWabaData] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch Contacts and WABA Account on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch WABA Account
                const accRes = await fetch('/api/whatsapp/accounts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const accData = await accRes.json();
                if (accData.success && accData.accounts.length > 0) {
                    setWabaData(accData.accounts[0]);
                }

                // Fetch Contacts
                const contactsRes = await fetch('/api/contacts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const contactsData = await contactsRes.json();
                if (contactsData.success) {
                    setContacts(contactsData.contacts);
                }
            } catch (error) {
                console.error("Error loading inbox data:", error);
            } finally {
                setLoadingContacts(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch Messages when Contact Selected
    useEffect(() => {
        if (!selectedContact) return;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/messages/${selectedContact.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setMessages(data.messages);
                    scrollToBottom();
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
        // Optional: Set up polling here
        const interval = setInterval(fetchMessages, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [selectedContact]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedContact || !wabaData) return;

        const tempMsg = {
            id: 'temp-' + Date.now(),
            direction: 'outbound',
            body: { text: newMessage },
            timestamp: new Date().toISOString(),
            status: 'sending'
        };

        // Optimistic update
        setMessages([...messages, tempMsg]);
        setNewMessage('');
        scrollToBottom();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    wabaId: wabaData.waba_id,
                    phoneNumberId: wabaData.phone_number_id,
                    contactId: selectedContact.id,
                    type: 'text',
                    body: { text: tempMsg.body.text }
                })
            });

            const data = await res.json();
            if (data.success) {
                // Replace temp message with real one
                setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
            } else {
                console.error("Failed to send message:", data.error);
                // Mark temp message as failed
                setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: 'failed' } : m));
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
                {/* Chat List */}
                <div className="w-full md:w-1/3 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Chats</h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-primary text-sm"
                            />
                            <span className="material-symbols-outlined text-gray-400 absolute left-3 top-2.5 text-[18px]">search</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingContacts ? (
                            <div className="p-4 text-center text-gray-500">Loading contacts...</div>
                        ) : contacts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No contacts found.</div>
                        ) : (
                            contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-green-50 border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-semibold text-sm ${selectedContact?.id === contact.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {contact.name || contact.phone_number}
                                        </h4>
                                        <span className="text-xs text-gray-400">
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{contact.email || contact.phone_number}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-sm overflow-hidden">
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-3">
                                        {selectedContact.name ? selectedContact.name.charAt(0).toUpperCase() : '#'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{selectedContact.name || selectedContact.phone_number}</h3>
                                        <p className="text-xs text-green-500 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                            WhatsApp
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#e5ddd5]" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                                {loadingMessages ? (
                                    <div className="text-center p-4"><span className="bg-white px-3 py-1 rounded-full text-sm shadow-sm">Loading messages...</span></div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center p-8"><span className="bg-white px-4 py-2 rounded-lg shadow-sm text-gray-500 text-sm">No messages yet. Start the conversation!</span></div>
                                ) : (
                                    messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`${msg.direction === 'outbound' ? 'bg-[#dcf8c6]' : 'bg-white'} text-gray-800 p-3 rounded-lg shadow-sm max-w-[80%] ${msg.direction === 'outbound' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                                                <p className="text-sm">{msg.body?.text || msg.body}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <p className="text-[10px] text-gray-500">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {msg.direction === 'outbound' && (
                                                        <span className="material-symbols-outlined text-[12px] text-gray-400">
                                                            {msg.status === 'sending' ? 'schedule' : 'done_all'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!wabaData}
                                    className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-md shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined text-6xl mb-4">chat</span>
                            <p className="text-lg font-medium">Select a contact to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default InboxPage;
