
import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, FileDown, Code, Check, Copy, Edit3, Save, Layout, 
  Terminal, PenTool, Book, Type as TypeIcon, Bold, Italic, 
  Underline, AlignLeft, AlignCenter, AlignRight, List, 
  ChevronDown, Maximize2, MoreVertical, Printer, Share2
} from 'lucide-react';
import { AssignmentResult, Question } from '../types';
import AITutorChat from './AITutorChat';

type Theme = 'standard' | 'academic' | 'modern' | 'manuscript';

interface SolutionDisplayProps {
  result: AssignmentResult;
  setResult: React.Dispatch<React.SetStateAction<AssignmentResult | null>>;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ result, setResult }) => {
  const [theme, setTheme] = useState<Theme>('standard');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const updateQuestionField = (id: string, field: keyof Question, value: string) => {
    setResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
      };
    });
  };

  const updateTitle = (value: string) => {
    setResult(prev => prev ? { ...prev, title: value } : null);
  };

  const handleDownload = (format: 'pdf' | 'docx') => {
    if (format === 'pdf') {
      setTimeout(() => window.print(), 100);
    } else if (format === 'docx') {
      const blob = new Blob([document.getElementById('document-paper')?.innerHTML || ''], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${result.title}.doc`;
      link.click();
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'academic': return 'font-serif leading-[2.0] text-black bg-white';
      case 'modern': return 'font-sans leading-relaxed text-slate-800 bg-white';
      case 'manuscript': return 'font-mono text-sm leading-tight text-gray-900 bg-white';
      default: return 'font-sans leading-normal text-gray-900 bg-white';
    }
  };

  const Toolbar = () => (
    <div className="sticky top-16 z-40 bg-[#f9fbfd] border-b border-slate-200 px-4 py-2 flex items-center justify-between no-print shadow-sm overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1">
        <div className="flex border-r pr-2 mr-2 gap-1 border-slate-300">
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Bold size={16} /></button>
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Italic size={16} /></button>
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><Underline size={16} /></button>
        </div>

        <div className="flex items-center gap-2 border-r pr-2 mr-2 border-slate-300">
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer hover:bg-slate-200 p-1 rounded transition-colors"
          >
            <option value="standard">Arial (Standard)</option>
            <option value="academic">Times New Roman (Academic)</option>
            <option value="modern">Inter (Modern)</option>
            <option value="manuscript">Courier (Manuscript)</option>
          </select>
        </div>

        <div className="flex gap-1 border-r pr-2 mr-2 border-slate-300">
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><AlignLeft size={16} /></button>
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><AlignCenter size={16} /></button>
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><AlignRight size={16} /></button>
        </div>

        <div className="flex gap-1 border-r pr-2 mr-2 border-slate-300">
           <button className="p-1.5 hover:bg-slate-200 rounded text-slate-600"><List size={16} /></button>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2">
           Live Syncing...
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => handleDownload('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-200 rounded text-xs font-bold text-slate-700">
          <Printer size={14} /> Print
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold text-white shadow-sm">
          <Share2 size={14} /> Share
        </button>
      </div>
    </div>
  );

  const EditableBlock = ({ value, onUpdate, className, isHeading = false, placeholder = "" }: { value: string, onUpdate: (v: string) => void, className: string, isHeading?: boolean, placeholder?: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [value]);

    return (
      <div className="group relative w-full">
        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onUpdate(e.target.value)}
          className={`w-full bg-transparent resize-none focus:outline-none focus:bg-blue-50/30 p-1 rounded-sm transition-colors block ${className} ${isHeading ? 'font-black tracking-tight' : ''}`}
          rows={1}
          style={{ overflow: 'hidden' }}
        />
      </div>
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#f3f4f6] pb-20 no-print flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-1.5 rounded text-white shadow-sm">
            <Book size={20} />
          </div>
          <div className="flex flex-col">
            <input 
              value={result.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="text-sm font-bold text-slate-800 border-none focus:ring-1 focus:ring-blue-400 px-1 py-0.5 rounded outline-none w-64 truncate"
            />
            <div className="flex items-center gap-4 text-[10px] text-slate-500 px-1 font-medium">
               <span className="cursor-pointer hover:text-blue-600">File</span>
               <span className="cursor-pointer hover:text-blue-600">Edit</span>
               <span className="cursor-pointer hover:text-blue-600">View</span>
               <span className="cursor-pointer hover:text-blue-600">Insert</span>
               <span className="cursor-pointer hover:text-blue-600">Format</span>
               <span className="cursor-pointer hover:text-blue-600">Tools</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">Academic Account</span>
              <span className="text-[9px] text-slate-400">All changes saved to cloud</span>
           </div>
           <button className="bg-blue-50 text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors">
              <Share2 size={18} />
           </button>
        </div>
      </div>

      <Toolbar />

      <div className="flex-1 overflow-y-auto p-8 md:p-12 flex justify-center no-print">
        <div 
          id="document-paper"
          className={`w-full max-w-[850px] min-h-[1100px] shadow-[0_0_20px_rgba(0,0,0,0.1)] p-[2.5cm] flex flex-col transition-all duration-300 ${getThemeStyles()}`}
        >
          <div className="mb-12 border-b border-slate-200 pb-8 text-center">
            <EditableBlock 
              value={result.title} 
              onUpdate={updateTitle} 
              className="text-3xl text-center uppercase tracking-[0.15em] mb-2"
              isHeading={true}
            />
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em]">
               Generated by AceAssign Intelligent Engine • {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-10">
            {result.questions.map((q, index) => (
              <div key={q.id} className="space-y-4">
                <div className="flex gap-4">
                  <span className="font-bold flex-shrink-0 min-w-[2.5rem]">Q{index + 1}.</span>
                  <EditableBlock 
                    value={q.question_text} 
                    onUpdate={(val) => updateQuestionField(q.id, 'question_text', val)} 
                    className="font-bold text-lg" 
                  />
                </div>

                <div className="pl-14 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Step-by-Step Analysis</h4>
                    <EditableBlock 
                      value={q.explanation} 
                      onUpdate={(val) => updateQuestionField(q.id, 'explanation', val)} 
                      className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap"
                    />
                  </div>

                  {q.code !== undefined && (
                    <div className="my-6 space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        <div className="flex items-center gap-2">
                          <Code size={12} />
                          <input 
                            value={q.language || ''} 
                            placeholder="Language"
                            onChange={(e) => updateQuestionField(q.id, 'language', e.target.value)}
                            className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5 w-24"
                          />
                        </div>
                        <button 
                          onClick={() => copyToClipboard(q.code || '', q.id)}
                          className="hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                          {copiedId === q.id ? <Check size={10} /> : <Copy size={10} />}
                          {copiedId === q.id ? 'COPIED' : 'COPY'}
                        </button>
                      </div>
                      <div className="bg-[#1e293b] rounded-lg overflow-hidden border border-slate-700">
                        <EditableBlock 
                          value={q.code || ""} 
                          onUpdate={(val) => updateQuestionField(q.id, 'code', val)} 
                          className="font-mono text-xs text-blue-300 p-6 leading-relaxed bg-[#1e293b] border-none focus:bg-[#243347]"
                          placeholder="// Type or paste code here..."
                        />
                      </div>
                    </div>
                  )}

                  {q.solution && !q.code && (
                    <div className="bg-blue-50/50 p-6 border-l-4 border-blue-600 rounded-r-lg">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Conclusive Result</h4>
                      <EditableBlock 
                        value={q.solution} 
                        onUpdate={(val) => updateQuestionField(q.id, 'solution', val)} 
                        className="text-base font-semibold italic"
                      />
                    </div>
                  )}

                  {q.execution_output && (
                    <div className="bg-slate-100 p-4 rounded border border-slate-200">
                      <h4 className="text-[9px] font-bold uppercase text-slate-500 mb-2">Runtime Verification Output</h4>
                      <pre className="text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">
                        {q.execution_output}
                      </pre>
                    </div>
                  )}
                </div>
                
                {index < result.questions.length - 1 && <div className="border-b border-slate-100 my-10" />}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-20 border-t border-slate-100 text-center">
            <div className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.5em]">
               Document end • Page 1 of 1
            </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block bg-white p-0">
         <div className={`p-10 ${getThemeStyles()}`}>
            <h1 className="text-3xl font-black text-center mb-10">{result.title}</h1>
            {result.questions.map((q, i) => (
              <div key={i} className="mb-10 page-break-inside-avoid">
                <h3 className="font-bold text-xl mb-4">Question {i+1}: {q.question_text}</h3>
                <div className="pl-6 mb-6">
                   <p className="mb-4 text-slate-700">{q.explanation}</p>
                   {q.code && <pre className="bg-slate-100 p-4 rounded font-mono text-xs mb-4">{q.code}</pre>}
                   {q.solution && <div className="p-4 border-l-2 border-slate-300 italic font-semibold">{q.solution}</div>}
                </div>
              </div>
            ))}
         </div>
      </div>

      <AITutorChat result={result} setResult={setResult} />
    </div>
  );
};

export default SolutionDisplay;
