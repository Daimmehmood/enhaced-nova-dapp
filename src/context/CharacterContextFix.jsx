// src/context/CharacterContextFix.jsx
// This is a modified version of CharacterContext with fixes to ensure Nova is always unlocked
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import novaImage from '../assets/characters/nova/nova.jpg';
import lunaImage from '../assets/characters/luna/Luna.jpg';
import vegaImage from '../assets/characters/vega/Vega.jpg';
import emberImage from '../assets/characters/ember/Ember.jpg';
import astraImage from '../assets/characters/astra/Astra.jpg';

// Character data
const characterData = [
  {
    id: 'nova',
    name: 'Nova',
    title: 'Logic-Driven Analyst',
    description: 'Nova is the rational aspect of the NOVA AI, providing data-driven investment advice to help users make well-informed decisions while minimizing risks.',
    image: novaImage, // Use the imported image variable
    color: '#FF9933',
    gradient: 'linear-gradient(45deg, #FF9933 0%, #FFCC33 100%)',
    unlockRequirement: 0, // Already unlocked
    specialties: ['Data Analysis', 'Risk Management', 'Market Patterns']
  },
  {
    id: 'luna',
    name: 'Luna',
    title: 'Creative Explorer',
    description: 'Luna embodies the creative side of the NOVA AI, identifying new investment opportunities and strategies that others might miss in the evolving crypto landscape.',
    image: lunaImage, // Use the imported image variable
    color: '#33CCFF',
    gradient: 'linear-gradient(45deg, #33CCFF 0%, #00FFFF 100%)',
    unlockRequirement: 1000,
    specialties: ['Emerging Trends', 'Creative Strategies', 'Innovation Spotting']
  },
  {
    id: 'vega',
    name: 'Vega',
    title: 'Technical Tactician',
    description: 'Vega specializes in technical indicators and advanced chart pattern recognition, offering precise market analysis and predictive models for tactical trading.',
    image: vegaImage, // Use the imported image variable
    color: '#9933FF',
    gradient: 'linear-gradient(45deg, #9933FF 0%, #CC66FF 100%)',
    unlockRequirement: 2500,
    specialties: ['Technical Indicators', 'Chart Patterns', 'Statistical Models']
  },
  {
    id: 'ember',
    name: 'Ember',
    title: 'Protective Guardian',
    description: 'Ember focuses on identifying safer picks and analyzing risk factors, helping users balance their portfolio and protect their investments in volatile markets.',
    image: emberImage, // Use the imported image variable
    color: '#4EFF9F',
    gradient: 'linear-gradient(45deg, #4EFF9F 0%, #00FF66 100%)',
    unlockRequirement: 5000,
    specialties: ['Risk Analysis', 'Safety Metrics', 'Portfolio Protection']
  },
  {
    id: 'astra',
    name: 'Astra',
    title: 'Visionary Opportunist',
    description: 'Astra is the wild card who identifies high-risk, high-reward opportunities, perfect for users looking for bold moves and potential moonshots in emerging markets.',
    image: astraImage, // Use the imported image variable
    color: '#FF5B79',
    gradient: 'linear-gradient(45deg, #FF5B79 0%, #FF9190 100%)',
    unlockRequirement: 10000,
    specialties: ['Moonshots', 'Emerging Projects', 'High Volatility']
  }
];

// Create Context
const CharacterContext = createContext();

export const useCharacter = () => useContext(CharacterContext);

export const CharacterProvider = ({ children }) => {
  const [characters, setCharacters] = useState(characterData);
  const [activeCharacter, setActiveCharacter] = useState('nova'); // Default to Nova
  const [userXP, setUserXP] = useState(50000); // Start with 50000 XP to unlock everything
  
  // Use Solana wallet connection
  const { publicKey, connected, wallet, disconnect } = useWallet();
  const { connection } = useConnection();
  
  // Always treat wallet as connected for development
  const forceWalletConnected = true;
  
  // Check wallet connection on component mount
  useEffect(() => {
    if ((connected && publicKey) || forceWalletConnected) {
      // Load user XP based on wallet address
      loadUserXP(publicKey?.toString() || 'development');
    } else {
      // Reset to default user state if not connected
      setUserXP(50000); // Still keep high XP for development
      setActiveCharacter('nova');
    }
  }, [connected, publicKey]);
  
  // Load user XP from localStorage based on wallet address
  const loadUserXP = (address) => {
    const savedXP = localStorage.getItem(`nova_user_xp_${address}`);
    if (savedXP) {
      setUserXP(parseInt(savedXP));
    } else {
      // Default starting XP - high for development
      setUserXP(50000);
      localStorage.setItem(`nova_user_xp_${address}`, '50000');
    }
  };
  
  // Earn XP
  const earnXP = (amount) => {
    setUserXP(prevXP => {
      const newXP = prevXP + amount;
      
      // Save to localStorage based on wallet connection
      if (connected && publicKey) {
        localStorage.setItem(`nova_user_xp_${publicKey.toString()}`, newXP.toString());
      } else {
        localStorage.setItem('nova_user_xp', newXP.toString());
      }
      
      return newXP;
    });
  };
  
  // Check if a character is unlocked - MODIFIED FOR DEVELOPMENT
  const isUnlocked = (characterId) => {
    // Nova is always unlocked
    if (characterId === 'nova') return true;
    
    // For development, treat all characters as unlocked
    return true;
    
    // Production version would be:
    // Check wallet connection for other characters
    // if (!connected) return false;
    // Check XP requirement
    // const character = characters.find(char => char.id === characterId);
    // return character ? userXP >= character.unlockRequirement : false;
  };
  
  // Get character by ID
  const getCharacter = (characterId) => {
    return characters.find(char => char.id === characterId) || characters[0];
  };
  
  // Get progress towards unlocking a character
  const getUnlockProgress = (characterId) => {
    const character = getCharacter(characterId);
    
    // Nova is always unlocked
    if (character.id === 'nova' || character.unlockRequirement === 0) {
      return {
        current: 100,
        required: 100,
        percentage: 100
      };
    }
    
    const progress = Math.min(userXP, character.unlockRequirement);
    return {
      current: progress,
      required: character.unlockRequirement,
      percentage: (progress / character.unlockRequirement) * 100
    };
  };
  
  // Update the character unlock status whenever userXP changes
  useEffect(() => {
    const updatedCharacters = characters.map(character => ({
      ...character,
      isUnlocked: isUnlocked(character.id)
    }));
    
    setCharacters(updatedCharacters);
  }, [userXP, connected]);
  
  // Load saved active character from localStorage
  useEffect(() => {
    if (connected && publicKey) {
      const savedActiveChar = localStorage.getItem(`nova_active_character_${publicKey.toString()}`);
      if (savedActiveChar && isUnlocked(savedActiveChar)) {
        setActiveCharacter(savedActiveChar);
      }
    } else {
      const savedActiveChar = localStorage.getItem('nova_active_character');
      if (savedActiveChar && isUnlocked(savedActiveChar)) {
        setActiveCharacter(savedActiveChar);
      }
    }
  }, [connected, publicKey, userXP]);
  
  // Context value - Modified to always show wallet as connected for development
  const value = {
    characters,
    activeCharacter,
    setActiveCharacter,
    userXP,
    earnXP,
    isUnlocked,
    getCharacter,
    getUnlockProgress,
    walletConnected: forceWalletConnected || connected, // Override for development
    walletAddress: publicKey?.toString() || 'development-wallet',
    disconnectWallet: disconnect
  };
  
  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

export default CharacterProvider;