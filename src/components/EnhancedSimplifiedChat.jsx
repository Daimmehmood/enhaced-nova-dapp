// src/components/EnhancedSimplifiedChat.jsx
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

// Import API services
import { processNovaEnhancedMessage } from '../services/novaAIService';
import { getComprehensiveTokenAnalysis, getTechnicalIndicators } from '../services/cryptoApiService';
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

// Enhanced Simplified Chat with real API capability
const EnhancedSimplifiedChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCharacter } = useCharacter();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cryptoSuggestions, setCryptoSuggestions] = useState(['BTC', 'ETH', 'SOL', 'MATIC', 'AVAX']);
  const [apiStatus, setApiStatus] = useState({
    openai: false,
    coingecko: false
  });
  const [useRealAPI, setUseRealAPI] = useState(true);
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
      
      // Set real API usage based on availability
      setUseRealAPI(openaiAvailable || coingeckoAvailable);
    };
    
    checkApis();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);
  
  // Add event listener to detect when user scrolls manually
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
  
  // Send message handler - with real API support
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Reset error state
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
    
    // Try to get real API response if available
    if (useRealAPI && (apiStatus.openai || apiStatus.coingecko)) {
      try {
        // Use novaAIService if available (which internally uses OpenAI)
        if (apiStatus.openai) {
          // Format chat history for the AI
          const chatHistory = messages.map(msg => ({
            content: msg.content,
            isUser: msg.isUser
          }));
          
          // Process with enhanced Nova AI
          const aiResponse = await processNovaEnhancedMessage(input.trim(), chatHistory);
          
          // Add AI response
          const novaResponse = {
            id: Date.now() + 1,
            content: aiResponse.content,
            sender: character?.name || 'Nova',
            isUser: false,
            time: formatTime(),
            analysisType: aiResponse.analysisType || 'general',
            token: aiResponse.token || null
          };
          
          setMessages(prev => [...prev, novaResponse]);
          
          // Update suggestions if token was analyzed
          if (aiResponse.token && !cryptoSuggestions.includes(aiResponse.token.toUpperCase())) {
            setCryptoSuggestions(prev => [
              aiResponse.token.toUpperCase(),
              ...prev.slice(0, 4)
            ]);
          }
          
          setIsTyping(false);
          return;
        }
        
        // If OpenAI not available but CoinGecko is, try to get token data directly
        if (apiStatus.coingecko) {
          // Extract potential token to analyze
          const potentialToken = extractTokenFromMessage(input);
          
          if (potentialToken) {
            // Get real token data
            const tokenData = await getComprehensiveTokenAnalysis(potentialToken);
            
            // Format the response with real data
            const response = formatTokenAnalysisResponse(potentialToken, tokenData);
            
            // Add response
            const novaResponse = {
              id: Date.now() + 1,
              content: response,
              sender: character?.name || 'Nova',
              isUser: false,
              time: formatTime(),
              analysisType: 'comprehensive',
              token: potentialToken
            };
            
            setMessages(prev => [...prev, novaResponse]);
            
            // Update suggestions
            if (!cryptoSuggestions.includes(potentialToken.toUpperCase())) {
              setCryptoSuggestions(prev => [
                potentialToken.toUpperCase(),
                ...prev.slice(0, 4)
              ]);
            }
            
            setIsTyping(false);
            return;
          }
        }
        
        // If we reached here, fall back to mocked response
        throw new Error("Falling back to mocked response");
        
      } catch (error) {
        console.error('API request failed:', error);
        
        // Only set error if it's not a deliberate fallback
        if (error.message !== "Falling back to mocked response") {
          setError({
            title: "API Request Failed",
            message: `Error: ${error.message}. Falling back to simulated responses.`
          });
        }
        
        // Fall back to mocked responses
        fallbackToMockedResponse(input);
      }
    } else {
      // Use mocked responses if APIs not available
      fallbackToMockedResponse(input);
    }
  };
  
  // Fallback to mocked responses
  const fallbackToMockedResponse = (userInput) => {
    // Extract potential token to analyze
    const potentialToken = extractTokenFromMessage(userInput);
    
    // Simulate API delay
    setTimeout(() => {
      // Add Nova's response
      const novaResponse = {
        id: Date.now() + 1,
        content: potentialToken ? getMockedTokenAnalysis(potentialToken) : getGeneralResponse(userInput),
        sender: character?.name || 'Nova',
        isUser: false,
        time: formatTime()
      };
      
      setMessages(prev => [...prev, novaResponse]);
      setIsTyping(false);
      
      // Update suggestions if token was analyzed
      if (potentialToken && !cryptoSuggestions.includes(potentialToken.toUpperCase())) {
        setCryptoSuggestions(prev => [
          potentialToken.toUpperCase(),
          ...prev.slice(0, 4)
        ]);
      }
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5s
  };
  
  // Format token analysis with real data
  const formatTokenAnalysisResponse = (token, data) => {
    if (!data || (!data.coinGeckoData && !data.dexScreenerData)) {
      return getMockedTokenAnalysis(token);
    }
    
    const coinData = data.coinGeckoData;
    const dexData = data.dexScreenerData;
    
    // Create a detailed response using real data
    let response = `## ${token.toUpperCase()} Analysis\n\n`;
    
    // Executive Summary
    response += `**Executive Summary**: `;
    if (coinData) {
      response += `${coinData.name} (${coinData.symbol?.toUpperCase() || token.toUpperCase()}) is currently trading at $${coinData.currentPrice || 'N/A'}. `;
      response += coinData.priceChangePercentage24h 
        ? `It's ${coinData.priceChangePercentage24h >= 0 ? 'up' : 'down'} ${Math.abs(coinData.priceChangePercentage24h).toFixed(2)}% in the last 24 hours. `
        : '';
      response += coinData.marketCap 
        ? `Market cap is $${formatLargeNumber(coinData.marketCap)}${coinData.marketCapRank ? ` (rank #${coinData.marketCapRank})` : ''}. `
        : '';
    }
    
    if (dexData && dexData.mostLiquidPair) {
      const pair = dexData.mostLiquidPair;
      response += `Most liquid trading pair is on ${pair.dexId} with $${formatLargeNumber(pair.liquidity?.usd || 0)} liquidity. `;
    }
    
    response += '\n\n';
    
    // Market Structure
    response += `### Market Structure\n`;
    if (coinData) {
      response += coinData.marketCap ? `- **Market Cap**: $${formatLargeNumber(coinData.marketCap)}\n` : '';
      response += coinData.totalVolume ? `- **24h Volume**: $${formatLargeNumber(coinData.totalVolume)}\n` : '';
      response += coinData.marketCapRank ? `- **Market Rank**: #${coinData.marketCapRank}\n` : '';
    }
    
    if (dexData && dexData.mostLiquidPair) {
      const pair = dexData.mostLiquidPair;
      response += pair.liquidity?.usd ? `- **Liquidity**: $${formatLargeNumber(pair.liquidity.usd)}\n` : '';
      response += pair.volume?.h24 ? `- **DEX 24h Volume**: $${formatLargeNumber(pair.volume.h24)}\n` : '';
      
      // Buy/sell ratio if available
      if (pair.txns?.h24?.buys && pair.txns?.h24?.sells) {
        const buyRatio = pair.txns.h24.buys / (pair.txns.h24.buys + pair.txns.h24.sells);
        response += `- **Buy/Sell Ratio**: ${(buyRatio * 100).toFixed(1)}% buys / ${((1-buyRatio) * 100).toFixed(1)}% sells\n`;
      }
    }
    
    response += '\n';
    
    // Technical indicators if available
    if (data.marketChart && data.marketChart.prices) {
      const technicalIndicators = getTechnicalIndicators(data.marketChart.prices);
      
      if (technicalIndicators) {
        response += `### Technical Outlook\n`;
        response += `- **Current Trend**: ${technicalIndicators.trend}\n`;
        response += `- **RSI(14)**: ${technicalIndicators.rsi.value} - ${technicalIndicators.rsi.signal}\n`;
        
        if (technicalIndicators.supportResistance?.support?.length > 0) {
          response += `- **Key Support**: $${technicalIndicators.supportResistance.support[0].price}\n`;
        }
        
        if (technicalIndicators.supportResistance?.resistance?.length > 0) {
          response += `- **Key Resistance**: $${technicalIndicators.supportResistance.resistance[0].price}\n`;
        }
        
        if (technicalIndicators.macd) {
          response += `- **MACD**: ${technicalIndicators.macd.trend} trend\n`;
        }
        
        response += '\n';
      }
    }
    
    // Fundamental Assessment
    if (coinData) {
      response += `### Fundamental Assessment\n`;
      
      if (coinData.circulatingSupply) {
        response += `- **Circulating Supply**: ${formatLargeNumber(coinData.circulatingSupply)}\n`;
      }
      
      if (coinData.totalSupply) {
        response += `- **Total Supply**: ${formatLargeNumber(coinData.totalSupply)}\n`;
      }
      
      if (coinData.maxSupply) {
        response += `- **Max Supply**: ${formatLargeNumber(coinData.maxSupply)}\n`;
      }
      
      // All-time high/low
      if (coinData.ath) {
        response += `- **All-Time High**: $${coinData.ath} (${coinData.athChangePercentage ? coinData.athChangePercentage.toFixed(2) + '%' : 'N/A'} from ATH)\n`;
      }
      
      // Developer activity if available
      if (coinData.developerData?.commitCount4Weeks) {
        response += `- **Developer Activity**: ${coinData.developerData.commitCount4Weeks} commits in last 4 weeks\n`;
      }
      
      response += '\n';
    }
    
    // Conclusion
    response += `This analysis represents educational information based on available data, not financial advice.`;
    
    return response;
  };
  
  // Format large numbers for better readability
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
  
  // Extract token from user message
  const extractTokenFromMessage = (message) => {
    // Common cryptocurrency names and tickers
    const commonCryptos = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada',
      'ripple', 'xrp', 'polkadot', 'dot', 'doge', 'dogecoin', 'shib', 'shiba',
      'bnb', 'binance', 'usdt', 'tether', 'usdc', 'usd coin', 'matic', 'polygon',
      'avax', 'avalanche', 'link', 'chainlink', 'uni', 'uniswap', 'cake', 'pancakeswap'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit "analyze X" patterns
    const analyzeMatch = lowerMessage.match(/analyze\s+([a-z0-9]+)/i);
    if (analyzeMatch && analyzeMatch[1]) {
      return analyzeMatch[1];
    }
    
    // Check for common cryptos in the message
    for (const crypto of commonCryptos) {
      if (lowerMessage.includes(crypto)) {
        return crypto;
      }
    }
    
    // No token found
    return null;
  };
  
  // Handle quick analysis of tokens
  const handleQuickAnalysis = (token, analysisType = 'comprehensive') => {
    if (!token) return;
    
    // Generate appropriate prompt based on analysis type
    let prompt = '';
    switch (analysisType) {
      case 'technical':
        prompt = `Analyze ${token} using technical analysis`;
        break;
      case 'fundamental':
        prompt = `Provide fundamental analysis of ${token}`;
        break;
      case 'risk':
        prompt = `Assess the risk factors for ${token}`;
        break;
      case 'comparison':
        // For comparison, pick another top token that's different
        const compareToken = cryptoSuggestions.find(t => t !== token) || 'ETH';
        prompt = `Compare ${token} and ${compareToken}`;
        break;
      default:
        prompt = `Analyze ${token}`;
    }
    
    // Set input and send message
    setInput(prompt);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };
  
  // Mocked token analysis responses
  const getMockedTokenAnalysis = (token) => {
    // Mock data for common cryptocurrencies
    const cryptoResponses = {
      'bitcoin': `## Bitcoin (BTC) Analysis

**Executive Summary**: Bitcoin has maintained its position as the leading cryptocurrency with strong institutional adoption trends. Current technical indicators suggest a neutral to slightly bullish outlook with key support established at $61,200.

### Market Structure
- **Market Cap**: $1.23 trillion
- **24h Volume**: $42.3 billion
- **Dominance**: 48.7% of total crypto market cap
- **Liquidity**: Excellent depth across all major exchanges

### Technical Outlook
- RSI(14): 58.2 - neutral with room for upside
- MACD: Bullish crossover forming on daily chart
- Key Support: $61,200, $57,800, $52,400
- Key Resistance: $69,000 (All-Time High), $72,500, $75,000

### Fundamental Assessment
Bitcoin's fundamentals remain strong with growing institutional adoption and continuing integration with traditional financial systems. On-chain metrics show accumulation patterns among long-term holders.

This analysis represents educational information based on available data, not financial advice.`,
      'ethereum': `## Ethereum (ETH) Analysis

**Executive Summary**: Ethereum continues to dominate the smart contract platform space with its extensive developer ecosystem and dApp infrastructure. The network has successfully transitioned to Proof of Stake, significantly altering its economic model.

### Market Structure
- **Market Cap**: $427.8 billion
- **24h Volume**: $18.2 billion
- **TVL in DeFi**: $142.6 billion
- **Liquidity**: Excellent depth across all major exchanges

### Technical Outlook
- RSI(14): 62.5 - approaching overbought but still bullish
- MACD: Positive with histogram expanding
- Key Support: $3,480, $3,250, $2,950
- Key Resistance: $3,800, $4,000, $4,380 (All-Time High)

### Fundamental Assessment
Ethereum's transition to Proof of Stake has reduced energy consumption by ~99.95% and introduced a deflationary mechanism during periods of high network activity. Layer-2 scaling solutions continue to gain traction, addressing throughput limitations.

This analysis represents educational information based on available data, not financial advice.`,
      'solana': `## Solana (SOL) Analysis

**Executive Summary**: Solana has established itself as a high-performance blockchain with emphasis on speed and low transaction costs. Despite past reliability issues, it has maintained a robust ecosystem particularly in NFTs and DeFi.

### Market Structure
- **Market Cap**: $72.4 billion
- **24h Volume**: $3.8 billion
- **TVL**: $8.2 billion
- **Liquidity**: Good depth on major exchanges

### Technical Outlook
- RSI(14): 48.3 - neutral
- MACD: Slightly bearish with potential for reversal
- Key Support: $118, $105, $92
- Key Resistance: $142, $158, $172

### Fundamental Assessment
Solana's technical architecture prioritizes performance through innovations like Turbine block propagation and Gulf Stream mempool management. Challenges remain with validator decentralization and occasional network congestion.

This analysis represents educational information based on available data, not financial advice.`
    };
    
    // Convert to lowercase for case-insensitive matching
    const tokenLower = token.toLowerCase();
    
    // Check for exact matches
    if (cryptoResponses[tokenLower]) {
      return cryptoResponses[tokenLower];
    }
    
    // Check for partial matches
    for (const key in cryptoResponses) {
      if (tokenLower.includes(key) || key.includes(tokenLower)) {
        return cryptoResponses[key];
      }
    }
    
    // Default response for unknown tokens
    return `## ${token.toUpperCase()} Analysis

**Executive Summary**: Based on available data, ${token.toUpperCase()} appears to be a ${Math.random() > 0.5 ? 'smaller cap' : 'mid-tier'} cryptocurrency. Limited market data suggests a ${Math.random() > 0.5 ? 'moderately volatile' : 'highly speculative'} asset with ${Math.random() > 0.5 ? 'developing' : 'emerging'} ecosystem adoption.

### Market Structure
- **Liquidity**: ${Math.random() > 0.7 ? 'Moderate' : Math.random() > 0.4 ? 'Limited' : 'Very thin'} across exchanges
- **24h Volume**: Fluctuating between $${(Math.random() * 10).toFixed(2)}M and $${(Math.random() * 20 + 10).toFixed(2)}M

### Risk Assessment
When analyzing smaller market cap tokens, consider:
- Higher volatility and liquidity risks
- Project development sustainability
- Technological differentiators
- Team experience and commitment

I recommend conducting thorough research on this project's fundamentals before considering any investment decisions. This includes reviewing documentation, community engagement, and development activity.

This analysis represents educational information based on limited available data, not financial advice.`;
  };
  
  // Get general response for non-token queries
  const getGeneralResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `## How I Can Help You

I'm an Enhanced Crypto Analyst equipped to provide detailed analysis of cryptocurrencies and tokens. Here's what I can do:

- **Token Analysis**: Ask me to analyze any cryptocurrency (e.g., "Analyze Bitcoin")
- **Technical Analysis**: Request technical indicators and chart patterns
- **Fundamental Assessment**: Explore tokenomics, utility, and adoption metrics
- **Risk Evaluation**: Get insights on potential risks and considerations
- **Market Comparisons**: Compare different cryptocurrencies

Simply mention a cryptocurrency name in your message, and I'll provide comprehensive analysis based on available data.`;
    }
    
    if (lowerMessage.includes('market') || lowerMessage.includes('outlook')) {
      return `## Current Market Outlook

**Executive Summary**: The cryptocurrency market is currently in a neutral phase with mixed signals across different sectors. Bitcoin dominance stands at approximately 48%, suggesting a balanced distribution of capital across the ecosystem.

### Key Metrics
- **Total Market Cap**: $2.56 trillion
- **24h Volume**: $124.8 billion
- **BTC Dominance**: 48.2%
- **ETH Dominance**: 19.8%

### Sector Performance (7-Day)
- **Layer-1**: +2.8%
- **DeFi**: -1.2%
- **Gaming/Metaverse**: +5.4%
- **Privacy**: -0.8%

### Notable Trends
The market is currently showing rotation from established Layer-1 protocols into gaming and metaverse projects. DeFi TVL has remained relatively stable despite token price volatility.

This analysis represents educational information based on available data, not financial advice.`;
    }
    
    // Default response
    return `I'm your Enhanced Crypto Analyst, specialized in providing comprehensive analysis of cryptocurrencies and tokens. To get started, simply mention a specific cryptocurrency you'd like me to analyze (e.g., "Analyze Bitcoin" or "What do you think about Ethereum?").

I can provide technical analysis, fundamental assessment, risk evaluation, and market comparisons for any cryptocurrency in my database. What would you like to explore today?`;
  };
  
  // Format message content with markdown-like formatting
  const formatMessageContent = (content) => {
    // Handle markdown headers
    content = content.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    content = content.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    
    // Handle bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle lists
    content = content.replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>');
    
    // Return formatted content
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };
  
  // Render quick action buttons
  const renderQuickActions = () => {
    // Use suggestions or default to top tokens
    const tokens = cryptoSuggestions.length > 0 ? cryptoSuggestions : ['BTC', 'ETH', 'SOL'];
    
    return (
      <QuickActionsContainer>
        {/* Quick token analysis */}
        <QuickActionButton
          color={character?.color}
          onClick={() => handleQuickAnalysis(tokens[0])}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSearch /> Analyze {tokens[0]}
        </QuickActionButton>
        
        {/* Technical analysis */}
        <QuickActionButton
          color={character?.color}
          onClick={() => handleQuickAnalysis(tokens[0], 'technical')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaChartLine /> Technical {tokens[0]}
        </QuickActionButton>
        
        {/* Risk analysis */}
        <QuickActionButton
          color={character?.color}
          onClick={() => handleQuickAnalysis(tokens[1] || 'ETH', 'risk')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaShieldAlt /> Risk {tokens[1] || 'ETH'}
        </QuickActionButton>
        
        {/* Comparison */}
        <QuickActionButton
          color={character?.color}
          onClick={() => handleQuickAnalysis(tokens[0], 'comparison')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaExchangeAlt /> Compare Tokens
        </QuickActionButton>
      </QuickActionsContainer>
    );
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
          {messages.length === 1 && (
            <WelcomeMessage
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <WelcomeTitle gradient={character?.gradient} color={character?.color}>
                Welcome to Enhanced {character?.name}
              </WelcomeTitle>
              <WelcomeDescription>
                This interface combines real API functionality when available with fallback responses
                when needed. You're currently {apiStatus.openai || apiStatus.coingecko ? 'connected to' : 'disconnected from'} APIs.
                Try asking for analysis of Bitcoin, Ethereum, or Solana.
              </WelcomeDescription>
            </WelcomeMessage>
          )}
          
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
          
          {/* Error message if API failed */}
          {error && (
            <ErrorMessage>
              <h4>{error.title}</h4>
              <p>{error.message}</p>
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
        
        {/* Scroll to bottom button when needed */}
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
              placeholder="Ask for analysis of any cryptocurrency..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              color={character?.color}
              disabled={isTyping}
            />
            
            <SendButton
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping}
              gradient={character?.gradient}
              color={character?.color}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaPaperPlane />
            </SendButton>
          </InputWrapper>
          
          {renderQuickActions()}
        </ChatInputArea>
      </ChatInterfaceWrapper>
    </ChatContainer>
  );
};

export default EnhancedSimplifiedChat;