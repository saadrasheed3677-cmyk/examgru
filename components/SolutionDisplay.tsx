
import React, { useState } from 'react';
import { Download, FileDown, Code, Check, Copy, Edit3, Save, Layout, Terminal, PenTool, Book, Type as TypeIcon } from 'lucide-react';
import { AssignmentResult, Question } from '../types';
import AITutorChat from './AITutorChat';

type StyleMode = 'academic' | 'handwritten' | 'elegant' | 'terminal' | 'blueprint';

interface SolutionDisplayProps {
  result: AssignmentResult;
  setResult: React.Dispatch<React.SetStateAction<AssignmentResult | null>>;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ result, setResult }) => {
  const [styleMode, setStyleMode] = useState<StyleMode>('academic');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      setIsEditing(false);
      setTimeout(() => window.print(), 100);
    } else if (format === 'docx') {
      const filename = `${result.title.replace(/\s+/g, '_')}.doc`;
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${result.title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; }
          h1 { text-align: center; text-transform: uppercase; color: #1e40af; border-bottom: 2pt solid #1e40af; padding-bottom: 10pt; }
          .question { font-weight: bold; font-size: 14pt; margin-top: 25pt; color: #111827; }
          .explanation { background: #f9fafb; padding: 12pt; border: 1pt solid #e5e7eb; margin: 10pt 0; color: #4b5563; }
          .answer { border-left: 3pt solid #3b82f6; padding-left: 10pt; margin: 10pt 0; }
          .code { font-family: 'Courier New', monospace; background: #111827; color: #f3f4f6; padding: 15pt; display: block; border-radius: 5pt; }
        </style>
        </head><body>
      `;
      const footer = "</body></html>";
      let content = `<h1>${result.title}</h1>`;
      result.questions.forEach((q, i) => {
        content += `<div class="question">Question ${i + 1}: ${q.question_text}</div>`;
        content += `<div class="explanation"><strong>Explanation:</strong><br/>${q.explanation.replace(/\n/g, '<br/>')}</div>`;
        if (q.solution && !q.code) {
          content += `<div class="answer"><strong>Final Answer:</strong><br/>${q.solution.replace(/\n/g, '<br/>')}</div>`;
        }
        if (q.code) {
          content += `<p><strong>Source Code (${q.language || 'Code'}):</strong></p>`;
          content += `<div class="code"><pre>${q.code}</pre></div>`;
        }
        content += `<hr/>`;
      });
      const blob = new Blob([header + content + footer], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStyleClasses = () => {
    switch (styleMode) {
      case 'handwritten': return 'font-handwritten text-2xl bg-white border-blue-200';
      case 'elegant': return 'font-serif text-lg bg-[#fffcf5] border-[#e0d5c1] text-stone-800';
      case 'terminal': return 'font-mono text-sm bg-zinc-950 border-zinc-800 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]';
      case 'blueprint': return 'font-mono text-sm bg-blueprint border-white/20 text-white shadow-2xl';
      default: return 'font-sans text-base bg-white border-gray-200';
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeContent = part.slice(1, -1);
        return (
          <code key={i} className={`inline-block px-1.5 py-0.5 rounded font-mono text-[0.85em] border ${
            styleMode === 'terminal' ? 'bg-zinc-800 border-zinc-700 text-green-300' :
            styleMode === 'blueprint' ? 'bg-white/10 border-white/20 text-blue-200' :
            'bg-slate-100 border-slate-200 text-indigo-700'
          }`}>
            {codeContent}
          </code>
        );
      }
      return part;
    });
  };

  const EditableField = ({ value, onUpdate, className, label }: { value: string, onUpdate: (val: string) => void, className: string, label?: string }) => {
    if (!isEditing) return <div className={className}>{renderFormattedText(value)}</div>;
    return (
      <div className="w-full">
        {label && <div className="text-[10px] font-bold text-blue-500 uppercase mb-1">{label}</div>}
        <textarea
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          className={`w-full bg-blue-50/10 border-2 border-blue-500/20 focus:border-blue-500 focus:bg-white rounded-xl p-3 outline-none transition-all resize-y min-h-[60px] ${
            styleMode === 'terminal' || styleMode === 'blueprint' ? 'text-gray-900 bg-white' : ''
          } ${className}`}
          rows={Math.max(2, value.split('\n').length)}
        />
      </div>
    );
  };

  const templates: { id: StyleMode, icon: React.ReactNode, label: string }[] = [
    { id: 'academic', icon: <Book size={14} />, label: 'Academic' },
    { id: 'handwritten', icon: <PenTool size={14} />, label: 'Handwritten' },
    { id: 'elegant', icon: <TypeIcon size={14} />, label: 'Elegant' },
    { id: 'terminal', icon: <Terminal size={14} />, label: 'Terminal' },
    { id: 'blueprint', icon: <Layout size={14} />, label: 'Blueprint' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 relative">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-3xl border shadow-xl sticky top-4 z-10 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Edit3 size={20} />
            </div>
            <div>
              {isEditing ? (
                <input 
                  value={result.title}
                  onChange={(e) => updateTitle(e.target.value)}
                  className="text-xl font-bold text-gray-900 border-b-2 border-blue-400 outline-none font-sans"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 truncate max-w-xs font-sans">{result.title}</h2>
              )}
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 font-sans">
                {result.type} Assignment
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isEditing ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isEditing ? <><Save size={16} /> Save</> : <><Edit3 size={16} /> Manual Edit</>}
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />
            
            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={() => handleDownload('docx')}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
            >
              <FileDown size={16} /> DOCX
            </button>
          </div>
        </div>

        {/* Template Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 font-sans">Template</span>
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setStyleMode(tmpl.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap font-sans ${
                styleMode === tmpl.id 
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              {tmpl.icon}
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Document Content */}
      <div className={`space-y-12 p-12 rounded-[2.5rem] border-4 transition-all duration-500 ${getStyleClasses()}`}>
        <div className={`text-center mb-16 border-b pb-10 ${
          styleMode === 'terminal' ? 'border-zinc-800' : 
          styleMode === 'blueprint' ? 'border-white/20' : 
          'border-gray-100'
        }`}>
          {isEditing ? (
             <div className="max-w-xl mx-auto">
               <EditableField value={result.title} onUpdate={updateTitle} className="text-4xl font-black text-center uppercase tracking-widest" label="Document Title" />
             </div>
          ) : (
            <h1 className={`text-4xl font-black mb-3 uppercase tracking-[0.2em] ${
              styleMode === 'blueprint' ? 'text-white' : 
              styleMode === 'terminal' ? 'text-green-500' : 'text-gray-900'
            }`}>
              {result.title}
            </h1>
          )}
          <p className={`italic text-sm tracking-widest uppercase ${
            styleMode === 'blueprint' ? 'text-blue-300' : 
            styleMode === 'terminal' ? 'text-zinc-500' : 'text-gray-400'
          }`}>
            Generated with AceAssign AI Academic Engine
          </p>
        </div>

        {result.questions.map((q, index) => (
          <div key={q.id} className="space-y-6 relative group/q">
            <div className="flex items-start gap-6">
              <span className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
                styleMode === 'blueprint' ? 'bg-white text-blue-800' :
                styleMode === 'terminal' ? 'bg-green-500 text-black' :
                'bg-blue-600 text-white shadow-lg'
              }`}>
                {index + 1}
              </span>
              <div className="space-y-6 flex-1">
                <EditableField 
                  value={q.question_text} 
                  onUpdate={(val) => updateQuestionField(q.id, 'question_text', val)} 
                  className={`font-bold text-xl leading-snug ${
                    styleMode === 'blueprint' ? 'text-white' : 
                    styleMode === 'terminal' ? 'text-green-300' : 'text-gray-900'
                  }`} 
                  label="Question"
                />
                
                <div className={`rounded-3xl p-8 border-2 transition-all group-hover/q:border-blue-400/30 ${
                  styleMode === 'blueprint' ? 'bg-white/5 border-white/10' :
                  styleMode === 'terminal' ? 'bg-zinc-900 border-zinc-800' :
                  'bg-slate-50 border-slate-100'
                }`}>
                  <div className={`flex items-center gap-2 text-[10px] font-black mb-4 uppercase tracking-[0.2em] ${
                    styleMode === 'blueprint' ? 'text-blue-300' :
                    styleMode === 'terminal' ? 'text-green-500' : 'text-blue-600'
                  }`}>
                    <Check size={14} /> Solution Breakdown
                  </div>
                  <EditableField 
                    value={q.explanation} 
                    onUpdate={(val) => updateQuestionField(q.id, 'explanation', val)} 
                    className={`leading-relaxed whitespace-pre-wrap ${
                      styleMode === 'blueprint' || styleMode === 'terminal' ? 'text-gray-300' : 'text-slate-600'
                    }`} 
                  />
                </div>

                {q.code !== undefined && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] px-1 no-print ${
                      styleMode === 'blueprint' ? 'text-blue-300' : 'text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Code size={14} /> {q.language || 'Snippet'}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(q.code || '', q.id)}
                        className="hover:text-blue-500 transition-colors flex items-center gap-1"
                      >
                        {copiedId === q.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === q.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={q.code}
                        onChange={(e) => updateQuestionField(q.id, 'code', e.target.value)}
                        className="w-full bg-slate-900 text-blue-400 p-6 rounded-3xl font-mono text-sm border-4 border-slate-800 focus:border-blue-500 outline-none"
                        rows={8}
                      />
                    ) : (
                      <pre className={`p-8 rounded-3xl overflow-x-auto font-mono text-sm leading-relaxed border-2 ${
                        styleMode === 'blueprint' ? 'bg-white/5 border-white/10 text-blue-200' :
                        styleMode === 'terminal' ? 'bg-zinc-900 border-zinc-800 text-green-400' :
                        'bg-slate-900 text-slate-100 border-slate-800'
                      }`}>
                        <code>{q.code}</code>
                      </pre>
                    )}
                  </div>
                )}

                {q.solution && !q.code && (
                  <div className={`pl-6 border-l-4 ${
                    styleMode === 'blueprint' ? 'border-blue-400' : 
                    styleMode === 'terminal' ? 'border-green-500' : 'border-blue-600'
                  }`}>
                    <EditableField 
                      value={q.solution} 
                      onUpdate={(val) => updateQuestionField(q.id, 'solution', val)} 
                      className={`font-black text-lg whitespace-pre-wrap ${
                        styleMode === 'blueprint' ? 'text-white' : 
                        styleMode === 'terminal' ? 'text-green-400' : 'text-slate-900'
                      }`} 
                      label="Result"
                    />
                  </div>
                )}

                {q.execution_output && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-green-500 uppercase tracking-widest px-1">
                      Verified Output
                    </div>
                    <pre className="bg-green-950/30 text-green-400 p-4 rounded-2xl overflow-x-auto font-mono text-xs border border-green-900/50">
                      <code>{q.execution_output}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
            {index < result.questions.length - 1 && <div className={`border-b pt-10 ${
              styleMode === 'blueprint' ? 'border-white/10' : 
              styleMode === 'terminal' ? 'border-zinc-900' : 'border-gray-50'
            }`} />}
          </div>
        ))}
        
        <div className={`pt-12 mt-12 border-t text-center text-[10px] font-bold uppercase tracking-[0.3em] ${
          styleMode === 'blueprint' ? 'text-blue-300/50 border-white/10' :
          styleMode === 'terminal' ? 'text-zinc-700 border-zinc-900' :
          'text-slate-300 border-slate-50'
        }`}>
          End of Document • AceAssign AI Professional Intelligence
        </div>
      </div>

      {/* Floating Chat Interface */}
      <AITutorChat result={result} setResult={setResult} />
    </div>
  );
};

export default SolutionDisplay;
