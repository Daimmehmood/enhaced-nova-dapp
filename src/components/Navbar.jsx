// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useCharacter } from '../context/CharacterContextFix';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Styled components
const NavbarContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 107, 26, 0.3);
  transition: all 0.3s ease;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  
  h1 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 2rem;
    margin: 0;
    background: ${({ theme }) => theme.gradients.orangeYellow};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 10px rgba(255, 107, 26, 0.7);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 800;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2.5rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: ${({ active, theme }) => active ? theme.colors.primaryYellow : '#fff'};
  position: relative;
  text-decoration: none;
  transition: color 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryYellow};
  }
  
  ${({ active, theme }) => active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 100%;
      height: 2px;
      background: ${theme.colors.primaryYellow};
      box-shadow: 0 0 8px ${theme.colors.primaryYellow};
    }
  `}
`;

const WalletInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const XPDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(26, 26, 26, 0.8);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.primaryOrange};
  
  span {
    color: ${({ theme }) => theme.colors.primaryYellow};
    font-family: ${({ theme }) => theme.fonts.mono};
    font-weight: bold;
  }
  
  label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const AddressDisplay = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(26, 26, 26, 0.8);
  padding: a0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  span {
    display: inline-block;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DisconnectButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.danger};
    background: rgba(255, 77, 77, 0.1);
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: transparent;
  color: white;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryYellow};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  width: 75%;
  max-width: 300px;
  height: 100vh;
  background: rgba(10, 10, 10, 0.98);
  backdrop-filter: blur(10px);
  padding: 5rem 2rem 2rem;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
`;

const MobileNavLink = styled(NavLink)`
  font-size: 1.2rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 107, 26, 0.3);
  width: 100%;
  display: block;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  color: white;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryYellow};
  }
`;

// Style the WalletMultiButton to match your theme
const StyledWalletButton = styled.div`
  .wallet-adapter-button {
    background: ${props => props.connected ? 'rgba(78, 255, 159, 0.2)' : 'linear-gradient(45deg, #FF6B1A 0%, #FFD700 100%)'};
    color: ${props => props.connected ? '#4EFF9F' : '#000'};
    font-weight: 700;
    border: ${props => props.connected ? '1px solid #4EFF9F' : 'none'};
    border-radius: 4px;
    padding: 0.8rem 1.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    font-family: ${({ theme }) => theme.fonts.heading};
    box-shadow: ${props => props.connected ? '0 0 10px rgba(78, 255, 159, 0.3)' : '0 0 15px rgba(255, 107, 26, 0.7)'};
    cursor: pointer;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: ${props => props.connected ? '0 0 15px rgba(78, 255, 159, 0.5)' : '0 0 20px rgba(255, 215, 0, 0.7)'};
    }
  }
`;

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Get character context
  const { 
    userXP
  } = useCharacter();
  
  // Use Solana wallet
  const { connected, publicKey, disconnect } = useWallet();
  
  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  return (
    <NavbarContainer style={{
      boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none',
      padding: scrolled ? '0.7rem 2rem' : '1rem 2rem',
    }}>
      <Logo to="/">
        <h1>NOVA</h1>
      </Logo>
      
      <NavLinks>
        <NavLink to="/" active={location.pathname === '/' ? 1 : 0}>
          Home
        </NavLink>
        <NavLink to="/agents" active={location.pathname === '/agents' || location.pathname.includes('/character/') ? 1 : 0}>
          Agents
        </NavLink>
        
        {connected ? (
          <WalletInfo>
            <XPDisplay>
              <label>XP:</label>
              <span>{userXP}</span>
            </XPDisplay>
            
            <AddressDisplay>
              <span>{formatAddress(publicKey?.toString())}</span>
            </AddressDisplay>
            
            <DisconnectButton onClick={disconnect}>
              <FaSignOutAlt /> Disconnect
            </DisconnectButton>
          </WalletInfo>
        ) : (
          <StyledWalletButton connected={connected}>
            <WalletMultiButton />
          </StyledWalletButton>
        )}
      </NavLinks>
      
      <MobileMenuButton onClick={() => setMobileMenuOpen(true)}>
        <FaBars />
      </MobileMenuButton>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <CloseButton onClick={() => setMobileMenuOpen(false)}>
              <FaTimes />
            </CloseButton>
            
            <MobileNavLink 
              to="/" 
              active={location.pathname === '/' ? 1 : 0}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </MobileNavLink>
            
            <MobileNavLink 
              to="/agents" 
              active={location.pathname === '/agents' || location.pathname.includes('/character/') ? 1 : 0}
              onClick={() => setMobileMenuOpen(false)}
            >
              Agents
            </MobileNavLink>
            
            {connected ? (
              <>
                <XPDisplay>
                  <label>XP:</label>
                  <span>{userXP}</span>
                </XPDisplay>
                
                <AddressDisplay>
                  <span>{formatAddress(publicKey?.toString())}</span>
                </AddressDisplay>
                
                <DisconnectButton onClick={disconnect}>
                  <FaSignOutAlt /> Disconnect
                </DisconnectButton>
              </>
            ) : (
              <StyledWalletButton connected={connected}>
                <WalletMultiButton />
              </StyledWalletButton>
            )}
          </MobileMenu>
        )}
      </AnimatePresence>
    </NavbarContainer>
  );
};

export default Navbar;