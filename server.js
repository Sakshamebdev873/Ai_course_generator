import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { PromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize embeddings
const embeddingModel = new HuggingFaceInferenceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  apiKey: process.env.HUGGINGFACEHUB_API_KEY, // Make sure to set this in your .env
});

// Initialize Chroma DB
const vectorstore = await Chroma.fromExistingCollection(embeddingModel, {
  collectionName: "courses_collection",
  url: "http://localhost:8000", // Chroma server URL
});

// Setup retriever
const retriever = vectorstore.asRetriever({
  k: 5, // Number of documents to retrieve
});

// LLM setup (Gemini)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash", // Using gemini-pro instead of 2.0-flash for better availability
  temperature: 0.7,
  apiKey: "AIzaSyA-zbjiXmjz9TIo3bQTtS5tL4UsbjxQsII", // Use environment variable for security
});

// Prompt Template
const template= `
You are a course generator. Based on the following retrieved content, generate a detailed {weeks}-week {difficulty} course for the topic "{topic}".
Each week must include:
- A clear topic  title
- A long description of what will be covered
- A simple exercise related to the topic

Content retrieved from database:
{context}

Output format strictly as valid JSON (no extra text, no explanations):

[
  {{
    "week": 1,
    "topic": "Introduction to Python Basics",
    "description": "Students will learn about Python syntax, variables, and basic data types.",
    "exercise": "Write a Python program that prints 'Hello, World!' and stores your name in a variable."
  }},
  {{
    "week": 2,
    "topic": "Control Flow and Loops",
    "description": "Students will practice using if-else statements, for loops, and while loops.",
    "exercise": "Write a program that prints all even numbers from 1 to 50."
  }}
]
`;


const prompt = new PromptTemplate({
  template,
  inputVariables: ["topic", "weeks", "difficulty", "context"],
});

// Generate course function
async function generateCourse(topic, weeks, difficulty) {
  try {
    // Retrieve relevant content
    const docs = await retriever.invoke(topic);
    const contextText = docs.map(doc => doc.pageContent).join("\n");

    // Fill prompt
    const finalPrompt = await prompt.format({
      topic,
      weeks,
      difficulty,
      context: contextText,
    });

    // Generate course using LLM
    const response = await llm.invoke([new HumanMessage(finalPrompt)]);
    const llmOutput = response.content;

    // Try parsing JSON
    try {
      const startIdx = llmOutput.indexOf("[");
      const endIdx = llmOutput.lastIndexOf("]") + 1;
      
      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error("Could not find valid JSON array markers in LLM output.");
      }

      const courseJson = JSON.parse(llmOutput.slice(startIdx, endIdx));
      return courseJson;
    } catch (e) {
      console.error("Error parsing JSON from LLM output:", e);
      return { 
        error: `Failed to parse JSON. Raw output:\n${llmOutput}`, 
        parseError: e.message 
      };
    }
  } catch (error) {
    console.error("Error in generateCourse:", error);
    return { error: error.message };
  }
}

// Example usage
(async () => {
  const topic = "Python Programming";
  const weeks = 12;
  const difficulty = "Beginner";

  console.log(`Generating a ${weeks}-week ${difficulty} course on "${topic}"...`);
  const course = await generateCourse(topic, weeks, difficulty);
  
  if (course.error) {
    console.error("Course generation failed:", course.error);
  } else {
    console.log("\nGenerated Course:");
    console.log(JSON.stringify(course, null, 2));
  }
})();