// src/components/DebugEnhancedChat.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContextFix';
import styled from 'styled-components';

const DebugContainer = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(20, 20, 30, 0.8);
  border-radius: 12px;
  color: white;
`;

const StatusItem = styled.div`
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: ${props => props.success ? 'rgba(78, 255, 159, 0.2)' : 'rgba(255, 77, 77, 0.2)'};
  border-left: 4px solid ${props => props.success ? '#4EFF9F' : '#FF4D4D'};
`;

const FixButton = styled.button`
  background: linear-gradient(45deg, #FF9933 0%, #FFCC33 100%);
  color: black;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin: 0.5rem 0;
  cursor: pointer;
  font-weight: bold;
`;

const DebugEnhancedChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getCharacter, 
    isUnlocked, 
    walletConnected,
    earnXP,
    setActiveCharacter
  } = useCharacter();
  
  const [checks, setChecks] = useState({
    walletConnected: false,
    characterExists: false,
    characterUnlocked: false,
    openAIConfigured: false
  });
  
  // Perform all the checks that would normally prevent the page from loading
  useEffect(() => {
    const runChecks = () => {
      console.log("Running security checks...");
      
      // Check 1: Wallet connection
      const walletCheck = !!walletConnected;
      console.log("Wallet connected:", walletCheck);
      
      // Check 2: Character exists
      const character = getCharacter(id);
      const characterCheck = !!character;
      console.log("Character exists:", characterCheck, character);
      
      // Check 3: Character unlocked
      const unlockCheck = isUnlocked(id);
      console.log("Character unlocked:", unlockCheck);
      
      // Check 4: OpenAI API key configured
      const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
      const openAICheck = !!openAIKey && openAIKey.length > 20;
      console.log("OpenAI configured:", openAICheck);
      
      setChecks({
        walletConnected: walletCheck,
        characterExists: characterCheck,
        characterUnlocked: unlockCheck,
        openAIConfigured: openAICheck
      });
    };
    
    runChecks();
  }, [id, getCharacter, isUnlocked, walletConnected]);
  
  // Helper functions to fix issues
  const fixWalletIssue = () => {
    // Can't directly fix wallet connection, just navigate to home
    navigate('/');
  };
  
  const fixCharacterIssue = () => {
    // Navigate to agents page
    navigate('/agents');
  };
  
  const unlockCharacter = () => {
    // Give user enough XP to unlock character
    earnXP(10000);
    // Force a refresh of the checks
    setTimeout(() => {
      setChecks(prev => ({...prev}));
    }, 100);
  };
  
  const continueAnyway = () => {
    // Set Nova as active character
    setActiveCharacter('nova');
    // Navigate to the actual enhanced interface
    navigate('/enhanced/nova');
  };
  
  return (
    <DebugContainer>
      <h1>Enhanced Nova Debug Mode</h1>
      <p>This page will help diagnose why the Enhanced Nova interface isn't working.</p>
      
      <h2>Security Checks</h2>
      
      <StatusItem success={checks.walletConnected}>
        <h3>Wallet Connection: {checks.walletConnected ? 'PASSED ✓' : 'FAILED ✗'}</h3>
        <p>The wallet {checks.walletConnected ? 'is' : 'is not'} connected.</p>
        {!checks.walletConnected && (
          <FixButton onClick={fixWalletIssue}>Go to Home to Connect Wallet</FixButton>
        )}
      </StatusItem>
      
      <StatusItem success={checks.characterExists}>
        <h3>Character Exists: {checks.characterExists ? 'PASSED ✓' : 'FAILED ✗'}</h3>
        <p>The character "{id}" {checks.characterExists ? 'exists' : 'does not exist'} in the system.</p>
        {!checks.characterExists && (
          <FixButton onClick={fixCharacterIssue}>Go to Agent Selection</FixButton>
        )}
      </StatusItem>
      
      <StatusItem success={checks.characterUnlocked}>
        <h3>Character Unlocked: {checks.characterUnlocked ? 'PASSED ✓' : 'FAILED ✗'}</h3>
        <p>The character "{id}" {checks.characterUnlocked ? 'is' : 'is not'} unlocked.</p>
        {!checks.characterUnlocked && (
          <FixButton onClick={unlockCharacter}>Force Unlock Character</FixButton>
        )}
      </StatusItem>
      
      <StatusItem success={checks.openAIConfigured}>
        <h3>OpenAI Configuration: {checks.openAIConfigured ? 'PASSED ✓' : 'FAILED ✗'}</h3>
        <p>The OpenAI API {checks.openAIConfigured ? 'is' : 'is not'} properly configured.</p>
        {!checks.openAIConfigured && (
          <p>You need to add your OpenAI API key to the .env file as VITE_OPENAI_API_KEY</p>
        )}
      </StatusItem>
      
      <h2>Summary</h2>
      <p>Overall status: {Object.values(checks).every(check => check) ? 'ALL CHECKS PASSED ✓' : 'SOME CHECKS FAILED ✗'}</p>
      
      {!Object.values(checks).every(check => check) && (
        <p>Fix the issues above to use Enhanced Nova properly.</p>
      )}
      
      <FixButton onClick={continueAnyway}>Continue to Enhanced Nova Anyway</FixButton>
    </DebugContainer>
  );
};

export default DebugEnhancedChat;