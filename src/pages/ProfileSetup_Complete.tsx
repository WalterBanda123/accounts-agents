import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonToast,
  IonIcon,
  IonChip,
} from '@ionic/react';
import { 
  storefront, 
  person, 
  location, 
  business,
  checkmark,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import useAuthContext from '../contexts/auth/UseAuthContext';
import AvatarComponent from '../components/AvatarComponent';
import { generateUserAvatar, generateStoreAvatar } from '../utils/avatarUtils';
import { UserProfile } from '../interfaces/user';
import { StoreProfile } from '../interfaces/store';
import { saveUserProfile, saveStoreProfile } from '../services/profileService';
import './ProfileSetup.css';

const ProfileSetup: React.FC = () => {
  const { user } = useAuthContext();
  const history = useHistory();

  // User Profile State
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    user_id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    language_preference: 'English',
    preferred_currency: 'USD',
    country: 'Zimbabwe',
    business_owner: true,
  });

  // Store Profile State
  const [storeProfile, setStoreProfile] = useState<Partial<StoreProfile>>({
    user_id: user?.id || '',
    store_name: user?.businessName || '',
    business_type: 'general',
    currency: 'USD',
    tax_rate: 0.15,
    business_size: 'small',
    location: {
      country: 'Zimbabwe',
    },
    industry_profile: {
      common_brands: [],
      product_categories: [],
    },
  });

  // UI State
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  // Avatar State
  const [userAvatar, setUserAvatar] = useState(generateUserAvatar(user?.id || '', user?.name || ''));
  const [storeAvatar, setStoreAvatar] = useState(generateStoreAvatar(user?.id || '', user?.businessName || ''));

  // Product categories for selection
  const productCategories = [
    'Beverages', 'Snacks', 'Groceries', 'Personal Care', 'Household Items',
    'Electronics', 'Clothing', 'Medicine', 'Fresh Produce', 'Dairy Products',
    'Meat & Poultry', 'Bakery', 'Cleaning Supplies', 'Baby Products', 'Office Supplies'
  ];

  // Common brands for selection
  const commonBrands = [
    'Coca-Cola', 'Fanta', 'Sprite', 'Mazowe', 'Tanganda', 'Blue Ribbon',
    'Surf', 'Sunlight', 'Vaseline', 'Colgate', 'Reckitt', 'Unilever',
    'Nestle', 'Procter & Gamble', 'Johnson & Johnson', 'Nivea'
  ];

  // Update avatars when names change
  useEffect(() => {
    if (userProfile.name) {
      setUserAvatar(prev => ({
        ...prev,
        initials: generateUserAvatar(userProfile.user_id || '', userProfile.name || '').initials
      }));
    }
  }, [userProfile.name, userProfile.user_id]);

  useEffect(() => {
    if (storeProfile.store_name) {
      setStoreAvatar(prev => ({
        ...prev,
        initials: generateStoreAvatar(storeProfile.user_id || '', storeProfile.store_name || '').initials
      }));
    }
  }, [storeProfile.store_name, storeProfile.user_id]);

  const handleUserProfileChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStoreProfileChange = (field: keyof StoreProfile, value: string | number) => {
    setStoreProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setStoreProfile(prev => ({
      ...prev,
      location: {
        ...prev.location,
        country: prev.location?.country || 'Zimbabwe',
        [field]: value
      }
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setStoreProfile(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const toggleCategory = (category: string) => {
    setStoreProfile(prev => {
      const categories = prev.industry_profile?.product_categories || [];
      const isSelected = categories.includes(category);
      
      return {
        ...prev,
        industry_profile: {
          ...prev.industry_profile,
          product_categories: isSelected
            ? categories.filter(c => c !== category)
            : [...categories, category],
          common_brands: prev.industry_profile?.common_brands || []
        }
      };
    });
  };

  const toggleBrand = (brand: string) => {
    setStoreProfile(prev => {
      const brands = prev.industry_profile?.common_brands || [];
      const isSelected = brands.includes(brand);
      
      return {
        ...prev,
        industry_profile: {
          ...prev.industry_profile,
          common_brands: isSelected
            ? brands.filter(b => b !== brand)
            : [...brands, brand],
          product_categories: prev.industry_profile?.product_categories || []
        }
      };
    });
  };

  const handleAvatarColorChange = (color: string, type: 'user' | 'store') => {
    if (type === 'user') {
      setUserAvatar(prev => ({ ...prev, color }));
    } else {
      setStoreAvatar(prev => ({ ...prev, color }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(userProfile.name && userProfile.email && userProfile.country);
      case 2:
        return !!(storeProfile.store_name && storeProfile.business_type && storeProfile.location?.country);
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      setToastMessage('Please fill in all required fields');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(2)) {
      setToastMessage('Please complete all required information');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare final profile data
      const finalUserProfile: UserProfile = {
        ...userProfile,
        avatar: userAvatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      } as UserProfile;

      const finalStoreProfile: StoreProfile = {
        ...storeProfile,
        store_id: `store_${user?.id}_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      } as StoreProfile;

      console.log('Saving profiles to Firestore...');
      console.log('User Profile:', finalUserProfile);
      console.log('Store Profile:', finalStoreProfile);

      // Save to Firestore database
      await Promise.all([
        saveUserProfile(finalUserProfile),
        saveStoreProfile(finalStoreProfile)
      ]);

      // Save to localStorage for immediate access
      localStorage.setItem('userProfile', JSON.stringify(finalUserProfile));
      localStorage.setItem('storeProfile', JSON.stringify(finalStoreProfile));

      setToastMessage('Profile setup completed successfully and saved to database!');
      setToastColor('success');
      setShowToast(true);

      // Dispatch a custom event to notify other components of profile completion
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { userProfile: finalUserProfile, storeProfile: finalStoreProfile }
      }));

      // Redirect to home after a brief delay
      setTimeout(() => {
        history.push('/home');
      }, 2000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setToastMessage('Failed to save profile to database. Please try again.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserProfileStep = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={person} style={{ marginRight: '8px' }} />
          Personal Information
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="avatar-section">
          <div className="avatar-display">
            <AvatarComponent
              initials={userAvatar.initials}
              color={userAvatar.color}
              size="large"
            />
          </div>
          <div className="color-picker">
            <p>Choose avatar color:</p>
            <div className="color-options">
              {['#3498db', '#e74c3c', '#2ecc71', '#f39c12'].map((color) => (
                <div
                  key={color}
                  className={`color-option ${userAvatar.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleAvatarColorChange(color, 'user')}
                >
                  {userAvatar.color === color && <IonIcon icon={checkmark} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <IonItem>
          <IonLabel position="stacked">Full Name *</IonLabel>
          <IonInput
            value={userProfile.name}
            onIonInput={(e) => handleUserProfileChange('name', e.detail.value!)}
            placeholder="Enter your full name"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Email *</IonLabel>
          <IonInput
            value={userProfile.email}
            onIonInput={(e) => handleUserProfileChange('email', e.detail.value!)}
            placeholder="Enter your email"
            readonly
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Phone Number</IonLabel>
          <IonInput
            value={userProfile.phone}
            onIonInput={(e) => handleUserProfileChange('phone', e.detail.value!)}
            placeholder="Enter your phone number"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Country *</IonLabel>
          <IonSelect
            value={userProfile.country}
            onIonChange={(e) => handleUserProfileChange('country', e.detail.value)}
          >
            <IonSelectOption value="Zimbabwe">Zimbabwe</IonSelectOption>
            <IonSelectOption value="South Africa">South Africa</IonSelectOption>
            <IonSelectOption value="Botswana">Botswana</IonSelectOption>
            <IonSelectOption value="Zambia">Zambia</IonSelectOption>
            <IonSelectOption value="Other">Other</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">City</IonLabel>
          <IonInput
            value={userProfile.city}
            onIonInput={(e) => handleUserProfileChange('city', e.detail.value!)}
            placeholder="Enter your city"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Language Preference</IonLabel>
          <IonSelect
            value={userProfile.language_preference}
            onIonChange={(e) => handleUserProfileChange('language_preference', e.detail.value)}
          >
            <IonSelectOption value="English">English</IonSelectOption>
            <IonSelectOption value="Shona">Shona</IonSelectOption>
            <IonSelectOption value="Ndebele">Ndebele</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Preferred Currency</IonLabel>
          <IonSelect
            value={userProfile.preferred_currency}
            onIonChange={(e) => handleUserProfileChange('preferred_currency', e.detail.value)}
          >
            <IonSelectOption value="USD">USD ($)</IonSelectOption>
            <IonSelectOption value="ZIG">ZIG (Z$)</IonSelectOption>
            <IonSelectOption value="ZWL">ZWL</IonSelectOption>
          </IonSelect>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderStoreProfileStep = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={storefront} style={{ marginRight: '8px' }} />
          Store Information
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="avatar-section">
          <div className="avatar-display">
            <AvatarComponent
              initials={storeAvatar.initials}
              color={storeAvatar.color}
              size="large"
            />
          </div>
          <div className="color-picker">
            <p>Choose store avatar color:</p>
            <div className="color-options">
              {['#3498db', '#e74c3c', '#2ecc71', '#f39c12'].map((color) => (
                <div
                  key={color}
                  className={`color-option ${storeAvatar.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleAvatarColorChange(color, 'store')}
                >
                  {storeAvatar.color === color && <IonIcon icon={checkmark} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <IonItem>
          <IonLabel position="stacked">Store Name *</IonLabel>
          <IonInput
            value={storeProfile.store_name}
            onIonInput={(e) => handleStoreProfileChange('store_name', e.detail.value!)}
            placeholder="Enter your store name"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Business Type *</IonLabel>
          <IonSelect
            value={storeProfile.business_type}
            onIonChange={(e) => handleStoreProfileChange('business_type', e.detail.value)}
          >
            <IonSelectOption value="grocery">Grocery Store</IonSelectOption>
            <IonSelectOption value="pharmacy">Pharmacy</IonSelectOption>
            <IonSelectOption value="electronics">Electronics</IonSelectOption>
            <IonSelectOption value="clothing">Clothing</IonSelectOption>
            <IonSelectOption value="general">General Store</IonSelectOption>
            <IonSelectOption value="other">Other</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Store Description</IonLabel>
          <IonTextarea
            value={storeProfile.description}
            onIonInput={(e) => handleStoreProfileChange('description', e.detail.value!)}
            placeholder="Brief description of your store"
            rows={3}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Business Size</IonLabel>
          <IonSelect
            value={storeProfile.business_size}
            onIonChange={(e) => handleStoreProfileChange('business_size', e.detail.value)}
          >
            <IonSelectOption value="small">Small (1-10 employees)</IonSelectOption>
            <IonSelectOption value="medium">Medium (11-50 employees)</IonSelectOption>
            <IonSelectOption value="large">Large (50+ employees)</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Primary Currency</IonLabel>
          <IonSelect
            value={storeProfile.currency}
            onIonChange={(e) => handleStoreProfileChange('currency', e.detail.value)}
          >
            <IonSelectOption value="USD">USD ($)</IonSelectOption>
            <IonSelectOption value="ZIG">ZIG (Z$)</IonSelectOption>
            <IonSelectOption value="ZWL">ZWL</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Tax Rate (%)</IonLabel>
          <IonInput
            type="number"
            value={(storeProfile.tax_rate || 0) * 100}
            onIonInput={(e) => handleStoreProfileChange('tax_rate', parseFloat(e.detail.value!) / 100)}
            placeholder="15"
          />
        </IonItem>

        {/* Location Information */}
        <div className="section-header">
          <IonIcon icon={location} />
          <h3>Location & Contact</h3>
        </div>

        <IonItem>
          <IonLabel position="stacked">Country *</IonLabel>
          <IonSelect
            value={storeProfile.location?.country}
            onIonChange={(e) => handleLocationChange('country', e.detail.value)}
          >
            <IonSelectOption value="Zimbabwe">Zimbabwe</IonSelectOption>
            <IonSelectOption value="South Africa">South Africa</IonSelectOption>
            <IonSelectOption value="Botswana">Botswana</IonSelectOption>
            <IonSelectOption value="Zambia">Zambia</IonSelectOption>
            <IonSelectOption value="Other">Other</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">City</IonLabel>
          <IonInput
            value={storeProfile.location?.city}
            onIonInput={(e) => handleLocationChange('city', e.detail.value!)}
            placeholder="Enter city"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Address</IonLabel>
          <IonTextarea
            value={storeProfile.location?.address}
            onIonInput={(e) => handleLocationChange('address', e.detail.value!)}
            placeholder="Store address"
            rows={2}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Store Phone</IonLabel>
          <IonInput
            value={storeProfile.contact?.phone}
            onIonInput={(e) => handleContactChange('phone', e.detail.value!)}
            placeholder="Store phone number"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Store Email</IonLabel>
          <IonInput
            value={storeProfile.contact?.email}
            onIonInput={(e) => handleContactChange('email', e.detail.value!)}
            placeholder="Store email address"
          />
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderBusinessProfileStep = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={business} style={{ marginRight: '8px' }} />
          Business Profile (Optional)
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="section-description">
          Help us personalize your experience by selecting the product categories and brands you commonly sell.
        </p>

        <div className="section-header">
          <h3>Product Categories</h3>
        </div>
        <div className="chip-grid">
          {productCategories.map((category) => (
            <IonChip
              key={category}
              color={storeProfile.industry_profile?.product_categories?.includes(category) ? 'primary' : 'medium'}
              onClick={() => toggleCategory(category)}
            >
              <IonLabel>{category}</IonLabel>
              {storeProfile.industry_profile?.product_categories?.includes(category) && (
                <IonIcon icon={checkmark} />
              )}
            </IonChip>
          ))}
        </div>

        <div className="section-header">
          <h3>Common Brands</h3>
        </div>
        <div className="chip-grid">
          {commonBrands.map((brand) => (
            <IonChip
              key={brand}
              color={storeProfile.industry_profile?.common_brands?.includes(brand) ? 'primary' : 'medium'}
              onClick={() => toggleBrand(brand)}
            >
              <IonLabel>{brand}</IonLabel>
              {storeProfile.industry_profile?.common_brands?.includes(brand) && (
                <IonIcon icon={checkmark} />
              )}
            </IonChip>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonTitle>Profile Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-setup-content">
        <div className="setup-container">
          {/* Progress indicator */}
          <div className="progress-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <div className="progress-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <div className="progress-line"></div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
          </div>

          <div className="step-content">
            {currentStep === 1 && renderUserProfileStep()}
            {currentStep === 2 && renderStoreProfileStep()}
            {currentStep === 3 && renderBusinessProfileStep()}
          </div>

          {/* Navigation buttons */}
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <IonButton
                fill="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </IonButton>
            )}
            
            {currentStep < 3 ? (
              <IonButton
                onClick={handleNext}
                disabled={!validateStep(currentStep) || isLoading}
              >
                Next
              </IonButton>
            ) : (
              <IonButton
                onClick={handleComplete}
                disabled={isLoading}
                color="success"
              >
                {isLoading ? (
                  <>
                    <IonSpinner name="circular" style={{ marginRight: '8px' }} />
                    Saving...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </IonButton>
            )}
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ProfileSetup;
