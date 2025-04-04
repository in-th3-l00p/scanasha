import { Router, Request, Response } from 'express';
import openai from '../config/openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

// Function to fetch and extract text from a website
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Get the text content
    const bodyText = $('body').text()
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .trim();
      
    return bodyText;
  } catch (error) {
    console.error('Error fetching website:', error);
    throw new Error(`Failed to fetch content from ${url}`);
  }
}

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { documentationUrl } = req.body;

    if (!documentationUrl) {
      res.status(400).json({ error: 'Documentation URL is required' });
      return;
    }

    // Fetch website content
    const websiteContent = await fetchWebsiteContent(documentationUrl);
    
    if (!websiteContent || websiteContent.length === 0) {
      res.status(400).json({ error: 'Could not extract content from the provided URL' });
      return;
    }

    // Truncate content if it's too long for the API (limit to around 8000 tokens)
    const truncatedContent = websiteContent.length > 32000 ? 
      websiteContent.substring(0, 32000) + "..." : 
      websiteContent;

    const systemPrompt = `You are an expert in analyzing DeFi protocol documentation. 
    Extract the following information from the provided documentation content:
    1. Contract name
    2. Description of what the contract does
    3. Codebase location (if available)
    4. Smart contract address (if available)
    
    Format the response as a JSON object with these exact keys:
    {
      "name": "string",
      "description": "string",
      "codebase": "string",
      "address": "string"
    }
    
    If any information is not available, use null for that field.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this documentation content: ${truncatedContent}` }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    res.json({
      success: true,
      data: analysis,
      contentLength: websiteContent.length,
      truncated: websiteContent.length > 32000
    });
  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze documentation' 
    });
  }
});

export default router; 