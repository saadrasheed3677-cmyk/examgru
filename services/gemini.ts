
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AssignmentResult, AssignmentType } from "../types";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async processAssignment(fileData: { base64: string; mimeType: string }): Promise<AssignmentResult> {
    const model = 'gemini-3-pro-preview';

    const response = await this.ai.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: fileData.base64,
                mimeType: fileData.mimeType
              }
            },
            {
              text: "Act as an expert academic professor. Extract all questions from this document. Solve them with detailed step-by-step explanations. IMPORTANT: Use standard Markdown backticks (e.g. `variableName` or `function()`) for any inline code snippets, keywords, or mathematical expressions within your explanations and solutions. For coding questions, provide clean, commented code in the separate code field. Classify the assignment as 'theory', 'coding', or 'mixed'. Return the data in the following JSON format."
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(AssignmentType) },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question_text: { type: Type.STRING },
                  language: { type: Type.STRING },
                  requires_execution: { type: Type.BOOLEAN },
                  solution: { type: Type.STRING },
                  code: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question_text", "solution", "explanation"]
              }
            }
          },
          required: ["title", "type", "questions"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AssignmentResult;
  }

  async executeCode(code: string, language: string): Promise<string> {
    const model = 'gemini-3-flash-preview';
    const response = await this.ai.models.generateContent({
      model: model,
      contents: `Simulate the execution output of the following ${language} code. Only provide the terminal output, no extra text:\n\n${code}`,
    });
    return response.text || "Execution completed with no output.";
  }

  startChat(result: AssignmentResult): Chat {
    const model = 'gemini-3-flash-preview';
    const context = JSON.stringify(result, null, 2);
    
    return this.ai.chats.create({
      model: model,
      config: {
        systemInstruction: `You are AceAssign AI Tutor. You are helping a student with their assignment titled "${result.title}". 
        The full assignment content is provided below in JSON format. 
        Use this context to answer questions, explain concepts further, provide alternative solutions, or help with related practice problems.
        Always be encouraging, academic, and clear.
        Use markdown for formatting. 
        Context: ${context}`
      }
    });
  }
}

export const geminiService = new GeminiService();
