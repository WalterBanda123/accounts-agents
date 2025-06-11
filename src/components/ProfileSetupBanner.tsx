import React from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonChip,
  IonLabel,
} from "@ionic/react";
import {
  personCircleOutline,
  storefrontOutline,
  checkmarkCircle,
  arrowForward,
  closeOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { ProfileCompletionStatus } from "../utils/profileUtils";
import "./ProfileSetupBanner.css";

interface ProfileSetupBannerProps {
  completionStatus: ProfileCompletionStatus;
  isNewUser: boolean;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

const ProfileSetupBanner: React.FC<ProfileSetupBannerProps> = ({
  completionStatus,
  isNewUser,
  onDismiss,
  showDismiss = true,
}) => {
  const history = useHistory();

  const handleCompleteSetup = () => {
    history.push("/profile-setup");
  };

  const handleViewProfile = () => {
    history.push("/profile");
  };

  // Don't show banner if profile is fully complete and user is not new
  if (completionStatus.isFullyComplete && !isNewUser) {
    return null;
  }

  const getStatusColor = () => {
    if (completionStatus.completionPercentage >= 80) return "success";
    if (completionStatus.completionPercentage >= 50) return "warning";
    return "primary";
  };

  const getStatusIcon = () => {
    if (completionStatus.isFullyComplete) return checkmarkCircle;
    if (completionStatus.isUserProfileComplete) return personCircleOutline;
    return storefrontOutline;
  };

  const getMessage = () => {
    if (completionStatus.isFullyComplete) {
      return isNewUser ? "🎉 Welcome! Your profile setup is complete." : "";
    }

    if (completionStatus.completionPercentage === 0) {
      return "👋 Welcome! Complete your profile setup to get the most out of Account Manager.";
    }

    if (completionStatus.completionPercentage < 50) {
      return `Your profile is ${completionStatus.completionPercentage}% complete. Let's finish setting it up!`;
    }

    return `Almost done! Your profile is ${completionStatus.completionPercentage}% complete.`;
  };

  return (
    <IonCard className="profile-setup-banner">
      <IonCardContent>
        {showDismiss && onDismiss && (
          <IonButton
            fill="clear"
            className="dismiss-button"
            onClick={onDismiss}
          >
            <IonIcon icon={closeOutline} />
          </IonButton>
        )}

        <div className="banner-content">
          <div className="banner-header">
            <div className="banner-icon">
              <IonIcon
                icon={getStatusIcon()}
                color={getStatusColor()}
                style={{ fontSize: "24px" }}
              />
            </div>
            <div className="banner-text">
              <h3>{getMessage()}</h3>
              {!completionStatus.isFullyComplete && (
                <p>
                  {completionStatus.missingFields.length > 0 && (
                    <>
                      Missing:{" "}
                      {completionStatus.missingFields.slice(0, 3).join(", ")}
                      {completionStatus.missingFields.length > 3 &&
                        ` +${completionStatus.missingFields.length - 3} more`}
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {!completionStatus.isFullyComplete && (
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-text">
                  {completionStatus.completionPercentage}% Complete
                </span>
                <div className="completion-badges">
                  <IonChip
                    color={
                      completionStatus.isUserProfileComplete
                        ? "success"
                        : "medium"
                    }
                  >
                    <IonIcon icon={personCircleOutline} />
                    <IonLabel>Personal</IonLabel>
                  </IonChip>
                  <IonChip
                    color={
                      completionStatus.isStoreProfileComplete
                        ? "success"
                        : "medium"
                    }
                  >
                    <IonIcon icon={storefrontOutline} />
                    <IonLabel>Store</IonLabel>
                  </IonChip>
                </div>
              </div>
              <IonProgressBar
                value={completionStatus.completionPercentage / 100}
                color={getStatusColor()}
                className="completion-progress"
              />
            </div>
          )}

          <div className="banner-actions">
            {!completionStatus.isFullyComplete ? (
              <IonButton
                expand="block"
                fill="solid"
                color={getStatusColor()}
                onClick={handleCompleteSetup}
                className="setup-button"
              >
                <span>Complete Setup</span>
                <IonIcon icon={arrowForward} slot="end" />
              </IonButton>
            ) : (
              <IonButton
                expand="block"
                fill="outline"
                color="success"
                onClick={handleViewProfile}
                className="setup-button"
              >
                <span>View Profile</span>
                <IonIcon icon={arrowForward} slot="end" />
              </IonButton>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ProfileSetupBanner;
