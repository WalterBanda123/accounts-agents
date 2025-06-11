import React, { useState } from "react";
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
import { UserInterface } from "../interfaces/user";

const Profile: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [profileData, setProfileData] = useState<UserInterface | null>(user);

  const [editData, setEditData] = useState<UserInterface>({
    id:"",
    name: profileData?.name || "",
    email: profileData?.email || "",
    businessName: profileData?.businessName || "",
    phone: profileData?.phone || "",
    profileImage: profileData?.profileImage || "",
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      id: "",
      name: profileData?.name || "",
      email: profileData?.email || "",
      businessName: profileData?.businessName || "",
      phone: profileData?.phone || "",
      profileImage: profileData?.profileImage || "",
    });
  };

  const handleSave = () => {
    setProfileData({ ...editData });
    setIsEditing(false);
    setToastMessage("Profile updated successfully");
    setShowToast(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      id: "",
      name: profileData?.name || "",
      email: profileData?.email || "",
      businessName: profileData?.businessName || "",
      phone: profileData?.phone || "",
      profileImage: profileData?.profileImage || "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleImageChange = () => {
    // Image upload logic would go here
    setToastMessage("Image upload feature coming soon");
    setShowToast(true);
  };

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
                <img src={profileData?.profileImage} alt="Profile" />
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
                <h2>{profileData?.name}</h2>
                <p>{profileData?.businessName}</p>
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
                  <IonIcon icon={businessOutline} slot="start" color="medium" />
                  <IonLabel position="stacked">Business Name</IonLabel>
                  <IonInput
                    value={editData.businessName}
                    onIonInput={(e) =>
                      handleInputChange("businessName", e.detail.value!)
                    }
                    placeholder="Enter your business name"
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
                    <p>{profileData?.name}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={businessOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Business Name</label>
                    <p>{profileData?.businessName}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={mailOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Email</label>
                    <p>{profileData?.email}</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <IonIcon icon={callOutline} color="medium" />
                  </div>
                  <div className="info-content">
                    <label>Phone Number</label>
                    <p>{profileData?.phone}</p>
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
