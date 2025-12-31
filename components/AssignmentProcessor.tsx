
import React from 'react';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import { ProcessingStep } from '../types';

interface AssignmentProcessorProps {
  currentStep: ProcessingStep;
  error?: string | null;
}

const steps = [
  { key: ProcessingStep.EXTRACTING, label: 'Extracting Content' },
  { key: ProcessingStep.CLASSIFYING, label: 'Classifying Assignment' },
  { key: ProcessingStep.SOLVING, label: 'Solving Questions' },
  { key: ProcessingStep.COMPLETED, label: 'Ready to Export' },
];

const AssignmentProcessor: React.FC<AssignmentProcessorProps> = ({ currentStep, error }) => {
  if (currentStep === ProcessingStep.IDLE && !error) return null;

  const getStepIcon = (stepKey: ProcessingStep) => {
    const stepOrder = steps.findIndex(s => s.key === stepKey);
    const currentOrder = steps.findIndex(s => s.key === currentStep);

    if (error && currentStep === stepKey) return <Circle className="text-red-500" />;
    if (currentOrder > stepOrder || currentStep === ProcessingStep.COMPLETED) {
      return <CheckCircle2 className="text-green-500" />;
    }
    if (currentStep === stepKey) {
      return <Loader2 className="text-blue-500 animate-spin" />;
    }
    return <Circle className="text-gray-300" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Processing Pipeline</h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center space-x-4">
            {getStepIcon(step.key)}
            <span className={`text-sm ${currentStep === step.key ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default AssignmentProcessor;
