
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles, User, Bot, Minimize2 } from 'lucide-react';
import { AssignmentResult } from '../types';
import { geminiService } from '../services/gemini';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AITutorChatProps {
  result: AssignmentResult;
}

const AITutorChat: React.FC<AITutorChatProps> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi! I'm your AI Tutor for "${result.title}". How can I help you understand this assignment better today?` }
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
      const responseStream = await chatSession.sendMessageStream({ message: userMessage });
      let fullText = '';
      
      // Initial empty message for model to stream into
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullText += text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
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
        <MessageCircle size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium">
          Ask AI Tutor
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 no-print">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h3 className="font-bold">AI Tutor</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOpen(false)} className="hover:bg-blue-500 p-1 rounded transition-colors">
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border rounded-tl-none text-gray-800 shadow-sm'
              }`}>
                {msg.text || (isLoading && i === messages.length - 1 ? <Loader2 size={16} className="animate-spin" /> : null)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
          <div className="flex justify-start">
             <div className="flex gap-2 items-center text-gray-400 text-xs italic ml-10">
                <Loader2 size={12} className="animate-spin" /> Thinking...
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar">
           {['Explain Q1', 'Alternative solution', 'Practice problem'].map(pill => (
             <button 
               key={pill}
               onClick={() => setInput(pill)}
               className="text-[10px] whitespace-nowrap bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded-full border transition-colors"
             >
               {pill}
             </button>
           ))}
        </div>
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about this..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-400'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITutorChat;
