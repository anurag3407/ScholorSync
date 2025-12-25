/**
 * Seed script using Firebase Client SDK (no service account needed)
 * Run with: npx tsx scripts/seed-client.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Types
interface ScholarshipAmount {
  min: number;
  max: number;
}

interface ScholarshipEligibility {
  categories: string[];
  incomeLimit: number;
  minPercentage: number;
  states: string[];
  gender: string;
  courses: string[];
  levels: string[];
  yearRange: [number, number];
  disabilities?: boolean;
}

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  type: 'government' | 'private' | 'corporate' | 'college';
  amount: ScholarshipAmount;
  eligibility: ScholarshipEligibility;
  eligibilityText: string;
  deadline: string;
  applicationUrl: string;
  documentsRequired: string[];
  benefits: string;
  howToApply: string;
  sourceUrl: string;
  tags: string[];
  isActive: boolean;
  renewalAvailable: boolean;
  competitionLevel: 'low' | 'medium' | 'high';
}

interface ScholarshipsData {
  scholarships: Scholarship[];
}

// Firebase client config from env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
function validateFirebaseConfig() {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}. Check your .env.local file.`);
  }
}

// Initialize Pinecone
function initPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  PINECONE_API_KEY not set - skipping Pinecone seeding');
    return null;
  }
  return new Pinecone({ apiKey });
}

// Initialize Google AI for embeddings
function initGoogleAI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  GOOGLE_API_KEY not set - skipping embeddings');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// Generate embedding for a scholarship
async function generateEmbedding(genAI: GoogleGenerativeAI, scholarship: Scholarship): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  const text = [
    `Name: ${scholarship.name}`,
    `Provider: ${scholarship.provider}`,
    `Type: ${scholarship.type}`,
    `Amount: ₹${scholarship.amount.min.toLocaleString()} to ₹${scholarship.amount.max.toLocaleString()}`,
    `Deadline: ${scholarship.deadline}`,
    `Eligibility: ${scholarship.eligibilityText}`,
    `Categories: ${scholarship.eligibility.categories.join(', ')}`,
    `States: ${scholarship.eligibility.states.join(', ')}`,
    `Gender: ${scholarship.eligibility.gender}`,
    `Income Limit: ₹${scholarship.eligibility.incomeLimit.toLocaleString()}`,
    `Minimum Percentage: ${scholarship.eligibility.minPercentage}%`,
    `Courses: ${scholarship.eligibility.courses.join(', ')}`,
    `Education Levels: ${scholarship.eligibility.levels.join(', ')}`,
    `Benefits: ${scholarship.benefits}`,
    `Tags: ${scholarship.tags.join(', ')}`,
  ].join('\n');

  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Seed Firestore with scholarships
async function seedFirestore(db: ReturnType<typeof getFirestore>, scholarships: Scholarship[]): Promise<void> {
  console.log('\n📦 Seeding Firestore with scholarships...\n');
  
  const scholarshipsRef = collection(db, 'scholarships');
  let count = 0;
  
  // Process in batches of 500 (Firestore limit)
  const batchSize = 500;
  
  for (let i = 0; i < scholarships.length; i += batchSize) {
    const batch = writeBatch(db);
    const currentBatch = scholarships.slice(i, i + batchSize);
    
    for (const scholarship of currentBatch) {
      const docRef = doc(scholarshipsRef, scholarship.id);
      batch.set(docRef, {
        ...scholarship,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: Math.floor(Math.random() * 10000) + 1000,
        applicationCount: Math.floor(Math.random() * 5000) + 500,
      });
      count++;
    }
    
    await batch.commit();
    console.log(`  ✅ Committed batch: ${count} scholarships`);
  }
  
  console.log(`\n✅ Seeded ${count} scholarships to Firestore\n`);
}

// Seed Pinecone with embeddings
async function seedPinecone(
  pinecone: Pinecone, 
  genAI: GoogleGenerativeAI, 
  scholarships: Scholarship[]
): Promise<void> {
  console.log('\n🧠 Generating embeddings and seeding Pinecone...\n');
  
  const indexName = process.env.PINECONE_INDEX_NAME || process.env.PINECONE_INDEX || 'scholarships';
  
  console.log(`  📍 Using Pinecone index: ${indexName}`);
  
  const index = pinecone.index(indexName);
  
  const batchSize = 50;
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < scholarships.length; i += batchSize) {
    const batch = scholarships.slice(i, i + batchSize);
    
    try {
      const vectors = await Promise.all(
        batch.map(async (scholarship) => {
          try {
            const embedding = await generateEmbedding(genAI, scholarship);
            return {
              id: scholarship.id,
              values: embedding,
              metadata: {
                name: scholarship.name,
                provider: scholarship.provider,
                type: scholarship.type,
                amountMin: scholarship.amount.min,
                amountMax: scholarship.amount.max,
                deadline: scholarship.deadline,
                applicationUrl: scholarship.applicationUrl,
                categories: scholarship.eligibility.categories,
                incomeLimit: scholarship.eligibility.incomeLimit,
                minPercentage: scholarship.eligibility.minPercentage,
                states: scholarship.eligibility.states,
                gender: scholarship.eligibility.gender,
                courses: scholarship.eligibility.courses,
                levels: scholarship.eligibility.levels,
                tags: scholarship.tags,
                isActive: scholarship.isActive,
                competitionLevel: scholarship.competitionLevel,
                benefits: scholarship.benefits,
                eligibilityText: scholarship.eligibilityText,
              },
            };
          } catch (error) {
            console.error(`  ❌ Failed embedding for ${scholarship.name}:`, error);
            failCount++;
            return null;
          }
        })
      );
      
      const validVectors = vectors.filter((v): v is NonNullable<typeof v> => v !== null);
      
      if (validVectors.length > 0) {
        await index.upsert(validVectors);
        successCount += validVectors.length;
        console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${validVectors.length} embeddings`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      failCount += batch.length;
    }
  }
  
  console.log(`\n✅ Pinecone seeding complete: ${successCount} success, ${failCount} failed\n`);
}

// Seed community data
async function seedCommunityData(db: ReturnType<typeof getFirestore>): Promise<void> {
  console.log('\n💬 Seeding community data...\n');
  
  const users = [
    { id: 'user-1', name: 'Priya Sharma', avatar: 'PS', reputation: 1250, badges: ['helper', 'top-contributor'] },
    { id: 'user-2', name: 'Rahul Kumar', avatar: 'RK', reputation: 890, badges: ['verified'] },
    { id: 'user-3', name: 'Anita Desai', avatar: 'AD', reputation: 2100, badges: ['expert', 'mentor'] },
    { id: 'user-4', name: 'Vikram Singh', avatar: 'VS', reputation: 560, badges: ['newcomer'] },
    { id: 'user-5', name: 'Meera Patel', avatar: 'MP', reputation: 1800, badges: ['helper', 'verified'] },
  ];
  
  const posts = [
    {
      id: 'post-1',
      title: 'How I got the Central Sector Scholarship - Complete Guide',
      content: `I wanted to share my experience getting the Central Sector Scholarship last year. Here's everything you need to know:

**Eligibility:**
- You need to be in the top 20% of your Class 12 board
- Family income should be less than 8 lakh per annum
- Must be pursuing a regular degree course

**Tips:**
- Apply early on NSP portal
- Keep all documents ready in PDF format
- Track your application status regularly

I received ₹10,000 for UG and it really helped with my expenses. Feel free to ask any questions!`,
      authorId: 'user-3',
      authorName: 'Anita Desai',
      authorAvatar: 'AD',
      category: 'success-story',
      tags: ['central-sector', 'nsp', 'merit-based', 'guide'],
      upvotes: 156,
      downvotes: 3,
      commentCount: 42,
      createdAt: new Date('2025-12-20'),
      updatedAt: new Date('2025-12-20'),
      isPinned: true,
    },
    {
      id: 'post-2',
      title: 'NSP Portal Not Working - Anyone Else Facing Issues?',
      content: `I've been trying to submit my scholarship application on NSP for the past 3 days but keep getting errors. The OTP is not being sent to my mobile number. Has anyone else faced this issue?`,
      authorId: 'user-4',
      authorName: 'Vikram Singh',
      authorAvatar: 'VS',
      category: 'help',
      tags: ['nsp', 'technical-issue', 'otp'],
      upvotes: 89,
      downvotes: 1,
      commentCount: 67,
      createdAt: new Date('2025-12-22'),
      updatedAt: new Date('2025-12-23'),
      isPinned: false,
    },
    {
      id: 'post-3',
      title: 'List of Scholarships for Engineering Students 2025-26',
      content: `I've compiled a comprehensive list of scholarships available for engineering students:

**Government Scholarships:**
1. AICTE Pragati (for girls) - ₹50,000/year
2. AICTE Saksham (for PwD) - ₹50,000/year
3. Central Sector Scheme - ₹10,000-20,000/year

**Corporate Scholarships:**
1. L&T Build India - Up to ₹1.8 lakh/year
2. Reliance Foundation - Up to ₹6 lakh

Will keep updating this list!`,
      authorId: 'user-1',
      authorName: 'Priya Sharma',
      authorAvatar: 'PS',
      category: 'resource',
      tags: ['engineering', 'list', 'comprehensive', '2025-26'],
      upvotes: 342,
      downvotes: 5,
      commentCount: 89,
      createdAt: new Date('2025-12-15'),
      updatedAt: new Date('2025-12-23'),
      isPinned: true,
    },
    {
      id: 'post-4',
      title: 'Scholarship Stacking - Can I Apply for Multiple?',
      content: `I'm eligible for multiple scholarships. Can I apply for and receive all of them simultaneously? Or are there restrictions?`,
      authorId: 'user-2',
      authorName: 'Rahul Kumar',
      authorAvatar: 'RK',
      category: 'question',
      tags: ['stacking', 'multiple-scholarships', 'eligibility'],
      upvotes: 78,
      downvotes: 1,
      commentCount: 34,
      createdAt: new Date('2025-12-19'),
      updatedAt: new Date('2025-12-20'),
      isPinned: false,
    },
  ];

  const comments = [
    {
      id: 'comment-1',
      postId: 'post-2',
      content: 'I faced the same issue. Try using incognito mode and make sure your Aadhaar is linked to the mobile number.',
      authorId: 'user-1',
      authorName: 'Priya Sharma',
      authorAvatar: 'PS',
      upvotes: 45,
      createdAt: new Date('2025-12-22T10:30:00'),
      parentCommentId: null,
    },
    {
      id: 'comment-2',
      postId: 'post-2',
      content: 'The NSP helpline number is 0120-6619540. They helped me resolve a similar issue.',
      authorId: 'user-3',
      authorName: 'Anita Desai',
      authorAvatar: 'AD',
      upvotes: 67,
      createdAt: new Date('2025-12-22T11:15:00'),
      parentCommentId: null,
    },
    {
      id: 'comment-3',
      postId: 'post-4',
      content: 'Yes, you can stack! State + Central is usually allowed. Private scholarships can be combined with government ones too.',
      authorId: 'user-3',
      authorName: 'Anita Desai',
      authorAvatar: 'AD',
      upvotes: 56,
      createdAt: new Date('2025-12-19T18:00:00'),
      parentCommentId: null,
    },
  ];

  // Seed users
  for (const user of users) {
    await setDoc(doc(db, 'communityUsers', user.id), {
      ...user,
      joinedAt: new Date('2025-01-01'),
      postsCount: posts.filter(p => p.authorId === user.id).length,
      commentsCount: comments.filter(c => c.authorId === user.id).length,
    });
  }
  console.log(`  ✅ Seeded ${users.length} community users`);

  // Seed posts
  for (const post of posts) {
    await setDoc(doc(db, 'communityPosts', post.id), post);
  }
  console.log(`  ✅ Seeded ${posts.length} community posts`);

  // Seed comments
  for (const comment of comments) {
    await setDoc(doc(db, 'communityComments', comment.id), comment);
  }
  console.log(`  ✅ Seeded ${comments.length} community comments`);

  console.log('\n✅ Community data seeding complete!\n');
}

// Main seed function
async function main() {
  console.log('\n🚀 Starting ScholarSync Database Seeding (Client SDK)...\n');
  console.log('='.repeat(50));
  
  try {
    // Validate config
    validateFirebaseConfig();
    console.log('✅ Firebase config validated');
    
    // Load scholarships data
    const dataPath = path.join(process.cwd(), 'scholorships.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error('scholorships.json not found in project root');
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data: ScholarshipsData = JSON.parse(rawData);
    
    console.log(`\n📄 Loaded ${data.scholarships.length} scholarships from JSON\n`);
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized');
    
    // Initialize optional services
    const pinecone = initPinecone();
    const genAI = initGoogleAI();
    
    // Seed Firestore
    await seedFirestore(db, data.scholarships);
    
    // Seed Pinecone with embeddings (if available)
    if (pinecone && genAI) {
      await seedPinecone(pinecone, genAI, data.scholarships);
    } else {
      console.log('\n⚠️  Skipping Pinecone seeding (missing API keys)\n');
    }
    
    // Seed community data
    await seedCommunityData(db);
    
    console.log('='.repeat(50));
    console.log('\n🎉 All seeding complete!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
