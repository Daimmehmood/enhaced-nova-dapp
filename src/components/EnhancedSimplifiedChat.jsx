// src/components/EnhancedSimplifiedChat.jsx - Create an improved version with working OpenAI integration and dynamic buttons
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaPaperPlane, 
  FaUser, 
  FaRobot, 
  FaArrowLeft, 
  FaChartLine,
  FaExchangeAlt,
  FaShieldAlt,
  FaSearch,
  FaArrowDown
} from 'react-icons/fa';
import { useCharacter } from '../context/CharacterContextFix';
import OPENAI_CONFIG from '../config/openaiConfig';

// Import API services
import { getComprehensiveTokenAnalysis } from '../services/cryptoApiService';
import { isOpenAIAvailable } from '../services/aiAnalysisService';

// Styled components from the original implementation
const ChatContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 900px;
  margin-bottom: 2rem;
`;

const BackButton = styled(motion.button)`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primaryOrange};
  color: ${({ theme }) => theme.colors.primaryOrange};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 107, 26, 0.1);
    transform: translateX(-3px);
  }
`;

const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AgentAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid ${({ color }) => color || '#FF6B1A'};
  box-shadow: 0 0 10px ${({ color }) => `${color}50` || 'rgba(255, 107, 26, 0.3)'};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AgentName = styled.h3`
  font-size: 1.5rem;
  margin: 0;
  background: ${({ gradient, color, theme }) => 
    gradient || `linear-gradient(45deg, ${color || theme.colors.primaryOrange} 0%, white 150%)`};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ApiStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.active ? 'rgba(78, 255, 159, 0.2)' : 'rgba(255, 153, 51, 0.2)'};
  border: 1px solid ${props => props.active ? '#4EFF9F' : '#FF9933'};
  border-radius: 20px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  color: ${props => props.active ? '#4EFF9F' : '#FF9933'};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ChatInterfaceWrapper = styled(motion.div)`
  width: 100%;
  max-width: 900px;
  height: 70vh;
  background: rgba(20, 20, 30, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 1px;
    background: ${({ gradient, color }) => 
      gradient || `linear-gradient(45deg, ${color || '#FF6B1A'} 0%, transparent 50%)`};
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ color }) => color || '#FF6B1A'};
    border-radius: 3px;
  }
`;

const MessageBubble = styled(motion.div)`
  max-width: 85%;
  padding: 1rem;
  background: ${({ isUser }) =>
    isUser ? 'rgba(255, 107, 26, 0.15)' : 'rgba(30, 30, 40, 0.6)'};
  border-radius: ${({ isUser }) =>
    isUser ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0'};
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  border: 1px solid ${({ isUser, color }) =>
    isUser ? 'rgba(255, 107, 26, 0.3)' : `rgba(${color ? color.substring(1).match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ') : '153, 51, 255'}, 0.3)`};
  position: relative;
`;

const MessageSender = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  
  svg {
    color: ${({ isUser, color }) => isUser ? '#FF6B1A' : color || '#9933FF'};
  }
`;

const SenderName = styled.span`
  color: ${({ isUser, color }) => isUser ? '#FF6B1A' : color || '#9933FF'};
`;

const MessageContent = styled.div`
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-wrap;
  
  h3 {
    color: ${({ color }) => color || '#FFD700'};
    margin: 10px 0 5px 0;
  }
  
  h4 {
    color: ${({ color }) => color || '#FFD700'};
    margin: 8px 0 4px 0;
    font-size: 1.1rem;
  }
  
  strong {
    color: ${({ color }) => color || '#FFD700'};
  }
  
  ul, ol {
    padding-left: 20px;
    margin: 5px 0;
  }
  
  li {
    margin: 3px 0;
  }
`;

const ChatInputArea = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  background: rgba(15, 15, 25, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

const InputField = styled.input`
  flex: 1;
  padding: 0.8rem 1.2rem;
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ color }) => color || '#FF6B1A'};
    box-shadow: 0 0 0 1px ${({ color }) => color || '#FF6B1A'};
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SendButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: ${({ gradient, color, theme }) => 
    gradient || color || theme.gradients.orangeYellow};
  color: ${({ theme }) => theme.colors.primaryBlack};
  border: none;
  font-size: 1rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickActionButton = styled(motion.button)`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: rgba(30, 30, 40, 0.6);
  border: 1px solid ${({ color }) => color || '#FF6B1A'};
  color: ${({ color }) => color || '#FF6B1A'};
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 107, 26, 0.1);
    transform: translateY(-2px);
  }
`;

const QuickActionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ScrollToBottomButton = styled(motion.button)`
  position: absolute;
  bottom: 80px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryBlack};
  color: ${({ color }) => color || '#FF6B1A'};
  border: 1px solid ${({ color }) => color || '#FF6B1A'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 5;
`;

const WelcomeMessage = styled(motion.div)`
  text-align: center;
  margin: 2rem 0;
`;

const WelcomeTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
  background: ${({ gradient, color, theme }) => 
    gradient || `linear-gradient(45deg, ${color || theme.colors.primaryOrange} 0%, white 150%)`};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const WelcomeDescription = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const TypingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  background: rgba(30, 30, 40, 0.6);
  border-radius: 1rem;
  align-self: flex-start;
  
  span {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    font-style: italic;
  }
`;

const TypingDot = styled(motion.div)`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color || '#9933FF'};
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  margin: 0.5rem 0;
  background: rgba(255, 77, 77, 0.1);
  border-left: 4px solid #FF4D4D;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
  
  h4 {
    color: #FF4D4D;
    margin: 0 0 0.5rem 0;
  }
`;

const EnhancedSimplifiedChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCharacter } = useCharacter();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeToken, setActiveToken] = useState('BTC');
  const [apiStatus, setApiStatus] = useState({
    openai: false,
    coingecko: false
  });
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const character = getCharacter(id);
  
  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && character) {
      setMessages([{
        id: Date.now(),
        content: `Hello! I'm ${character.name}, your Enhanced Crypto Analyst. I can provide comprehensive analysis of any cryptocurrency or token. What would you like to analyze today?`,
        sender: character.name,
        isUser: false,
        time: formatTime()
      }]);
    }
  }, [character, messages.length]);
  
  // Check API availability
  useEffect(() => {
    const checkApis = async () => {
      // Check OpenAI
      const openaiAvailable = isOpenAIAvailable();
      
      // Check CoinGecko
      let coingeckoAvailable = false;
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/ping');
        coingeckoAvailable = response.ok;
      } catch (error) {
        console.log('CoinGecko API check failed:', error);
      }
      
      setApiStatus({
        openai: openaiAvailable,
        coingecko: coingeckoAvailable
      });
    };
    
    checkApis();
  }, []);
  
  // Auto-scroll to bottom when messages change
useEffect(() => {
  if (shouldAutoScroll && messagesEndRef.current) {
    // Use requestAnimationFrame to ensure DOM is ready before scrolling
    const scrollTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end'
        });
      });
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }
}, [messages, isTyping, shouldAutoScroll]);

// Add these handlers for the input field
const handleInputFocus = () => {
  // Temporarily disable auto-scrolling when input is focused
  setShouldAutoScroll(false);
};

const handleInputBlur = () => {
  const container = messagesContainerRef.current;
  if (container) {
    // Only re-enable auto-scroll if we're already near the bottom
    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }
};

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Check if user is near bottom (within 100px)
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      setShouldAutoScroll(isNearBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Format time helper
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Process user message using OpenAI
  const processWithOpenAI = async (message, chatHistory = []) => {
  // If no OpenAI API key, return default response without throwing
  if (!OPENAI_CONFIG.apiKey) {
    console.log('OpenAI API key not available, using fallback');
    return getDefaultResponse(message);
  }
  
  try {
    // Format the conversation history for the API
    const messages = [
      { 
        role: "system", 
        content: `You are Nova, an advanced cryptocurrency analyst AI with expertise in technical analysis, fundamentals, and market behavior. Your analysis is data-driven, precise, and insightful. Current date: ${new Date().toISOString().split('T')[0]}`
      },
      ...chatHistory.slice(-5)
        .filter(msg => msg.content !== null && msg.content !== undefined)
        .map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content || "" 
        })),
      { role: "user", content: message || "" }
    ];
    
    // Use the configuration to make the API request
    const response = await OPENAI_CONFIG.createChatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 700
    });

    // Return the AI response
    return response.choices[0].message.content;
  } catch (error) {
    // Return default response instead of throwing
    console.log('OpenAI API error, using fallback response:', error);
    return getDefaultResponse(message);
  }
};
  
  // Extract token from message
  const extractTokenFromMessage = (message) => {
    const lowerMessage = message.toLowerCase();
    const commonCryptos = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
      'ripple', 'xrp', 'polkadot', 'dot', 'doge', 'dogecoin', 'shib', 'shiba',
      'bnb', 'usdt', 'tether', 'usdc', 'matic', 'polygon', 'avax', 'avalanche'
    ];
    
    // Check for common cryptos in the message
    for (const crypto of commonCryptos) {
      if (lowerMessage.includes(crypto)) {
        return crypto;
      }
    }
    
    // Check for analyze pattern
    const analyzeMatch = lowerMessage.match(/analyze\s+([a-z0-9]+)/i);
    if (analyzeMatch && analyzeMatch[1]) {
      return analyzeMatch[1];
    }
    
    return null;
  };
  
  // Send message handler
  const handleSendMessage = async () => {
  if (!input.trim() || isProcessing) return;
  
  setIsProcessing(true);
  setError(null);
  
  // Add user message
  const userMessage = {
    id: Date.now(),
    content: input.trim(),
    sender: 'You',
    isUser: true,
    time: formatTime()
  };
  
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsTyping(true);
  
  // Format chat history for AI
  const chatHistory = messages.map(msg => ({
    content: msg.content,
    isUser: msg.isUser
  }));
  
  // For simplicity, we'll fully wrap all the logic in a try-catch
  // and use a generic fallback response if anything fails
  try {
    let responseContent = '';
    
    // Extract potential token from message
    const token = extractTokenFromMessage(input);
    if (token) {
      setActiveToken(token.toUpperCase());
    }
    
    // Simplified logic to avoid any potential throw points
    if (apiStatus.openai) {
      try {
        // Process with OpenAI - wrap in its own try-catch to catch API errors
        responseContent = await processWithOpenAI(input, chatHistory);
      } catch (openaiError) {
        console.log("OpenAI processing failed:", openaiError);
        // Fallback to token or general response
        if (token) {
          responseContent = `I'd like to analyze ${token.toUpperCase()}, but I'm currently experiencing some technical difficulties with my advanced analysis capabilities. ${token.toUpperCase()} is a digital asset that should be evaluated based on market cap, volume, development activity, and use case. Would you like to discuss basic crypto analysis concepts instead?`;
        } else {
          responseContent = generateGeneralResponse(input);
        }
      }
    } else {
      // OpenAI not available, use simple generated responses
      if (token) {
        try {
          // Try to get token data - wrap this in try-catch to avoid any errors
          const tokenData = await getComprehensiveTokenAnalysis(token).catch(() => null);
          responseContent = generateTokenResponse(token, tokenData);
        } catch (tokenError) {
          console.log("Token data processing failed:", tokenError);
          responseContent = `I'd love to analyze ${token}, but I'm currently unable to fetch data for it. As a crypto analyst, I can tell you that ${token.toUpperCase()} should be evaluated based on market cap, volume, development activity, and use case. Would you like me to discuss general crypto analysis approaches instead?`;
        }
      } else {
        // General crypto response
        responseContent = generateGeneralResponse(input);
      }
    }
    
    // Safety check - if we somehow still have an empty response, use a fallback
    if (!responseContent) {
      responseContent = "I understand your interest in cryptocurrency. While I'm experiencing some technical difficulties accessing real-time data, I'd be happy to discuss general concepts in crypto analysis, blockchain technology, or investment strategies. What specifically would you like to explore?";
    }
    
    // Add AI response after a slight delay for natural feel
    setTimeout(() => {
      const novaResponse = {
        id: Date.now() + 1,
        content: responseContent,
        sender: character?.name || 'Nova',
        isUser: false,
        time: formatTime()
      };
      
      setMessages(prev => [...prev, novaResponse]);
      setIsTyping(false);
      setIsProcessing(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2s
    
  } catch (error) {
    // Ultimate fallback if anything in the outer try block fails
    console.log('Using ultimate fallback due to error:', error);
    
    // Add error message that doesn't reveal the technical details
    setTimeout(() => {
      const fallbackMessage = {
        id: Date.now() + 1,
        content: "I understand your interest in cryptocurrency. While I'm experiencing some technical difficulties with my advanced analysis capabilities, I'd be happy to discuss crypto markets, blockchain technology, or investment strategies in general terms. What would you like to know more about?",
        sender: character?.name || 'Nova',
        isUser: false,
        time: formatTime()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsTyping(false);
      setIsProcessing(false);
    }, 1000);
  }
};
  
  // Generate token response when APIs fail
  const generateTokenResponse = (token, data) => {
    if (!data) {
      return `I couldn't find detailed data for ${token.toUpperCase()}, but as a crypto analyst, I can tell you it's important to evaluate it based on market fundamentals, technical patterns, and sentiment indicators. Would you like to know what metrics to consider when analyzing cryptocurrencies?`;
    }
    
    const tokenInfo = data.coinGeckoData;
    const dexInfo = data.dexScreenerData;
    
    if (!tokenInfo && !dexInfo) {
      return `I found some limited information about ${token.toUpperCase()}, but couldn't access comprehensive data. In general, when analyzing cryptocurrencies, I look at market cap, volume, developer activity, and technical indicators. Would you like me to explain my analysis methodology in more detail?`;
    }
    
    let response = `## ${token.toUpperCase()} Analysis\n\n`;
    
    if (tokenInfo) {
      response += `**Market Overview**: ${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()}) is currently trading at $${tokenInfo.currentPrice || 'N/A'}. `;
      
      if (tokenInfo.priceChangePercentage24h) {
        response += `It's ${tokenInfo.priceChangePercentage24h >= 0 ? 'up' : 'down'} ${Math.abs(tokenInfo.priceChangePercentage24h).toFixed(2)}% in the last 24 hours. `;
      }
      
      if (tokenInfo.marketCap) {
        response += `Market cap is $${formatLargeNumber(tokenInfo.marketCap)}${tokenInfo.marketCapRank ? ` (rank #${tokenInfo.marketCapRank})` : ''}. `;
      }
      
      response += '\n\n';
    }
    
    if (dexInfo && dexInfo.mostLiquidPair) {
      const pair = dexInfo.mostLiquidPair;
      response += `**DEX Info**: Most liquid trading pair is on ${pair.dexId} with $${formatLargeNumber(pair.liquidity?.usd || 0)} liquidity. `;
      
      if (pair.volume?.h24) {
        response += `24h volume is $${formatLargeNumber(pair.volume.h24)}. `;
      }
      
      if (pair.txns?.h24) {
        const buyRatio = pair.txns.h24.buys / (pair.txns.h24.buys + pair.txns.h24.sells || 1);
        response += `Buy/sell ratio is ${(buyRatio * 100).toFixed(1)}% buys to ${((1-buyRatio) * 100).toFixed(1)}% sells in the last 24 hours.`;
      }
    }
    
    return response;
  };
  
  // Generate general response when no specific token is mentioned
  const generateGeneralResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello! I'm Nova, your advanced crypto analyst. I can help you analyze any cryptocurrency, assess market trends, or explain technical indicators. Which token would you like to explore today?`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm your crypto analysis assistant. Here's how I can help:

1. **Token Analysis** - I can analyze any cryptocurrency by name or ticker (e.g., "Analyze Bitcoin" or "Tell me about ETH")
2. **Technical Analysis** - I can evaluate price patterns and technical indicators (e.g., "Technical analysis for Solana")
3. **Risk Assessment** - I can assess investment risks for any token (e.g., "What are the risks of holding BNB?")
4. **Token Comparisons** - I can compare different cryptocurrencies (e.g., "Compare Bitcoin and Ethereum")

You can also use the quick action buttons below for instant analysis of any token. Which aspect of crypto would you like to explore?`;
    }
    
    if (lowerMessage.includes('market')) {
      return `The cryptocurrency market is characterized by high volatility, 24/7 trading, and a diverse ecosystem of assets with varying use cases. When analyzing the market, I focus on several key metrics:

1. **Bitcoin Dominance** - Currently around 45-55%, this indicates BTC's market share
2. **Total Market Capitalization** - The combined value of all cryptocurrencies
3. **Trading Volume** - Daily transaction volume across exchanges
4. **Sector Rotation** - Capital flows between different crypto categories
5. **Correlation Patterns** - How different assets move in relation to each other

The market typically moves in cycles influenced by Bitcoin halving events, regulatory news, institutional adoption, and technological breakthroughs. Would you like me to analyze a specific aspect of the market in more detail?`;
    }
    
    // Default response
    return `I'm here to provide data-driven analysis of cryptocurrencies and blockchain projects. I can help you understand market trends, evaluate specific tokens, and assess investment opportunities from a risk-adjusted perspective. 

To get the most value from our conversation, you can ask me to:
- Analyze specific cryptocurrencies (e.g., "Analyze Bitcoin")
- Explain technical concepts (e.g., "What is a liquidity pool?")
- Evaluate trends (e.g., "DeFi growth trends")
- Compare assets (e.g., "Compare ETH and SOL")

What would you like to explore today?`;
  };
  
  // Format large numbers for readability
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
  
  // Handle quick action for token analysis
  const handleQuickAnalysis = (analysisType = 'comprehensive') => {
    if (isProcessing) return;
    
    // Generate appropriate prompt based on analysis type
    let prompt = '';
    switch (analysisType) {
      case 'technical':
        prompt = `Provide a technical analysis of ${activeToken}`;
        break;
      case 'risk':
        prompt = `What are the risks of investing in ${activeToken}?`;
        break;
      case 'comparison':
        // For comparison, pick another top token that's different
        const compareToken = activeToken === 'BTC' ? 'ETH' : 'BTC';
        prompt = `Compare ${activeToken} and ${compareToken}`;
        break;
      default:
        prompt = `Analyze ${activeToken}`;
    }
    
    // Set input and send message
    setInput(prompt);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const getInputPlaceholder = () => {
  if (isProcessing) {
    return "Processing your request...";
  }
  
  if (activeToken) {
    return `Ask about ${activeToken} or any other crypto...`;
  }
  
  return "Ask me about any cryptocurrency...";
};
  
  // Format message content with markdown-like formatting
  const formatMessageContent = (content) => {
    if (!content) return '';
    
    // Simple regex-based markdown formatting
    let formattedContent = content;
    
    // Format headers
    formattedContent = formattedContent.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    formattedContent = formattedContent.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    
    // Format bold
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Format lists
    formattedContent = formattedContent.replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>');
    
    // Replace newlines with breaks for better spacing
    formattedContent = formattedContent.replace(/\n/g, '<br/>');
    
    // Clean up list formatting
    formattedContent = formattedContent.replace(/<\/li><br\/><li>/g, '</li><li>');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };
  
  return (
    <ChatContainer>
      <ChatHeader>
        <BackButton 
          onClick={() => navigate('/agents')}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaArrowLeft />
        </BackButton>
        
        <AgentInfo>
          <AgentAvatar color={character?.color}>
            <img src={character?.image} alt={character?.name} />
          </AgentAvatar>
          <AgentName gradient={character?.gradient} color={character?.color}>
            {character?.name} - Enhanced Analyst
          </AgentName>
        </AgentInfo>
        
        <ApiStatus active={apiStatus.openai || apiStatus.coingecko}>
          {apiStatus.openai || apiStatus.coingecko ? 'API Connected' : 'Using Simulated Responses'}
        </ApiStatus>
      </ChatHeader>
      
      <ChatInterfaceWrapper 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        gradient={character?.gradient}
        color={character?.color}
      >
        <MessagesContainer ref={messagesContainerRef} color={character?.color}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              isUser={message.isUser}
              color={character?.color}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MessageSender isUser={message.isUser} color={character?.color}>
                {message.isUser ? <FaUser /> : <FaRobot />}
                <SenderName isUser={message.isUser} color={character?.color}>
                  {message.sender}
                </SenderName>
              </MessageSender>
              
              <MessageContent color={character?.color}>
                {message.isUser ? message.content : formatMessageContent(message.content)}
              </MessageContent>
            </MessageBubble>
          ))}
          
          {/* Error message */}
          {error && (
            <ErrorMessage>
              <h4>API Error</h4>
              <p>{error.message || "An unknown error occurred"}</p>
            </ErrorMessage>
          )}
          
          {isTyping && (
            <TypingIndicator
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              color={character?.color}
            >
              <TypingDot 
                color={character?.color}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'loop', delay: 0 }}
              />
              <TypingDot 
                color={character?.color}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'loop', delay: 0.2 }}
              />
              <TypingDot 
                color={character?.color}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'loop', delay: 0.4 }}
              />
              <span>{character?.name} is analyzing data...</span>
            </TypingIndicator>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!shouldAutoScroll && (
            <ScrollToBottomButton
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                setShouldAutoScroll(true);
              }}
              color={character?.color}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <FaArrowDown />
            </ScrollToBottomButton>
          )}
        </AnimatePresence>
        
        <ChatInputArea>
          <InputWrapper>
            <InputField
              type="text"
              placeholder={getInputPlaceholder()}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              color={character?.color}
              disabled={isProcessing}
/>
            
            <SendButton
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping || isProcessing}
              gradient={character?.gradient}
              color={character?.color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaPaperPlane />
            </SendButton>
          </InputWrapper>
          
          {/* Quick action buttons */}
          <QuickActionsContainer>
            <QuickActionButton
              color={character?.color}
              onClick={() => handleQuickAnalysis('comprehensive')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaSearch /> Analyze {activeToken}
            </QuickActionButton>
            
            <QuickActionButton
              color={character?.color}
              onClick={() => handleQuickAnalysis('technical')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaChartLine /> Technical {activeToken}
            </QuickActionButton>
            
            <QuickActionButton
              color={character?.color}
              onClick={() => handleQuickAnalysis('risk')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaShieldAlt /> Risk {activeToken}
            </QuickActionButton>
            
            <QuickActionButton
              color={character?.color}
              onClick={() => handleQuickAnalysis('comparison')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaExchangeAlt /> Compare Tokens
            </QuickActionButton>
          </QuickActionsContainer>
        </ChatInputArea>
      </ChatInterfaceWrapper>
    </ChatContainer>
  );
};

export default EnhancedSimplifiedChat;