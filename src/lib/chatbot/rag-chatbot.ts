import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'scholarships';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Types
export interface UserProfile {
  category?: string;
  income?: number;
  percentage?: number;
  state?: string;
  gender?: string;
  course?: string;
  level?: string;
  year?: number;
  hasDisability?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ScholarshipMatch {
  id: string;
  name: string;
  provider: string;
  amount: { min: number; max: number };
  deadline: string;
  applicationUrl: string;
  eligibilityText: string;
  benefits: string;
  matchScore: number;
}

interface PineconeMetadata {
  name: string;
  provider: string;
  amountMin: number;
  amountMax: number;
  deadline: string;
  applicationUrl: string;
  eligibilityText: string;
  benefits: string;
  categories: string[];
  incomeLimit: number;
  minPercentage: number;
  states: string[];
  gender: string;
  courses: string[];
  levels: string[];
  tags: string[];
}

// Initialize clients
let genAI: GoogleGenerativeAI | null = null;
let pinecone: Pinecone | null = null;

function getGoogleAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  }
  return genAI;
}

function getPinecone(): Pinecone {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
  }
  return pinecone;
}

// Generate embedding for query
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const ai = getGoogleAI();
  const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(query);
  return result.embedding.values;
}

// Search scholarships using vector similarity
async function searchScholarships(
  query: string,
  profile?: UserProfile,
  topK: number = 10
): Promise<ScholarshipMatch[]> {
  const pc = getPinecone();
  const index = pc.index(PINECONE_INDEX);
  
  const queryEmbedding = await generateQueryEmbedding(query);
  
  // Build filter based on profile
  const filter: Record<string, unknown> = {};
  
  if (profile) {
    if (profile.category && profile.category !== 'all') {
      filter.categories = { $in: [profile.category.toUpperCase(), 'all'] };
    }
    if (profile.state && profile.state !== 'all') {
      filter.states = { $in: [profile.state, 'all'] };
    }
    if (profile.gender && profile.gender !== 'all') {
      filter.gender = { $in: [profile.gender, 'all'] };
    }
    if (profile.level) {
      filter.levels = { $in: [profile.level] };
    }
  }
  
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });
  
  return results.matches.map(match => {
    const metadata = match.metadata as unknown as PineconeMetadata;
    
    // Calculate match score based on profile compatibility
    let matchScore = (match.score || 0) * 100;
    
    if (profile) {
      if (profile.income && metadata.incomeLimit > 0 && profile.income <= metadata.incomeLimit) {
        matchScore += 10;
      }
      if (profile.percentage && profile.percentage >= metadata.minPercentage) {
        matchScore += 10;
      }
    }
    
    return {
      id: match.id,
      name: metadata.name,
      provider: metadata.provider,
      amount: { min: metadata.amountMin, max: metadata.amountMax },
      deadline: metadata.deadline,
      applicationUrl: metadata.applicationUrl,
      eligibilityText: metadata.eligibilityText,
      benefits: metadata.benefits,
      matchScore: Math.min(matchScore, 100),
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// Check eligibility for a specific scholarship
function checkEligibility(
  scholarship: ScholarshipMatch & { metadata?: PineconeMetadata },
  profile: UserProfile
): { eligible: boolean; reasons: string[]; missing: string[] } {
  const reasons: string[] = [];
  const missing: string[] = [];
  
  const metadata = scholarship.metadata;
  if (!metadata) {
    return { eligible: true, reasons: ['Unable to verify eligibility - please check manually'], missing: [] };
  }
  
  // Check category
  if (metadata.categories && !metadata.categories.includes('all')) {
    if (profile.category && metadata.categories.includes(profile.category.toUpperCase())) {
      reasons.push(`✓ Your category (${profile.category}) is eligible`);
    } else if (profile.category) {
      missing.push(`Category must be one of: ${metadata.categories.join(', ')}`);
    } else {
      missing.push('Please provide your category to check eligibility');
    }
  }
  
  // Check income
  if (metadata.incomeLimit > 0) {
    if (profile.income !== undefined) {
      if (profile.income <= metadata.incomeLimit) {
        reasons.push(`✓ Your income (₹${profile.income.toLocaleString()}) is within the limit (₹${metadata.incomeLimit.toLocaleString()})`);
      } else {
        missing.push(`Income must be below ₹${metadata.incomeLimit.toLocaleString()}`);
      }
    } else {
      missing.push(`Income limit is ₹${metadata.incomeLimit.toLocaleString()} - please provide your family income`);
    }
  }
  
  // Check percentage
  if (metadata.minPercentage > 0) {
    if (profile.percentage !== undefined) {
      if (profile.percentage >= metadata.minPercentage) {
        reasons.push(`✓ Your marks (${profile.percentage}%) meet the minimum (${metadata.minPercentage}%)`);
      } else {
        missing.push(`Minimum ${metadata.minPercentage}% marks required`);
      }
    } else {
      missing.push(`Minimum ${metadata.minPercentage}% marks required - please provide your percentage`);
    }
  }
  
  // Check state
  if (metadata.states && !metadata.states.includes('all')) {
    if (profile.state && metadata.states.includes(profile.state)) {
      reasons.push(`✓ Your state (${profile.state}) is eligible`);
    } else if (profile.state) {
      missing.push(`Must be from: ${metadata.states.join(', ')}`);
    }
  }
  
  // Check gender
  if (metadata.gender && metadata.gender !== 'all') {
    if (profile.gender === metadata.gender) {
      reasons.push(`✓ Gender requirement met (${metadata.gender})`);
    } else if (profile.gender) {
      missing.push(`This scholarship is only for ${metadata.gender} students`);
    }
  }
  
  const eligible = missing.length === 0;
  
  return { eligible, reasons, missing };
}

// Generate chat response using OpenRouter (or fallback to Gemini)
async function generateChatResponse(
  messages: ChatMessage[],
  scholarships: ScholarshipMatch[],
  profile?: UserProfile
): Promise<string> {
  // Build context from scholarships
  const scholarshipContext = scholarships.slice(0, 5).map((s, i) => 
    `${i + 1}. **${s.name}** (${s.provider})
   - Amount: ₹${s.amount.min.toLocaleString()} - ₹${s.amount.max.toLocaleString()}
   - Deadline: ${s.deadline}
   - Eligibility: ${s.eligibilityText}
   - Benefits: ${s.benefits}
   - Match Score: ${s.matchScore.toFixed(0)}%
   - Apply: ${s.applicationUrl}`
  ).join('\n\n');
  
  const systemPrompt = `You are ScholarSync AI, an expert scholarship advisor for Indian students. You help students find and apply for scholarships.

CONTEXT - Relevant Scholarships Found:
${scholarshipContext || 'No specific scholarships found for this query.'}

USER PROFILE:
${profile ? JSON.stringify(profile, null, 2) : 'Not provided yet'}

GUIDELINES:
1. Be helpful, encouraging, and supportive
2. Provide specific scholarship recommendations based on the context
3. If the user's profile is incomplete, ask relevant questions to help find better matches
4. Explain eligibility requirements clearly
5. Always mention deadlines and application links when available
6. If asked about eligibility, use the scholarship data to give accurate answers
7. Format responses with markdown for better readability
8. Be concise but informative
9. If you don't know something, admit it and suggest checking official sources

IMPORTANT: Only recommend scholarships from the context provided. Don't make up scholarship names or details.`;

  // Use OpenRouter if API key is available
  if (OPENROUTER_API_KEY) {
    const openRouterMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://scholarsync.app',
        'X-Title': 'ScholarSync',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: openRouterMessages,
      }),
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  }
  
  // Fallback to direct Gemini API
  const ai = getGoogleAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chatHistory = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am ScholarSync AI, ready to help students find scholarships. How can I assist you today?' }] },
      ...chatHistory.slice(0, -1),
    ],
  });
  
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  
  return result.response.text();
}

// Use OpenRouter for lower-accuracy tasks (cheaper)
async function generateSimpleResponse(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    // Fallback to Gemini if OpenRouter not configured
    const ai = getGoogleAI();
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://scholarsync.app',
      'X-Title': 'ScholarSync',
    },
    body: JSON.stringify({
      model: 'google/gemma-3-4b-it:free',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// Main chat function
export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  userProfile?: UserProfile
): Promise<{ response: string; scholarships: ScholarshipMatch[]; suggestedQuestions: string[] }> {
  // Add user message to history
  const messages: ChatMessage[] = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];
  
  // Search for relevant scholarships
  const searchQuery = userProfile 
    ? `${userMessage} ${userProfile.category || ''} ${userProfile.level || ''} ${userProfile.state || ''}`
    : userMessage;
  
  const scholarships = await searchScholarships(searchQuery, userProfile);
  
  // Generate response
  const response = await generateChatResponse(messages, scholarships, userProfile);
  
  // Generate suggested follow-up questions
  const suggestedQuestions = generateSuggestedQuestions(userMessage, scholarships, userProfile);
  
  return { response, scholarships, suggestedQuestions };
}

// Generate suggested follow-up questions
function generateSuggestedQuestions(
  lastMessage: string,
  scholarships: ScholarshipMatch[],
  profile?: UserProfile
): string[] {
  const questions: string[] = [];
  
  // Profile completion questions
  if (!profile?.category) {
    questions.push('What is your caste category (General/SC/ST/OBC)?');
  }
  if (!profile?.income) {
    questions.push('What is your annual family income?');
  }
  if (!profile?.percentage) {
    questions.push('What percentage did you score in your last exam?');
  }
  if (!profile?.level) {
    questions.push('Which education level are you in (School/UG/PG/PhD)?');
  }
  
  // Scholarship-specific questions
  if (scholarships.length > 0) {
    const topScholarship = scholarships[0];
    questions.push(`Tell me more about ${topScholarship.name}`);
    questions.push(`Am I eligible for ${topScholarship.name}?`);
    questions.push('How do I apply for these scholarships?');
  }
  
  // General questions
  questions.push('What documents do I need for scholarship applications?');
  questions.push('Can I apply for multiple scholarships?');
  
  return questions.slice(0, 4);
}

// Eligibility checker - asks questions to determine eligibility
export async function runEligibilityChecker(
  scholarshipId: string,
  answers: Record<string, string | number | boolean>
): Promise<{
  eligible: boolean;
  confidence: number;
  explanation: string;
  missingInfo: string[];
  nextQuestion?: { key: string; question: string; type: 'text' | 'number' | 'select'; options?: string[] };
}> {
  const requiredFields = [
    { key: 'category', question: 'What is your caste/reservation category?', type: 'select' as const, options: ['General', 'SC', 'ST', 'OBC', 'EWS', 'Minority'] },
    { key: 'income', question: 'What is your annual family income (in rupees)?', type: 'number' as const },
    { key: 'percentage', question: 'What percentage did you score in your last qualifying exam?', type: 'number' as const },
    { key: 'state', question: 'Which state are you from?', type: 'text' as const },
    { key: 'gender', question: 'What is your gender?', type: 'select' as const, options: ['Male', 'Female', 'Other'] },
    { key: 'level', question: 'What education level are you pursuing?', type: 'select' as const, options: ['Class 9-10', 'Class 11-12', 'UG', 'PG', 'PhD'] },
    { key: 'course', question: 'What course/stream are you studying?', type: 'text' as const },
  ];
  
  // Find next unanswered question
  for (const field of requiredFields) {
    if (answers[field.key] === undefined) {
      return {
        eligible: false,
        confidence: 0,
        explanation: 'Please answer the following question to check your eligibility.',
        missingInfo: requiredFields.filter(f => answers[f.key] === undefined).map(f => f.key),
        nextQuestion: field,
      };
    }
  }
  
  // All questions answered - calculate eligibility
  const profile: UserProfile = {
    category: String(answers.category),
    income: Number(answers.income),
    percentage: Number(answers.percentage),
    state: String(answers.state),
    gender: String(answers.gender).toLowerCase(),
    level: String(answers.level).toLowerCase(),
    course: String(answers.course),
  };
  
  // Search for the specific scholarship
  const scholarships = await searchScholarships(scholarshipId);
  const scholarship = scholarships.find(s => s.id === scholarshipId);
  
  if (!scholarship) {
    return {
      eligible: false,
      confidence: 0,
      explanation: 'Scholarship not found.',
      missingInfo: [],
    };
  }
  
  // Generate eligibility explanation using AI
  const prompt = `Based on the following profile and scholarship details, determine eligibility:

PROFILE:
- Category: ${profile.category}
- Annual Income: ₹${profile.income?.toLocaleString()}
- Percentage: ${profile.percentage}%
- State: ${profile.state}
- Gender: ${profile.gender}
- Education Level: ${profile.level}
- Course: ${profile.course}

SCHOLARSHIP:
- Name: ${scholarship.name}
- Eligibility: ${scholarship.eligibilityText}
- Amount: ₹${scholarship.amount.min.toLocaleString()} - ₹${scholarship.amount.max.toLocaleString()}

Provide a brief eligibility assessment with:
1. Whether the student is likely eligible (Yes/No/Maybe)
2. Confidence percentage (0-100)
3. Key reasons for the assessment
4. Any additional requirements to check`;

  const analysis = await generateSimpleResponse(prompt);
  
  // Parse response (simplified)
  const isEligible = analysis.toLowerCase().includes('yes') || analysis.toLowerCase().includes('eligible');
  const confidence = isEligible ? 75 : 25;
  
  return {
    eligible: isEligible,
    confidence,
    explanation: analysis,
    missingInfo: [],
  };
}

export { searchScholarships, checkEligibility, generateSimpleResponse };
