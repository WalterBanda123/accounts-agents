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
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  pencilOutline,
  saveOutline,
  closeOutline,
  businessOutline,
  mailOutline,
  callOutline,
  colorPalette,
  checkmark,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "./Profile.css";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { UserProfile } from "../interfaces/user";
import { StoreProfile } from "../interfaces/store";
import AvatarComponent from "../components/AvatarComponent";
import { generateUserAvatar } from "../utils/avatarUtils";
import {
  saveUserProfile,
  getUserProfile,
  getStoreProfile,
} from "../services/profileService";

const Profile: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load user and store profiles from localStorage (replace with API calls later)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);

  const [editData, setEditData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      // Try to load from Firestore first
      try {
        const firestoreUserProfile = await getUserProfile(user.id);
        const firestoreStoreProfile = await getStoreProfile(user.id);

        if (firestoreUserProfile) {
          setUserProfile(firestoreUserProfile);
          setEditData(firestoreUserProfile);
          // Update localStorage with Firestore data
          localStorage.setItem(
            "userProfile",
            JSON.stringify(firestoreUserProfile)
          );
        } else {
          // Fallback to localStorage
          const savedUserProfile = localStorage.getItem("userProfile");
          if (savedUserProfile) {
            const parsed = JSON.parse(savedUserProfile);
            setUserProfile(parsed);
            setEditData(parsed);
          } else {
            // Create fallback profile with proper avatar
            const fallbackProfile: Partial<UserProfile> = {
              user_id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              avatar: generateUserAvatar(user.id, user.name),
              language_preference: "English",
              preferred_currency: "USD",
              country: "Zimbabwe",
              business_owner: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status: "active",
            };
            setUserProfile(fallbackProfile as UserProfile);
            setEditData(fallbackProfile);
          }
        }

        if (firestoreStoreProfile) {
          setStoreProfile(firestoreStoreProfile);
          localStorage.setItem(
            "storeProfile",
            JSON.stringify(firestoreStoreProfile)
          );
        } else {
          const savedStoreProfile = localStorage.getItem("storeProfile");
          if (savedStoreProfile) {
            setStoreProfile(JSON.parse(savedStoreProfile));
          }
        }
      } catch (error) {
        console.error("Error loading profile from Firestore:", error);
        // Fallback to localStorage on error
        const savedUserProfile = localStorage.getItem("userProfile");
        if (savedUserProfile) {
          const parsed = JSON.parse(savedUserProfile);
          setUserProfile(parsed);
          setEditData(parsed);
        }
      }
    };

    loadProfileData();
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userProfile || {});
  };

  const handleSave = async () => {
    if (userProfile && editData) {
      const updatedProfile = {
        ...userProfile,
        ...editData,
        updated_at: new Date().toISOString(),
      };

      setUserProfile(updatedProfile);

      // Save to localStorage for immediate access
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

      // Save to Firestore database
      try {
        await saveUserProfile(updatedProfile);
        console.log("Profile saved to Firestore successfully");

        setIsEditing(false);
        setToastMessage("Profile updated successfully and saved to database");
        setShowToast(true);

        // Dispatch a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("profileUpdated", { detail: updatedProfile })
        );
      } catch (error) {
        console.error("Error saving to Firestore:", error);
        setToastMessage(
          "Profile updated locally. Database sync failed - please try again."
        );
        setShowToast(true);
        setIsEditing(false);
      }
    }
  };

  const handleCancel = () => {
    setEditData(userProfile || {});
    setIsEditing(false);
  };

  const handleAvatarColorChange = async (color: string) => {
    if (userProfile && userProfile.avatar) {
      const updatedAvatar = { ...userProfile.avatar, color };
      const updatedProfile = { ...userProfile, avatar: updatedAvatar };
      setUserProfile(updatedProfile);
      setEditData(updatedProfile);
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

      // Save to Firestore
      try {
        await saveUserProfile(updatedProfile);
        console.log("Avatar color updated in Firestore");
      } catch (error) {
        console.error("Error updating avatar color in Firestore:", error);
      }

      // Dispatch a custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("profileUpdated", { detail: updatedProfile })
      );
    }
  };

  const goToProfileSetup = () => {
    history.push("/profile-setup");
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
            {isEditing ? (
              <>
                <IonButton fill="clear" onClick={handleSave}>
                  <IonIcon icon={saveOutline} />
                </IonButton>
                <IonButton fill="clear" onClick={handleCancel}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </>
            ) : (
              <IonButton fill="clear" onClick={handleEdit}>
                <IonIcon icon={pencilOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-content">
        <div className="profile-container">
          {/* User Avatar and Basic Info */}
          <IonCard>
            <IonCardContent>
              <div className="profile-header">
                <div className="avatar-section">
                  <AvatarComponent
                    initials={userProfile.avatar?.initials || "U"}
                    color={userProfile.avatar?.color || "#3498db"}
                    size="large"
                  />
                  {!isEditing && (
                    <div className="color-picker">
                      <p>Tap to change color:</p>
                      <div className="color-options">
                        {["#3498db", "#e74c3c", "#2ecc71", "#f39c12"].map(
                          (color) => (
                            <div
                              key={color}
                              className={`color-option ${
                                userProfile.avatar?.color === color
                                  ? "selected"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => handleAvatarColorChange(color)}
                            >
                              {userProfile.avatar?.color === color && (
                                <IonIcon icon={checkmark} />
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="profile-name">
                  <h2>{userProfile.name}</h2>
                  <p>{storeProfile?.store_name || "Business Owner"}</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Personal Information */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Personal Information</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {isEditing ? (
                <>
                  <IonItem>
                    <IonLabel position="stacked">Full Name</IonLabel>
                    <IonInput
                      value={editData.name}
                      onIonInput={(e) =>
                        setEditData({ ...editData, name: e.detail.value! })
                      }
                      placeholder="Enter your full name"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      value={editData.email}
                      onIonInput={(e) =>
                        setEditData({ ...editData, email: e.detail.value! })
                      }
                      placeholder="Enter your email"
                      readonly
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Phone</IonLabel>
                    <IonInput
                      value={editData.phone}
                      onIonInput={(e) =>
                        setEditData({ ...editData, phone: e.detail.value! })
                      }
                      placeholder="Enter your phone number"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Country</IonLabel>
                    <IonSelect
                      value={editData.country}
                      onIonChange={(e) =>
                        setEditData({ ...editData, country: e.detail.value })
                      }
                    >
                      <IonSelectOption value="Zimbabwe">
                        Zimbabwe
                      </IonSelectOption>
                      <IonSelectOption value="South Africa">
                        South Africa
                      </IonSelectOption>
                      <IonSelectOption value="Botswana">
                        Botswana
                      </IonSelectOption>
                      <IonSelectOption value="Zambia">Zambia</IonSelectOption>
                      <IonSelectOption value="Other">Other</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">City</IonLabel>
                    <IonInput
                      value={editData.city}
                      onIonInput={(e) =>
                        setEditData({ ...editData, city: e.detail.value! })
                      }
                      placeholder="Enter your city"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Language Preference</IonLabel>
                    <IonSelect
                      value={editData.language_preference}
                      onIonChange={(e) =>
                        setEditData({
                          ...editData,
                          language_preference: e.detail.value,
                        })
                      }
                    >
                      <IonSelectOption value="English">English</IonSelectOption>
                      <IonSelectOption value="Shona">Shona</IonSelectOption>
                      <IonSelectOption value="Ndebele">Ndebele</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Preferred Currency</IonLabel>
                    <IonSelect
                      value={editData.preferred_currency}
                      onIonChange={(e) =>
                        setEditData({
                          ...editData,
                          preferred_currency: e.detail.value,
                        })
                      }
                    >
                      <IonSelectOption value="USD">USD ($)</IonSelectOption>
                      <IonSelectOption value="ZIG">ZIG (Z$)</IonSelectOption>
                      <IonSelectOption value="ZWL">ZWL</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </>
              ) : (
                <div className="profile-info">
                  <div className="info-item">
                    <IonIcon icon={mailOutline} />
                    <div>
                      <p className="label">Email</p>
                      <p className="value">{userProfile.email}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={callOutline} />
                    <div>
                      <p className="label">Phone</p>
                      <p className="value">
                        {userProfile.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={businessOutline} />
                    <div>
                      <p className="label">Location</p>
                      <p className="value">
                        {userProfile.city
                          ? `${userProfile.city}, ${userProfile.country}`
                          : userProfile.country}
                      </p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={colorPalette} />
                    <div>
                      <p className="label">Language</p>
                      <p className="value">{userProfile.language_preference}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={colorPalette} />
                    <div>
                      <p className="label">Currency</p>
                      <p className="value">{userProfile.preferred_currency}</p>
                    </div>
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Store Information */}
          {storeProfile && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Store Information</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="profile-info">
                  <div className="info-item">
                    <IonIcon icon={businessOutline} />
                    <div>
                      <p className="label">Store Name</p>
                      <p className="value">{storeProfile.store_name}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={businessOutline} />
                    <div>
                      <p className="label">Business Type</p>
                      <p className="value">{storeProfile.business_type}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={businessOutline} />
                    <div>
                      <p className="label">Business Size</p>
                      <p className="value">{storeProfile.business_size}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <IonIcon icon={businessOutline} />
                    <div>
                      <p className="label">Currency</p>
                      <p className="value">{storeProfile.currency}</p>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Setup Actions */}
          <IonCard>
            <IonCardContent>
              <IonButton
                expand="block"
                fill="outline"
                onClick={goToProfileSetup}
              >
                Update Profile Setup
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
