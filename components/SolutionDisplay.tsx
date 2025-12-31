
import React, { useState } from 'react';
import { Download, FileDown, Code, FileText, Check, Copy, Edit3, Save, X } from 'lucide-react';
import { AssignmentResult, Question } from '../types';
import AITutorChat from './AITutorChat';

interface SolutionDisplayProps {
  result: AssignmentResult;
  setResult: React.Dispatch<React.SetStateAction<AssignmentResult | null>>;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ result, setResult }) => {
  const [styleMode, setStyleMode] = useState<'clean' | 'handwritten'>('clean');
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
      setIsEditing(false); // Close edit mode before printing
      setTimeout(() => window.print(), 100);
    } else if (format === 'docx') {
      const filename = `${result.title.replace(/\s+/g, '_')}.doc`;
      
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${result.title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          h1 { text-align: center; text-transform: uppercase; color: #1e40af; }
          .question { font-weight: bold; font-size: 14pt; margin-top: 20pt; color: #111827; }
          .explanation { background: #f9fafb; padding: 10pt; border: 1pt solid #e5e7eb; margin: 10pt 0; }
          .code { font-family: 'Courier New', monospace; background: #111827; color: #f3f4f6; padding: 15pt; display: block; }
          .output { font-family: 'Courier New', monospace; color: #059669; font-weight: bold; }
        </style>
        </head><body>
      `;

      const footer = "</body></html>";
      
      let content = `<h1>${result.title}</h1>`;
      result.questions.forEach((q, i) => {
        content += `<div class="question">${i + 1}. ${q.question_text}</div>`;
        content += `<div class="explanation"><strong>Explanation:</strong><br/>${q.explanation.replace(/\n/g, '<br/>')}</div>`;
        if (q.solution && !q.code) {
          content += `<div class="solution"><strong>Answer:</strong><br/>${q.solution.replace(/\n/g, '<br/>')}</div>`;
        }
        if (q.code) {
          content += `<p><strong>Source Code (${q.language || 'Code'}):</strong></p>`;
          content += `<div class="code"><pre>${q.code}</pre></div>`;
        }
        if (q.execution_output) {
          content += `<p><strong>Execution Output:</strong></p>`;
          content += `<div class="output"><pre>${q.execution_output}</pre></div>`;
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

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeContent = part.slice(1, -1);
        return (
          <code key={i} className={`inline-block px-1.5 py-0.5 rounded font-mono text-[0.85em] border ${styleMode === 'handwritten' ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 'bg-slate-100 border-slate-200 text-indigo-700'}`}>
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
          className={`w-full bg-blue-50/30 border-2 border-blue-100 focus:border-blue-400 focus:bg-white rounded-xl p-3 outline-none transition-all resize-y min-h-[60px] ${className}`}
          rows={Math.max(2, value.split('\n').length)}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border shadow-sm sticky top-4 z-10 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Edit3 size={18} />
          </div>
          <div>
            {isEditing ? (
              <input 
                value={result.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="text-xl font-bold text-gray-900 border-b-2 border-blue-400 outline-none"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900 truncate max-w-xs">{result.title}</h2>
            )}
            <span className="block text-xs font-semibold uppercase tracking-wider text-blue-600">
              {result.type} Assignment
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isEditing ? <><Save size={16} /> Save Edits</> : <><Edit3 size={16} /> Edit Solution</>}
          </button>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setStyleMode('clean')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${styleMode === 'clean' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Academic
            </button>
            <button
              onClick={() => setStyleMode('handwritten')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${styleMode === 'handwritten' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Handwritten
            </button>
          </div>
          
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={16} /> PDF
          </button>
          <button
            onClick={() => handleDownload('docx')}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-black transition-colors"
          >
            <FileDown size={16} /> DOCX
          </button>
        </div>
      </div>

      {/* Assignment Content */}
      <div className={`space-y-12 bg-white p-10 rounded-3xl border shadow-lg ${styleMode === 'handwritten' ? 'font-handwritten text-xl' : 'text-base'}`}>
        <div className="text-center mb-16 border-b pb-8">
          {isEditing ? (
             <div className="max-w-xl mx-auto">
               <EditableField value={result.title} onUpdate={updateTitle} className="text-3xl font-bold text-center uppercase tracking-widest" label="Document Title" />
             </div>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-widest">{result.title}</h1>
          )}
          <p className="text-gray-500 italic">Solved with AceAssign AI Academic Engine</p>
        </div>

        {result.questions.map((q, index) => (
          <div key={q.id} className="space-y-6 relative group">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <div className="space-y-4 flex-1">
                <EditableField 
                  value={q.question_text} 
                  onUpdate={(val) => updateQuestionField(q.id, 'question_text', val)} 
                  className="font-bold text-gray-900 text-lg" 
                  label="Question"
                />
                
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-3 uppercase tracking-tighter">
                    <Check size={14} /> Solution Explanation
                  </div>
                  <EditableField 
                    value={q.explanation} 
                    onUpdate={(val) => updateQuestionField(q.id, 'explanation', val)} 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap" 
                  />
                </div>

                {q.code !== undefined && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest px-1 no-print">
                      <div className="flex items-center gap-1">
                        <Code size={14} /> {q.language || 'Source Code'}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(q.code || '', q.id)}
                        className="hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        {copiedId === q.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === q.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={q.code}
                        onChange={(e) => updateQuestionField(q.id, 'code', e.target.value)}
                        className="w-full bg-gray-900 text-blue-400 p-6 rounded-2xl font-mono text-sm border-4 border-gray-800 focus:border-blue-500 outline-none"
                        rows={10}
                      />
                    ) : (
                      <pre className="bg-gray-900 text-gray-100 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed border-4 border-gray-800">
                        <code>{q.code}</code>
                      </pre>
                    )}
                  </div>
                )}

                {q.solution && !q.code && (
                  <div className="pl-4 border-l-4 border-blue-200">
                    <EditableField 
                      value={q.solution} 
                      onUpdate={(val) => updateQuestionField(q.id, 'solution', val)} 
                      className="text-gray-900 font-medium whitespace-pre-wrap" 
                      label="Final Answer"
                    />
                  </div>
                )}

                {q.execution_output && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-green-600 uppercase tracking-widest px-1">
                      Execution Output
                    </div>
                    <pre className="bg-green-950 text-green-400 p-4 rounded-xl overflow-x-auto font-mono text-xs border border-green-900">
                      <code>{q.execution_output}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
            {index < result.questions.length - 1 && <div className="border-b pt-8" />}
          </div>
        ))}
        
        <div className="pt-16 mt-16 border-t text-center text-gray-400 text-sm italic">
          Disclaimer: This document was generated for educational assistance only. 
          Use responsibly and adhere to your institution's academic integrity policies.
        </div>
      </div>

      {/* Floating Chat Interface */}
      <AITutorChat result={result} />
    </div>
  );
};

export default SolutionDisplay;
