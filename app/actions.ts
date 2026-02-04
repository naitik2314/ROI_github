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
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
      You are an expert business analyst. I will provide a company name, and you need to return a JSON object with the following information about the company:
      1. Official Name
      2. Headquarters Location:
         - City
         - County (or equivalent district)
         - US State Abbreviation (e.g., CA, NY). If outside US, pick the US HQ if applicable, or the main HQ and use a US-equivalent state code if possible or just the country code if not US.
         - Approximate Coordinates (Latitude and Longitude) of the headquarters.
      3. Approximate number of US employees (formatted as a string, e.g. "150,000+"). If US specific is hard to find, give global.
      4. A very brief 1-sentence summary of what they do.
      
      Return ONLY valid JSON in this format, no code blocks:
      {
        "name": "Company Name",
        "location": {
          "city": "City",
          "county": "County Name",
          "state": "2-letter State Code",
          "coordinates": {
            "lat": 37.7749,
            "lng": -122.4194
          }
        },
        "stats": {
          "employeeCount": "100,000",
          "industry": "Industry Name"
        },
        "summary": "One sentence summary."
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
