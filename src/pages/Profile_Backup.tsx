import React, { useState, useEffect } from "react";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonAvatar,
  IonToast,
} from "@ionic/react";
import {
  pencilOutline,
  saveOutline,
  closeOutline,
  cameraOutline,
  businessOutline,
  mailOutline,
  callOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "./Profile.css";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { UserProfile } from "../interfaces/user";
// Avatar utilities not needed for backup file

const Profile: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load user profile from localStorage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [editData, setEditData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    // Load profiles from localStorage
    const savedUserProfile = localStorage.getItem('userProfile');
    
    if (savedUserProfile) {
      const parsed = JSON.parse(savedUserProfile);
      setUserProfile(parsed);
      setEditData(parsed);
    } else if (user) {
      // Fallback to basic user data if no profile setup completed
      const fallbackProfile: Partial<UserProfile> = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language_preference: 'English',
        preferred_currency: 'USD',
        location: 'Zimbabwe',
        business_owner: true,
      };
      setUserProfile(fallbackProfile as UserProfile);
      setEditData(fallbackProfile);
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userProfile || {});
  };

  const handleSave = () => {
    if (userProfile && editData) {
      const updatedProfile = {
        ...userProfile,
        ...editData,
        updated_at: new Date().toISOString(),
      };
      
      setUserProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setIsEditing(false);
      setToastMessage("Profile updated successfully");
      setShowToast(true);
    }
  };

  const handleCancel = () => {
    setEditData(userProfile || {});
    setIsEditing(false);
  };

  const goToProfileSetup = () => {
    history.push('/profile-setup');
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleImageChange = () => {
    // Image upload logic would go here
    setToastMessage("Image upload feature coming soon");
    setShowToast(true);
  };

  if (!userProfile) {
    return (
      <IonPage>
        <IonHeader mode="ios">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="profile-content">
          <div className="profile-setup-prompt">
            <p>Complete your profile setup to get started!</p>
            <IonButton expand="block" onClick={goToProfileSetup}>
              Complete Profile Setup
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            {!isEditing ? (
              <IonButton fill="clear" onClick={handleEdit}>
                <IonIcon icon={pencilOutline} />
              </IonButton>
            ) : (
              <>
                <IonButton fill="clear" onClick={handleCancel}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
                <IonButton fill="clear" onClick={handleSave}>
                  <IonIcon icon={saveOutline} />
                </IonButton>
              </>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="profile-content">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="profile-container">
          {/* Profile Image Section */}
          <div className="profile-image-section">
            <div className="avatar-container">
              <IonAvatar className="profile-avatar-large">
                <img src={userProfile?.email || ''} alt="Profile" />
              </IonAvatar>
              {isEditing && (
                <IonButton
                  fill="clear"
                  className="camera-button"
                  onClick={handleImageChange}
                >
                  <IonIcon icon={cameraOutline} />
                </IonButton>
              )}
            </div>

            {!isEditing && (
              <div className="profile-name">
                <h2>{userProfile?.name}</h2>
                <p>{userProfile?.email}</p>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="profile-info-section">
            {isEditing ? (
              // Edit Mode
              <div className="edit-form">
                <IonItem className="profile-item">
                  <IonIcon icon={businessOutline} slot="start" color="medium" />
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput
                    value={editData.name}
                    onIonInput={(e) =>
                      handleInputChange("name", e.detail.value!)
                    }
                    placeholder="Enter your full name"
                  />
                </IonItem>

                <IonItem className="profile-item">
                  <IonIcon icon={mailOutline} slot="start" color="medium" />
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={editData.email}
                    onIonInput={(e) =>
                      handleInputChange("email", e.detail.value!)
                    }
                    placeholder="Enter your email"
                  />
                </IonItem>

                <IonItem className="profile-item">
                  <IonIcon icon={callOutline} slot="start" color="medium" />
                  <IonLabel position="stacked">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    value={editData.phone}
                    onIonInput={(e) =>
                      handleInputChange("phone", e.detail.value!)
                    }
                    placeholder="Enter your phone number"
                  />
                </IonItem>
              </div>
            ) : (
              // View Mode
              <div className="view-info">
                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={businessOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Full Name</label>
                    <p>{userProfile?.name}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={businessOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Business Name</label>
                    <p>{userProfile?.email}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={mailOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Email</label>
                    <p>{userProfile?.email}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={callOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Phone Number</label>
                    <p>{userProfile?.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Stats Section */}
          <div className="stats-section">
            <h3>Account Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">156</div>
                <div className="stat-label">Total Transactions</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">$12,450</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">45</div>
                <div className="stat-label">Products in Stock</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">30</div>
                <div className="stat-label">Days Active</div>
              </div>
            </div>
          </div>

          {/* Additional Actions */}
          {!isEditing && (
            <div className="actions-section">
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                onClick={() => history.push("/account-settings")}
              >
                Account Settings
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                color="danger"
                onClick={() => history.push("/login")}
              >
                Sign Out
              </IonButton>
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
