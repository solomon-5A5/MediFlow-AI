import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const MedicalChatbot = ({ patient, aiResult }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello Doctor. I am your MediFlow AI assistant. I have reviewed the current patient file. How can I help you?' }
    ]);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newUserMsg = { role: 'user', content: message };
        setMessages(prev => [...prev, newUserMsg]);
        setMessage('');
        setIsTyping(true);

        // Build a secret string of context to send to the backend so the AI knows what's going on
        const contextString = `
            Patient Name: ${patient?.fullName || 'Unknown'}
            Age/Sex: ${patient?.age || 'N/A'} / ${patient?.gender || 'N/A'}
            Current AI Scan Results: ${aiResult ? JSON.stringify(aiResult.consensus_panel) : 'No scans run yet.'}
        `;

        try {
            const res = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: newUserMsg.content,
                    history: messages,
                    context: contextString
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please try again." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Server disconnected." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* The Chat Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-[#5747e6] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform hover:bg-indigo-700 relative"
                >
                    <Sparkles className="w-6 h-6" />
                    {aiResult && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>}
                </button>
            )}

            {/* The Chat Window */}
            {isOpen && (
                <div className="w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    
                    {/* Header */}
                    <div className="bg-[#5747e6] p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <div>
                                <h3 className="font-bold text-sm">MediFlow Copilot</h3>
                                <p className="text-[10px] text-indigo-200 uppercase tracking-widest">{patient ? `Context: ${patient.fullName}` : 'Global Context'}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-[#5747e6] text-white'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#5747e6] text-white flex items-center justify-center shrink-0">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-500 italic">
                                    Analyzing clinical data...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input 
                            type="text" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask about the scan or vitals..." 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                            type="submit" 
                            disabled={!message.trim() || isTyping}
                            className="w-10 h-10 bg-[#5747e6] text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MedicalChatbot;