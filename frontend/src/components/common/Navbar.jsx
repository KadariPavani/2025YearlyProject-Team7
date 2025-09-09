// Navbar.js
import React from 'react';

const Navbar = ({ onLogoClick, onLoginClick, isAdmin }) => (
  <div style={styles.navbar}>
    <div style={styles.logoContainer} onClick={onLogoClick}>
      <img src="/logo.svg" alt="Infoverses Logo" style={styles.logo} />
      <span style={styles.logoText}>INFOVERSE</span>
    </div>
    <button
      style={styles.loginButton}
      onClick={onLoginClick}
    >
      {isAdmin ? 'LOGOUT' : 'LOGIN'}
    </button>
  </div>
);

const styles = {
  navbar: {
    width: '100%',
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(90deg, #DED7F8 0%, #6A9DFD 100%)',
    padding: '0 24px',
    boxSizing: 'border-box',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  logo: {
    height: 32,
    marginRight: 8,
  },
  logoText: {
    color: '#2C377C',
    fontWeight: 600,
    letterSpacing: 2,
    fontSize: 12,
  },
  loginButton: {
    backgroundColor: '#FF3044',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '4px 20px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
    transition: 'background 0.2s',
  }
};

export default Navbar;
