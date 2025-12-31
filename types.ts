
export enum AssignmentType {
  THEORY = 'theory',
  CODING = 'coding',
  MIXED = 'mixed'
}

export interface Question {
  id: string;
  question_text: string;
  language?: string;
  requires_execution: boolean;
  solution?: string;
  code?: string;
  execution_output?: string;
  explanation: string;
}

export interface AssignmentResult {
  type: AssignmentType;
  title: string;
  questions: Question[];
}

export enum ProcessingStep {
  IDLE = 'idle',
  EXTRACTING = 'extracting',
  CLASSIFYING = 'classifying',
  SOLVING = 'solving',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface FileData {
  name: string;
  type: string;
  base64: string;
}
