import { ChatOpenAI } from '@langchain/openai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// Initialize model via OpenRouter (OpenAI-compatible API)
export const geminiModel = new ChatOpenAI({
  model: 'google/gemini-2.0-flash-001',
  apiKey: process.env.OPENROUTER_API_KEY,
  temperature: 0.7,
  maxTokens: 2048,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://scholarsync.app',
      'X-Title': 'ScholarSync',
    },
  },
});

// Initialize Gemini embeddings for vector search (embeddings are still free tier)
export const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  model: 'text-embedding-004',
  apiKey: process.env.GOOGLE_API_KEY,
});

// Generate embeddings for text
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const embedding = await geminiEmbeddings.embedQuery(text);
  return embedding;
};

// Generate embeddings for multiple texts
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const embeddings = await geminiEmbeddings.embedDocuments(texts);
  return embeddings;
};
