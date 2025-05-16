// src/components/EnhancedChatInterface.jsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaPaperPlane, 
  FaMicrophone, 
  FaRobot, 
  FaUser, 
  FaArrowLeft,
  FaLock,
  FaArrowDown,
  FaChartLine,
  FaExchangeAlt,
  FaShieldAlt,
  FaSearch,
  FaUsers
} from 'react-icons/fa';
import { useCharacter } from '../context/CharacterContextFix';
import { processNovaEnhancedMessage } from '../services/novaAIService';
import useCryptoAnalysis from '../hooks/useCryptoAnalysis';
import { 
  ApiErrorMessage, 
  DataErrorMessage, 
  RateLimitErrorMessage, 
  AuthErrorMessage 
} from './ErrorStates';

// Reuse the styled components from ChatInterface.jsx
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

const MessageContent = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-wrap;
  
  /* Style for markdown formatting */
  strong, b {
    color: ${({ color }) => color || '#FFD700'};
    font-weight: 700;
  }
  
  h3, h4 {
    color: ${({ color }) => color || '#FFD700'};
    margin: 10px 0 5px 0;
  }
  
  ul, ol {
    padding-left: 20px;
    margin: 5px 0;
  }
  
  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
  }
`;

const ChatInputArea = styled.div`
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(15, 15, 25, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

const EnhancedChatInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCharacter, isUnlocked, walletConnected } = useCharacter();
  const { analyzeToken, loading: analysisPending } = useCryptoAnalysis();
  
  const [character, setCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoSuggestions, setCryptoSuggestions] = useState([
    'BTC', 'ETH', 'SOL', 'MATIC', 'AVAX'
  ]);
  
  // Scroll control variables
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Security check: Is wallet connected and character unlocked?
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Check if character exists and is unlocked
  useEffect(() => {
    const securityCheck = () => {
      // Step 1: Check wallet connection
      if (!walletConnected) {
  console.log("Access denied: Wallet not connected");
  setIsAuthorized(false);
  return;
}
      
      // Step 2: Check if character exists
     const characterData = getCharacter(id);
if (!characterData) {
  console.log("Access denied: Character not found");
  setIsAuthorized(false);
  return;
}
      
      // Step 3: Check if character is unlocked
    if (!isUnlocked(id)) {
  console.log("Access denied: Character not unlocked");
  setIsAuthorized(false);
  return;
}
      
      // All checks passed
      setCharacter(characterData);
      setIsAuthorized(true);
      
      // Add welcome message for Nova
      if (messages.length === 0) {
        const welcomeMsg = {
          id: Date.now(),
          content: `Hello! I'm Nova, your Advanced Crypto Analyst. I now have enhanced capabilities to analyze any cryptocurrency or token with detailed data from CoinGecko and DexScreener. I can provide comprehensive analysis, technical indicators, market metrics, and risk assessment. What would you like me to analyze today?`,
          sender: 'Nova',
          isUser: false,
          time: formatTime()
        };
        
        setMessages([welcomeMsg]);
      }
    };
    
    securityCheck();
  }, [id, getCharacter, isUnlocked, walletConnected, messages.length]);
  
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
  
  // Scroll to bottom when messages change, if appropriate
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      const scrollTimer = setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      }, 100);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [messages, isTyping, shouldAutoScroll]);
  
  const [apiError, setApiError] = useState(null);
  const [errorType, setErrorType] = useState(null);

  // Process message with Enhanced Nova AI
  const handleSendMessage = async () => {
    if (!input.trim() || !character || !isAuthorized || isProcessing) return;
    
    setIsProcessing(true);
    setApiError(null);
    setErrorType(null);
    
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
    
    try {
      // Process with enhanced Nova AI
      const aiResponse = await processNovaEnhancedMessage(input, chatHistory);

      // Add response message
      const novaMessage = {
        id: Date.now() + 1,
        content: aiResponse.content,
        sender: 'Nova',
        isUser: false,
        time: formatTime(),
        analysisType: aiResponse.analysisType,
        token: aiResponse.token,
        contractAddress: aiResponse.contractAddress,
        blockchain: aiResponse.blockchain,
        rawData: aiResponse.rawData
      };
      
      setMessages(prev => [...prev, novaMessage]);
      
      // If we have token data, update suggestions for quick actions
      if (aiResponse.token) {
        if (!cryptoSuggestions.includes(aiResponse.token.toUpperCase())) {
          setCryptoSuggestions(prev => [
            aiResponse.token.toUpperCase(),
            ...prev.slice(0, 4)
          ]);
        }
      }
    } catch (error) {
      console.error('Error generating Nova response:', error);

      // Determine error type
      if (error.message?.includes('rate limit')) {
        setErrorType('rateLimit');
      } else if (error.message?.includes('auth') || error.message?.includes('key')) {
        setErrorType('auth');
      } else if (error.message?.includes('not found') || error.message?.includes('parsing')) {
        setErrorType('data');
      } else {
        setErrorType('api');
      }
      
      setApiError(error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        content: `I'm sorry, I encountered an issue while analyzing your request.`,
        sender: 'Nova',
        isUser: false,
        time: formatTime(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };
  
  // Handle quick action token analysis
  const handleQuickAnalysis = (token, analysisType = 'comprehensive') => {
    if (isProcessing) return;
    
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

  // Handler for contract-specific quick actions
  const handleContractQuickAction = (address, actionType) => {
    if (isProcessing) return;
    
    // Generate appropriate prompt based on action type
    let prompt = '';
    switch (actionType) {
      case 'price':
        prompt = `Show me the price chart and technical analysis for contract ${address}`;
        break;
      case 'holders':
        prompt = `Analyze the holder distribution for contract ${address}`;
        break;
      case 'security':
        prompt = `Perform a security check on contract ${address}`;
        break;
      default:
        prompt = `Tell me more about contract ${address}`;
    }
    
    // Set input and send message
    setInput(prompt);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };
  
  // Handle suggestions for tokens
  const generateSuggestions = () => {
    // If no messages yet, return empty array
    if (messages.length <= 1) return [];
    
    // Get tokens mentioned in the conversation
    const extractTokens = (content) => {
      const tokens = [];
      const tokenRegex = /\b(BTC|ETH|SOL|MATIC|AVAX|DOT|ADA|BNB|XRP|DOGE|SHIB|LINK|LTC)\b/gi;
      let match;
      
      while ((match = tokenRegex.exec(content)) !== null) {
        if (!tokens.includes(match[0].toUpperCase())) {
          tokens.push(match[0].toUpperCase());
        }
      }
      
      return tokens;
    };
    
    const mentionedTokens = [];
    
    // Extract from last 5 messages
    const recentMessages = messages.slice(-5);
    for (const msg of recentMessages) {
      const tokens = extractTokens(msg.content);
      mentionedTokens.push(...tokens);
    }
    
    // Return unique tokens, prioritizing recently mentioned ones
    return [...new Set(mentionedTokens)].slice(0, 5);
  };
  
  // Format time helper function
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Dynamic placeholder based on message count
  const getInputPlaceholder = () => {
    if (messages.length <= 1) {
      return "Ask me to analyze any cryptocurrency (e.g., 'Analyze Bitcoin')...";
    } else if (cryptoSuggestions.length > 0) {
      return `Ask about ${cryptoSuggestions.join(', ')} or any other token...`;
    } else {
      return "Ask me for crypto analysis, price data, or token comparisons...";
    }
  };
  
  // Render quick action buttons
  const renderQuickActions = () => {
    // If we don't have any suggestions yet, show default top tokens
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
  
  // If not authorized, redirect to agent selection
  if (!isAuthorized) {
    useEffect(() => {
      navigate('/agents');
    }, [navigate]);
    return null;
  }
  
  // If security checks pass, show enhanced chat interface
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
            {character?.name} - Advanced Analyst
          </AgentName>
        </AgentInfo>
        
        <div style={{ width: '40px' }} /> {/* Spacer for balance */}
      </ChatHeader>
      
      <ChatInterfaceWrapper 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        gradient={character?.gradient}
        color={character?.color}
      >
        <MessagesContainer 
          ref={messagesContainerRef}
          color={character?.color}
        >
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
              
              {message.analysisType === 'tokenContract' ? (
                <TokenContractAnalysis 
                  contractAddress={message.contractAddress}
                  blockchain={message.blockchain}
                  content={message.content}
                  color={character?.color}
                />
              ) : (
                <MessageContent color={character?.color}>
                  {/* Handle markdown-like formatting for Nova's responses */}
                  {!message.isUser 
                    ? formatMessageWithMarkdown(message.content)
                    : message.content
                  }
                </MessageContent>
              )}

              {/* Add quick actions for contract analysis */}
              {message.analysisType === 'tokenContract' && (
                <QuickActionsContainer>
                  <QuickActionButton
                    color={character?.color}
                    onClick={() => handleContractQuickAction(message.contractAddress, 'price')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaChartLine /> Price Chart
                  </QuickActionButton>
                  
                  <QuickActionButton
                    color={character?.color}
                    onClick={() => handleContractQuickAction(message.contractAddress, 'holders')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaUsers /> Holder Analysis
                  </QuickActionButton>
                  
                  <QuickActionButton
                    color={character?.color}
                    onClick={() => handleContractQuickAction(message.contractAddress, 'security')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaShieldAlt /> Security Check
                  </QuickActionButton>
                </QuickActionsContainer>
              )}
            </MessageBubble>
          ))}

          {/* Add error messages */}
          {apiError && errorType === 'api' && (
            <ApiErrorMessage 
              error={apiError} 
              onRetry={() => {
                if (input.trim()) handleSendMessage();
              }} 
            />
          )}

          {apiError && errorType === 'data' && (
            <DataErrorMessage 
              error={apiError} 
              onRetry={() => {
                if (input.trim()) handleSendMessage();
              }} 
            />
          )}
          
          {apiError && errorType === 'rateLimit' && (
            <RateLimitErrorMessage 
              retryTime={30000} 
              onRetry={() => {
                if (input.trim()) handleSendMessage();
              }} 
            />
          )}
          
          {apiError && errorType === 'auth' && (
            <AuthErrorMessage 
              error={apiError} 
              onRetry={() => {
                if (input.trim()) handleSendMessage();
              }} 
            />
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
              <span>Nova is analyzing data...</span>
            </TypingIndicator>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        <ChatInputArea>
          <div style={{ width: '100%' }}>
            <InputField
              type="text"
              placeholder={getInputPlaceholder()}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              color={character?.color}
              disabled={isProcessing}
            />
            {renderQuickActions()}
          </div>
          
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
        </ChatInputArea>
      </ChatInterfaceWrapper>
    </ChatContainer>
  );
};

// Token Contract Analysis Component
const TokenContractAnalysis = ({ contractAddress, blockchain, content, color }) => {
  // Format the content to enhance the display
  const formattedContent = formatTokenAnalysisContent(content);
  
  return (
    <div className="token-analysis-container">
      <div 
        style={{ 
          borderLeft: `4px solid ${color || '#FF9933'}`,
          padding: '8px 16px',
          marginBottom: '16px',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ color: color || '#FF9933' }}>Contract Analysis</strong>
          <div 
            style={{ 
              marginLeft: '12px', 
              fontSize: '0.8rem', 
              padding: '2px 8px', 
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            {blockchain}
          </div>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          {contractAddress}
        </div>
      </div>
      
      <MessageContent color={color}>
        {/* Render the formatted token analysis */}
        {formattedContent}
      </MessageContent>
    </div>
  );
};

// Helper function to enhance the display of token analysis
const formatTokenAnalysisContent = (content) => {
  // We'll keep this simple - just return the content for now
  // In a more advanced implementation, you could parse the sections and format them nicely
  return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />;
};

// Helper function to format message with markdown-like syntax
const formatMessageWithMarkdown = (content) => {
  if (!content) return '';
  
  // Simple regex-based markdown formatting
  let formattedContent = content;
  
  // Format headers
  formattedContent = formattedContent.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  formattedContent = formattedContent.replace(/^## (.*$)/gm, '<h3>$1</h3>');
  formattedContent = formattedContent.replace(/^# (.*$)/gm, '<h3>$1</h3>');
  
  // Format bold
  formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedContent = formattedContent.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Format italics
  formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formattedContent = formattedContent.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Format lists
  formattedContent = formattedContent.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
  formattedContent = formattedContent.replace(/^\s*[-*]\s+(.*$)/gm, '<li>$1</li>');
  
  // Replace newlines with breaks for better spacing
  formattedContent = formattedContent.replace(/\n/g, '<br/>');
  
  // Clean up list formatting
  formattedContent = formattedContent.replace(/<\/li><br\/><li>/g, '</li><li>');
  
  // Return as React components using dangerouslySetInnerHTML
  // Note: In a production app, you'd want to use a proper markdown parser or sanitize this
  return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
};

export default EnhancedChatInterface;