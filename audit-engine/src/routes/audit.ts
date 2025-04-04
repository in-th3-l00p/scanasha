import { Router, Request, Response } from 'express';
import openai from '../config/openai';

const router = Router();

interface Function {
  Function: string;
  Modifiers: string[];
  "msg.sender_conditions": string[];
  "state_variables_read_inside_modifiers": string[];
  "state_variables_written": string[];
}

interface Contract {
  Contract_Name: string;
  Functions: Function[];
}

interface PermissionScannerData {
  [address: string]: {
    [contractName: string]: Contract;
  };
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { scannerData, docsUrl, sourceUrl } = req.body;

    if (!scannerData) {
      res.status(400).json({ error: 'Permission scanner data is required' });
      return;
    }

    // Parse scanner data if it's a string
    let parsedScannerData: PermissionScannerData;
    try {
      parsedScannerData = typeof scannerData === 'string' 
        ? JSON.parse(scannerData) 
        : scannerData;
    } catch (error) {
      res.status(400).json({ error: 'Invalid scanner data format' });
      return;
    }

    // Extract contract information from the scanner data
    const addresses = Object.keys(parsedScannerData);
    if (addresses.length === 0) {
      res.status(400).json({ error: 'No contract addresses found in scanner data' });
      return;
    }

    const contractAddress = addresses[0];
    const contractNames = Object.keys(parsedScannerData[contractAddress]);
    if (contractNames.length === 0) {
      res.status(400).json({ error: 'No contract names found in scanner data' });
      return;
    }

    const contractName = contractNames[0];
    const contractData = parsedScannerData[contractAddress][contractName];

    // Calculate risk score based on the number of privileged functions
    const privilegedFunctions = contractData.Functions.filter(
      func => func["msg.sender_conditions"].length > 0 || func.Modifiers.length > 0
    );
    
    // Simple risk scoring algorithm - can be enhanced
    const riskScore = Math.min(10, Math.max(1, Math.ceil(privilegedFunctions.length * 1.5)));

    // Create a prompt for the OpenAI model
    const systemPrompt = `You are an expert DeFi security auditor analyzing a smart contract. 
    Based on the permission data provided, generate a comprehensive markdown audit report.
    
    Focus on:
    1. Security risks of privileged functions with access controls
    2. Potential vulnerabilities based on msg.sender checks and modifiers
    3. State variables that can be modified by privileged functions
    4. Recommendations for improvements in permission structure
    
    The report should include:
    - Title with the contract name
    - Overview section with contract details and risk score (1-10, with 10 being highest risk)
    - Analysis of each privileged function identified in the permission data
    - Assessment of centralization risks
    - Clear recommendations section with actionable items
    
    Format the response in Markdown.`;

    // Create content with all available information
    const userContent = `
    Contract Name: ${contractData.Contract_Name}
    Contract Address: ${contractAddress}
    Documentation URL: ${docsUrl || 'Not provided'}
    Source Code URL: ${sourceUrl || 'Not provided'}
    
    Permission Data:
    ${JSON.stringify({
      contractName: contractData.Contract_Name,
      functions: contractData.Functions
    }, null, 2)}
    
    Generated Risk Score: ${riskScore}/10
    
    Generate a detailed security audit report for this contract, focusing on permission and access control risks.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    });

    const auditMarkdown = completion.choices[0].message.content;
    
    // Add a separate metrics generation call
    const metricsPrompt = `
    You are evaluating a smart contract's security and decentralization metrics based on its permission structure.
    
    From the permission data and function analysis, score the following metrics from 0.0 to 1.0 (where 1.0 is best):
    
    1. autonomy: How autonomous is the contract? Less admin/owner intervention required means higher score.
       Consider factors like:
       - Number of privileged functions that require owner/admin access
       - Presence of automated vs manual processes
       - Reliance on centralized decision-making
    
    2. exitwindow: Do users have the ability to exit or withdraw their assets?
       Consider factors like:
       - Presence of withdrawal functions accessible to all users
       - Lack of lock-up periods or freezing capabilities
       - Absence of admin functions that can block withdrawals
    
    3. chain: Cross-chain compatibility and interoperability.
       Consider factors like:
       - Functions for cross-chain operations
       - Bridge compatibility
       - Chain-agnostic design elements
    
    4. upgradeability: How safely can the contract be upgraded if needed?
       Consider factors like:
       - Presence of proxy patterns
       - Timelock mechanisms
       - Multi-sig requirements for upgrades
       - Transparency of upgrade processes

    Format your response as a JSON object with these four metrics and their numeric scores.
    Example: { "autonomy": 0.75, "exitwindow": 0.9, "chain": 0.5, "upgradeability": 0.6 }
    `;
    
    const metricsCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: metricsPrompt },
        { role: "user", content: userContent }
      ],
      response_format: { type: "json_object" }
    });
    
    // Extract and parse metrics
    let metrics = {
      autonomy: 0.5,
      exitwindow: 0.5,
      chain: 0.5,
      upgradeability: 0.5
    };
    
    try {
      const metricsContent = metricsCompletion.choices[0].message?.content?.trim();
      if (metricsContent) {
        const extractedMetrics = JSON.parse(metricsContent);
        console.log('Extracted metrics:', extractedMetrics);
        metrics = {
          autonomy: ensureValidMetric(extractedMetrics.autonomy),
          exitwindow: ensureValidMetric(extractedMetrics.exitwindow),
          chain: ensureValidMetric(extractedMetrics.chain),
          upgradeability: ensureValidMetric(extractedMetrics.upgradeability)
        };
      }
    } catch (error) {
      console.error('Failed to parse metrics:', error);
      // Continue with default metrics
    }
    
    res.json({
      success: true,
      data: {
        auditMarkdown,
        contractName: contractData.Contract_Name,
        contractAddress,
        riskScore,
        metrics
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

// Helper function to ensure metrics are within 0.0 to 1.0 range
function ensureValidMetric(value: any): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0.5; // Default value
  }
  return Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
}

export default router; 