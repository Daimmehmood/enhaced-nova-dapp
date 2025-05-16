// src/services/aiAnalysisService.js
/**
 * This service integrates with OpenAI to provide advanced cryptocurrency analysis
 * It combines data from crypto APIs with AI-powered insights
 */

import { getComprehensiveTokenAnalysis, getTechnicalIndicators } from './cryptoApiService';

// Get API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Check if the OpenAI API key is valid and available
 * @returns {boolean} - Whether the API key is available
 */
export const isOpenAIAvailable = () => {
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 20;
};

/**
 * Generate a detailed analysis of a cryptocurrency using OpenAI
 * @param {string} tokenQuery - The token to analyze (name, symbol, or address)
 * @param {Object} options - Additional options for the analysis
 * @returns {Promise<Object>} - The analysis result
 */
export const generateTokenAnalysis = async (tokenQuery, options = {}) => {
  try {
    // 1. Fetch comprehensive token data
    const tokenData = await getComprehensiveTokenAnalysis(tokenQuery);
    
    // 2. Calculate technical indicators if market chart data is available
    let technicalAnalysis = null;
    if (tokenData.marketChart && tokenData.marketChart.prices) {
      technicalAnalysis = getTechnicalIndicators(tokenData.marketChart.prices);
    }
    
    // 3. Combine the data
    const analysisData = {
      token: tokenData.coinGeckoData,
      dex: tokenData.dexScreenerData,
      technicalIndicators: technicalAnalysis,
      dataSource: tokenData.source,
    };
    
    // 4. Generate AI analysis if OpenAI is available
    if (isOpenAIAvailable()) {
      const aiAnalysis = await generateAIInsights(analysisData, options);
      return {
        data: analysisData,
        analysis: aiAnalysis,
        success: true,
      };
    } else {
      // Fallback to simple analysis without AI
      return {
        data: analysisData,
        analysis: generateFallbackAnalysis(analysisData),
        success: true,
        aiUnavailable: true,
      };
    }
  } catch (error) {
    console.error("Error generating token analysis:", error);
    return {
      success: false,
      error: error.message,
      errorDetails: error.stack,
    };
  }
};

/**
 * Generate AI-powered insights using OpenAI API
 * @param {Object} data - Token data and technical analysis
 * @param {Object} options - Additional options like analysis type
 * @returns {Promise<Object>} - AI-generated analysis
 */
const generateAIInsights = async (data, options = {}) => {
  // Set default analysis type if not specified
  const analysisType = options.analysisType || 'comprehensive';
  
  // Create a system prompt based on the analysis type
  const systemPrompt = getSystemPrompt(analysisType);
  
  // Create a user prompt with the token data
  const userPrompt = `
Please analyze the following cryptocurrency data:

TOKEN INFORMATION:
${formatTokenDataForPrompt(data.token)}

${data.dex ? `DEX DATA:
${formatDexDataForPrompt(data.dex)}` : 'No DEX data available.'}

${data.technicalIndicators ? `TECHNICAL INDICATORS:
${formatTechnicalIndicatorsForPrompt(data.technicalIndicators)}` : 'No technical indicators available.'}

Data source: ${data.dataSource}

${options.additionalContext ? `Additional context: ${options.additionalContext}` : ''}

${getAnalysisInstructions(analysisType)}
  `;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Can use "gpt-4" if available
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more deterministic outputs
        max_tokens: 1200, // Adjust as needed
        response_format: options.responseFormat === 'json' ? { type: "json_object" } : undefined
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const aiResponse = await response.json();
    
    if (options.responseFormat === 'json') {
      try {
        // If JSON response is requested, parse and return
        const jsonResponse = JSON.parse(aiResponse.choices[0].message.content);
        return jsonResponse;
      } catch (e) {
        console.warn("Error parsing JSON response:", e);
        return {
          analysisText: aiResponse.choices[0].message.content,
          format: "text",
          parseError: e.message
        };
      }
    }
    
    // Return the text response
    return {
      analysisText: aiResponse.choices[0].message.content,
      format: "text"
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return {
      error: true,
      message: `Failed to generate AI insights: ${error.message}`,
      fallbackAnalysis: generateFallbackAnalysis(data)
    };
  }
};

/**
 * Generate a system prompt based on the analysis type
 * @param {string} analysisType - Type of analysis to perform
 * @returns {string} - System prompt for the AI
 */
const getSystemPrompt = (analysisType) => {
  const basePrompt = `You are Nova, an advanced cryptocurrency analyst AI with expertise in technical analysis, fundamentals, and market behavior. Your analysis is data-driven, precise, and insightful, focusing on objective metrics rather than hype.`;
  
  const analysisTypePrompts = {
    comprehensive: `${basePrompt}
You provide detailed, holistic analysis covering fundamental metrics, technical indicators, and market dynamics. Your assessments are balanced, nuanced, and consider multiple timeframes. You clearly separate facts from opinion and emphasize risk management. You note limitations in the data when relevant.`,
    
    technical: `${basePrompt}
You focus exclusively on technical analysis, interpreting chart patterns, indicators, and trading signals. You analyze price action, volume trends, support/resistance levels, and mathematical indicators. You avoid fundamental factors and focus on price movements and probabilities.`,
    
    fundamental: `${basePrompt}
You focus on fundamental analysis of cryptocurrencies, examining tokenomics, utility, adoption metrics, and project fundamentals. You assess factors like supply distribution, developer activity, real-world usage, and value accrual mechanisms.`,
    
    risk: `${basePrompt}
You focus on risk assessment, critically analyzing weaknesses, threats, and vulnerabilities. You evaluate liquidity risks, smart contract security, centralization concerns, regulatory threats, and market dynamics. Your assessment is cautious and prioritizes capital preservation.`,
    
    opportunity: `${basePrompt}
You focus on identifying potential opportunities and growth catalysts, while still maintaining analytical rigor. You evaluate positive signals, undervalued metrics, competitive advantages, and market inefficiencies.`
  };
  
  // Return the specific prompt or the comprehensive one if type not found
  return analysisTypePrompts[analysisType] || analysisTypePrompts.comprehensive;
};

/**
 * Get specific instructions based on the analysis type
 * @param {string} analysisType - Type of analysis to perform
 * @returns {string} - Specific instructions for the AI
 */
const getAnalysisInstructions = (analysisType) => {
  const instructions = {
    comprehensive: `Provide a comprehensive analysis with these sections:
1. Executive Summary (key findings in 2-3 sentences)
2. Price Analysis (recent movements, context, key levels)
3. Market Structure (liquidity, volume, buy/sell pressure)
4. Technical Outlook (indicator analysis, trend direction, signals)
5. Fundamental Assessment (tokenomics, utility, adoption metrics)
6. Risk Factors (specific risks and concerns)
7. Noteworthy Metrics (any standout data points)
8. Conclusion (objective synthesis of the data)

Do not make price predictions or give financial advice. Separate facts from interpretations and note data limitations.`,
    
    technical: `Provide a technical analysis with these sections:
1. Key Technical Findings (2-3 sentence summary)
2. Price Action Analysis (trends, patterns, key levels)
3. Indicator Analysis (detailed interpretation of technical indicators)
4. Support & Resistance Levels (key price levels and their significance)
5. Volume Analysis (volume trends and what they suggest)
6. Technical Signals (bullish/bearish setups, divergences, or other patterns)
7. Technical Outlook (potential scenarios based on current indicators)

Focus exclusively on price action and technical indicators. Do not include fundamental factors or make specific price predictions.`,
    
    fundamental: `Provide a fundamental analysis with these sections:
1. Key Fundamental Findings (2-3 sentence summary)
2. Tokenomics Assessment (supply metrics, distribution, emission schedule)
3. Utility & Value Accrual (token use cases and how value is captured)
4. Adoption Metrics (user growth, transaction volume, ecosystem development)
5. Developer Activity (codebase activity, updates, innovation)
6. Community & Market Position (community strength, competitive position)
7. Fundamental Outlook (analysis of project's fundamental health)

Focus on project fundamentals and adoption metrics rather than price movements or technical factors.`,
    
    risk: `Provide a risk assessment with these sections:
1. Risk Summary (key risk factors in 2-3 sentences)
2. Liquidity & Market Risks (depth, concentration, slippage concerns)
3. Technical Vulnerabilities (concerning technical signals or patterns)
4. Fundamental Weaknesses (problematic tokenomics, adoption issues)
5. Security Considerations (contract risks, centralization concerns)
6. Competitive & External Threats (market position, competitive disadvantages)
7. Risk Mitigation Considerations (factors that could reduce identified risks)

Focus on identifying and analyzing possible risks. Be thorough and cautious in your assessment.`,
    
    opportunity: `Provide an opportunity analysis with these sections:
1. Opportunity Summary (key potential in 2-3 sentences)
2. Technical Opportunities (positive indicators, potential setups)
3. Fundamental Strengths (strong metrics, competitive advantages)
4. Market Positioning (relative value, market inefficiencies)
5. Growth Catalysts (upcoming events, developing trends)
6. Comparative Advantages (standout metrics compared to peers)
7. Balanced Perspective (important counterbalancing factors to consider)

While focusing on potential opportunities, maintain analytical rigor and include a balanced perspective.`
  };
  
  return instructions[analysisType] || instructions.comprehensive;
};

/**
 * Format token data for inclusion in the prompt
 * @param {Object} token - Token data
 * @returns {string} - Formatted token data
 */
const formatTokenDataForPrompt = (token) => {
  if (!token) return "No token data available.";
  
  return `
Name: ${token.name} (${token.symbol})
Current Price: $${token.currentPrice || 'N/A'}
Market Cap: $${formatLargeNumber(token.marketCap) || 'N/A'} (Rank: ${token.marketCapRank || 'N/A'})
24h Volume: $${formatLargeNumber(token.totalVolume) || 'N/A'}
24h Change: ${token.priceChangePercentage24h ? token.priceChangePercentage24h.toFixed(2) + '%' : 'N/A'}
7d Change: ${token.priceChangePercentage7d ? token.priceChangePercentage7d.toFixed(2) + '%' : 'N/A'}
30d Change: ${token.priceChangePercentage30d ? token.priceChangePercentage30d.toFixed(2) + '%' : 'N/A'}
Circulating Supply: ${formatLargeNumber(token.circulatingSupply) || 'N/A'}
Total Supply: ${formatLargeNumber(token.totalSupply) || 'N/A'}
Max Supply: ${formatLargeNumber(token.maxSupply) || 'N/A'}
All-Time High: $${token.ath || 'N/A'} (${token.athChangePercentage ? token.athChangePercentage.toFixed(2) + '%' : 'N/A'} from ATH)
All-Time Low: $${token.atl || 'N/A'} (${token.atlChangePercentage ? token.atlChangePercentage.toFixed(2) + '%' : 'N/A'} from ATL)
Developer Activity: ${token.developerData?.commitCount4Weeks ? token.developerData.commitCount4Weeks + ' commits in last 4 weeks' : 'No data'}
Community: ${token.communityData?.twitterFollowers ? token.communityData.twitterFollowers + ' Twitter followers' : 'No data'}
  `;
};

/**
 * Format DEX data for inclusion in the prompt
 * @param {Object} dex - DEX data
 * @returns {string} - Formatted DEX data
 */
const formatDexDataForPrompt = (dex) => {
  if (!dex || !dex.pairs || dex.pairs.length === 0) return "No DEX data available.";
  
  const topPair = dex.mostLiquidPair;
  const highVolumePair = dex.highestVolumePair;
  
  return `
Total Pairs Found: ${dex.pairsCount}
Most Liquid Pair: ${topPair.baseToken.symbol}/${topPair.quoteToken.symbol} on ${topPair.dexId} (${topPair.chainId})
Pair Price: $${topPair.priceUsd || 'N/A'}
Liquidity: $${formatLargeNumber(topPair.liquidity?.usd) || 'N/A'}
24h Volume: $${formatLargeNumber(topPair.volume?.h24) || 'N/A'}
24h Price Change: ${topPair.priceChange?.h24 ? topPair.priceChange.h24.toFixed(2) + '%' : 'N/A'}
24h Transactions: ${topPair.txns?.h24 ? `${topPair.txns.h24.buys || 0} buys, ${topPair.txns.h24.sells || 0} sells` : 'N/A'}
Buy/Sell Ratio: ${topPair.txns?.h24 ? (topPair.txns.h24.buys / (topPair.txns.h24.sells || 1)).toFixed(2) : 'N/A'}
FDV: $${formatLargeNumber(topPair.fdv) || 'N/A'}
Market Cap: $${formatLargeNumber(topPair.marketCap) || 'N/A'}
  `;
};

/**
 * Format technical indicators for inclusion in the prompt
 * @param {Object} indicators - Technical indicators
 * @returns {string} - Formatted technical indicators
 */
const formatTechnicalIndicatorsForPrompt = (indicators) => {
  if (!indicators) return "No technical indicator data available.";
  
  return `
Current Trend: ${indicators.trend}
Moving Averages:
- SMA20: ${indicators.sma.sma20} (Price ${indicators.sma.sma20vsPrice} from SMA20)
- SMA50: ${indicators.sma.sma50} (Price ${indicators.sma.sma50vsPrice} from SMA50)
- SMA200: ${indicators.sma.sma200} (Price ${indicators.sma.sma200vsPrice} from SMA200)

RSI (14): ${indicators.rsi.value} (${indicators.rsi.signal})

MACD:
- MACD Line: ${indicators.macd.line}
- Signal Line: ${indicators.macd.signal}
- Histogram: ${indicators.macd.histogram} (${indicators.macd.trend})

Bollinger Bands:
- Upper: ${indicators.bollingerBands.upper}
- Middle: ${indicators.bollingerBands.middle}
- Lower: ${indicators.bollingerBands.lower}
- Width: ${indicators.bollingerBands.width} (${indicators.bollingerBands.signal})

Volatility:
- Daily: ${indicators.volatility.daily}
- Annualized: ${indicators.volatility.annualized}

Support Levels: ${indicators.supportResistance.support.map(level => `${level.price} (${level.strength})`).join(', ') || 'None identified'}
Resistance Levels: ${indicators.supportResistance.resistance.map(level => `${level.price} (${level.strength})`).join(', ') || 'None identified'}
  `;
};

/**
 * Generate a fallback analysis without using AI
 * @param {Object} data - Token data and technical analysis
 * @returns {Object} - Fallback analysis
 */
const generateFallbackAnalysis = (data) => {
  let analysis = {
    summary: "Analysis based on available market data without AI enhancement.",
    format: "text",
    sections: []
  };
  
  // Add price analysis if available
  if (data.token && data.token.currentPrice) {
    const priceChange = data.token.priceChangePercentage24h || 0;
    const priceDirection = priceChange > 0 ? "increased" : "decreased";
    const priceSection = {
      title: "Price Analysis",
      content: `${data.token.name} (${data.token.symbol}) is currently trading at $${data.token.currentPrice} and has ${priceDirection} by ${Math.abs(priceChange).toFixed(2)}% in the last 24 hours.`
    };
    analysis.sections.push(priceSection);
  }
  
  // Add market cap analysis if available
  if (data.token && data.token.marketCap) {
    const marketCapSection = {
      title: "Market Information",
      content: `The token has a market capitalization of $${formatLargeNumber(data.token.marketCap)}${data.token.marketCapRank ? ` with a market cap rank of #${data.token.marketCapRank}` : ''}.`
    };
    analysis.sections.push(marketCapSection);
  }
  
  // Add technical indicator insights if available
  if (data.technicalIndicators) {
    const ti = data.technicalIndicators;
    const technicalSection = {
      title: "Technical Indicators",
      content: `The current trend appears to be ${ti.trend}. RSI is at ${ti.rsi.value} indicating ${ti.rsi.signal} conditions. The token is currently trading ${parseFloat(ti.sma.sma50vsPrice) > 0 ? 'above' : 'below'} its 50-day moving average by ${ti.sma.sma50vsPrice.replace('-', '')}.`
    };
    analysis.sections.push(technicalSection);
  }
  
  // Add DEX insights if available
  if (data.dex && data.dex.pairs && data.dex.pairs.length > 0) {
    const topPair = data.dex.mostLiquidPair;
    const dexSection = {
      title: "DEX Information",
      content: `The token has ${data.dex.pairsCount} trading pairs across various DEXes. The most liquid pair is ${topPair.baseToken.symbol}/${topPair.quoteToken.symbol} on ${topPair.dexId}, with $${formatLargeNumber(topPair.liquidity?.usd)} in liquidity and $${formatLargeNumber(topPair.volume?.h24)} in 24h trading volume.`
    };
    analysis.sections.push(dexSection);
  }
  
  // Add a conclusion
  analysis.sections.push({
    title: "Conclusion",
    content: "This analysis is based on available market data. For more detailed insights, enable the OpenAI integration."
  });
  
  // Create a text version
  analysis.analysisText = analysis.sections.map(section => {
    return `## ${section.title}\n${section.content}\n`;
  }).join('\n');
  
  return analysis;
};

/**
 * Format large numbers for better readability
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
const formatLargeNumber = (num) => {
  if (num === null || num === undefined) return 'N/A';
  
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  } else {
    return num.toFixed(2);
  }
};

/**
 * Get token market sentiment based on available data
 * @param {Object} data - Token data
 * @returns {string} - Market sentiment description
 */
export const getMarketSentiment = (data) => {
  if (!data || !data.token) return "Insufficient data for sentiment analysis";
  
  let bullishFactors = 0;
  let bearishFactors = 0;
  
  // Price momentum
  if (data.token.priceChangePercentage24h > 5) bullishFactors += 2;
  else if (data.token.priceChangePercentage24h > 2) bullishFactors += 1;
  else if (data.token.priceChangePercentage24h < -5) bearishFactors += 2;
  else if (data.token.priceChangePercentage24h < -2) bearishFactors += 1;
  
  // Moving averages
  if (data.technicalIndicators) {
    const ti = data.technicalIndicators;
    
    // Price vs SMA relationship
    if (parseFloat(ti.sma.sma50vsPrice) > 5) bullishFactors += 1;
    else if (parseFloat(ti.sma.sma50vsPrice) < -5) bearishFactors += 1;
    
    if (parseFloat(ti.sma.sma200vsPrice) > 10) bullishFactors += 2;
    else if (parseFloat(ti.sma.sma200vsPrice) < -10) bearishFactors += 2;
    
    // RSI
    if (parseFloat(ti.rsi.value) > 70) bearishFactors += 1; // Overbought
    else if (parseFloat(ti.rsi.value) < 30) bullishFactors += 1; // Oversold
    
    // MACD
    if (ti.macd.trend === 'bullish') bullishFactors += 1;
    else if (ti.macd.trend === 'bearish') bearishFactors += 1;
  }
  
  // DEX data
  if (data.dex && data.dex.mostLiquidPair) {
    const pair = data.dex.mostLiquidPair;
    
    // Buy/sell ratio
    if (pair.txns?.h24?.buys > pair.txns?.h24?.sells * 1.5) bullishFactors += 1;
    else if (pair.txns?.h24?.sells > pair.txns?.h24?.buys * 1.5) bearishFactors += 1;
    
    // Price change
    if (pair.priceChange?.h24 > 5) bullishFactors += 1;
    else if (pair.priceChange?.h24 < -5) bearishFactors += 1;
  }
  
  // Determine sentiment
  const sentimentScore = bullishFactors - bearishFactors;
  
  if (sentimentScore >= 4) return "Strongly Bullish";
  else if (sentimentScore >= 2) return "Bullish";
  else if (sentimentScore >= 0) return "Mildly Bullish";
  else if (sentimentScore >= -2) return "Mildly Bearish";
  else if (sentimentScore >= -4) return "Bearish";
  else return "Strongly Bearish";
};

/**
 * Get a quick summary of a token for chat responses
 * @param {string} tokenQuery - Token to analyze
 * @returns {Promise<string>} - Quick summary
 */
export const getQuickTokenSummary = async (tokenQuery) => {
  try {
    const analysisResult = await generateTokenAnalysis(tokenQuery, { analysisType: 'comprehensive' });
    
    if (!analysisResult.success) {
      return `I couldn't find reliable data for ${tokenQuery}. ${analysisResult.error}`;
    }
    
    const data = analysisResult.data;
    
    if (!data.token && !data.dex) {
      return `I couldn't find sufficient data for ${tokenQuery}. The token may be very new or not listed on major platforms.`;
    }
    
    let summary = '';
    
    // Add token name and current price
    if (data.token) {
      summary += `${data.token.name} (${data.token.symbol}) is currently trading at $${data.token.currentPrice || 'N/A'}. `;
      
      // Add price change
      if (data.token.priceChangePercentage24h) {
        const changeDirection = data.token.priceChangePercentage24h >= 0 ? 'up' : 'down';
        summary += `It's ${changeDirection} ${Math.abs(data.token.priceChangePercentage24h).toFixed(2)}% in the last 24 hours. `;
      }
      
      // Add market cap
      if (data.token.marketCap) {
        summary += `Market cap is $${formatLargeNumber(data.token.marketCap)}${data.token.marketCapRank ? ` (rank #${data.token.marketCapRank})` : ''}. `;
      }
    }
    
    // Add DEX info if available
    if (data.dex && data.dex.mostLiquidPair) {
      const pair = data.dex.mostLiquidPair;
      summary += `Most liquid trading pair is on ${pair.dexId} with $${formatLargeNumber(pair.liquidity?.usd || 0)} liquidity. `;
    }
    
    // Add technical sentiment if available
    if (data.technicalIndicators) {
      summary += `Technical analysis indicates a ${data.technicalIndicators.trend} trend. `;
      
      // Add RSI
      if (data.technicalIndicators.rsi) {
        summary += `RSI is at ${data.technicalIndicators.rsi.value} (${data.technicalIndicators.rsi.signal}). `;
      }
    }
    
    // Add market sentiment
    summary += `Overall market sentiment appears ${getMarketSentiment(data).toLowerCase()}.`;
    
    return summary;
  } catch (error) {
    console.error("Error generating quick summary:", error);
    return `I encountered an error while analyzing ${tokenQuery}: ${error.message}`;
  }
};