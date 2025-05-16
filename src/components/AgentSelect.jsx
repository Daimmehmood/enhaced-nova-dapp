// src/components/AgentSelect.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContextFix';
import { FaLock, FaUnlock, FaRocket } from 'react-icons/fa';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
`;

const PageHeader = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 2rem auto 4rem;
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
`;

// XP Display
const XPDisplay = styled(motion.div)`
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid ${({ theme }) => theme.colors.primaryOrange};
  border-radius: 8px;
  padding: 1rem 2rem;
  margin: 1.5rem auto;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.subtle};
`;

const XPLabel = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${({ theme }) => theme.colors.primaryYellow};
`;

const XPValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const XPButton = styled(motion.button)`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primaryOrange};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.primaryOrange};
  font-family: ${({ theme }) => theme.fonts.heading};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 107, 26, 0.2);
    transform: translateY(-2px);
  }
`;

// Agent Grid
const AgentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.xxl}) {
    grid-template-columns: repeat(5, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

// Agent Card
const AgentCard = styled(motion.div)`
  position: relative;
  background: rgba(26, 26, 26, 0.9);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ isActive, color }) => 
    isActive ? color : 'rgba(255, 255, 255, 0.1)'};
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  height: 450px;
  box-shadow: ${({ isActive, color, theme }) => 
    isActive ? `0 0 20px ${color}50` : theme.shadows.subtle};
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: ${({ color, theme }) => 
      `0 15px 30px ${color}30, 0 8px 15px rgba(0, 0, 0, 0.2)`};
  }
  
  /* Cyberpunk corner accents */
  &::before, &::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 30px;
    z-index: 1;
    pointer-events: none;
  }
  
  &::before {
    top: 0;
    left: 0;
    border-top: 2px solid ${({ color }) => color};
    border-left: 2px solid ${({ color }) => color};
  }
  
  &::after {
    bottom: 0;
    right: 0;
    border-bottom: 2px solid ${({ color }) => color};
    border-right: 2px solid ${({ color }) => color};
  }
`;

const AgentImageContainer = styled.div`
  height: 230px;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  }
  
  ${AgentCard}:hover & img {
    transform: scale(1.08);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60%;
    background: linear-gradient(to top, rgba(26, 26, 26, 0.9), transparent);
    pointer-events: none;
  }
`;

const AgentStatusIndicator = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.unlocked ? 
    'rgba(78, 255, 159, 0.9)' : 
    'rgba(0, 0, 0, 0.7)'};
  color: ${props => props.unlocked ? '#000' : '#FFF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  z-index: 2;
  box-shadow: ${props => props.unlocked ? 
    '0 0 15px rgba(78, 255, 159, 0.7)' : 
    '0 0 10px rgba(0, 0, 0, 0.5)'};
`;

const AgentInfo = styled.div`
  padding: 1.5rem;
  position: relative;
  z-index: 1;
`;

const AgentName = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  background: ${props => props.gradient || `linear-gradient(45deg, ${props.color} 0%, white 150%)`};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${props => `0 0 15px ${props.color}50`};
`;

const AgentTitle = styled.h4`
  font-size: 1rem;
  color: white;
  margin-bottom: 1rem;
  font-weight: 500;
  letter-spacing: 1px;
`;

const AgentDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin-bottom: 1.2rem;
`;

// Progress Bar
const ProgressContainer = styled.div`
  width: 100%;
  margin-top: auto;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ progress }) => `${progress}%`};
  background: ${({ color, theme }) => color || theme.gradients.orangeYellow};
  border-radius: 4px;
  transition: width 1s ease-out;
`;

const ProgressText = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.primaryYellow};
  display: flex;
  justify-content: space-between;
`;

// Locked Overlay
const LockedOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
`;

const LockIcon = styled(motion.div)`
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
`;

const UnlockText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
`;

// Selected agent details
const SelectedAgentDetails = styled(motion.div)`
  width: 100%;
  max-width: 1200px;
  margin: 3rem auto;
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2.5rem;
  display: flex;
  align-items: center;
  gap: 3rem;
  box-shadow: ${({ color, theme }) => 
    `0 0 30px ${color || theme.colors.primaryOrange}30`};
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 2px;
    background: ${({ gradient, color }) => 
      gradient || `linear-gradient(45deg, ${color || '#FF6B1A'} 0%, transparent 50%)`};
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    text-align: center;
    padding: 2rem;
    gap: 2rem;
  }
`;

const SelectedAgentImage = styled(motion.div)`
  width: 250px;
  height: 250px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 3px;
    background: ${({ gradient, color }) => gradient || color};
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: 1;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 200px;
    height: 200px;
  }
`;

const SelectedAgentInfo = styled.div`
  flex: 1;
`;

const SelectedAgentName = styled.h3`
  font-size: 3rem;
  margin-bottom: 0.5rem;
  background: ${props => props.gradient || `linear-gradient(45deg, ${props.color || '#FF6B1A'} 0%, white 150%)`};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${props => `0 0 20px ${props.color || '#FF6B1A'}50`};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const SelectedAgentTitle = styled.h4`
  font-size: 1.5rem;
  color: white;
  margin-bottom: 0.8rem;
  letter-spacing: 1px;
`;

const SelectedAgentDescription = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  margin-bottom: 2rem;
`;

const SpecialtiesTitle = styled.h5`
  font-size: 1.2rem;
  color: white;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SpecialtiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const SpecialtyTag = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${({ color }) => color || 'rgba(255, 107, 26, 0.3)'};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: ${({ color }) => color || '#FFD700'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const Button = styled(motion.button)`
  padding: ${props => props.large ? '1rem 2rem' : '0.75rem 1.5rem'};
  background: ${props => props.secondary ? 'transparent' : 
    (props.gradient || props.theme.gradients.orangeYellow)};
  color: ${props => props.secondary ? 
    (props.color || props.theme.colors.primaryOrange) : 
    props.theme.colors.primaryBlack};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.secondary && `
    border: 1px solid ${props.color || props.theme.colors.primaryOrange};
  `}
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.secondary ? 
      `0 0 10px ${props.color || props.theme.colors.primaryOrange}30` : 
      `0 0 15px ${props.color || props.theme.colors.primaryOrange}70`};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const AgentSelect = () => {
  const navigate = useNavigate();
  const { 
    characters, 
    activeCharacter, 
    setActiveCharacter,
    userXP,
    earnXP,
    isUnlocked,
    getUnlockProgress 
  } = useCharacter();
  
  const [selectedCharacter, setSelectedCharacter] = useState(
    characters.find(char => char.id === activeCharacter) || characters[0]
  );
  
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
  };
  
  const handleStartChat = () => {
    if (isUnlocked(selectedCharacter.id)) {
      setActiveCharacter(selectedCharacter.id);
      navigate(`/character/${selectedCharacter.id}`);
    }
  };
  
  const handleEarnXP = () => {
    // For demo purposes, earn some XP
    earnXP(500);
  };
  
  const isCharacterUnlocked = selectedCharacter ? isUnlocked(selectedCharacter.id) : false;
  
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1]
      }
    })
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <Title
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Choose Your AI Companion
        </Title>
        
        <Description
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Each AI agent has unique abilities and specialties. Unlock new agents by earning XP
          through interactions and analysis.
        </Description>
        
        <XPDisplay
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <XPLabel>Current XP:</XPLabel>
          <XPValue>{userXP}</XPValue>
          <XPButton 
            onClick={handleEarnXP} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            + Earn XP (Demo)
          </XPButton>
        </XPDisplay>
      </PageHeader>
      
      <AgentsGrid>
        {characters.map((character, index) => {
          const progress = getUnlockProgress(character.id);
          const unlocked = isUnlocked(character.id);
          
          return (
            <AgentCard
              key={character.id}
              color={character.color}
              isActive={selectedCharacter?.id === character.id}
              onClick={() => handleCharacterClick(character)}
              initial="hidden"
              animate="visible"
              custom={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AgentImageContainer>
                <img src={character.image || '/assets/NOVA ALL CHARACTER/NOVA/nova4.jpg'} alt={character.name} />
              </AgentImageContainer>
              
              <AgentStatusIndicator unlocked={unlocked}>
                {unlocked ? <FaUnlock /> : <FaLock />}
              </AgentStatusIndicator>
              
              <AgentInfo>
                <AgentName 
                  color={character.color}
                  gradient={character.gradient}
                >
                  {character.name}
                </AgentName>
                <AgentTitle>{character.title}</AgentTitle>
                <AgentDescription>
                  {character.description.length > 100
                    ? `${character.description.substring(0, 100)}...`
                    : character.description
                  }
                </AgentDescription>
                
                {!unlocked && (
                  <ProgressContainer>
                    <ProgressBar>
                      <ProgressFill 
                        progress={progress.percentage} 
                        color={character.color}
                      />
                    </ProgressBar>
                    <ProgressText>
                      <span>XP: {progress.current}</span>
                      <span>{progress.required}</span>
                    </ProgressText>
                  </ProgressContainer>
                )}
              </AgentInfo>
              
              {!unlocked && (
                <LockedOverlay
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <LockIcon
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0] 
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop" 
                    }}
                  >
                    <FaLock />
                  </LockIcon>
                  <UnlockText>
                    Requires {progress.required} XP
                  </UnlockText>
                </LockedOverlay>
              )}
            </AgentCard>
          );
        })}
      </AgentsGrid>
      
      {selectedCharacter && (
        <SelectedAgentDetails
          color={selectedCharacter.color}
          gradient={selectedCharacter.gradient}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SelectedAgentImage 
            color={selectedCharacter.color}
            gradient={selectedCharacter.gradient}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img 
              src={selectedCharacter.image || '/images/characters/placeholder.png'} 
              alt={selectedCharacter.name} 
            />
          </SelectedAgentImage>
          
          <SelectedAgentInfo>
            <SelectedAgentName 
              color={selectedCharacter.color}
              gradient={selectedCharacter.gradient}
            >
              {selectedCharacter.name}
            </SelectedAgentName>
            <SelectedAgentTitle>{selectedCharacter.title}</SelectedAgentTitle>
            <SelectedAgentDescription>
              {selectedCharacter.description}
            </SelectedAgentDescription>
            
            {selectedCharacter.specialties && (
              <>
                <SpecialtiesTitle>Specialties</SpecialtiesTitle>
                <SpecialtiesList>
                  {selectedCharacter.specialties.map((specialty, index) => (
                    <SpecialtyTag 
                      key={index}
                      color={selectedCharacter.color}
                    >
                      <FaRocket /> {specialty}
                    </SpecialtyTag>
                  ))}
                </SpecialtiesList>
              </>
            )}
            
            <ButtonContainer>
              <Button 
                gradient={selectedCharacter.gradient}
                color={selectedCharacter.color}
                large
                onClick={handleStartChat}
                disabled={!isCharacterUnlocked}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCharacterUnlocked ? 'Start Session' : 'Locked'}
              </Button>
              
              {!isCharacterUnlocked && (
                <Button 
                  secondary
                  color={selectedCharacter.color}
                  large
                  onClick={handleEarnXP}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Earn More XP
                </Button>
              )}
            </ButtonContainer>
          </SelectedAgentInfo>
        </SelectedAgentDetails>
      )}
    </PageContainer>
  );
};

export default AgentSelect;