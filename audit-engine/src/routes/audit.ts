import { Router, Request, Response } from 'express';
import openai from '../config/openai';

const router = Router();

interface PermissionFunction {
  name: string;
  permissionLevel: string;
  risk: string;
}

interface PermissionData {
  functions: PermissionFunction[];
  riskScore: number;
}

router.post('/generate-report', async (req: Request, res: Response) => {
  try {
    const { permissionData, contractName, contractAddress, contractDescription } = req.body;

    if (!permissionData) {
      return res.status(400).json({ error: 'Permission data is required' });
    }

    if (!contractName || !contractAddress) {
      return res.status(400).json({ error: 'Contract name and address are required' });
    }

    // Parse permission data if it's a string
    let parsedPermissionData: PermissionData;
    try {
      parsedPermissionData = typeof permissionData === 'string' 
        ? JSON.parse(permissionData) 
        : permissionData;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid permission data format' });
    }

    // Create a prompt for the OpenAI model
    const systemPrompt = `You are an expert DeFi security auditor analyzing a smart contract. 
    Based on the permission data provided, generate a comprehensive markdown audit report.
    
    Focus on:
    1. Security risks of privileged functions
    2. Potential vulnerabilities based on permission levels
    3. Recommendations for improvements
    
    The report should include:
    - Title with the contract name
    - Overview section with contract details and risk score
    - Analysis of each critical function identified in the permission data
    - Clear recommendations section with actionable items
    
    Format the response in Markdown.`;

    // Create content with all available information
    const userContent = `
    Contract Name: ${contractName}
    Contract Address: ${contractAddress}
    Contract Description: ${contractDescription || 'Not provided'}
    
    Permission Data:
    ${JSON.stringify(parsedPermissionData, null, 2)}
    
    Generate a detailed security audit report for this contract.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    });

    const auditMarkdown = completion.choices[0].message.content;
    
    res.json({
      success: true,
      data: {
        auditMarkdown,
        riskScore: parsedPermissionData.riskScore
      }
    });
  } catch (error) {
    console.error('Audit Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate audit report' 
    });
  }
});

router.post('/analyze-permissions', async (req: Request, res: Response) => {
  try {
    const { contractAddress, contractABI } = req.body;

    if (!contractAddress) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!contractABI) {
      return res.status(400).json({ error: 'Contract ABI is required' });
    }

    // In a real implementation, this would call the permission scanner
    // For now, we'll simulate generating permission data
    
    // Mock permission data generation
    const mockFunctions = [
      { name: "transferOwnership", permissionLevel: "owner", risk: "high" },
      { name: "withdraw", permissionLevel: "owner", risk: "high" },
      { name: "pause", permissionLevel: "admin", risk: "medium" },
      { name: "unpause", permissionLevel: "admin", risk: "medium" },
      { name: "setFees", permissionLevel: "admin", risk: "medium" },
      { name: "addToWhitelist", permissionLevel: "owner", risk: "low" }
    ];
    
    // Calculate a risk score based on the functions (0-100)
    const highRiskCount = mockFunctions.filter(f => f.risk === "high").length;
    const mediumRiskCount = mockFunctions.filter(f => f.risk === "medium").length;
    const riskScore = Math.min(100, Math.floor(
      (highRiskCount * 25 + mediumRiskCount * 10) * 
      (mockFunctions.length > 0 ? 100 / mockFunctions.length : 0)
    ));
    
    const permissionData = {
      functions: mockFunctions,
      riskScore: riskScore
    };
    
    res.json({
      success: true,
      data: {
        permissionData: JSON.stringify(permissionData, null, 2),
        riskScore: riskScore
      }
    });
  } catch (error) {
    console.error('Permission Analysis Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze permissions' 
    });
  }
});

export default router; 