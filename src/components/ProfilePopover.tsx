import React from "react";
import {
  IonPopover,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import {
  settingsOutline,
  personOutline,
  notificationsOutline,
  logOutOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import useAuthContext from "../contexts/auth/UseAuthContext";
import InitialsAvatar from "./InitialsAvatar";
import "./ProfilePopover.css";

interface ProfilePopoverProps {
  isOpen: boolean;
  event: Event | undefined;
  onDidDismiss: () => void;
}

const ProfilePopover: React.FC<ProfilePopoverProps> = ({
  isOpen,
  event,
  onDidDismiss,
}) => {
  const history = useHistory();
  const { signOut, user } = useAuthContext();

  const handleAccountSettings = () => {
    history.push("/account-settings");
    onDidDismiss();
  };

  const handleProfile = () => {
    history.push("/profile");
    onDidDismiss();
  };

  const handleNotifications = () => {
    history.push("/notifications");
    onDidDismiss();
  };

  const handleLogout = async () => {
    console.log("Logout user");
    await signOut();
    history.push("/login");
    onDidDismiss();
  };

  return (
    <IonPopover
      isOpen={isOpen}
      event={event}
      onDidDismiss={onDidDismiss}
      showBackdrop={true}
      dismissOnSelect={true}
      side="bottom"
      alignment="end"
    >
      <IonContent>
        <div className="profile-header">
          <InitialsAvatar
            name={user?.name || "User"}
            size="medium"
            className="profile-avatar"
          />
          <div className="profile-info">
            <h3>{user?.name || "User"}</h3>
            <p>{user?.email || "user@example.com"}</p>
          </div>
        </div>

        <IonList lines="none" className="profile-menu">
          <IonItem button onClick={handleProfile}>
            <IonIcon icon={personOutline} slot="start" />
            <IonLabel>Profile</IonLabel>
          </IonItem>

          <IonItem button onClick={handleAccountSettings}>
            <IonIcon icon={settingsOutline} slot="start" />
            <IonLabel>Account Settings</IonLabel>
          </IonItem>

          <IonItem button onClick={handleNotifications}>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>Notifications</IonLabel>
          </IonItem>

          <IonItem button onClick={handleLogout} className="logout-item">
            <IonIcon icon={logOutOutline} slot="start" />
            <IonLabel>Logout</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPopover>
  );
};

export default ProfilePopover;
