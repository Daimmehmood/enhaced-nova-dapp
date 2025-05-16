// src/components/DeveloperTools.jsx
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBug, FaFlask, FaTools, FaInfoCircle } from 'react-icons/fa';

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
`;

const Title = styled(motion.h1)`
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${({ theme }) => theme.shadows.glowOrange};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.8rem;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 2.2rem;
  }
`;

const Description = styled(motion.p)`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
  max-width: 800px;
  text-align: center;
  margin-bottom: 3rem;
`;

const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
`;

const ToolCard = styled(motion.div)`
  background: rgba(26, 26, 26, 0.8);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 107, 26, 0.3);
  transition: all 0.3s ease;
  height: 100%;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ theme }) => theme.shadows.glowOrange};
    border-color: ${({ theme }) => theme.colors.primaryOrange};
  }
`;

const ToolHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 107, 26, 0.3);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconContainer = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: black;
`;

const ToolTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryYellow};
`;

const ToolBody = styled.div`
  padding: 1.5rem;
`;

const ToolDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const Button = styled(motion(Link))`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.gradients.orangeYellow};
  color: black;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  text-decoration: none;
  text-transform: uppercase;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.glowOrange};
  }
`;

const StatusContainer = styled.div`
  margin-top: 3rem;
  padding: 1.5rem;
  background: rgba(26, 26, 26, 0.8);
  border-radius: 12px;
  max-width: 800px;
  border: 1px solid rgba(255, 107, 26, 0.3);
`;

const StatusTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primaryYellow};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
`;

const DeveloperTools = () => {
  return (
    <Container>
      <Title
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Developer Tools
      </Title>
      
      <Description
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Use these tools to diagnose and fix issues with the Enhanced Nova interface
      </Description>
      
      <ToolsGrid>
        <ToolCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ToolHeader>
            <IconContainer>
              <FaBug />
            </IconContainer>
            <ToolTitle>Debug Enhanced Nova</ToolTitle>
          </ToolHeader>
          <ToolBody>
            <ToolDescription>
              This tool will check for common issues that might prevent the Enhanced Nova interface from loading correctly, including wallet connection, character unlock status, and API configuration.
            </ToolDescription>
            <Button
              to="/debug-enhanced/nova"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Run Diagnostics
            </Button>
          </ToolBody>
        </ToolCard>
        
        <ToolCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ToolHeader>
            <IconContainer>
              <FaFlask />
            </IconContainer>
            <ToolTitle>Simplified Nova</ToolTitle>
          </ToolHeader>
          <ToolBody>
            <ToolDescription>
              Use this simplified version of Enhanced Nova that doesn't rely on external APIs. It provides mocked responses for cryptocurrency analysis queries to test the interface.
            </ToolDescription>
            <Button
              to="/enhanced/nova"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Open Simplified Nova
            </Button>
          </ToolBody>
        </ToolCard>
        
        <ToolCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <ToolHeader>
            <IconContainer>
              <FaTools />
            </IconContainer>
            <ToolTitle>API Testing</ToolTitle>
          </ToolHeader>
          <ToolBody>
            <ToolDescription>
              Test your API connections to OpenAI, CoinGecko, and DexScreener. This helps ensure that your environment is properly configured for the Enhanced Nova experience.
            </ToolDescription>
            <Button
              to="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Test API Connections
            </Button>
          </ToolBody>
        </ToolCard>
      </ToolsGrid>
      
      <StatusContainer>
        <StatusTitle>
          <FaInfoCircle /> Enhanced Nova Status
        </StatusTitle>
        <StatusDescription>
          The Enhanced Nova interface is currently in development mode. To fully enable it in production, you will need:
          <ul>
            <li>An OpenAI API key (add to .env as VITE_OPENAI_API_KEY)</li>
            <li>CoinGecko API access (optional Pro key for higher rate limits)</li>
            <li>DexScreener API access (for DEX data)</li>
          </ul>
          Until these are configured, you can use the Simplified Nova interface for testing purposes.
        </StatusDescription>
      </StatusContainer>
    </Container>
  );
};

export default DeveloperTools;