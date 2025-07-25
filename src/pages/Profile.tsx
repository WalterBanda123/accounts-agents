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
  IonSelect,
  IonSelectOption,
  IonCheckbox,
} from "@ionic/react";
import {
  pencilOutline,
  closeOutline,
  businessOutline,
  mailOutline,
  callOutline,
  globeOutline,
  locationOutline,
  cardOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "./Profile.css";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { UserProfile } from "../interfaces/user";
import InitialsAvatar from "../components/InitialsAvatar";
import LocationAutoComplete from "../components/LocationAutoComplete";
import profileService from "../services/profileService";

const Profile: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize profile data from authenticated user, with fallbacks for missing data
  const [profileData, setProfileData] = useState<UserProfile>({
    user_id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    language_preference: "English", // Default if not set
    location: "", // Let user fill this in
    created_at: new Date().toISOString(),
    business_owner: false, // Default if not set
    preferred_currency: "USD", // Default if not set
  });

  const [editData, setEditData] = useState<UserProfile>({
    ...profileData,
  });

  // Load user profile from Firestore on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          const savedProfile = await profileService.getUserProfile(user.id);

          if (savedProfile) {
            setProfileData(savedProfile);
            setEditData(savedProfile);
          } else {
            // If no profile exists, create one with current user data
            const initialProfile: UserProfile = {
              user_id: user.id,
              name: user.name || "",
              email: user.email || "",
              phone: user.phone || "",
              language_preference: "English",
              location: "",
              created_at: new Date().toISOString(),
              business_owner: false,
              preferred_currency: "USD",
            };
            setProfileData(initialProfile);
            setEditData(initialProfile);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          setToastMessage("Error loading profile data");
          setShowToast(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
  };

  const handleSave = async () => {
    if (!user?.id) {
      setToastMessage("User not found");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);

      // Save to Firestore
      await profileService.updateUserProfile(user.id, editData);

      // Update local state
      setProfileData({ ...editData });
      setIsEditing(false);
      setToastMessage("Profile updated successfully");
      setShowToast(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      setToastMessage("Error saving profile. Please try again.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...profileData });
  };

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | boolean
  ) => {
    setEditData({ ...editData, [field]: value });
  };

  // Calculate profile completion percentage
  const getProfileCompletion = (): number => {
    const fields = ["name", "email", "phone", "location"];
    const filledFields = fields.filter(
      (field) => profileData[field as keyof UserProfile]
    );
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const profileCompletion = getProfileCompletion();

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
              <IonButton fill="clear" onClick={handleCancel}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-content">
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <IonIcon
              icon={businessOutline}
              color="medium"
              style={{ fontSize: "24px" }}
            />
          </div>
        ) : (
          <div className="profile-container">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="avatar-section">
                <InitialsAvatar
                  name={profileData.name || "User"}
                  size="extra-large"
                  className="profile-avatar"
                />
              </div>

              <div className="profile-details">
                <h1 className="profile-name">
                  {profileData.name || "Complete your profile"}
                </h1>
                <p className="profile-subtitle">
                  {profileData.business_owner
                    ? "Business Owner"
                    : "Individual Account"}
                </p>
                {profileCompletion < 100 && (
                  <div className="profile-completion">
                    <div className="completion-bar">
                      <div
                        className="completion-fill"
                        style={{ width: `${profileCompletion}%` }}
                      ></div>
                    </div>
                    <p className="completion-text">
                      Profile {profileCompletion}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="profile-section">
              {isEditing ? (
                // Edit Mode
                <div className="edit-form">
                  <div className="form-section">
                    <h2 className="section-title">Personal Information</h2>

                    <IonItem className="input-item">
                      <IonLabel position="stacked">Full Name</IonLabel>
                      <IonInput
                        value={editData.name}
                        onIonInput={(e) =>
                          handleInputChange("name", e.detail.value!)
                        }
                        placeholder="Enter your full name"
                      />
                    </IonItem>

                    <IonItem className="input-item">
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

                    <IonItem className="input-item">
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

                    <LocationAutoComplete
                      value={editData.location}
                      onLocationChange={(location: string) =>
                        handleInputChange("location", location)
                      }
                      className="input-item"
                      placeholder="Search for your location"
                    />
                  </div>

                  <div className="form-section">
                    <h2 className="section-title">Preferences</h2>

                    <IonItem className="input-item">
                      <IonLabel position="stacked">Language</IonLabel>
                      <IonSelect
                        value={editData.language_preference}
                        onIonChange={(e) =>
                          handleInputChange(
                            "language_preference",
                            e.detail.value
                          )
                        }
                        interface="popover"
                        placeholder="Select language"
                      >
                        <IonSelectOption value="English">
                          English
                        </IonSelectOption>
                        <IonSelectOption value="Shona">Shona</IonSelectOption>
                        <IonSelectOption value="Ndebele">
                          Ndebele
                        </IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <IonItem className="input-item">
                      <IonLabel position="stacked">Currency</IonLabel>
                      <IonSelect
                        value={editData.preferred_currency}
                        onIonChange={(e) =>
                          handleInputChange(
                            "preferred_currency",
                            e.detail.value
                          )
                        }
                        interface="popover"
                        placeholder="Select currency"
                      >
                        <IonSelectOption value="USD">USD</IonSelectOption>
                        <IonSelectOption value="ZWL">ZWL</IonSelectOption>
                        <IonSelectOption value="EUR">EUR</IonSelectOption>
                        <IonSelectOption value="GBP">GBP</IonSelectOption>
                      </IonSelect>
                    </IonItem>

                    <IonItem className="input-item checkbox-item">
                      <IonLabel>Business Owner</IonLabel>
                      <IonCheckbox
                        slot="end"
                        checked={editData.business_owner}
                        onIonChange={(e) =>
                          handleInputChange("business_owner", e.detail.checked)
                        }
                      />
                    </IonItem>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="view-info">
                  <div className="info-section">
                    <h2 className="section-title">Personal Information</h2>

                    <div className="info-grid">
                      <div className="info-item">
                        <IonIcon icon={businessOutline} className="info-icon" />
                        <div className="info-content">
                          <span className="info-label">Name</span>
                          <span
                            className={`info-value ${
                              !profileData.name ? "empty" : ""
                            }`}
                          >
                            {profileData.name || "Not set"}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <IonIcon icon={mailOutline} className="info-icon" />
                        <div className="info-content">
                          <span className="info-label">Email</span>
                          <span
                            className={`info-value ${
                              !profileData.email ? "empty" : ""
                            }`}
                          >
                            {profileData.email || "Not set"}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <IonIcon icon={callOutline} className="info-icon" />
                        <div className="info-content">
                          <span className="info-label">Phone</span>
                          <span
                            className={`info-value ${
                              !profileData.phone ? "empty" : ""
                            }`}
                          >
                            {profileData.phone || "Not set"}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <IonIcon icon={locationOutline} className="info-icon" />
                        <div className="info-content">
                          <span className="info-label">Location</span>
                          <span
                            className={`info-value ${
                              !profileData.location ? "empty" : ""
                            }`}
                          >
                            {profileData.location || "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h2 className="section-title">Preferences</h2>

                    <div className="info-grid">
                      <div className="info-item">
                        <IonIcon icon={globeOutline} className="info-icon" />
                        <div className="info-content">
                          <span className="info-label">Language</span>
                          <span className="info-value">
                            {profileData.language_preference}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <IonIcon icon={cardOutline} className="info-icon" />
                        <div className="info-content">
                          <span className="info-label">Currency</span>
                          <span className="info-value">
                            {profileData.preferred_currency}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <IonIcon
                          icon={checkmarkCircleOutline}
                          className="info-icon"
                        />
                        <div className="info-content">
                          <span className="info-label">Account Type</span>
                          <span className="info-value">
                            {profileData.business_owner
                              ? "Business Owner"
                              : "Individual"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="actions-section">
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={() => history.push("/account-settings")}
                  className="action-button"
                >
                  Account Settings
                </IonButton>

                <IonButton
                  expand="block"
                  fill="clear"
                  color="danger"
                  onClick={() => history.push("/login")}
                  className="action-button"
                >
                  Sign Out
                </IonButton>
              </div>
            )}
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
          color="success"
          translucent
        />

        {/* Footer Save Button - Only show when editing */}
        {isEditing && (
          <div className="save-footer">
            <div className="footer-buttons">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleCancel}
                className="cancel-button"
                style={{ flex: "1" }}
              >
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={isSaving}
                className="save-button"
                style={{ flex: "2" }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
