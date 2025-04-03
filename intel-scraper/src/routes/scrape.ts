import { Router, Request, Response } from 'express';
import openai from '../config/openai';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { documentationUrl } = req.body;

    if (!documentationUrl) {
      res.status(400).json({ error: 'Documentation URL is required' });
      return;
    }

    const systemPrompt = `You are an expert in analyzing DeFi protocol documentation. 
    Extract the following information from the provided documentation:
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
        { role: "user", content: `Please analyze this documentation: ${documentationUrl}` }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Scraping Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze documentation' 
    });
  }
});

export default router; 