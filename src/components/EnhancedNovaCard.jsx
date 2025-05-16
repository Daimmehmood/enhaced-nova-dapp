
// src/components/EnhancedNovaCard.jsx
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaChartLine, FaSearch, FaExchangeAlt, FaArrowRight } from 'react-icons/fa';
import { useCharacter } from '../context/CharacterContextFix';
import novaImage from '../assets/characters/nova/nova4.jpg';

const CardContainer = styled(motion.div)`
  width: 100%;
  max-width: 900px;
  margin: 2rem auto;
  background: rgba(20, 20, 30, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 153, 51, 0.3);
  box-shadow: 0 0 20px rgba(255, 153, 51, 0.2);
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 2px;
    background: linear-gradient(45deg, #FF9933 0%, transparent 50%);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const CardHeader = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid rgba(255, 153, 51, 0.2);
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AgentAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #FF9933;
  box-shadow: 0 0 15px rgba(255, 153, 51, 0.5);
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const AgentName = styled.h3`
  font-size: 2.2rem;
  margin-bottom: 0.3rem;
  background: linear-gradient(45deg, #FF9933 0%, #FFCC33 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(255, 153, 51, 0.3);
`;

const AgentTitle = styled.h4`
  font-size: 1.2rem;
  color: #FFD700;
  margin-bottom: 0.8rem;
  letter-spacing: 1px;
`;

const UpgradeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, rgba(255, 153, 51, 0.2) 0%, rgba(255, 215, 0, 0.2) 100%);
  border: 1px solid #FF9933;
  border-radius: 20px;
  padding: 0.3rem 0.8rem;
  font-size: 0.9rem;
  color: #FFD700;
  margin-bottom: 0.5rem;
`;

const CardBody = styled.div`
  padding: 1.5rem 2rem;
`;

const DescriptionTitle = styled.h5`
  font-size: 1.2rem;
  color: #FFFFFF;
  margin-bottom: 0.8rem;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FeatureItem = styled.div`
  background: rgba(30, 30, 40, 0.6);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 153, 51, 0.2);
  
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  
  svg {
    color: #FF9933;
    font-size: 1.2rem;
    margin-top: 0.2rem;
  }
`;

const FeatureText = styled.div`
  h6 {
    font-size: 1rem;
    color: #FFD700;
    margin-bottom: 0.3rem;
  }
  
  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.4;
  }
`;

const ActionArea = styled.div`
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 153, 51, 0.2);
  padding: 1.5rem 2rem;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const StartButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(45deg, #FF9933 0%, #FFCC33 100%);
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(255, 153, 51, 0.3);
  
  &:hover {
    box-shadow: 0 0 20px rgba(255, 153, 51, 0.5);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const EnhancedNovaCard = () => {
  const navigate = useNavigate();
  const { isUnlocked } = useCharacter();
  
  // Check if Nova is unlocked
  const isNovaUnlocked = isUnlocked('nova');
  
  const handleStartSession = () => {
    if (isNovaUnlocked) {
      navigate('/enhanced/nova');
    }
  };
  
  return (
    <CardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <CardHeader>
        <AgentAvatar>
          <img src={novaImage} alt="Nova" />
        </AgentAvatar>
        
        <HeaderContent>
          <UpgradeBadge>
            <FaRobot /> Enhanced AI
          </UpgradeBadge>
          <AgentName>Nova 2.0</AgentName>
          <AgentTitle>Advanced Crypto Analysis System</AgentTitle>
          <Description>
            Experience Nova with enhanced capabilities, powered by real-time cryptocurrency data from CoinGecko and DexScreener, combined with advanced OpenAI-powered analysis.
          </Description>
        </HeaderContent>
      </CardHeader>
      
      <CardBody>
        <DescriptionTitle>New Advanced Features:</DescriptionTitle>
        
        <FeaturesGrid>
          <FeatureItem>
            <FaChartLine />
            <FeatureText>
              <h6>Real-time Market Data</h6>
              <p>Access up-to-date pricing, volume, and liquidity data from CoinGecko and DexScreener for any token</p>
            </FeatureText>
          </FeatureItem>
          
          <FeatureItem>
            <FaSearch />
            <FeatureText>
              <h6>Comprehensive Analysis</h6>
              <p>Get detailed fundamental and technical analysis including support/resistance levels, RSI, and MACD</p>
            </FeatureText>
          </FeatureItem>
          
          <FeatureItem>
            <FaExchangeAlt />
            <FeatureText>
              <h6>Token Comparisons</h6>
              <p>Compare different cryptocurrencies across key metrics to identify strengths and weaknesses</p>
            </FeatureText>
          </FeatureItem>
          
          <FeatureItem>
            <FaRobot />
            <FeatureText>
              <h6>AI-Powered Insights</h6>
              <p>Benefit from OpenAI integration to process complex market data and deliver actionable insights</p>
            </FeatureText>
          </FeatureItem>
        </FeaturesGrid>
      </CardBody>
      
      <ActionArea>
        <StartButton
          onClick={handleStartSession}
          disabled={!isNovaUnlocked}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Enhanced Session <FaArrowRight />
        </StartButton>
      </ActionArea>
    </CardContainer>
  );
};

export default EnhancedNovaCard;