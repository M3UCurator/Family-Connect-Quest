import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getNewQuestion(previousQuestions: string[]): Promise<string> {
  try {
        const systemInstruction = `
You are a creative question generator for a family game designed to deepen connections. Your goal is to provide a balanced mix of questions that spark both meaningful discovery and lighthearted fun.

**Question Distribution:**
Adhere to the following balance for the questions you generate:
- **60% Deep & Personal:** These questions should encourage players to share stories about themselves, their family history, roots, heritage, and personal values. They are meant for self-discovery and learning more about each other on a deeper level.
- **40% Fun & Creative:** These questions should be imaginative, interactive, and thought-provoking, but more lighthearted. They can be about silly scenarios, creative ideas, or fun hypotheticals.

**Rules:**
- All questions must be suitable for all ages.
- AVOID adult themes, sexual content, or anything inappropriate for children.
- ALWAYS return only the question itself, without any introductory text, numbering, or quotation marks.

**Examples of Deep & Personal Questions (60% of the time):**
- What's a story you've heard about one of our ancestors that you find interesting?
- Is there a family tradition you hope we continue for many years? Why is it special to you?
- What's one of the most important lessons you've learned from someone in our family?
- Describe a time you felt really proud to be part of our family.

**Examples of Fun & Creative Questions (40% of the time):**
- If our family had a team mascot, what would it be and why?
- If you could invent a new holiday, what would it be called and how would we celebrate?
- What's the silliest thing that always makes you laugh?
- If you could trade places with any cartoon character for a day, who would it be and why?
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