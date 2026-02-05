'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface CompanyData {
    name: string;
    location: {
        city: string;
        county: string;
        state: string; // Two-letter abbreviation, e.g., "CA", "NY"
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    stats: {
        employeeCount: string; // e.g., "150,000+"
        revenue?: string;
        industry?: string;
    };
    summary: string;
    commuters: {
        county: string;
        count: number;
        percent: number;
    }[];
    socialPosts: {
        id: number;
        user: string;
        content: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        topic: 'air' | 'happiness' | 'water' | 'general';
    }[];
    trendingTopics: {
        term: string;
        volume: string;
        growth: string;
    }[];
}

export async function getCompanyData(query: string): Promise<CompanyData | null> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY is not set');
        // Return mock data for testing if no key is present
        return {
            name: query,
            location: {
                city: 'Unknown',
                county: 'Unknown',
                state: 'CA',
                coordinates: { lat: 37.7749, lng: -122.4194 }
            },
            stats: { employeeCount: 'Unknown' },
            summary: 'API Key missing. Please check your .env file.',
            commuters: [],
            socialPosts: [],
            trendingTopics: []
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `
      You are an expert business analyst and urban planner. I will provide a company name, and you need to return a JSON object with the following information:
      1. Official Name
      2. Headquarters Location (City, County, State, Coordinates).
      3. Approximate number of US employees.
      4. A brief 1-sentence summary.
      5. Commuter Data: Estimate the top 3 neighboring counties people commute FROM to this HQ. Give approximate counts and percentages.
      6. Social Media Simulation: Generate 3-4 realistic "social media posts" that might be trending in that county regarding health/environment (Air Quality, Happiness, Water Quality, Traffic Stress). Mix sentiments.
      7. Google Trends: Identify top 3 rising health-related search terms in this region (e.g. "Flu symptoms", "Gym near me", "Air purifier").

      Return ONLY valid JSON in this format:
      {
        "name": "Company Name",
        "location": {
          "city": "City",
          "county": "County Name",
          "state": "2-letter State Code",
          "coordinates": { "lat": 0.0, "lng": 0.0 }
        },
        "stats": { "employeeCount": "100,000", "industry": "Tech" },
        "summary": "Summary.",
        "commuters": [
            { "county": "Neighbor County A", "count": 5000, "percent": 15 },
            { "county": "Neighbor County B", "count": 3000, "percent": 10 }
        ],
        "socialPosts": [
            { "id": 1, "user": "@user123", "content": "Air quality is terrible today in [County]...", "sentiment": "negative", "topic": "air" },
            { "id": 2, "user": "@happy_local", "content": "Love the new parks...", "sentiment": "positive", "topic": "happiness" }
        ],
        "trendingTopics": [
            { "term": "Flu symptoms", "volume": "High", "growth": "+150%" },
            { "term": "Yoga classes", "volume": "Medium", "growth": "+40%" }
        ]
      }

      Company: ${query}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

        const data = JSON.parse(cleanText);
        return data;
    } catch (error) {
        console.error('Error fetching company data:', error);
        return null;
    }
}
