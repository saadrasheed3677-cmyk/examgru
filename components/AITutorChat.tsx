
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles, User, Bot, Minimize2, Wrench } from 'lucide-react';
import { AssignmentResult, Question } from '../types';
import { geminiService } from '../services/gemini';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
  isSystem?: boolean;
}

interface AITutorChatProps {
  result: AssignmentResult;
  setResult: React.Dispatch<React.SetStateAction<AssignmentResult | null>>;
}

const AITutorChat: React.FC<AITutorChatProps> = ({ result, setResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi! I'm your AI Tutor. I can explain these solutions or even edit them for you if you ask! How can I help?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSession) {
      setChatSession(geminiService.startChat(result));
    }
  }, [isOpen, result, chatSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      let responseStream = await chatSession.sendMessageStream({ message: userMessage });
      let fullText = '';
      
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

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
              if (lastMsg.role === 'model' && !lastMsg.isSystem) {
                newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
              }
              return newMessages;
            });
          }
        }
        return calls;
      };

      const toolCalls = await processStream(responseStream);

      if (toolCalls.length > 0) {
        const functionResponses = toolCalls.map(fc => {
          if (fc.name === 'update_assignment_content') {
            const args = fc.args as any;
            
            // Apply updates to the state
            setResult(prev => {
              if (!prev) return null;
              let updatedQuestions = [...prev.questions];
              
              if (args.questions) {
                updatedQuestions = updatedQuestions.map(q => {
                  const update = args.questions.find((u: any) => u.id === q.id);
                  return update ? { ...q, ...update } : q;
                });
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
                response: { result: "Content updated successfully on user screen." }
              }
            };
          }
          return {
            functionResponse: {
              id: fc.id,
              name: fc.name,
              response: { error: "Unknown function called" }
            }
          };
        });

        // Add visual confirmation in chat
        setMessages(prev => [...prev, { role: 'model', text: "✨ I've updated the assignment content based on your request!", isSystem: true }]);
        
        // Reset full text for the follow-up confirmation from the AI
        fullText = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);
        
        // Send the function responses back to the model to complete the turn
        const followUpStream = await chatSession.sendMessageStream({ message: functionResponses });
        await processStream(followUpStream);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I hit a snag. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 flex items-center gap-2 group no-print"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold px-0 group-hover:px-2">
          AI Smart Edit
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
            <h3 className="font-bold text-sm">AI Tutor & Editor</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Active Session</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
          <Minimize2 size={20} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            {msg.isSystem ? (
               <div className="w-full flex justify-center py-2">
                  <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-2">
                    <Wrench size={12} /> {msg.text}
                  </div>
               </div>
            ) : (
              <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border-blue-50 border rounded-tl-none text-slate-700'
                }`}>
                  {msg.text || (isLoading && i === messages.length - 1 ? <Loader2 size={18} className="animate-spin text-blue-400" /> : null)}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start ml-12">
             <div className="flex gap-2 items-center text-blue-400 text-xs font-bold bg-white px-3 py-1.5 rounded-full border border-blue-50 shadow-sm">
                <Loader2 size={14} className="animate-spin" /> Analyzing your request...
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 border-t bg-white">
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar py-1">
           {['Rewrite Q1 simply', 'Make Q2 explanation shorter', 'Change title', 'Add more code comments'].map(pill => (
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
            placeholder="Tell me what to change..."
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
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">
          AI can modify the document based on your prompts
        </p>
      </div>
    </div>
  );
};

export default AITutorChat;
