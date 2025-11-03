
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getNewQuestion(previousQuestions: string[]): Promise<string> {
  try {
    const prompt = `
      Generate a single, fun, and open-ended question suitable for a family game night with players of all ages.
      The question should spark conversation, laughter, and storytelling.
      It must be a different question than any of these previous ones: ${previousQuestions.join(', ')}.
      Do not include any introductory text, numbering, or quotation marks. Just return the question itself.
      
      Good examples:
      - If you could trade places with any cartoon character for a day, who would it be and why?
      - What's the silliest thing that always makes you laugh?
      - If animals could talk, which animal would you most want to have a conversation with?

      Bad examples (too personal, boring, or complex):
      - What is your biggest regret?
      - What is the capital of Nebraska?
      - Describe the geopolitical implications of modern trade agreements.
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
