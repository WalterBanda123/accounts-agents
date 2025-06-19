import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonText,
  IonBackButton,
  IonButtons,
  IonToast,
} from "@ionic/react";
import { settingsOutline, checkmarkCircleOutline } from "ionicons/icons";
import SettingsInitializer from "../components/SettingsInitializer";
import { SettingsInitializationResult } from "../utils/settingsInitializer";

const DevSettingsSetup: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleInitializationComplete = (
    result: SettingsInitializationResult
  ) => {
    if (result.success) {
      setToastMessage(
        `Settings system initialized successfully! ${result.usersProcessed} users processed.`
      );
    } else {
      setToastMessage(
        `Initialization completed with ${result.errors.length} issues. Check console for details.`
      );
    }
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Development - Settings Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Settings Setup</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={settingsOutline} style={{ marginRight: "8px" }} />
              Development Tool - Store Settings Initialization
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                <strong>Important:</strong> This is a development tool to set up
                the store settings system in Firestore. It will:
              </p>
              <ul>
                <li>Create store_settings collection structure</li>
                <li>Generate default settings for all existing users</li>
                <li>Migrate any localStorage settings to Firestore</li>
                <li>Validate and fix any corrupted settings documents</li>
              </ul>
            </IonText>
          </IonCardContent>
        </IonCard>

        <SettingsInitializer onComplete={handleInitializationComplete} />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon
                icon={checkmarkCircleOutline}
                style={{ marginRight: "8px" }}
              />
              After Initialization
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>Once initialized, all users will have:</p>
              <ul>
                <li>✅ Persistent store settings in Firestore</li>
                <li>✅ Automatic backup to localStorage</li>
                <li>✅ Settings validation on save</li>
                <li>✅ Migration from old localStorage data</li>
                <li>✅ Default settings based on user profile</li>
              </ul>
            </IonText>

            <IonButton
              expand="block"
              fill="outline"
              routerLink="/account-settings"
              style={{ marginTop: "16px" }}
            >
              Go to Account Settings
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default DevSettingsSetup;
