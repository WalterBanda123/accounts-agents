import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonList,
  IonText
} from '@ionic/react';
import { 
  checkmarkCircleOutline, 
  warningOutline, 
  refreshOutline, 
  cloudUploadOutline 
} from 'ionicons/icons';
import { initializeCompleteSettingsSystem, SettingsInitializationResult } from '../utils/settingsInitializer';

interface SettingsInitializerProps {
  onComplete?: (result: SettingsInitializationResult) => void;
}

const SettingsInitializer: React.FC<SettingsInitializerProps> = ({ onComplete }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<SettingsInitializationResult | null>(null);

  const handleInitialize = async () => {
    setIsInitializing(true);
    setResult(null);

    try {
      const initResult = await initializeCompleteSettingsSystem();
      setResult(initResult);
      onComplete?.(initResult);
    } catch (error) {
      console.error('Initialization error:', error);
      setResult({
        success: false,
        usersProcessed: 0,
        errors: [`Critical error: ${error}`]
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={cloudUploadOutline} style={{ marginRight: '8px' }} />
          Initialize Store Settings System
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonText>
          <p>
            This will initialize the store settings system by creating settings documents 
            for all existing users and validating the current setup.
          </p>
        </IonText>

        <IonButton 
          expand="block" 
          onClick={handleInitialize} 
          disabled={isInitializing}
          style={{ marginTop: '16px' }}
        >
          {isInitializing ? (
            <>
              <IonSpinner name="circular" style={{ marginRight: '8px' }} />
              Initializing...
            </>
          ) : (
            <>
              <IonIcon icon={refreshOutline} style={{ marginRight: '8px' }} />
              Initialize Settings System
            </>
          )}
        </IonButton>

        {result && (
          <IonCard style={{ marginTop: '16px' }}>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonIcon 
                    icon={result.success ? checkmarkCircleOutline : warningOutline}
                    color={result.success ? 'success' : 'warning'}
                    slot="start"
                  />
                  <IonLabel>
                    <h3>Status: {result.success ? 'Success' : 'Completed with Issues'}</h3>
                    <p>Users processed: {result.usersProcessed}</p>
                  </IonLabel>
                </IonItem>

                {result.errors.length > 0 && (
                  <IonItem>
                    <IonLabel>
                      <h3>Issues ({result.errors.length}):</h3>
                      {result.errors.map((error, index) => (
                        <p key={index} style={{ color: 'var(--ion-color-warning)', fontSize: '0.9em' }}>
                          • {error}
                        </p>
                      ))}
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default SettingsInitializer;
