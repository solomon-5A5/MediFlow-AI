import React, { useState, useEffect, useRef } from 'react';

export default function PatientChatPortal() {
  const user = { id: "P_DEFAULT" }; // Fallback. Change to useAuth() later!

  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🟢 NEW: Voice-to-Text State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  // GraphRAG States
  const [hasContext, setHasContext] = useState(false); 
  const [activeFile, setActiveFile] = useState(null);

  // Database States
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- DATABASE FUNCTIONS ---
  
  const fetchChatHistory = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/chats/patient/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch chat history", error);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const loadSpecificChat = async (chatId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/chats/${chatId}`);
      if (res.ok) {
        const chatData = await res.json();
        setCurrentChatId(chatData._id);
        setMessages(chatData.messages || []);
        setHasContext(chatData.hasContext);
        setActiveFile(chatData.activeFile);
      }
    } catch (error) {
      console.error("Failed to load chat", error);
    }
  };

  const saveChatToDatabase = async (updatedMessages, contextStatus, fileName) => {
    try {
      const res = await fetch("http://localhost:5001/api/chats/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          patientId: user.id,
          title: updatedMessages.length > 0 ? updatedMessages[0].content.substring(0, 25) + "..." : "New Chat",
          messages: updatedMessages,
          hasContext: contextStatus,
          activeFile: fileName
        })
      });
      const data = await res.json();
      
      if (!currentChatId && data._id) { 
        setCurrentChatId(data._id);
        fetchChatHistory(); 
      }
    } catch (err) {
      console.error("Failed to sync chat to DB", err);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setHasContext(false);
    setActiveFile(null);
  };

  // --- 🟢 NEW: VOICE TO TEXT LOGIC 🟢 ---
  const toggleListening = () => {
    if (isListening) {
      // If currently listening, stop it
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Check if the browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try using Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop listening automatically when they stop speaking
    recognition.interimResults = false; // Only get the final, accurate sentence
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Add the spoken text to whatever is already typed in the box
      setInputValue((prev) => prev + (prev.length > 0 ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- CHAT LOGIC ---

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setActiveFile(file.name);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", user.id);

    try {
      const response = await fetch("http://localhost:8000/api/ingest-patient-report", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Server rejected the file.");
      const data = await response.json(); 
      
      setHasContext(true);
      const newSystemMsg = { 
        id: Date.now(),
        role: 'system', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `✅ Successfully analyzed ${file.name}. (Detected: ${data.extracted_condition}). Your personal knowledge graph is updated.` 
      };
      
      const updatedMessages = [...messages, newSystemMsg];
      setMessages(updatedMessages);
      saveChatToDatabase(updatedMessages, true, file.name); 
      
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: inputValue
    };
    
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiEndpoint = hasContext 
        ? "http://localhost:8000/api/graph-chat" 
        : "http://localhost:8000/api/chat";

      const requestBody = hasContext 
        ? { question: userMessage.content, patient_id: user.id } 
        : { message: userMessage.content, history: messagesWithUser.map(m => ({role: m.role, content: m.content})) };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();

      const aiMessage = { 
        id: Date.now() + 1,
        role: 'ai', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: data.reply || data.answer || "I'm sorry, I couldn't process that.",
        sources: data.sources 
      };

      const finalMessages = [...messagesWithUser, aiMessage];
      setMessages(finalMessages);
      saveChatToDatabase(finalMessages, hasContext, activeFile);

    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-body bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0e7ff] h-screen text-on-surface overflow-hidden selection:bg-primary-container selection:text-on-primary-container flex w-full relative">
      
      <aside className="fixed left-0 top-0 h-full flex-col p-4 gap-2 bg-slate-50 border-r border-slate-200 z-50 hidden md:flex w-64">
        <div className="flex flex-col gap-4 mb-4 px-2">
          <div className="text-lg font-black text-slate-900 tracking-tighter">Clinical Curator AI</div>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 mt-2 overflow-y-auto pr-2">
          <button 
            onClick={startNewChat}
            className="flex items-center gap-3 px-4 py-3 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-bold mb-4 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span> New Chat
          </button>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-1">Recent Chats</p>
          
          {chatHistory.map((chat) => (
            <button 
              key={chat._id}
              onClick={() => loadSpecificChat(chat._id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                currentChatId === chat._id 
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {chat.hasContext ? 'memory' : 'chat_bubble'}
              </span>
              <div className="flex flex-col truncate">
                <span className="font-medium text-sm truncate">{chat.title}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col relative h-screen">
        
        <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-4">
            <span className="font-headline tracking-tighter text-indigo-700 font-bold text-xl">MediFlow AI</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-8 pb-40 flex flex-col items-center">
          <div className="w-full max-w-5xl space-y-8">
            
            <div className="flex flex-col gap-4 mb-10 sticky top-0 z-10">
              <div className="glass-morphism rounded-full px-6 py-3 flex items-center justify-between shadow-sm prism-edge">
                <div className="flex items-center gap-4">
                  {activeFile ? (
                    <div className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full border border-white/40">
                      <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                      <span className="text-xs font-bold text-on-surface">{activeFile}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">Upload a report to build your Knowledge Graph</span>
                  )}
                  <div className="h-4 w-[1px] bg-black/10"></div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${hasContext ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {hasContext ? 'Graph Analysis Active' : 'General Mode'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-20 text-sm">
                  Send a message or click the microphone to start speaking.
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end ml-auto max-w-[80%]' : 'items-start max-w-[85%]'}`}>
                  
                  <div className={`p-5 rounded-3xl text-sm shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-primary to-indigo-500 text-white user-bubble px-6' 
                      : msg.role === 'system'
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-3 mx-auto'
                      : 'glass-morphism ai-bubble text-on-surface leading-relaxed prism-edge'
                  }`}>
                    
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mt-4 space-y-4">
                        {msg.sources.map((src, idx) => {
                          const matchPercentage = (src.similarity_score * 100).toFixed(1);
                          return (
                            <div key={idx} className="border-b border-white/20 pb-3 last:border-0 last:pb-0">
                              <div className="flex justify-between items-end mb-2">
                                <div>
                                  <p className="text-[10px] uppercase font-bold text-primary mb-1">Graph Match: {src.disease}</p>
                                  <h4 className="font-headline font-bold text-lg">{matchPercentage}%</h4>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-gradient-to-r from-primary to-indigo-400" style={{ width: `${matchPercentage}%` }}></div>
                              </div>
                              <div className="text-xs italic text-slate-600 border-l-2 border-primary/30 pl-3 line-clamp-2">
                                "{src.notes}"
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                  </div>
                  
                  <span className={`text-[10px] text-slate-400 ${msg.role === 'user' ? 'mr-4' : 'ml-4'}`}>
                    {msg.time}
                  </span>
                </div>
              ))}

              {isLoading && (
                 <div className="flex flex-col gap-2 items-start max-w-[85%]">
                   <div className="glass-morphism ai-bubble p-4 px-6 rounded-3xl text-sm shadow-md text-slate-500 flex items-center gap-3 prism-edge">
                      <span className="material-symbols-outlined animate-spin">sync</span> Thinking...
                   </div>
                 </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

          </div>
        </section>

        {/* INPUT DOCK */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40 md:pl-64">
          <form onSubmit={handleSendMessage} className="glass-morphism rounded-full p-2 flex items-center shadow-2xl prism-edge ring-1 ring-white/50 bg-white/60">
            
            {/* PAPERCLIP UPLOAD */}
            <input 
              type="file" 
              id="graph-upload" 
              className="hidden" 
              accept=".pdf"
              onChange={handleFileUpload}
            />
            <label htmlFor="graph-upload" className="w-12 h-12 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-all cursor-pointer">
              <span className="material-symbols-outlined">attach_file</span>
            </label>

            {/* 🟢 NEW: MICROPHONE BUTTON 🟢 */}
            <button 
              type="button" 
              onClick={toggleListening}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ml-1 ${
                isListening ? 'bg-red-50 text-red-500 shadow-inner' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Voice Input"
            >
              <span className={`material-symbols-outlined ${isListening ? 'animate-pulse' : ''}`}>
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>

            {/* TEXT INPUT */}
            <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium px-4 placeholder:text-slate-400" 
              placeholder={isListening ? "Listening..." : (hasContext ? "Ask about your active context..." : "Ask MediFlow a medical question...")} 
              type="text"
            />

            {/* SEND BUTTON */}
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-primary to-indigo-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 ml-2"
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </form>
        </div>

      </main>

      {/* BACKGROUND DECORATIONS */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-10 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

    </div>
  );
}