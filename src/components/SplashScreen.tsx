import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        onComplete();
      }, 500); // Wait for fade out animation
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <img 
            src="/splash-logo.png" 
            alt="Logo" 
            className="splash-logo"
          />
        </div>
        <div className="splash-text">
          <h1 className="splash-title">Welcome to Account Manager</h1>
          <p className="splash-subtitle">Your trusted financial companion</p>
        </div>
        <div className="splash-loading">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <div className="splash-hero">
        <img 
          src="/splash-hero.png" 
          alt="Hero" 
          className="splash-hero-image"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
