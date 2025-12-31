
import { GoogleGenAI, Type, Chat, FunctionDeclaration, Content } from "@google/genai";
import { AssignmentResult, AssignmentType } from "../types";

const API_KEY = process.env.API_KEY || "";

// Define the tool for editing the assignment
const updateAssignmentTool: FunctionDeclaration = {
  name: 'update_assignment_content',
  parameters: {
    type: Type.OBJECT,
    description: 'Update specific parts of the assignment content like questions, explanations, or solutions based on user feedback.',
    properties: {
      questions: {
        type: Type.ARRAY,
        description: 'An array of question objects containing the updated fields. You only need to provide the ID and the fields that changed.',
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'The unique ID of the question to update.' },
            question_text: { type: Type.STRING, description: 'The updated text for the question.' },
            explanation: { type: Type.STRING, description: 'The updated step-by-step explanation.' },
            solution: { type: Type.STRING, description: 'The updated final answer/solution.' },
            code: { type: Type.STRING, description: 'The updated code block.' },
            language: { type: Type.STRING, description: 'The programming language for the code.' }
          },
          required: ['id']
        }
      },
      title: { type: Type.STRING, description: 'Updated title for the entire assignment.' }
    }
  }
};

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
              text: "Act as an expert academic professor. Extract all questions from this document. Solve them with detailed step-by-step explanations. IMPORTANT: Use standard Markdown backticks for code/math. Classify as 'theory', 'coding', or 'mixed'. Return the data in JSON."
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
      contents: `Simulate terminal output for ${language}:\n\n${code}`,
    });
    return response.text || "No output.";
  }

  startChat(result: AssignmentResult, history: Content[] = []): Chat {
    const model = 'gemini-3-flash-preview';
    const context = JSON.stringify(result, null, 2);
    
    return this.ai.chats.create({
      model: model,
      history: history,
      config: {
        tools: [{ functionDeclarations: [updateAssignmentTool] }],
        systemInstruction: `You are AceAssign AI Tutor. You help students with their assignment: "${result.title}".
        CONTEXT: ${context}
        
        CAPABILITY: You can directly edit the assignment solution on the screen! 
        If the user asks to change, simplify, rewrite, or correct any part of the solution, use the 'update_assignment_content' tool to apply those changes immediately. 
        Always explain what you've changed to the student after using the tool.
        If they ask for a general explanation without asking for an edit, just chat normally.`
      }
    });
  }
}

export const geminiService = new GeminiService();
