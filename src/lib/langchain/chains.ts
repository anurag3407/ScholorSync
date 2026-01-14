import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { geminiModel, generateEmbedding } from './config';
import type {
  UserProfile,
  Scholarship,
  EligibilityExplanation,
  WhyNotMeResult,
  SuccessPrediction,
  FeeAnalysisResult
} from '@/types';

// Eligibility Explanation Chain
const eligibilityPrompt = PromptTemplate.fromTemplate(`
You are an expert scholarship advisor. Analyze if the student is eligible for the scholarship and explain in simple terms.

Student Profile:
- Name: {name}
- Category: {category}
- Annual Family Income: ₹{income}
- Academic Percentage: {percentage}%
- Branch: {branch}
- Year: {year}
- State: {state}
- College: {college}
- Gender: {gender}
- Achievements: {achievements}

Scholarship Details:
- Name: {scholarshipName}
- Provider: {provider}
- Amount: ₹{minAmount} - ₹{maxAmount}
- Eligible Categories: {eligibleCategories}
- Income Limit: ₹{incomeLimit}
- Minimum Percentage: {minPercentage}%
- Eligible States: {eligibleStates}
- Eligible Branches: {eligibleBranches}
- Gender Requirement: {genderReq}
- Year Range: Year {yearMin} to Year {yearMax}
- Additional Criteria: {eligibilityText}

Provide a JSON response with the following structure:
{{
  "eligible": boolean,
  "matchPercentage": number (0-100),
  "explanation": "A friendly, encouraging explanation in 2-3 sentences",
  "meetsCriteria": ["List of criteria the student meets"],
  "missedCriteria": ["List of criteria the student doesn't meet"],
  "suggestions": ["Actionable suggestions to improve eligibility"]
}}

Only respond with valid JSON, no additional text.
`);

export const explainEligibility = async (
  profile: UserProfile,
  scholarship: Scholarship
): Promise<EligibilityExplanation> => {
  const chain = RunnableSequence.from([
    eligibilityPrompt,
    geminiModel,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke({
    name: profile.name,
    category: profile.category,
    income: profile.income.toString(),
    percentage: profile.percentage.toString(),
    branch: profile.branch,
    year: profile.year.toString(),
    state: profile.state,
    college: profile.college,
    gender: profile.gender,
    achievements: profile.achievements.join(', ') || 'None',
    scholarshipName: scholarship.name,
    provider: scholarship.provider,
    minAmount: scholarship.amount.min.toString(),
    maxAmount: scholarship.amount.max.toString(),
    eligibleCategories: scholarship.eligibility.categories.join(', '),
    incomeLimit: scholarship.eligibility.incomeLimit.toString(),
    minPercentage: scholarship.eligibility.minPercentage.toString(),
    eligibleStates: scholarship.eligibility.states.join(', '),
    eligibleBranches: scholarship.eligibility.branches.join(', '),
    genderReq: scholarship.eligibility.gender,
    yearMin: scholarship.eligibility.yearRange[0].toString(),
    yearMax: scholarship.eligibility.yearRange[1].toString(),
    eligibilityText: scholarship.eligibilityText || 'No additional criteria',
  });

  try {
    // Clean the response - remove markdown code blocks if present
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedResult);
  } catch {
    return {
      eligible: false,
      matchPercentage: 0,
      explanation: 'Unable to analyze eligibility at this time.',
      meetsCriteria: [],
      missedCriteria: [],
      suggestions: ['Please try again later.'],
    };
  }
};

// Why Not Me Analyzer Chain
const whyNotMePrompt = PromptTemplate.fromTemplate(`
You are a scholarship gap analyzer. The student doesn't fully qualify for this scholarship. 
Identify what's missing and provide actionable advice.

Student Profile:
- Category: {category}
- Annual Family Income: ₹{income}
- Academic Percentage: {percentage}%
- Branch: {branch}
- Year: {year}
- State: {state}
- Gender: {gender}
- Achievements: {achievements}

Scholarship Requirements:
- Name: {scholarshipName}
- Eligible Categories: {eligibleCategories}
- Income Limit: ₹{incomeLimit}
- Minimum Percentage: {minPercentage}%
- Eligible States: {eligibleStates}
- Eligible Branches: {eligibleBranches}
- Gender Requirement: {genderReq}
- Year Range: Year {yearMin} to Year {yearMax}

Respond with JSON:
{{
  "gapPercentage": number (how close they are, 0-100),
  "missingCriteria": [
    {{
      "criterion": "Name of the criterion",
      "currentValue": "Student's current value",
      "requiredValue": "What's required",
      "actionable": boolean (can they change this?),
      "suggestion": "Specific advice on how to qualify"
    }}
  ]
}}

Only respond with valid JSON.
`);

export const analyzeWhyNotMe = async (
  profile: UserProfile,
  scholarship: Scholarship
): Promise<Omit<WhyNotMeResult, 'scholarship'>> => {
  // Check if API key is configured
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not configured, returning fallback response');
    return {
      gapPercentage: 50,
      missingCriteria: [{
        criterion: 'Configuration Required',
        currentValue: 'N/A',
        requiredValue: 'OPENROUTER_API_KEY must be set in .env',
        actionable: false,
        suggestion: 'Please configure the AI API key to enable analysis.'
      }],
    };
  }

  try {
    const chain = RunnableSequence.from([
      whyNotMePrompt,
      geminiModel,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      category: profile.category || 'Not specified',
      income: (profile.income || 0).toString(),
      percentage: (profile.percentage || 0).toString(),
      branch: profile.branch || 'Not specified',
      year: (profile.year || 1).toString(),
      state: profile.state || 'Not specified',
      gender: profile.gender || 'Not specified',
      achievements: (profile.achievements || []).join(', ') || 'None',
      scholarshipName: scholarship.name || 'Unknown Scholarship',
      eligibleCategories: (scholarship.eligibility?.categories || []).join(', ') || 'All',
      incomeLimit: (scholarship.eligibility?.incomeLimit || 0).toString(),
      minPercentage: (scholarship.eligibility?.minPercentage || 0).toString(),
      eligibleStates: (scholarship.eligibility?.states || []).join(', ') || 'All',
      eligibleBranches: (scholarship.eligibility?.branches || []).join(', ') || 'All',
      genderReq: scholarship.eligibility?.gender || 'All',
      yearMin: (scholarship.eligibility?.yearRange?.[0] || 1).toString(),
      yearMax: (scholarship.eligibility?.yearRange?.[1] || 5).toString(),
    });

    try {
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResult);
    } catch {
      return {
        gapPercentage: 0,
        missingCriteria: [],
      };
    }
  } catch (error) {
    console.error('Error in analyzeWhyNotMe chain:', error);
    return {
      gapPercentage: 0,
      missingCriteria: [{
        criterion: 'Analysis Error',
        currentValue: 'N/A',
        requiredValue: 'N/A',
        actionable: false,
        suggestion: 'AI analysis temporarily unavailable. Please try again later.'
      }],
    };
  }
};

// Success Predictor Chain
const successPredictorPrompt = PromptTemplate.fromTemplate(`
Based on historical scholarship data and the student's profile, predict their success rate.

Student Profile:
- Category: {category}
- Income: ₹{income}
- Percentage: {percentage}%
- Achievements: {achievements}

Scholarship:
- Name: {scholarshipName}
- Type: {type}
- Competition Level: {competitionLevel}
- Typical Applicants: {typicalApplicants}

Analyze and respond with JSON:
{{
  "successRate": number (0-100),
  "competitionLevel": "low" | "medium" | "high",
  "recommendation": "Strategic advice for this application",
  "similarProfiles": number (estimated number of similar applicants)
}}

Only respond with valid JSON.
`);

export const predictSuccess = async (
  profile: UserProfile,
  scholarship: Scholarship
): Promise<SuccessPrediction> => {
  const chain = RunnableSequence.from([
    successPredictorPrompt,
    geminiModel,
    new StringOutputParser(),
  ]);

  // Estimate competition level based on scholarship type
  const competitionLevel = scholarship.type === 'government' ? 'high' :
    scholarship.type === 'private' ? 'medium' : 'low';

  const result = await chain.invoke({
    category: profile.category,
    income: profile.income.toString(),
    percentage: profile.percentage.toString(),
    achievements: profile.achievements.join(', ') || 'None',
    scholarshipName: scholarship.name,
    type: scholarship.type,
    competitionLevel,
    typicalApplicants: scholarship.type === 'government' ? '10000+' :
      scholarship.type === 'private' ? '1000-5000' : '100-500',
  });

  try {
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedResult);
    return {
      ...parsed,
      scholarshipId: scholarship.id,
    };
  } catch {
    return {
      scholarshipId: scholarship.id,
      successRate: 50,
      competitionLevel: 'medium',
      recommendation: 'Apply early and ensure all documents are complete.',
      similarProfiles: 100,
    };
  }
};

// Fee Anomaly Analyzer Chain
const feeAnalyzerPrompt = PromptTemplate.fromTemplate(`
You are a fee structure expert. Analyze the student's fee receipt against the official fee structure.

Official Fee Structure for {branch} at {college}:
- Tuition: ₹{officialTuition}
- Hostel: ₹{officialHostel}
- Mess: ₹{officialMess}
- Other Fees: {officialOther}

Student's Fee Receipt:
{receiptData}

Compare and identify any anomalies or overcharges. Respond with JSON:
{{
  "receiptTotal": number,
  "expectedTotal": number,
  "anomalies": [
    {{
      "category": "Fee category name",
      "expectedAmount": number,
      "chargedAmount": number,
      "difference": number,
      "explanation": "Possible reason or recommendation"
    }}
  ],
  "overchargeAmount": number (total extra charged),
  "recommendation": "What the student should do"
}}

Only respond with valid JSON.
`);

export const analyzeFeeAnomaly = async (
  receiptData: string,
  officialFees: {
    tuition: number;
    hostel: number;
    mess: number;
    other: Record<string, number>;
  },
  branch: string,
  college: string
): Promise<FeeAnalysisResult> => {
  const chain = RunnableSequence.from([
    feeAnalyzerPrompt,
    geminiModel,
    new StringOutputParser(),
  ]);

  const otherFeesStr = Object.entries(officialFees.other)
    .map(([key, value]) => `${key}: ₹${value}`)
    .join(', ');

  const result = await chain.invoke({
    branch,
    college,
    officialTuition: officialFees.tuition.toString(),
    officialHostel: officialFees.hostel.toString(),
    officialMess: officialFees.mess.toString(),
    officialOther: otherFeesStr || 'None specified',
    receiptData,
  });

  try {
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedResult);
  } catch {
    return {
      receiptTotal: 0,
      expectedTotal: 0,
      anomalies: [],
      overchargeAmount: 0,
      recommendation: 'Unable to analyze the fee receipt. Please ensure the image is clear.',
    };
  }
};

// Document Data Extractor Chain
const documentExtractorPrompt = PromptTemplate.fromTemplate(`
Extract structured data from the following document text (obtained via OCR).

Document Type: {documentType}
Document Text:
{documentText}

Extract relevant information and respond with JSON containing the appropriate fields:

For Income Certificate:
{{
  "holderName": "Name on certificate",
  "annualIncome": number,
  "issueDate": "date string",
  "validUntil": "date string if available",
  "issuingAuthority": "Authority name"
}}

For Caste Certificate:
{{
  "holderName": "Name on certificate",
  "category": "OBC/SC/ST/EWS",
  "issueDate": "date string",
  "certificateNumber": "number if available"
}}

For Marksheet:
{{
  "studentName": "Name",
  "institution": "School/College name",
  "percentage": number,
  "cgpa": number if available,
  "year": "Academic year",
  "subjects": [{{"name": "Subject", "marks": number}}]
}}

Only respond with valid JSON for the appropriate document type.
`);

export const extractDocumentData = async (
  documentType: string,
  documentText: string
): Promise<Record<string, unknown>> => {
  const chain = RunnableSequence.from([
    documentExtractorPrompt,
    geminiModel,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke({
    documentType,
    documentText,
  });

  try {
    const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedResult);
  } catch {
    return {
      error: 'Failed to extract document data',
      rawText: documentText,
    };
  }
};

// Generate scholarship matching profile text for embedding
export const generateProfileText = (profile: UserProfile): string => {
  return `
    Student profile:
    Category: ${profile.category}
    Annual family income: ${profile.income} rupees
    Academic percentage: ${profile.percentage}%
    Branch of study: ${profile.branch}
    Current year: ${profile.year}
    State: ${profile.state}
    College: ${profile.college}
    Gender: ${profile.gender}
    Achievements and activities: ${profile.achievements.join(', ') || 'None specified'}
  `.trim();
};

// Generate scholarship text for embedding
export const generateScholarshipText = (scholarship: Scholarship): string => {
  return `
    Scholarship: ${scholarship.name}
    Provider: ${scholarship.provider}
    Type: ${scholarship.type}
    Amount: ${scholarship.amount.min} to ${scholarship.amount.max} rupees
    Eligible categories: ${scholarship.eligibility.categories.join(', ')}
    Income limit: ${scholarship.eligibility.incomeLimit} rupees
    Minimum percentage required: ${scholarship.eligibility.minPercentage}%
    Eligible states: ${scholarship.eligibility.states.join(', ')}
    Eligible branches: ${scholarship.eligibility.branches.join(', ')}
    Gender requirement: ${scholarship.eligibility.gender}
    Year range: ${scholarship.eligibility.yearRange[0]} to ${scholarship.eligibility.yearRange[1]}
    Additional criteria: ${scholarship.eligibilityText}
  `.trim();
};

// Generate profile embedding
export const generateProfileEmbedding = async (profile: UserProfile): Promise<number[]> => {
  const text = generateProfileText(profile);
  return generateEmbedding(text);
};

// Generate scholarship embedding
export const generateScholarshipEmbedding = async (scholarship: Scholarship): Promise<number[]> => {
  const text = generateScholarshipText(scholarship);
  return generateEmbedding(text);
};
