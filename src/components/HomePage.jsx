// Updated HomePage.jsx with Developer Tools link
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaChartLine, FaShieldAlt, FaLightbulb, FaRocket, FaStar, FaBolt, FaTools } from 'react-icons/fa';
import novaImage from '../assets/characters/nova/nova4.jpg';
import lunaImage from '../assets/characters/luna/Luna3.jpg';
import vegaImage from '../assets/characters/vega/Vega3.jpg';
import emberImage from '../assets/characters/ember/Ember.jpg';
import astraImage from '../assets/characters/astra/Astra2.jpg';

const HomeContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

// Hero Section
const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 90vh;
  width: 100%;
  padding: 4rem 1.5rem;
  position: relative;
  overflow: hidden;
`;

const HeroContent = styled.div`
  max-width: 1200px;
  width: 100%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled(motion.h1)`
  font-size: 4.5rem;
  margin-bottom: 1.5rem;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${({ theme }) => theme.shadows.glowOrange};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    font-size: 3.5rem;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.8rem;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 2.2rem;
  }
`;

const Subtitle = styled(motion.h2)`
  font-size: 1.8rem;
  color: white;
  margin-bottom: 2rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.5rem;
  }
`;

const Description = styled(motion.p)`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 800px;
  margin: 0 auto 3rem;
  line-height: 1.8;
  text-align: center;
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  justify-content: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

// Styling for button since we're not importing the Button component
// Update the StyledButton component to add icon support
const StyledButton = styled(motion.button)`
  padding: ${props => props.large ? '1rem 2rem' : '0.75rem 1.5rem'};
  background: ${props => props.secondary ? 'transparent' : props.primary ? 'linear-gradient(45deg, #FF9933 0%, #FFCC33 100%)' : props.theme.gradients.orangeYellow};
  color: ${props => props.secondary ? props.theme.colors.primaryOrange : props.theme.colors.primaryBlack};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.secondary && `
    border: 1px solid ${props.theme.colors.primaryOrange};
  `}
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.secondary ? 
      '0 0 10px rgba(255, 107, 26, 0.3)' : 
      props.theme.shadows.glowOrange};
  }
`;

// Features Section
const FeaturesSection = styled.section`
  width: 100%;
  padding: 6rem 1.5rem;
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 3rem;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${({ theme }) => theme.shadows.glowOrange};
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  background: rgba(26, 26, 26, 0.8);
  border-radius: 10px;
  padding: 2rem;
  border: 1px solid rgba(255, 107, 26, 0.3);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.glowOrange};
    border-color: ${({ theme }) => theme.colors.primaryOrange};
  }
`;

const FeatureIconWrapper = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.primaryBlack};
  font-size: 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.glowOrange};
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primaryYellow};
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  flex: 1;
`;

// Agents Showcase Section
const AgentsSection = styled.section`
  width: 100%;
  padding: 6rem 1.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AgentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const AgentCard = styled(motion.div)`
  background: rgba(26, 26, 26, 0.8);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid ${({ color }) => color || 'rgba(255, 107, 26, 0.3)'};
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ color, theme }) => color ? 
      `0 0 15px ${color}80` : theme.shadows.glowOrange};
  }
`;

const AgentImageContainer = styled.div`
  height: 200px;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  ${AgentCard}:hover & img {
    transform: scale(1.05);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: linear-gradient(to top, rgba(26, 26, 26, 1), transparent);
  }
`;

const AgentInfo = styled.div`
  padding: 1.5rem;
`;

const AgentName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${({ color, theme }) => color || theme.colors.primaryYellow};
`;

const AgentTitle = styled.h4`
  font-size: 1rem;
  color: #fff;
  margin-bottom: 1rem;
`;

const AgentDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const SectionCTA = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 3rem;
`;

const NewFeatureBadge = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(45deg, #FF9933 0%, #FFCC33 100%);
  color: black;
  font-weight: bold;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

// Add this to EnhancedNovaSection
const EnhancedNovaSection = styled.section`
  width: 100%;
  padding: 2rem 1.5rem 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(10, 10, 15, 0) 0%, rgba(10, 10, 15, 0.7) 100%);
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 153, 51, 0.5) 50%, transparent 100%);
  }
`;

// Add a developer tools button that stands out as a helper element
const DevToolsButton = styled(motion.button)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: rgba(255, 107, 26, 0.9);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 100;
  
  &:hover {
    background: linear-gradient(45deg, #FF9933 0%, #FFCC33 100%);
    transform: translateY(-3px);
  }
`;

const HomePage = () => {
  const navigate = useNavigate();
  
  // Sample agent data for showcase
  const agentShowcase = [
    {
      id: 'nova',
      name: 'Nova',
      title: 'Logic-Driven Analyst',
      description: 'Data-driven investment advice to make informed decisions',
      image: novaImage,
      color: '#FF9933'
    },
    {
      id: 'luna',
      name: 'Luna',
      title: 'Creative Explorer',
      description: 'Discovering unique opportunities others might miss',
      image: lunaImage,
      color: '#33CCFF'
    },
    {
      id: 'vega',
      name: 'Vega',
      title: 'Technical Tactician',
      description: 'Expert chart analysis and pattern recognition',
      image: vegaImage,
      color: '#9933FF'
    },
    {
      id: 'ember',
      name: 'Ember',
      title: 'Protective Guardian',
      description: 'Risk assessment and portfolio protection',
      image: emberImage,
      color: '#4EFF9F'
    },
    {
      id: 'astra',
      name: 'Astra',
      title: 'Visionary Opportunist',
      description: 'High-risk, high-reward moonshot opportunities',
      image: astraImage,
      color: '#FF5B78'
    }
  ];
  
  return (
    <HomeContainer>
      <HeroSection>
        <HeroContent>
          <Title
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome to NOVA
          </Title>
          
          <Subtitle
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AI-Powered DeFi Analysis
          </Subtitle>
          
          <Description
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8, delay: 0.4 }}
>
  Explore the digital metropolis where AI companions guide you through the world of crypto.
  Our enhanced Nova AI now connects to CoinGecko and DexScreener for real-time data and 
  powerful analysis of any cryptocurrency or token.
</Description>

<Subtitle
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8, delay: 0.2 }}
>
  AI-Powered Crypto Analysis
</Subtitle>

<CTAButtons
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.6 }}
>
  <StyledButton 
    large 
    onClick={() => navigate('/agents')}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
  >
    <FaRobot /> Meet the Agents
  </StyledButton>
  
  <StyledButton 
    primary
    large
    onClick={() => navigate('/enhanced/nova')}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
    style={{ position: 'relative' }}
  >
    <FaChartLine /> Try Enhanced Nova
    <NewFeatureBadge><FaStar /> NEW</NewFeatureBadge>
  </StyledButton>
</CTAButtons>
          
          <CTAButtons
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            
            
            <StyledButton 
              secondary
              large
              onClick={() => window.open('https://docs.yourdomain.com', '_blank')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Learn More
            </StyledButton>
          </CTAButtons>
        </HeroContent>
      </HeroSection>
      
      <FeaturesSection>
        <SectionTitle>Core Features</SectionTitle>
        
        <FeaturesGrid>
          <FeatureCard
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  viewport={{ once: true }}
  style={{ position: 'relative' }}
>
  <NewFeatureBadge><FaBolt /> NEW</NewFeatureBadge>
  <FeatureIconWrapper>
    <FaChartLine />
  </FeatureIconWrapper>
  <FeatureTitle>Live Market Data</FeatureTitle>
  <FeatureDescription>
    Access real-time cryptocurrency data from CoinGecko and DexScreener APIs.
    Get current prices, market caps, trading volumes, and liquidity metrics.
  </FeatureDescription>
</FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <FeatureIconWrapper>
              <FaChartLine />
            </FeatureIconWrapper>
            <FeatureTitle>Data Visualization</FeatureTitle>
            <FeatureDescription>
              Complex market data transformed into intuitive visual formats to help you understand
              trends, patterns, and opportunities at a glance.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <FeatureIconWrapper>
              <FaShieldAlt />
            </FeatureIconWrapper>
            <FeatureTitle>Risk Management</FeatureTitle>
            <FeatureDescription>
              Advanced risk assessment tools help you make informed decisions and protect your
              investments in volatile market conditions.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>
      
      <AgentsSection>
        <SectionTitle>Meet Your AI Companions</SectionTitle>
        
        <AgentsGrid>
          {agentShowcase.map((agent, index) => (
  <AgentCard
    key={agent.id}
    color={agent.color}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    onClick={() => navigate(`/character/${agent.id}`)}
    style={{ position: 'relative' }}
  >
    {agent.id === 'nova' && <NewFeatureBadge><FaStar /> ENHANCED</NewFeatureBadge>}
    <AgentImageContainer>
      <img src={agent.image} alt={agent.name} />
    </AgentImageContainer>
    
    <AgentInfo>
      <AgentName color={agent.color}>{agent.name}</AgentName>
      <AgentTitle>{agent.title}</AgentTitle>
      <AgentDescription>{agent.description}</AgentDescription>
    </AgentInfo>
  </AgentCard>
))};
        </AgentsGrid>
        
        <SectionCTA>
          <StyledButton 
            large
            onClick={() => navigate('/agents')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Explore All Agents
          </StyledButton>
        </SectionCTA>
      </AgentsSection>
      
      {/* Developer Tools Button */}
      <DevToolsButton
        onClick={() => navigate('/dev-tools')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <FaTools /> Developer Tools
      </DevToolsButton>
    </HomeContainer>
  );
};

export default HomePage;