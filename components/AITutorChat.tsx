
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles, User, Bot, Minimize2, Wrench, Trash2, Clock, Check } from 'lucide-react';
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
          text: `Hi! I'm your AI Tutor. I can explain these solutions or even edit them for you if you ask! How can I help?`,
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const clearHistory = () => {
    if (window.confirm("Clear all chat history for this assignment?")) {
      localStorage.removeItem(storageKey);
      setMessages([{ 
        role: 'model', 
        text: `Chat cleared. How else can I help with "${result.title}"?`,
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
              // Ensure we are updating the active model message and not a system one
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
                  // Use robust ID matching (string comparison)
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
                  message: "The document has been updated and the user can see the changes." 
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

        // Add distinct system confirmation message
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `✨ Content Updated: ${updateSummary || 'Applied requested changes.'}`, 
          isSystem: true,
          timestamp: Date.now()
        }]);
        
        // Reset text accumulator for the model's follow-up explanation
        fullText = '';
        const followUpStream = await chatSession.sendMessageStream({ message: functionResponses });
        await processStream(followUpStream);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I encountered an error trying to process that. Please try rephrasing your request.",
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
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 flex items-center gap-2 group no-print"
      >
        <div className="relative">
          <Sparkles size={24} className="animate-pulse" />
          {messages.length > 1 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
              {messages.length - 1}
            </span>
          )}
        </div>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold px-0 group-hover:px-2">
          AI Tutor
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-blue-50 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-8 no-print">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Tutor Session</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Live Document Sync</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearHistory}
            className="hover:bg-white/10 p-2 rounded-xl transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={18} />
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
            <Minimize2 size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
            {msg.isSystem ? (
               <div className="w-full flex justify-center py-2">
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-2 shadow-sm">
                    <Check size={12} className="text-emerald-500" /> {msg.text}
                  </div>
               </div>
            ) : (
              <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-auto ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border-blue-50 border rounded-tl-none text-slate-700'
                  }`}>
                    {msg.text || (isLoading && i === messages.length - 1 ? <Loader2 size={18} className="animate-spin text-blue-400" /> : null)}
                  </div>
                  <div className={`flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-tighter ${msg.role === 'user' ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
                    <Clock size={8} /> {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start ml-12">
             <div className="flex gap-2 items-center text-blue-400 text-[10px] font-bold bg-white px-3 py-1.5 rounded-full border border-blue-50 shadow-sm uppercase tracking-widest">
                <Loader2 size={14} className="animate-spin" /> Analyzing Document...
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 border-t bg-white">
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar py-1">
           {['Summarize the solution', 'Explain Q1 like I\'m five', 'Make everything formal', 'Check for errors'].map(pill => (
             <button 
               key={pill}
               onClick={() => setInput(pill)}
               className="text-[10px] whitespace-nowrap bg-slate-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl border border-slate-100 transition-all font-bold text-slate-500 shadow-sm"
             >
               {pill}
             </button>
           ))}
        </div>
        <div className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question or request an edit..."
            className="w-full pl-5 pr-14 py-4 bg-slate-100/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border-2 border-transparent focus:border-blue-100 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
              input.trim() && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutorChat;
