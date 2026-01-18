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

// Search scholarships using vector similarity (with Firestore fallback)
async function searchScholarships(
  query: string,
  profile?: UserProfile,
  topK: number = 10
): Promise<ScholarshipMatch[]> {
  try {
    // First, try Pinecone vector search
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

    if (results.matches && results.matches.length > 0) {
      return results.matches.map(match => {
        const metadata = match.metadata as unknown as PineconeMetadata;

        // Calculate match score based on profile compatibility
        let matchScore = (match.score || 0) * 100;

        if (profile && metadata) {
          if (profile.income && metadata.incomeLimit > 0 && profile.income <= metadata.incomeLimit) {
            matchScore += 10;
          }
          if (profile.percentage && metadata.minPercentage && profile.percentage >= metadata.minPercentage) {
            matchScore += 10;
          }
        }

        return {
          id: match.id,
          name: metadata?.name || 'Unknown Scholarship',
          provider: metadata?.provider || 'Unknown Provider',
          amount: { min: metadata?.amountMin || 0, max: metadata?.amountMax || 0 },
          deadline: metadata?.deadline || 'Not specified',
          applicationUrl: metadata?.applicationUrl || '',
          eligibilityText: metadata?.eligibilityText || '',
          benefits: metadata?.benefits || '',
          matchScore: Math.min(matchScore, 100),
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
    }

    // Fallback: Fetch from Firestore if Pinecone returns no results
    console.log('Pinecone returned no results, falling back to Firestore...');
    return await fetchScholarshipsFromFirestore(profile, topK);
  } catch (error) {
    console.error('Error searching scholarships:', error);
    // Fallback to Firestore on any error
    try {
      return await fetchScholarshipsFromFirestore(profile, topK);
    } catch (firestoreError) {
      console.error('Firestore fallback also failed:', firestoreError);
      return [];
    }
  }
}

// Fetch scholarships from Firestore with profile-based matching
async function fetchScholarshipsFromFirestore(
  profile?: UserProfile,
  limit: number = 10
): Promise<ScholarshipMatch[]> {
  try {
    // Import Firestore functions dynamically to avoid circular dependencies
    const { getAllScholarships } = await import('@/lib/firebase/firestore');

    const allScholarships = await getAllScholarships();

    if (!allScholarships || allScholarships.length === 0) {
      return [];
    }

    // Filter and calculate match scores based on profile
    const matchedScholarships: ScholarshipMatch[] = allScholarships
      .map(scholarship => {
        let matchScore = 50; // Base score
        const eligibility = scholarship.eligibility || {};

        if (profile) {
          // Income check
          const incomeLimit = eligibility.incomeLimit || 0;
          if (incomeLimit > 0 && profile.income) {
            if (profile.income <= incomeLimit) {
              matchScore += 15;
            } else {
              matchScore -= 20; // Penalty for exceeding income limit
            }
          }

          // Category check
          const categories = eligibility.categories || [];
          if (categories.length > 0 && profile.category) {
            if (categories.includes('all') || categories.includes(profile.category)) {
              matchScore += 15;
            } else {
              matchScore -= 15;
            }
          }

          // State check
          const states = eligibility.states || [];
          if (states.length > 0 && profile.state) {
            if (states.includes('all') || states.includes('All States') || states.includes(profile.state)) {
              matchScore += 10;
            } else {
              matchScore -= 10;
            }
          }

          // Gender check
          const gender = eligibility.gender || 'all';
          if (gender !== 'all' && profile.gender) {
            if (gender.toLowerCase() === profile.gender.toLowerCase()) {
              matchScore += 5;
            } else {
              matchScore -= 20;
            }
          }

          // Percentage check
          const minPercentage = eligibility.minPercentage || 0;
          if (minPercentage > 0 && profile.percentage) {
            if (profile.percentage >= minPercentage) {
              matchScore += 10;
            } else {
              matchScore -= 15;
            }
          }

          // Year check
          const yearRange = eligibility.yearRange || [1, 6];
          if (profile.year) {
            if (profile.year >= yearRange[0] && profile.year <= yearRange[1]) {
              matchScore += 5;
            } else {
              matchScore -= 10;
            }
          }
        }

        return {
          id: scholarship.id,
          name: scholarship.name,
          provider: scholarship.provider,
          amount: scholarship.amount,
          deadline: scholarship.deadline,
          applicationUrl: scholarship.applicationUrl,
          eligibilityText: scholarship.eligibilityText || '',
          benefits: scholarship.description || '',
          matchScore: Math.max(0, Math.min(100, matchScore)),
        };
      })
      .filter(s => s.matchScore >= 30) // Only include scholarships with reasonable match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return matchedScholarships;
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
    return [];
  }
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
   - Match Score: ${s.matchScore.toFixed(0)}%
   - Apply Link: ${s.applicationUrl || 'Not available'}`
  ).join('\n\n');

  // Build profile summary for context
  const profileSummary = profile
    ? `User: ${profile.category || 'Not specified'} category, Income: ₹${profile.income?.toLocaleString() || 'Not specified'}, Marks: ${profile.percentage || 'Not specified'}%, State: ${profile.state || 'Not specified'}, Gender: ${profile.gender || 'Not specified'}, Year: ${profile.year || 'Not specified'}`
    : 'Profile not available';

  const systemPrompt = `You are ScholarSync AI, an expert scholarship advisor for Indian students. You help students find and apply for scholarships.

AVAILABLE SCHOLARSHIPS (Already filtered based on user's profile):
${scholarshipContext || 'No scholarships found in database.'}

USER PROFILE (ALREADY COLLECTED - USE THIS DATA):
${profileSummary}

CRITICAL INSTRUCTIONS:
1. The scholarships above are ALREADY MATCHED to the user's profile. RECOMMEND THEM DIRECTLY.
2. DO NOT ask for income, category, percentage, state, or gender - you ALREADY HAVE this information.
3. For each scholarship recommendation, ALWAYS include:
   - Scholarship name and provider
   - Amount range
   - Deadline
   - Match score percentage
   - Application link (if available)
4. If scholarships are available, list them with their apply links. Don't just talk about them generically.
5. Format: Use bullet points and make apply links clickable.
6. Be encouraging and helpful. The user is looking for financial assistance.
7. If asked about a specific scholarship, provide detailed information.
8. Only ask questions if truly necessary for a NEW search - not for basic profile info.

IMPORTANT: If scholarships are shown above, RECOMMEND them in your response with their apply links!`;

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
  try {
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
  } catch (error) {
    console.error('Error in chat function:', error);
    // Return a graceful error response
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      scholarships: [],
      suggestedQuestions: [
        'Find scholarships for me',
        'What scholarships are available?',
        'Help me with my application',
      ],
    };
  }
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
