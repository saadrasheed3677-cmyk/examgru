
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot, Minimize2, Trash2, Clock, Check, Zap, MessageSquare, Info } from 'lucide-react';
import { AssignmentResult, Question } from '../types';
import { geminiService } from '../services/gemini';
import { Chat, GenerateContentResponse, Content } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
  isSystem?: boolean;
  timestamp: number;
}

interface AITutorChatProps {
  result: AssignmentResult;
  setResult: React.Dispatch<React.SetStateAction<AssignmentResult | null>>;
}

const AITutorChat: React.FC<AITutorChatProps> = ({ result, setResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `aceassign_chat_${result.title.replace(/\s+/g, '_').toLowerCase()}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved chat", e);
      }
    } else {
      setMessages([
        { 
          role: 'model', 
          text: `Hi! I'm your AI Tutor. I'm connected to your live document. I can help you explain these concepts, verify the code, or even edit the solutions for you. How can I help?`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (isOpen && !chatSession) {
      const history: Content[] = messages
        .filter(m => !m.isSystem)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      setChatSession(geminiService.startChat(result, history));
    }
  }, [isOpen, result, chatSession, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading, isOpen]);

  const clearHistory = () => {
    if (window.confirm("Clear all chat history for this assignment?")) {
      localStorage.removeItem(storageKey);
      setMessages([{ 
        role: 'model', 
        text: `History cleared. Your document state is preserved. What's next?`,
        timestamp: Date.now()
      }]);
      setChatSession(null); 
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      let fullText = '';
      
      const processStream = async (stream: any) => {
        let calls: any[] = [];
        for await (const chunk of stream) {
          const c = chunk as GenerateContentResponse;
          
          if (c.functionCalls && c.functionCalls.length > 0) {
            calls.push(...c.functionCalls);
          }

          const text = c.text || '';
          if (text) {
            fullText += text;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg && lastMsg.role === 'model' && !lastMsg.isSystem) {
                newMessages[newMessages.length - 1] = { ...lastMsg, text: fullText };
              } else {
                newMessages.push({ role: 'model', text: fullText, timestamp: Date.now() });
              }
              return newMessages;
            });
          }
        }
        return calls;
      };

      const initialStream = await chatSession.sendMessageStream({ message: userMessage });
      const toolCalls = await processStream(initialStream);

      if (toolCalls.length > 0) {
        let updateSummary = "";
        const functionResponses = toolCalls.map(fc => {
          if (fc.name === 'update_assignment_content') {
            const args = fc.args as any;
            
            setResult(prev => {
              if (!prev) return null;
              let updatedQuestions = [...prev.questions];
              
              if (args.questions && Array.isArray(args.questions)) {
                updatedQuestions = updatedQuestions.map(q => {
                  const update = args.questions.find((u: any) => String(u.id) === String(q.id));
                  return update ? { ...q, ...update } : q;
                });
                updateSummary += `Modified ${args.questions.length} question(s). `;
              }

              if (args.title) {
                updateSummary += "Updated title. ";
              }

              return {
                ...prev,
                title: args.title || prev.title,
                questions: updatedQuestions
              };
            });

            return {
              functionResponse: {
                id: fc.id,
                name: fc.name,
                response: { 
                  status: "success", 
                  message: "Content updated live." 
                }
              }
            };
          }
          return {
            functionResponse: {
              id: fc.id,
              name: fc.name,
              response: { error: "Unknown function" }
            }
          };
        });

        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `✨ Applied changes: ${updateSummary || 'Updated content.'}`, 
          isSystem: true,
          timestamp: Date.now()
        }]);
        
        fullText = '';
        const followUpStream = await chatSession.sendMessageStream({ message: functionResponses });
        await processStream(followUpStream);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I encountered a minor issue. Could you try rephrasing that?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 flex items-center gap-3 group no-print border-4 border-white"
      >
        <div className="relative">
          <Zap size={28} className="fill-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div className="flex flex-col items-start pr-2">
           <span className="text-sm font-bold tracking-tight">AI Assistant</span>
           <span className="text-[10px] opacity-80 font-medium">Ready to edit live</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[440px] h-[700px] bg-[#fdfdfd] rounded-[2.5rem] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.25)] border border-slate-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500 no-print">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Bot size={26} />
          </div>
          <div className="flex flex-col">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              AceAssign Tutor
              <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-100">Live</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[11px] text-slate-400 font-semibold">Active & Connected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearHistory}
            className="hover:bg-red-50 hover:text-red-500 p-2.5 rounded-xl transition-all text-slate-400"
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="hover:bg-slate-100 p-2.5 rounded-xl transition-all text-slate-400"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      </div>

      {/* Modern Messages Layout */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#f8fafc]/50 no-scrollbar"
      >
        <div className="flex justify-center mb-8">
           <div className="bg-slate-100/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-2">
              <Info size={14} className="text-slate-400" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Conversation started on {new Date().toLocaleDateString()}</span>
           </div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            {msg.isSystem ? (
               <div className="w-full flex justify-center py-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-5 py-2.5 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-3 shadow-sm">
                    <div className="bg-emerald-500 text-white p-1 rounded-full"><Check size={12} strokeWidth={4} /></div>
                    {msg.text}
                  </div>
               </div>
            ) : (
              <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md mt-auto mb-1 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border border-slate-100'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Zap size={20} className="fill-blue-600" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className={`p-5 rounded-3xl text-[13.5px] leading-[1.6] shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-br-none font-medium' 
                    : 'bg-white border-slate-200 border rounded-tl-none text-slate-700 font-normal ring-1 ring-slate-100/50'
                  }`}>
                    {msg.text || (isLoading && i === messages.length - 1 ? (
                      <div className="flex gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : null)}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tighter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <Clock size={8} /> {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start ml-14">
             <div className="flex gap-2.5 items-center text-blue-600 text-[10px] font-black bg-blue-50/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-100 shadow-sm uppercase tracking-widest">
                <Loader2 size={14} className="animate-spin" /> Thinking...
             </div>
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           {['Rewrite simply', 'Add comments to code', 'Check math steps', 'Summarize key points'].map(pill => (
             <button 
               key={pill}
               onClick={() => setInput(pill)}
               className="text-[11px] whitespace-nowrap bg-white hover:bg-blue-600 hover:text-white px-4 py-2 rounded-2xl border border-slate-200 transition-all font-bold text-slate-600 shadow-sm flex items-center gap-1.5 group"
             >
               <Sparkles size={12} className="group-hover:text-white text-blue-500" />
               {pill}
             </button>
           ))}
        </div>
        <div className="relative flex items-center group">
          <div className="absolute left-4 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors">
             <MessageSquare size={20} />
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a request (e.g. 'Improve Q2 answer')"
            className="w-full pl-12 pr-16 py-4.5 bg-slate-50/50 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-3 rounded-2xl transition-all ${
              input.trim() && !isLoading 
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:scale-105 active:scale-95 shadow-xl shadow-blue-200' 
              : 'bg-slate-100 text-slate-300'
            }`}
          >
            <Send size={22} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest pt-1">
           Encrypted • Contextual Intelligence Enabled
        </p>
      </div>
    </div>
  );
};

export default AITutorChat;
