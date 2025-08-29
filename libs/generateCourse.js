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
  apiKey: process.env.GOOGLE_API_KEY, // Use environment variable for security
});

// Prompt Template
const template= `
You are a course generator. Based on the following retrieved content, generate a detailed {weeks}-week {difficulty} course for the topic "{topic}".

Each week must include:
- A clear and descriptive topic title
- A **long, detailed description** (at least 4–6 sentences) explaining what will be covered, why it’s important, and how it connects to the next topics
- A simple exercise related to the topic

Content retrieved from database:
{context}

Output format strictly as valid JSON (no extra text, no explanations):

[
  {{
    "week": 1,
    "topic": "Introduction to Python Basics",
    "description": "Students will explore Python’s core foundations including syntax, variables, and primitive data types such as integers, strings, and booleans. The week will begin with an overview of how Python is installed and run on different platforms, followed by hands-on exercises to build familiarity with the interactive interpreter and script execution. By the end of this week, learners will be able to write simple programs that store information, process user input, and display meaningful output. This foundation is critical because it sets the stage for more advanced topics such as flow control, data structures, and modular programming.",
    "exercise": "Write a Python program that prints 'Hello, World!', stores your name in a variable, and then displays it back to the user."
  }},
  {{
    "week": 2,
    "topic": "Control Flow and Loops",
    "description": "This week focuses on the decision-making capabilities and repetition structures that give Python programs power and flexibility. Students will learn how to guide program execution using conditional statements like if, elif, and else, enabling programs to respond differently to varying conditions. The lessons will then progress to iteration using for loops and while loops, with practical examples such as traversing lists, generating sequences, and controlling loop execution with break and continue statements. By mastering these concepts, learners will be able to create programs that solve real-world problems requiring dynamic decision-making and repetitive processes.",
    "exercise": "Write a program that prints all even numbers from 1 to 50 using both a for loop and a while loop."
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
export default generateCourse;