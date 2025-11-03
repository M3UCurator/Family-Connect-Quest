import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getNewQuestion(previousQuestions: string[]): Promise<string> {
  try {
        const systemInstruction = `
You are a creative question generator for a family game night. Your goal is to provide fun, engaging, and age-appropriate open-ended questions that spark conversation, connection, and storytelling.

Rules:
- Questions must be suitable for all ages.
- AVOID adult themes, sexual content, or anything inappropriate for children.
- The tone can be lighthearted, fun, personal, or reflective.
- ALWAYS return only the question itself, without any introductory text, numbering, or quotation marks.

Good examples:
- If you could trade places with any cartoon character for a day, who would it be and why?
- What's the silliest thing that always makes you laugh?
- What is a memory that makes you feel proud of yourself?
`;
    
    const contents = `Generate a single, new question that is different from any of these previous ones: ${previousQuestions.join(', ')}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          // Moderate temperature for a balance of creativity and speed
          temperature: 0.8,
          // Disable thinking to prioritize low latency for a better interactive experience
          thinkingConfig: { thinkingBudget: 0 },
        }
    });
    
    const text = response.text.trim();
    if (!text) {
        return "If you could invent a new holiday, what would it be called and how would we celebrate?";
    }
    return text;

  } catch (error) {
    console.error("Error fetching new question from Gemini:", error);
    // Return a fun, fallback question in case of an API error
    return "What's a superpower that would be very useful for our family?";
  }
}