import { useState, useEffect } from 'react';
import { UserProfile } from '../interfaces/user';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Load user profile from localStorage
    const loadProfile = () => {
      const savedUserProfile = localStorage.getItem('userProfile');
      if (savedUserProfile) {
        try {
          setUserProfile(JSON.parse(savedUserProfile));
        } catch (error) {
          console.error('Error parsing user profile from localStorage:', error);
        }
      }
    };

    loadProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  return userProfile;
};
