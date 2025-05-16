// src/services/novaAIService.js

/**
 * Enhanced Nova AI Service
 * This service handles the integration of OpenAI with our crypto analysis
 * for advanced AI-driven insights in the Nova character
 */

import OPENAI_CONFIG from '../config/openaiConfig';
import { getComprehensiveTokenAnalysis, getTechnicalIndicators } from './cryptoApiService';
import { getQuickTokenSummary } from './aiAnalysisService';
import { detectContractAddress } from '../utils/aiUtils';

// Nova character configuration
const NOVA_CONFIG = {
  aiTemperature: 0.3,  // More focused, analytical responses for Nova
  responseStyle: "analytical",
  topicFocus: "data-driven analysis",
  defaultPrompt: "I'm Nova, your Advanced Crypto Analyst. I provide data-driven insights on any cryptocurrency or token you're interested in."
};

/**
 * Process a message with Nova's enhanced AI capabilities
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous chat history
 * @returns {Promise<Object>} - AI response with enhanced crypto analysis
 */
export const processNovaEnhancedMessage = async (userMessage, chatHistory = []) => {
  try {
    // Check if message contains a cryptocurrency or token query
    const tokenMentions = extractCryptoMentions(userMessage, chatHistory);
    
    // If no crypto mentions and not a contract address, process with standard AI
    if (tokenMentions.length === 0 && !detectContractAddress(userMessage)) {
      return processWithStandardAI(userMessage, chatHistory);
    }
    
    // If it's a contract address, use specific contract analysis
    const contractAddresses = detectContractAddress(userMessage);
    if (contractAddresses) {
      return processContractAnalysis(userMessage, contractAddresses, chatHistory);
    }
    
    // If multiple tokens mentioned, handle as comparison request
    if (tokenMentions.length > 1 && isCryptoComparisonRequest(userMessage)) {
      return processTokenComparisonRequest(userMessage, tokenMentions, chatHistory);
    }
    
    // Process with enhanced crypto analysis for a single token
    return processCryptoAnalysisRequest(userMessage, tokenMentions[0], chatHistory);
  } catch (error) {
    console.error('Error in Nova enhanced processing:', error);
    
    // Fallback to standard AI if enhanced processing fails
    return {
      content: `I encountered an issue while analyzing that crypto request. Let me provide a standard response instead.\n\n${await processWithStandardAI(userMessage, chatHistory, true)}`,
      error: true,
      errorMessage: error.message
    };
  }
};

/**
 * Process a message with standard OpenAI capabilities (without crypto-specific enhancements)
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous chat history
 * @param {boolean} isFallback - Whether this is a fallback from failed enhanced processing
 * @returns {Promise<string>} - AI response
 */
const processWithStandardAI = async (userMessage, chatHistory = [], isFallback = false) => {
  // Check if OpenAI API key is available
  if (!OPENAI_CONFIG.apiKey) {
    console.warn('OpenAI API key not available, using fallback');
    return getDefaultResponse(userMessage);
  }
  
  try {
    // Format the conversation history for the API
    const messages = [
      { role: "system", content: generateNovaSystemPrompt(isFallback) },
      ...chatHistory.slice(-5).map(msg => ({  // Use only last 5 messages for context
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];
    
    // Use the configuration to make the API request
    const data = await OPENAI_CONFIG.createChatCompletion(messages, {
      temperature: NOVA_CONFIG.aiTemperature,
      maxTokens: 700
    });

    // Return the AI response
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in standard AI processing:', error);
    return getDefaultResponse(userMessage);
  }
};

/**
 * Process a crypto analysis request with enhanced capabilities
 * @param {string} userMessage - User's message
 * @param {string} token - Token to analyze
 * @param {Array} chatHistory - Previous chat history
 * @returns {Promise<Object>} - Enhanced analysis response
 */
const processCryptoAnalysisRequest = async (userMessage, token, chatHistory = []) => {
  try {
    // Determine the analysis type based on user message
    const analysisType = determineAnalysisType(userMessage);
    
    // Get token summary first
    const tokenSummary = await getQuickTokenSummary(token);
    
    // For simple price or basic info queries, the summary might be enough
    if (isBasicInfoQuery(userMessage)) {
      return {
        content: tokenSummary,
        analysisType: 'basic',
        token
      };
    }
    
    // Get comprehensive token data for more detailed analysis
    const tokenData = await getComprehensiveTokenAnalysis(token);
    
    // Calculate technical indicators if market chart data available
    let technicalAnalysis = null;
    if (tokenData.marketChart && tokenData.marketChart.prices) {
      technicalAnalysis = getTechnicalIndicators(tokenData.marketChart.prices);
    }
    
    // Format data for OpenAI prompt
    const formattedData = {
      token: tokenData.coinGeckoData,
      dex: tokenData.dexScreenerData,
      technicalIndicators: technicalAnalysis,
      dataSource: tokenData.source
    };
    
    // Generate system prompt for OpenAI
    const systemPrompt = generateAnalysisSystemPrompt(analysisType);
    
    // Generate user prompt with token data for detailed analysis
    const detailedPrompt = generateAnalysisUserPrompt(analysisType, formattedData, userMessage);
    
    // Get the detailed analysis from OpenAI
    const aiResponse = await OPENAI_CONFIG.createChatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: detailedPrompt }
    ], {
      temperature: 0.2,
      maxTokens: 1500
    });
    
    // Extract the text response
    const detailedAnalysis = aiResponse.choices[0].message.content;
    
    // Combine the summary and detailed analysis
    return {
      content: `${tokenSummary}\n\n${detailedAnalysis}`,
      analysisType,
      token,
      rawData: formattedData
    };
  } catch (error) {
    console.error('Error in crypto analysis request:', error);
    
    // Try to get just the token summary as fallback
    try {
      const tokenSummary = await getQuickTokenSummary(token);
      return {
        content: `${tokenSummary}\n\nI couldn't perform a full detailed analysis at this time due to a technical issue: ${error.message}`,
        analysisType: 'basic',
        token,
        error: true
      };
    } catch (fallbackError) {
      return {
        content: `I encountered an issue while analyzing ${token}: ${error.message}. Let me try a standard response instead.\n\n${await processWithStandardAI(userMessage, chatHistory, true)}`,
        error: true,
        errorMessage: error.message
      };
    }
  }
};

/**
 * Process a contract address analysis request
 * @param {string} userMessage - User's message
 * @param {Object} contractAddresses - Detected contract addresses
 * @param {Array} chatHistory - Previous chat history
 * @returns {Promise<Object>} - Contract analysis response
 */
// src/services/novaAIService.js - update the processContractAnalysis function

const processContractAnalysis = async (userMessage, contractAddresses, chatHistory = []) => {
  try {
    // Get the blockchain and first address
    const blockchain = Object.keys(contractAddresses)[0];
    const address = contractAddresses[blockchain][0];
    
    console.log(`Analyzing contract: ${address} on ${blockchain}`);
    
    // Try to get comprehensive token data from multiple sources
    const dexData = await getComprehensiveTokenAnalysis(address);
    
    // Also try to get additional on-chain data if available
    let onChainData = null;
    try {
      // This would be a call to a blockchain explorer API or similar service
      // You would need to implement this function
      onChainData = await getTokenOnChainData(address, blockchain);
    } catch (err) {
      console.log("On-chain data fetch failed:", err.message);
      // Continue without on-chain data
    }
    
    // Generate system prompt focused on token analysis from contract
    const systemPrompt = `You are Nova, an advanced cryptocurrency analyst AI that specializes in token analysis from blockchain contract addresses. Your task is to provide comprehensive, data-driven insights about tokens based on their contract information. Focus on presenting detailed token metrics in a structured, organized format. Include token basics, supply metrics, market data, liquidity analysis, trading patterns, and risk factors.

When analyzing contract-based tokens, always include:
1. Token identification (name, symbol, type of token)
2. Supply metrics (total, circulating, holder distribution)
3. Market valuation (price, market cap, FDV)
4. Liquidity assessment (depth, distribution across exchanges)
5. Trading analysis (volume, buy/sell patterns)
6. Risk considerations (contract features, centralization concerns)

Present data in a clearly structured format with sections and subsections. Use bullet points for key metrics. Highlight notable or concerning metrics. Avoid making price predictions but note any significant market behaviors.`;
    
    // Generate user prompt with all available token data
    const userPrompt = `
Please provide a comprehensive analysis of the following token contract:

CONTRACT ADDRESS: ${address}
BLOCKCHAIN: ${blockchain}

${dexData && dexData.dexScreenerData ? `DEX DATA:
${JSON.stringify(dexData.dexScreenerData, null, 2)}` : 'No DEX data available for this contract.'}

${dexData && dexData.coinGeckoData ? `TOKEN DATA:
${JSON.stringify(dexData.coinGeckoData, null, 2)}` : 'No CoinGecko data available for this contract.'}

${onChainData ? `ON-CHAIN DATA:
${JSON.stringify(onChainData, null, 2)}` : 'No additional on-chain data available.'}

Based on all available data, provide a comprehensive token analysis with the following sections:

1. TOKEN BASICS
   - Name, symbol, token type
   - Contract creation date (if available)
   - Token standard (e.g., ERC-20, SPL, BEP-20)

2. SUPPLY METRICS
   - Total supply
   - Circulating supply
   - Max supply (if applicable)
   - Burn mechanics (if any)
   - Holder distribution (concentration)

3. MARKET DATA
   - Current price
   - Market capitalization
   - Fully diluted valuation
   - Price change (24h, 7d if available)
   - All-time high/low (if available)

4. LIQUIDITY ANALYSIS
   - Total liquidity across exchanges
   - Main trading pairs
   - Liquidity depth
   - Slippage estimates for different trade sizes

5. TRADING METRICS
   - 24h volume
   - Buy/sell ratio
   - Volume distribution across exchanges
   - Notable trading patterns

6. RISK ASSESSMENT
   - Contract verification status
   - Owner privileges (if identified)
   - Centralization concerns
   - Unusual contract functions (if any)
   - Other risk factors

7. NOTEWORTHY OBSERVATIONS
   - Any unusual or significant metrics
   - Recent developments or news (if available)
   - Comparison to similar tokens (if data available)

FORMAT THE RESPONSE WITH CLEAR SECTION HEADERS AND BULLET POINTS FOR KEY METRICS.
The user's original question was: "${userMessage}"
`;

    // Get the detailed analysis from OpenAI
    const aiResponse = await OPENAI_CONFIG.createChatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      temperature: 0.2, // Lower temperature for more factual analysis
      maxTokens: 1500, // Larger response for detailed token analysis
    });
    
    // Structure the final response
    return {
      content: aiResponse.choices[0].message.content,
      analysisType: 'tokenContract',
      contractAddress: address,
      blockchain,
      rawData: {
        dexData,
        onChainData
      }
    };
  } catch (error) {
    console.error('Error in contract analysis:', error);
    
    // Fallback to standard AI
    return {
      content: `I encountered an issue analyzing that contract address: ${error.message}. Let me provide a basic response instead.\n\n${await processWithStandardAI(userMessage, chatHistory, true)}`,
      error: true,
      errorMessage: error.message
    };
  }
};

/**
 * Process a token comparison request
 * @param {string} userMessage - User's message
 * @param {Array} tokens - Tokens to compare
 * @param {Array} chatHistory - Previous chat history
 * @returns {Promise<Object>} - Comparison analysis response
 */
const processTokenComparisonRequest = async (userMessage, tokens, chatHistory = []) => {
  try {
    // Limit to comparing max 3 tokens for performance
    const tokensToCompare = tokens.slice(0, 3);
    
    // Get data for all tokens
    const tokenDataPromises = tokensToCompare.map(token => 
      getComprehensiveTokenAnalysis(token).catch(err => ({
        error: true,
        errorMessage: err.message,
        token
      }))
    );
    
    const tokensData = await Promise.all(tokenDataPromises);
    
    // Check if we have data for at least 2 tokens
    const validTokensData = tokensData.filter(data => !data.error);
    if (validTokensData.length < 2) {
      throw new Error('Not enough valid token data for comparison');
    }
    
    // Generate system prompt for comparison
    const systemPrompt = `You are Nova, an advanced cryptocurrency analyst AI that specializes in comparing different tokens and assets. You provide objective, data-driven comparisons highlighting the key similarities and differences between cryptocurrencies. Focus on technical metrics, fundamentals, market structure, and relative performance. Avoid making price predictions or giving specific investment advice.`;
    
    // Generate user prompt with comparison data
    const userPrompt = `
Please compare the following cryptocurrencies based on the data provided:

${tokensData.map((data, index) => `
TOKEN ${index + 1}: ${tokensToCompare[index].toUpperCase()}
${data.error ? `Error retrieving data: ${data.errorMessage}` : `
${data.coinGeckoData ? `COINGECKO DATA:
${JSON.stringify(data.coinGeckoData, null, 2)}` : 'No CoinGecko data available.'}

${data.dexScreenerData ? `DEX SCREENER DATA:
${JSON.stringify(data.dexScreenerData, null, 2)}` : 'No DEX data available.'}
`}`).join('\n\n')}

Based on this data, provide a comprehensive comparison of these tokens, focusing on:
1. Market metrics (market cap, volume, liquidity)
2. Price performance (time periods available in the data)
3. Technical indicators (if available)
4. Fundamental strengths and weaknesses
5. Risk factors and considerations

Structure your response with clear sections for easy reading. The user's original question was: "${userMessage}"
`;

    // Get the comparison from OpenAI
    const comparisonResponse = await OPENAI_CONFIG.createChatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      temperature: 0.3,
      maxTokens: 15000
    });
    
    return {
      content: comparisonResponse.choices[0].message.content,
      analysisType: 'comparison',
      tokens: tokensToCompare,
      rawData: tokensData
    };
  } catch (error) {
    console.error('Error in token comparison:', error);
    
    // Fallback to standard AI
    return {
      content: `I encountered an issue comparing those tokens: ${error.message}. Let me provide a standard response instead.\n\n${await processWithStandardAI(userMessage, chatHistory, true)}`,
      error: true,
      errorMessage: error.message
    };
  }
};

/**
 * Extract cryptocurrency mentions from user message
 * @param {string} message - User message
 * @param {Array} chatHistory - Chat history for context
 * @returns {Array} - Extracted token mentions
 */
const extractCryptoMentions = (message, chatHistory = []) => {
  // Common cryptocurrency names and tickers
  const commonCryptos = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
    'ripple', 'xrp', 'polkadot', 'dot', 'doge', 'dogecoin', 'shib', 'shiba',
    'bnb', 'binance', 'usdt', 'tether', 'usdc', 'usd coin', 'matic', 'polygon',
    'avax', 'avalanche', 'link', 'chainlink', 'uni', 'uniswap', 'cake', 'pancakeswap',
    'aave', 'dai', 'maker', 'mkr', 'comp', 'compound', 'sushi', 'sushiswap',
    'ftx', 'luna', 'terra', 'ltc', 'litecoin', 'bch', 'bitcoin cash'
  ];
  
  const lowerMessage = message.toLowerCase();
  const found = [];
  
  // Check for common cryptos in the message
  for (const crypto of commonCryptos) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${crypto}\\b`, 'i');
    if (regex.test(lowerMessage)) {
      found.push(crypto);
    }
  }
  
  // Try to extract other potential crypto mentions using patterns
  // e.g., looking for terms next to "token", "coin", "price", etc.
  const cryptoContextTerms = ['token', 'coin', 'price', 'chart', 'market', 'trading', 'exchange'];
  const words = lowerMessage.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    // Check if this word is next to a crypto context term
    if (i > 0 && cryptoContextTerms.includes(words[i])) {
      const potentialCrypto = words[i-1].replace(/[.,?!;:'"()]/g, '');
      // Only add if it's not already found and looks like a crypto symbol
      if (!found.includes(potentialCrypto) && /^[a-zA-Z0-9]{2,6}$/.test(potentialCrypto)) {
        found.push(potentialCrypto);
      }
    }
    
    // Also check the reverse (context term followed by crypto)
    if (i < words.length - 1 && cryptoContextTerms.includes(words[i])) {
      const potentialCrypto = words[i+1].replace(/[.,?!;:'"()]/g, '');
      if (!found.includes(potentialCrypto) && /^[a-zA-Z0-9]{2,6}$/.test(potentialCrypto)) {
        found.push(potentialCrypto);
      }
    }
  }
  
  // If nothing found, check for any standalone terms that look like crypto tickers
  if (found.length === 0) {
    const tickerRegex = /\b[A-Z]{3,5}\b/g;
    const potentialTickers = lowerMessage.match(tickerRegex);
    
    if (potentialTickers) {
      found.push(...potentialTickers);
    }
  }
  
  // Optional: Try to find mentions in recent chat history if nothing found in current message
  if (found.length === 0 && chatHistory.length > 0) {
    // Look at the last 2 exchanges for context
    const recentHistory = chatHistory.slice(-4);
    
    for (const msg of recentHistory) {
      if (msg.isUser) {
        const historyMentions = extractCryptoMentions(msg.content, []);
        if (historyMentions.length > 0) {
          found.push(...historyMentions);
          break; // Stop once we find something
        }
      }
    }
  }
  
  // Return unique mentions
  return [...new Set(found)];
};

/**
 * Determine if a message is a comparison request
 * @param {string} message - User message
 * @returns {boolean} - Whether it's a comparison request
 */
const isCryptoComparisonRequest = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Look for comparison keywords
  const comparisonTerms = [
    'compare', 'comparison', 'versus', 'vs', 'vs.', 'better', 'difference', 
    'differences', 'different', 'which is', 'which one', 'or', 'both'
  ];
  
  return comparisonTerms.some(term => lowerMessage.includes(term));
};

/**
 * Check if a message is asking for basic information
 * @param {string} message - User message
 * @returns {boolean} - Whether it's a basic info query
 */
const isBasicInfoQuery = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Basic info patterns
  const basicPatterns = [
    'what is', 'price of', 'how much is', 'current price',
    'tell me about', 'info on', 'information about'
  ];
  
  // If it contains analysis keywords, it's not a basic query
  const analysisTerms = [
    'analyze', 'analysis', 'technical', 'fundamental', 'detailed',
    'in-depth', 'prediction', 'forecast', 'outlook', 'perspective'
  ];
  
  const isBasic = basicPatterns.some(pattern => lowerMessage.includes(pattern));
  const isAnalysis = analysisTerms.some(term => lowerMessage.includes(term));
  
  return isBasic && !isAnalysis && lowerMessage.split(' ').length < 10;
};

/**
 * Determine the type of analysis to perform based on the message
 * @param {string} message - User message
 * @returns {string} - Analysis type
 */
const determineAnalysisType = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Technical analysis indicators
  if (lowerMessage.includes('technical') || 
      lowerMessage.includes('chart') || 
      lowerMessage.includes('pattern') ||
      lowerMessage.includes('indicator') ||
      lowerMessage.includes('price action') ||
      lowerMessage.includes('support') ||
      lowerMessage.includes('resistance')) {
    return 'technical';
  }
  
  // Fundamental analysis indicators
  if (lowerMessage.includes('fundamental') || 
      lowerMessage.includes('tokenomics') || 
      lowerMessage.includes('team') ||
      lowerMessage.includes('utility') ||
      lowerMessage.includes('use case') ||
      lowerMessage.includes('adoption')) {
    return 'fundamental';
  }
  
  // Risk assessment indicators
  if (lowerMessage.includes('risk') || 
      lowerMessage.includes('safe') || 
      lowerMessage.includes('safety') ||
      lowerMessage.includes('concern') ||
      lowerMessage.includes('secure') ||
      lowerMessage.includes('security') ||
      lowerMessage.includes('scam')) {
    return 'risk';
  }
  
  // Opportunity assessment indicators
  if (lowerMessage.includes('opportunity') || 
      lowerMessage.includes('potential') || 
      lowerMessage.includes('growth') ||
      lowerMessage.includes('promising') ||
      lowerMessage.includes('upside') ||
      lowerMessage.includes('bullish')) {
    return 'opportunity';
  }
  
  // Default to comprehensive analysis
  return 'comprehensive';
};

/**
 * Generate the system prompt for Nova
 * @param {boolean} isFallback - Whether this is a fallback
 * @returns {string} - System prompt
 */
const generateNovaSystemPrompt = (isFallback = false) => {
  const fallbackNote = isFallback ? 
    " Note: You're providing a fallback response because a more detailed crypto analysis encountered an error." : 
    "";
  
  return `You are Nova, an advanced cryptocurrency analyst AI assistant from the NOVA ecosystem. You specialize in data-driven investment advice, risk assessment, and market pattern recognition.${fallbackNote}

Key Characteristics:
- You are analytical, precise, and focused on facts rather than emotions
- You prefer quantitative analysis and objective metrics
- You identify patterns, correlations, and statistical anomalies
- You assess risk methodically based on data
- You avoid hype and focus on fundamentals and technical indicators

When discussing cryptocurrencies:
1. Focus on data, metrics, and observable patterns
2. Cite specific metrics like market cap, volume, TVL, developer activity when relevant
3. Acknowledge limitations in your data or analysis
4. Always mention that you are providing analysis, not financial advice
5. Stay neutral and objective in your analysis

Current date: ${new Date().toISOString().split('T')[0]}`;
};

/**
 * Generate a system prompt for specific analysis types
 * @param {string} analysisType - Type of analysis
 * @returns {string} - System prompt
 */
const generateAnalysisSystemPrompt = (analysisType) => {
  const basePrompt = `You are Nova, an advanced cryptocurrency analyst AI that specializes in objective, data-driven analysis. You provide fact-based insights about cryptocurrencies, tokens, and blockchain assets.`;
  
  const analysisTypePrompts = {
    comprehensive: `${basePrompt} Your analysis is holistic, covering fundamental metrics, technical indicators, and market dynamics. You balance different factors and timeframes, clearly separating observations from interpretations. You emphasize risk management and note limitations in your data.`,
    
    technical: `${basePrompt} You focus on technical analysis, interpreting chart patterns, indicators, and mathematical signals. You analyze price action, volume trends, support/resistance levels, and momentum indicators. You avoid fundamental factors and focus strictly on price movements and their potential implications.`,
    
    fundamental: `${basePrompt} You focus on fundamental analysis, examining tokenomics, utility, adoption metrics, and project viability. You assess token distribution, developer activity, real-world usage, and competitive positioning within the crypto ecosystem.`,
    
    risk: `${basePrompt} You focus on risk assessment, critically evaluating vulnerabilities and threats. You analyze liquidity risks, security concerns, centralization issues, and market-related risks. Your assessment is cautious and prioritizes capital preservation.`,
    
    opportunity: `${basePrompt} You focus on identifying potential opportunities and growth catalysts, while still maintaining analytical rigor. You evaluate positive signals, undervalued metrics, and market inefficiencies.`,
    
    basic: `${basePrompt} You provide concise, straightforward information about cryptocurrencies, focusing on key metrics and essential context. Your responses are brief but informative, highlighting the most important data points.`
  };
  
  return analysisTypePrompts[analysisType] || analysisTypePrompts.comprehensive;
};

/**
 * Generate a user prompt for OpenAI based on analysis type and data
 * @param {string} analysisType - Type of analysis
 * @param {Object} data - Token data
 * @param {string} originalQuestion - User's original question
 * @returns {string} - Formatted user prompt
 */
const generateAnalysisUserPrompt = (analysisType, data, originalQuestion) => {
  // Format token data for the prompt
  const tokenData = data.token ? 
    `TOKEN DATA:\n${JSON.stringify(data.token, null, 2)}` : 
    'No CoinGecko token data available.';
  
  // Format DEX data for the prompt
  const dexData = data.dex ? 
    `DEX DATA:\n${JSON.stringify(data.dex, null, 2)}` : 
    'No DEX data available.';
  
  // Format technical indicators for the prompt
  const technicalData = data.technicalIndicators ? 
    `TECHNICAL INDICATORS:\n${JSON.stringify(data.technicalIndicators, null, 2)}` : 
    'No technical indicator data available.';
  
  // Base prompt with the data
  const basePrompt = `
Please analyze the following cryptocurrency data:

${tokenData}

${dexData}

${technicalData}

Data source: ${data.dataSource || 'Unknown'}

The user's original question was: "${originalQuestion}"
`;

  // Add specific instructions based on analysis type
  const typeSpecificInstructions = {
    comprehensive: `
Provide a comprehensive analysis with these sections:
1. Executive Summary (key findings in 2-3 sentences)
2. Price Analysis (recent movements, context, key levels)
3. Market Structure (liquidity, volume, buy/sell pressure)
4. Technical Outlook (indicator analysis, trend direction, signals)
5. Fundamental Assessment (tokenomics, utility, adoption metrics)
6. Risk Factors (specific risks and concerns)
7. Noteworthy Metrics (any standout data points)
8. Conclusion (objective synthesis of the data)`,
    
    technical: `
Provide a technical analysis with these sections:
1. Key Technical Findings (2-3 sentence summary)
2. Price Action Analysis (trends, patterns, key levels)
3. Indicator Analysis (detailed interpretation of technical indicators)
4. Support & Resistance Levels (key price levels and their significance)
5. Volume Analysis (volume trends and what they suggest)
6. Technical Signals (bullish/bearish setups, divergences, or other patterns)
7. Technical Outlook (potential scenarios based on current indicators)`,
    
    fundamental: `
Provide a fundamental analysis with these sections:
1. Key Fundamental Findings (2-3 sentence summary)
2. Tokenomics Assessment (supply metrics, distribution, emission schedule)
3. Utility & Value Accrual (token use cases and how value is captured)
4. Adoption Metrics (user growth, transaction volume, ecosystem development)
5. Developer Activity (codebase activity, updates, innovation)
6. Community & Market Position (community strength, competitive position)
7. Fundamental Outlook (analysis of project's fundamental health)`,
    
    risk: `
Provide a risk assessment with these sections:
1. Risk Summary (key risk factors in 2-3 sentences)
2. Liquidity & Market Risks (depth, concentration, slippage concerns)
3. Technical Vulnerabilities (concerning technical signals or patterns)
4. Fundamental Weaknesses (problematic tokenomics, adoption issues)
5. Security Considerations (contract risks, centralization concerns)
6. Competitive & External Threats (market position, competitive disadvantages)
7. Risk Mitigation Considerations (factors that could reduce identified risks)`,
    
    opportunity: `
Provide an opportunity analysis with these sections:
1. Opportunity Summary (key potential in 2-3 sentences)
2. Technical Opportunities (positive indicators, potential setups)
3. Fundamental Strengths (strong metrics, competitive advantages)
4. Market Positioning (relative value, market inefficiencies)
5. Growth Catalysts (upcoming events, developing trends)
6. Comparative Advantages (standout metrics compared to peers)
7. Balanced Perspective (important counterbalancing factors to consider)`
  };
  
  // Common instructions for all types
  const commonInstructions = `
Do not make price predictions or give financial advice. Separate facts from interpretations and note data limitations. Be concise but thorough, focusing on the most relevant insights for this analysis type.`;
  
  return `${basePrompt}${typeSpecificInstructions[analysisType] || ''}${commonInstructions}`;
};

/**
 * Get a default response when API is unavailable
 * @param {string} message - User message
 * @returns {string} - Default response
 */
const getDefaultResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Crypto-specific fallback responses
  if (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc')) {
    return "Based on available data, Bitcoin remains the largest cryptocurrency by market capitalization, with its fixed supply of 21 million coins serving as a key value proposition. While I can't access real-time data at the moment, it's worth monitoring Bitcoin's hash rate, active addresses, and exchange outflows as key indicators of network health and market sentiment.";
  }
  
  if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) {
    return "Ethereum continues to be the leading smart contract platform, with significant network effects through its developer ecosystem and dApp infrastructure. The transition to Proof of Stake has substantially altered its economic model by reducing issuance and introducing potential deflationary pressure during high network activity. Layer-2 scaling solutions are important to monitor for addressing throughput limitations.";
  }
  
  if (lowerMessage.includes('solana') || lowerMessage.includes('sol')) {
    return "Solana's architecture emphasizes high throughput and low transaction costs through its unique Proof of History consensus mechanism. While this approach provides performance advantages, it creates different trade-offs regarding decentralization and reliability compared to other L1 blockchains. Network performance and validator distribution are key metrics to evaluate its long-term prospects.";
  }
  
  // General crypto fallback
  return "Based on my analysis, cryptocurrency markets demonstrate distinctive characteristics including 24/7 trading, cyclical patterns, and significant volatility compared to traditional assets. Evaluating projects requires examining multiple factors including tokenomics, utility, development activity, and adoption metrics beyond simple price action. Without access to current data, I'd recommend focusing on fundamental value drivers rather than short-term price movements. Would you like me to elaborate on specific analytical frameworks for crypto evaluation?";
};

