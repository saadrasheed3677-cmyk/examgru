
import React, { useState, useCallback } from 'react';
import { GraduationCap, BookOpen, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AssignmentProcessor from './components/AssignmentProcessor';
import SolutionDisplay from './components/SolutionDisplay';
import { geminiService } from './services/gemini';
import { ProcessingStep, FileData, AssignmentResult } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<ProcessingStep>(ProcessingStep.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssignmentResult | null>(null);

  const handleFileSelect = async (fileData: FileData) => {
    try {
      setStep(ProcessingStep.EXTRACTING);
      setError(null);
      setResult(null);

      // Process with Gemini
      const assignmentResult = await geminiService.processAssignment({
        base64: fileData.base64,
        mimeType: fileData.type
      });

      // Simulation of classification/solving phases for visual feedback
      setStep(ProcessingStep.CLASSIFYING);
      await new Promise(r => setTimeout(r, 1000));
      
      setStep(ProcessingStep.SOLVING);
      
      // Handle code execution if needed
      const finalQuestions = await Promise.all(
        assignmentResult.questions.map(async (q) => {
          if (q.code && (q.requires_execution || assignmentResult.type === 'coding')) {
            const output = await geminiService.executeCode(q.code, q.language || 'python');
            return { ...q, execution_output: output };
          }
          return q;
        })
      );

      setResult({ ...assignmentResult, questions: finalQuestions });
      setStep(ProcessingStep.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during processing.");
      setStep(ProcessingStep.ERROR);
    }
  };

  const reset = () => {
    setStep(ProcessingStep.IDLE);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" onClick={reset}>
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <GraduationCap size={24} />
            </div>
            <span>AceAssign <span className="text-blue-600 font-medium">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Safety</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          <button className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-black transition-all shadow-lg shadow-black/5">
            Sign In
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-12">
        {step === ProcessingStep.IDLE && (
          <div className="text-center space-y-12 py-12 animate-in fade-in duration-700">
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-100">
                <Sparkles size={16} /> Now with 100% higher accuracy
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
                Your Assignments, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Perfectly Solved.</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
                Upload your PDFs, images, or documents. Our AI extracts, classifies, and solves them with step-by-step academic precision.
              </p>
            </div>

            <FileUpload onFileSelect={handleFileSelect} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
              {[
                { icon: <BookOpen className="text-blue-600" />, title: "Academic Rigor", desc: "Solutions adhere to high academic standards with deep explanations." },
                { icon: <ShieldCheck className="text-green-600" />, title: "Secure Sandbox", desc: "Code problems are executed in isolated environments to verify output." },
                { icon: <RefreshCw className="text-purple-600" />, title: "Export Anywhere", desc: "Download in clean PDF, Word, or unique handwritten styles." }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step !== ProcessingStep.IDLE && step !== ProcessingStep.COMPLETED && (
          <div className="py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Analyzing Assignment...</h2>
              <p className="text-gray-500">Our engines are working through the complex content</p>
            </div>
            <AssignmentProcessor currentStep={step} error={error} />
            {error && (
              <div className="mt-8 text-center">
                <button 
                  onClick={reset}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {result && step === ProcessingStep.COMPLETED && (
          <div className="animate-in fade-in duration-1000">
            <SolutionDisplay result={result} setResult={setResult} />
            <div className="mt-12 text-center pb-12">
              <button 
                onClick={reset}
                className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={18} /> Solve another assignment
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-20 border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-gray-400">
             <GraduationCap size={20} />
             <span>AceAssign © 2024</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Academic Integrity</a>
          </div>
          <div className="text-xs text-gray-400 max-w-xs text-center md:text-right">
            For educational assistance only. Direct use in examinations is prohibited.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
