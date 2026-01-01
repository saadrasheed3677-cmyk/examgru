
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, FileDown, Code, Check, Copy, Edit3, Save, Layout, 
  Terminal, PenTool, Book, Type as TypeIcon, Bold, Italic, 
  Underline, AlignLeft, AlignCenter, AlignRight, List, 
  ChevronDown, Maximize2, MoreVertical, Printer, Share2,
  Image as ImageIcon, Plus, Trash2, Highlighter, Palette,
  RotateCcw, Sparkles, Wand2, Type
} from 'lucide-react';
import { AssignmentResult, Question, QuestionAsset } from '../types';
import AITutorChat from './AITutorChat';

type Theme = 'standard' | 'academic' | 'modern' | 'manuscript';

interface SolutionDisplayProps {
  result: AssignmentResult;
  setResult: React.Dispatch<React.SetStateAction<AssignmentResult | null>>;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ result, setResult }) => {
  const [theme, setTheme] = useState<Theme>('standard');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState('11pt');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ top: number, left: number } | null>(null);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [collabActive, setCollabActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Selection Toolbar
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionBox({
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX + (rect.width / 2) - 100
        });
      } else {
        setSelectionBox(null);
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    return () => document.removeEventListener('mouseup', handleSelectionChange);
  }, []);

  const updateQuestionField = (id: string, field: keyof Question, value: any) => {
    setResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
      };
    });
  };

  const addImageToQuestion = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const newAsset: QuestionAsset = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'image',
        url: url,
        caption: file.name
      };
      
      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map(q => 
            q.id === id ? { ...q, assets: [...(q.assets || []), newAsset] } : q
          )
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAsset = (qId: string, assetId: string) => {
    setResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => 
          q.id === qId ? { ...q, assets: q.assets?.filter(a => a.id !== assetId) } : q
        )
      };
    });
  };

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleDownload = () => {
    // Hide toolbars explicitly before printing
    setSelectionBox(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCollaboration = () => {
    setCollabActive(true);
    // Mock sharing by copying link to clipboard
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCollabActive(false), 3000);
  };

  const FloatingToolbar = () => {
    if (!selectionBox) return null;
    return (
      <div 
        className="fixed z-[100] bg-slate-900 text-white rounded-lg shadow-2xl p-1.5 flex items-center gap-1 animate-in zoom-in-95 fade-in duration-200 border border-slate-700/50 backdrop-blur-md no-print"
        style={{ top: selectionBox.top, left: selectionBox.left }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <button onClick={() => applyFormatting('bold')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Bold"><Bold size={14} /></button>
        <button onClick={() => applyFormatting('italic')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Italic"><Italic size={14} /></button>
        <button onClick={() => applyFormatting('underline')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Underline"><Underline size={14} /></button>
        <div className="w-[1px] h-4 bg-slate-700 mx-1" />
        <button onClick={() => applyFormatting('backColor', '#fffde7')} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Highlight"><Highlighter size={14} /></button>
        <div className="w-[1px] h-4 bg-slate-700 mx-1" />
        <button 
          onClick={() => setIsAITutorOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-blue-600 rounded text-[10px] font-black uppercase tracking-tighter transition-all bg-blue-500/20 text-blue-300"
        >
          <Sparkles size={12} /> Refine with AI
        </button>
      </div>
    );
  };

  const Toolbar = () => (
    <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-2 flex items-center justify-between no-print shadow-sm overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1">
        {/* Undo/Redo */}
        <div className="flex border-r pr-3 mr-3 gap-1 border-slate-200">
           <button onClick={() => applyFormatting('undo')} className="p-2 hover:bg-slate-100 rounded text-slate-500"><RotateCcw size={16} /></button>
        </div>

        {/* Font Family Selector */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-2 py-1 mr-2">
          <Type size={14} className="text-slate-400 mr-2" />
          <select 
            value={fontFamily} 
            onChange={(e) => setFontFamily(e.target.value)}
            className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-4"
          >
            <option value="Inter">Inter UI</option>
            <option value="Playfair Display">Modern Serif</option>
            <option value="JetBrains Mono">JetBrains Mono</option>
            <option value="Lexend">Lexend Readable</option>
            <option value="Caveat">Handwritten</option>
            <option value="Montserrat">Montserrat Bold</option>
          </select>
        </div>

        {/* Font Size Selector */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md px-2 py-1 mr-3">
          <select 
            value={fontSize} 
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36].map(s => (
              <option key={s} value={`${s}pt`}>{s}pt</option>
            ))}
          </select>
        </div>

        <div className="flex border-r pr-3 mr-3 gap-1 border-slate-200">
           <button onClick={() => applyFormatting('bold')} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Bold size={16} /></button>
           <button onClick={() => applyFormatting('italic')} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Italic size={16} /></button>
           <button onClick={() => applyFormatting('underline')} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Underline size={16} /></button>
           <button onClick={() => applyFormatting('foreColor', '#2563eb')} className="p-2 hover:bg-slate-100 rounded text-blue-600"><Palette size={16} /></button>
        </div>

        <div className="flex gap-1">
           <button onClick={() => applyFormatting('justifyLeft')} className="p-2 hover:bg-slate-100 rounded text-slate-600"><AlignLeft size={16} /></button>
           <button onClick={() => applyFormatting('justifyCenter')} className="p-2 hover:bg-slate-100 rounded text-slate-600"><AlignCenter size={16} /></button>
           <button onClick={() => applyFormatting('insertUnorderedList')} className="p-2 hover:bg-slate-100 rounded text-slate-600"><List size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700 transition-colors">
          <Printer size={16} /> PDF Export
        </button>
        <button 
          onClick={handleCollaboration}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
            collabActive ? 'bg-green-600 text-white shadow-green-100' : 'bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-200'
          }`}
        >
          {collabActive ? <Check size={16} /> : <Share2 size={16} />}
          {collabActive ? 'Link Copied!' : 'Collaboration'}
        </button>
      </div>
    </div>
  );

  const EditableBlock = ({ 
    value, 
    onUpdate, 
    className, 
    isHeading = false, 
    placeholder = "" 
  }: { value: string, onUpdate: (v: string) => void, className: string, isHeading?: boolean, placeholder?: string }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }, []);

    const handleInput = () => {
      if (editorRef.current) {
        onUpdate(editorRef.current.innerHTML);
      }
    };

    return (
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        placeholder={placeholder}
        className={`w-full focus:outline-none focus:bg-blue-50/20 p-1 rounded-sm transition-all duration-300 ${className} ${isHeading ? 'font-black tracking-tight' : ''}`}
        style={{ fontFamily, fontSize: isHeading ? '1.5em' : fontSize }}
      />
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#f1f3f5] pb-20 no-print flex flex-col">
      <FloatingToolbar />
      
      {/* Document Meta Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Book size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <input 
              value={result.title}
              onChange={(e) => setResult(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="text-[13px] font-extrabold text-slate-800 bg-transparent border-none focus:ring-2 focus:ring-blue-100 px-1.5 py-0.5 rounded outline-none w-80 transition-all"
            />
            <div className="flex items-center gap-5 text-[10px] text-slate-400 px-1.5 font-bold uppercase tracking-widest mt-0.5">
               {['File', 'Edit', 'Insert', 'Format', 'Tools'].map(tab => (
                 <span key={tab} className="cursor-pointer hover:text-blue-600 transition-colors">{tab}</span>
               ))}
               <span 
                 onClick={() => setIsAITutorOpen(true)}
                 className="cursor-pointer text-blue-600 hover:text-blue-700 font-black flex items-center gap-1 transition-colors"
               >
                 <Sparkles size={10} /> AI Assistant
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex -space-x-2 mr-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                   {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div 
                className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                onClick={handleCollaboration}
                title="Add Collaborators"
              >
                <Plus size={14} />
              </div>
           </div>
           <button 
             onClick={handleDownload}
             className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all font-bold text-[11px] shadow-sm border border-blue-100"
           >
              Publish PDF
           </button>
        </div>
      </div>

      <Toolbar />

      {/* Main Document Body */}
      <div className="flex-1 overflow-y-auto p-12 flex justify-center no-print">
        <div 
          id="document-paper"
          className={`w-full max-w-[900px] min-h-[1150px] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.12)] p-[2.54cm] flex flex-col bg-white rounded-sm ring-1 ring-slate-200/50 relative print-container`}
          style={{ fontFamily }}
        >
          {/* Header */}
          <div className="mb-16 pb-12 border-b-2 border-slate-100 text-center">
            <EditableBlock 
              value={result.title} 
              onUpdate={(v) => setResult(prev => prev ? { ...prev, title: v } : null)} 
              className="text-4xl text-center font-black uppercase tracking-[0.2em] mb-4 text-slate-900"
              isHeading={true}
            />
            <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
               <span>Assignment Dossier</span>
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
               <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="space-y-16">
            {result.questions.map((q, index) => (
              <div key={q.id} className="group relative">
                
                {/* Block Controls (Left Margin) */}
                <div className="absolute -left-16 top-0 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2 no-print">
                   <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400" title="Drag Block"><Maximize2 size={16} /></button>
                   <button onClick={() => {
                     const input = document.createElement('input');
                     input.type = 'file';
                     input.accept = 'image/*';
                     input.onchange = (e) => {
                       const file = (e.target as HTMLInputElement).files?.[0];
                       if (file) addImageToQuestion(q.id, file);
                     };
                     input.click();
                   }} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg" title="Insert Image"><ImageIcon size={16} /></button>
                   <button onClick={() => {
                      if(window.confirm("Delete this question?")) {
                        setResult(prev => prev ? {...prev, questions: prev.questions.filter(qu => qu.id !== q.id)} : null);
                      }
                   }} className="p-2 hover:bg-red-50 text-red-400 rounded-lg" title="Delete Question"><Trash2 size={16} /></button>
                </div>

                <div className="flex gap-6">
                  <span className="font-black text-slate-300 text-2xl flex-shrink-0 min-w-[3rem] mt-1">{String(index + 1).padStart(2, '0')}</span>
                  <div className="flex-1 space-y-6">
                    <EditableBlock 
                      value={q.question_text} 
                      onUpdate={(val) => updateQuestionField(q.id, 'question_text', val)} 
                      className="font-bold text-xl leading-snug text-slate-800" 
                    />

                    {/* Rich Explanation */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                        <PenTool size={12} /> Analytical Exposition
                      </h4>
                      <EditableBlock 
                        value={q.explanation} 
                        onUpdate={(val) => updateQuestionField(q.id, 'explanation', val)} 
                        className="text-[14px] leading-relaxed text-slate-600 whitespace-pre-wrap"
                      />
                    </div>

                    {/* Image Assets */}
                    {q.assets && q.assets.length > 0 && (
                      <div className="grid grid-cols-1 gap-6 my-8">
                        {q.assets.map(asset => (
                          <div key={asset.id} className="relative group/asset rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                            <img src={asset.url} alt={asset.caption} className="w-full h-auto" />
                            <div className="absolute top-2 right-2 opacity-0 group-hover/asset:opacity-100 transition-opacity no-print">
                              <button onClick={() => removeAsset(q.id, asset.id)} className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600"><Trash2 size={14} /></button>
                            </div>
                            <div className="p-3 bg-white border-t border-slate-100">
                               <input 
                                 value={asset.caption}
                                 onChange={(e) => {
                                   const newAssets = q.assets?.map(a => a.id === asset.id ? { ...a, caption: e.target.value } : a);
                                   updateQuestionField(q.id, 'assets', newAssets);
                                 }}
                                 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-transparent w-full text-center border-none focus:ring-0"
                                 placeholder="Add image caption..."
                               />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Code Section (Special Handling) */}
                    {q.code !== undefined && (
                      <div className="my-8 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            <input 
                              value={q.language || 'Plain Text'} 
                              onChange={(e) => updateQuestionField(q.id, 'language', e.target.value)}
                              className="bg-slate-50 border-none focus:outline-none rounded-full px-4 py-1 font-bold text-blue-600"
                            />
                          </div>
                          <button onClick={() => {
                            navigator.clipboard.writeText(q.code || '');
                            setCopiedId(q.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }} className="hover:text-blue-600 transition-all flex items-center gap-2">
                            {copiedId === q.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === q.id ? 'COPIED' : 'COPY SNIPPET'}
                          </button>
                        </div>
                        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                          <textarea
                            value={q.code || ""} 
                            onChange={(e) => updateQuestionField(q.id, 'code', e.target.value)} 
                            className="w-full font-mono text-[12px] text-blue-300 p-8 leading-relaxed bg-[#0f172a] border-none focus:ring-0 resize-none min-h-[150px]"
                            onInput={(e) => {
                              const t = e.target as HTMLTextAreaElement;
                              t.style.height = 'auto';
                              t.style.height = t.scrollHeight + 'px';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Conclusion */}
                    {q.solution && !q.code && (
                      <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 mt-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                           <Wand2 size={80} />
                        </div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 opacity-70">Synthesized Result</h4>
                        <EditableBlock 
                          value={q.solution} 
                          onUpdate={(val) => updateQuestionField(q.id, 'solution', val)} 
                          className="text-lg font-bold leading-relaxed italic border-none focus:bg-white/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {index < result.questions.length - 1 && (
                  <div className="relative py-12 flex justify-center no-print">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                     <button className="relative bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2">
                        <Plus size={12} /> Insert Break
                     </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-24 border-t-2 border-slate-50 text-center">
            <div className="text-[10px] text-slate-300 font-black uppercase tracking-[0.6em] mb-2">
               Verified Academic Protocol 2.5.0
            </div>
            <div className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
               Document Confidentiality Guaranteed • Page 1
            </div>
          </div>
        </div>
      </div>

      <AITutorChat 
        result={result} 
        setResult={setResult} 
        forceOpen={isAITutorOpen} 
        onClose={() => setIsAITutorOpen(false)} 
      />
    </div>
  );
};

export default SolutionDisplay;
