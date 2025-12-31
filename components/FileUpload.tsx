
import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileSelect: (file: FileData) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (disabled) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      onFileSelect({
        name: file.name,
        type: file.type || 'application/pdf',
        base64: base64
      });
    };
    reader.readAsDataURL(file);
    setPreviewFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {previewFile ? previewFile.name : 'Upload Assignment'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop your PDF, DOCX, or Image file here
            </p>
          </div>
          {previewFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-1"><FileText size={14} /> PDF</div>
        <div className="flex items-center gap-1"><FileText size={14} /> DOCX</div>
        <div className="flex items-center gap-1"><FileText size={14} /> TXT / Images</div>
      </div>
    </div>
  );
};

export default FileUpload;
