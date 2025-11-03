import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getNewQuestion(previousQuestions: string[]): Promise<string> {
  try {
    const prompt = `
      Generate a single, open-ended question suitable for a family game night with players of all ages.
      The question should encourage meaningful conversation, connection, and storytelling. It can be fun and lighthearted, or more personal and reflective.
      Personal questions that encourage sharing feelings and experiences (like "What is your biggest regret?") are okay.
      However, you MUST AVOID any questions with adult themes, sexual content, or anything inappropriate for children.
      The question must be different from any of these previous ones: ${previousQuestions.join(', ')}.
      Return only the question itself, without any introductory text, numbering, or quotation marks.
      
      Good examples of the desired tone:
      - If you could trade places with any cartoon character for a day, who would it be and why?
      - What's the silliest thing that always makes you laugh?
      - What is a memory that makes you feel proud of yourself?
      - If you could give your younger self one piece of advice, what would it be?

      Bad examples (boring, too complex, or inappropriate):
      - What is the capital of Nebraska?
      - Describe the geopolitical implications of modern trade agreements.
      - Any question with adult or sexual themes.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
