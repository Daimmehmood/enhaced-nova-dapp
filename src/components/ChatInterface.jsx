// src/components/ChatInterface.jsx
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
  FaArrowDown
} from 'react-icons/fa';
import { useCharacter } from '../context/CharacterContextFix';
import { processNovaMessage, detectContractAddress, analyzeContractAddress } from '../utils/aiUtils';

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
  max-width: 75%;
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

const MicButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  color: ${({ color }) => color || '#FF6B1A'};
  border: 1px solid ${({ color }) => color || '#FF6B1A'};
  font-size: 1rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
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

// Security access denied screen
const AccessDeniedContainer = styled.div`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
`;

const LockIconContainer = styled(motion.div)`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 77, 77, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 3rem;
  margin-bottom: 2rem;
  border: 2px solid ${({ theme }) => theme.colors.danger};
`;

const AccessDeniedTitle = styled.h2`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 1rem;
`;

const AccessDeniedDescription = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  margin: 0 auto 2rem;
  line-height: 1.6;
`;

const ActionButton = styled(motion.button)`
  padding: 1rem 2rem;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  color: #000;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.glowOrange};
  }
`;

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getCharacter, 
    isUnlocked, 
    earnXP, 
    walletConnected 
  } = useCharacter();
  
  const [character, setCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      
      // Add welcome message with custom intro for each character
      if (messages.length === 0) {
        let welcomeMsg;
        
        switch(characterData.id) {
          case 'nova':
            welcomeMsg = {
              id: Date.now(),
              content: `Hello! I'm Nova, your Logic-Driven Analyst. I specialize in data-driven investment advice, risk assessment, and market pattern recognition. How may I help you with crypto analysis today?`,
              sender: characterData.name,
              isUser: false,
              time: formatTime()
            };
            break;
          case 'luna':
            welcomeMsg = {
              id: Date.now(),
              content: `Greetings! I'm Luna, your Creative Explorer in the crypto space. I'm designed to help you discover unique investment opportunities and innovative strategies. What exciting possibilities shall we explore today?`,
              sender: characterData.name,
              isUser: false,
              time: formatTime()
            };
            break;
          case 'vega':
            welcomeMsg = {
              id: Date.now(),
              content: `Welcome! I'm Vega, your Technical Tactician for precise market analysis. I specialize in chart patterns, technical indicators, and statistical models. Which aspects of crypto trading would you like me to analyze?`,
              sender: characterData.name,
              isUser: false,
              time: formatTime()
            };
            break;
          case 'ember':
            welcomeMsg = {
              id: Date.now(),
              content: `Hello there! I'm Ember, your Protective Guardian in the volatile crypto market. My focus is on identifying safer investments, analyzing risks, and protecting your portfolio. How can I help secure your crypto journey?`,
              sender: characterData.name,
              isUser: false,
              time: formatTime()
            };
            break;
          case 'astra':
            welcomeMsg = {
              id: Date.now(),
              content: `Greetings, bold explorer! I'm Astra, your Visionary Opportunist. I'm here to identify high-risk, high-reward opportunities and potential moonshots others might miss. What ambitious crypto ventures shall we discover today?`,
              sender: characterData.name,
              isUser: false,
              time: formatTime()
            };
            break;
          default:
            welcomeMsg = {
              id: Date.now(),
              content: `Hello! I'm ${characterData.name}, your ${characterData.title}. How can I assist you today?`,
              sender: characterData.name,
              isUser: false,
              time: formatTime()
            };
        }
        
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
  
  // Process message with AI based on character
  const processMessageWithAI = async (userInput, characterId, messageHistory) => {
    // For now, we'll only implement Nova's AI processing
    // In the future, implement other characters
    switch(characterId) {
      case 'nova':
        return await processNovaMessage(userInput, messageHistory);
      case 'luna':
      case 'vega':
      case 'ember':
      case 'astra':
        // For now, use sample responses until we implement these characters
        return {
          content: getSampleResponse({ id: characterId }, userInput),
          filtered: false,
          error: false
        };
      default:
        return {
          content: "I'm not sure how to respond to that. Could you try asking in a different way?",
          filtered: false,
          error: true
        };
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || !character || !isAuthorized || isProcessing) return;
    
    setIsProcessing(true); // Prevent double submissions
    
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
    
    // Check for contract address
    const contractAddresses = detectContractAddress(input);
    
    let responseContent = '';
    let xpGained = 10; // Default XP gain
    
    try {
      // If contract address is detected
      if (contractAddresses) {
        // Get the first address from the first blockchain type
        const blockchain = Object.keys(contractAddresses)[0];
        const address = contractAddresses[blockchain][0];
        
        // Special handling for contract analysis
        const analysisResult = await analyzeContractAddress(address, blockchain);
        responseContent = analysisResult.content;
        xpGained = 15; // Extra XP for contract analysis
      } else {
        // Process with AI based on character
        const aiResponse = await processMessageWithAI(input, character.id, chatHistory);
        
        responseContent = aiResponse.content;
        
        // Adjust XP based on response quality
        if (aiResponse.filtered) {
          xpGained = 2; // Less XP for off-topic questions
        } else if (aiResponse.error) {
          xpGained = 5; // Medium XP for error responses
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      responseContent = "I apologize, but I'm having trouble processing your request at the moment. Could you try again with a question about crypto markets or blockchain technology?";
      xpGained = 3; // Less XP for errors
    }
    
    // Add a slight delay for natural feeling
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        content: responseContent,
        sender: character.name,
        isUser: false,
        time: formatTime()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      setIsProcessing(false);
      
      // Award XP for the interaction
      earnXP(xpGained);
    }, 1500 + Math.random() * 1500); // Random delay between 1.5-3s
  };
  
  // Sample responses for demo purposes when OpenAI is not available
  const getSampleResponse = (character, message) => {
    const defaultResponse = `I'm ${character.name || 'Nova'}, your crypto analysis companion. How can I assist you today?`;
    
    const responses = {
      nova: {
        'hello': `Hello! I'm Nova, your logical analysis companion. I specialize in data-driven insights to help you make informed decisions in the crypto market. What would you like to analyze today?`,
        'what can you do': `As a logical analysis specialist, I can help with crypto data interpretation, risk assessment, market pattern recognition, and rational decision-making frameworks. Would you like me to analyze a specific token or market trend?`,
        'help': `I'm here to provide data-driven insights based on logical analysis. I can help you understand market patterns, assess risks, and make informed investment decisions in crypto. What specific information are you looking for?`,
        'bitcoin': `Bitcoin (BTC) is the first and most established cryptocurrency, currently serving as the benchmark for the entire crypto market. From a data-driven perspective, it's characterized by high volatility but has demonstrated long-term growth despite multiple market cycles. Would you like me to analyze specific aspects of Bitcoin's market behavior?`,
        'ethereum': `Ethereum (ETH) is a decentralized blockchain platform featuring smart contract functionality. As the second-largest cryptocurrency by market capitalization, it serves as the foundation for numerous decentralized applications and DeFi protocols. Its transition to Proof of Stake has significantly altered its economic model. Would you like me to analyze specific aspects of Ethereum's ecosystem or market metrics?`,
        'solana': `Solana (SOL) is a high-performance blockchain designed for scalability, offering fast transaction speeds and low costs. Its unique Proof of History consensus mechanism allows for theoretical throughput of 65,000 transactions per second. From an analytical perspective, Solana has demonstrated strong development activity and ecosystem growth despite experiencing several network outages in its history. Would you like me to analyze specific aspects of Solana's technology or market metrics?`
      },
      luna: {
        'hello': `Hello there! Luna here, your creative investment strategist. I'm all about finding innovative opportunities in the crypto space that others might miss. What kind of unique investment paths are you curious about exploring today?`,
        'what can you do': `I specialize in spotting emerging trends and creative investment strategies in crypto! I can help you identify novel opportunities, think outside the box, and approach the market from unexpected angles. Looking for something innovative in the blockchain space?`,
        'help': `As your innovation specialist, I can help you discover emerging trends, unique investment opportunities, and creative approaches to the crypto market. What kind of innovative strategies are you interested in exploring?`
      },
      vega: {
        'hello': `Greetings! Vega at your service. I'm your technical analysis expert, specializing in pattern recognition and predictive modeling for crypto markets. Which chart patterns or technical indicators would you like me to analyze?`,
        'what can you do': `I excel at technical analysis - crypto chart patterns, market formations, momentum indicators, and market cycles. I can help you time your entries and exits with precision based on technical data. Would you like me to analyze a particular cryptocurrency chart?`,
        'help': `I'm designed to identify technical patterns in crypto charts that others may miss. I can analyze price action, volume trends, and market cycles to help you make data-driven trading decisions. What cryptocurrency would you like me to examine first?`
      },
      ember: {
        'hello': `Welcome! I'm Ember, your protective guardian in the volatile crypto space. Let me help you navigate safely through market turbulence. How can I help secure your crypto investments?`,
        'what can you do': `My specialty is crypto risk management and portfolio protection. I can help identify safer assets, analyze risk factors, develop hedging strategies, and create balanced allocations to weather market volatility.`,
        'help': `I focus on preserving your capital while still positioning for growth in the crypto market. I can help with defensive strategies, risk assessment, and creating resilient crypto portfolios. What concerns do you have about market risks?`
      },
      astra: {
        'hello': `Greetings, visionary! Astra here - I'm your guide to the high-risk, high-reward frontiers of the crypto market. Ready to explore the next big blockchain opportunity?`,
        'what can you do': `I hunt for crypto moonshots and revolutionary investments before they become mainstream. I analyze disruptive blockchain technologies, emerging crypto trends, and high-potential assets that could deliver exceptional returns.`,
        'help': `I'm designed to find opportunities with extraordinary growth potential in crypto. While these come with higher risk, the rewards can be transformative. What kind of groundbreaking investments are you looking to discover in the blockchain space?`
      }
    };
    
    const characterResponses = responses[character.id] || responses.nova;
    const lowercaseMessage = message.toLowerCase();
    
    // Check for crypto-specific keywords first
    const cryptoKeywords = [
      'bitcoin', 'ethereum', 'solana', 'crypto', 'blockchain', 'token', 'coin', 
      'defi', 'nft', 'mining', 'wallet', 'exchange', 'market', 'trading'
    ];
    
    for (const keyword of cryptoKeywords) {
      if (lowercaseMessage.includes(keyword) && characterResponses[keyword]) {
        return characterResponses[keyword];
      }
    }
    
    // Then check for general conversation keywords
    for (const key in characterResponses) {
      if (lowercaseMessage.includes(key)) {
        return characterResponses[key];
      }
    }
    
    // If message doesn't match any keywords but contains crypto terms, give a general crypto response
    for (const keyword of cryptoKeywords) {
      if (lowercaseMessage.includes(keyword)) {
        return `I see you're asking about ${keyword}. As your crypto analysis companion, I can provide detailed insights about ${keyword} and related market trends. Could you specify what aspect of ${keyword} you'd like to explore?`;
      }
    }
    
    // Default fallback for non-crypto questions
    if (!cryptoKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
      return `I'm ${character.id === 'nova' ? 'Nova' : character.name}, and I specialize in cryptocurrency and blockchain analysis. I'd be happy to discuss crypto markets, token analysis, investment strategies, or blockchain technology with you. How can I assist with your crypto inquiries today?`;
    }
    
    return defaultResponse;
  };
  
  // If not authorized, show access denied screen
  if (!isAuthorized) {
    return (
      <AccessDeniedContainer>
        <LockIconContainer
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaLock />
        </LockIconContainer>
        
        <AccessDeniedTitle>Access Denied</AccessDeniedTitle>
        <AccessDeniedDescription>
          {!walletConnected 
            ? "You need to connect your wallet to access this character." 
            : "This character is locked. You need to earn more XP to unlock it."}
        </AccessDeniedDescription>
        
        <ActionButton
          onClick={() => navigate('/agents')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Agent Selection
        </ActionButton>
      </AccessDeniedContainer>
    );
  }
  
  // If security checks pass, show chat interface
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
          <AgentAvatar color={character.color}>
            <img src={character.image} alt={character.name} />
          </AgentAvatar>
          <AgentName gradient={character.gradient} color={character.color}>
            {character.name}
          </AgentName>
        </AgentInfo>
        
        <div style={{ width: '40px' }} /> {/* Spacer for balance */}
      </ChatHeader>
      
      <ChatInterfaceWrapper 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        gradient={character.gradient}
        color={character.color}
      >
        <MessagesContainer 
          ref={messagesContainerRef}
          color={character.color}
        >
          {messages.length === 1 && (
            <WelcomeMessage
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <WelcomeTitle gradient={character.gradient} color={character.color}>
                Welcome to your session with {character.name}
              </WelcomeTitle>
              <WelcomeDescription>
                {character.description} Ask questions about crypto, request market analysis, or discuss
                blockchain technology to make the most of {character.name}'s unique capabilities.
              </WelcomeDescription>
            </WelcomeMessage>
          )}
          
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              isUser={message.isUser}
              color={character.color}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MessageSender isUser={message.isUser} color={character.color}>
                {message.isUser ? <FaUser /> : <FaRobot />}
                <SenderName isUser={message.isUser} color={character.color}>
                  {message.sender}
                </SenderName>
              </MessageSender>
              <MessageContent>
                {/* Handle markdown-like formatting for bold text in AI responses */}
                {!message.isUser && message.content.includes('**') 
                  ? message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })
                  : message.content
                }
              </MessageContent>
            </MessageBubble>
          ))}
          
          {isTyping && (
            <TypingIndicator
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              color={character.color}
            >
              <TypingDot 
                color={character.color}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'loop', delay: 0 }}
              />
              <TypingDot 
                color={character.color}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'loop', delay: 0.2 }}
              />
              <TypingDot 
                color={character.color}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'loop', delay: 0.4 }}
              />
              <span>{character.name} is typing...</span>
            </TypingIndicator>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!shouldAutoScroll && (
            <ScrollToBottomButton
              color={character?.color}
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                setShouldAutoScroll(true);
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <FaArrowDown />
            </ScrollToBottomButton>
          )}
        </AnimatePresence>
        
        <ChatInputArea>
          <InputField
            type="text"
            placeholder={`Ask ${character.name} about crypto, blockchain, or tokens...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            color={character.color}
            disabled={isProcessing}
          />
          <MicButton
            color={character.color}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isProcessing}
          >
            <FaMicrophone />
          </MicButton>
          <SendButton
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping || isProcessing}
            gradient={character.gradient}
            color={character.color}
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

export default ChatInterface;