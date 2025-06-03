import { IonButton, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonLabel, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { cameraOutline, chatbubblesOutline, cubeOutline, documentAttachOutline } from "ionicons/icons"
import './Home.css';
import ReceiptComponent, { ReceiptComponentInterface } from '../components/Receipt';
import { RECENT_RECEIPTS } from '../mock/receipts';
import React from 'react';

const Home: React.FC = () => {

  return (
    <React.Fragment>
      <IonPage>
        <IonHeader mode='ios'>
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense" mode='ios'>
            <IonToolbar>
              <IonTitle size="large">Welcome </IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonGrid>
            <IonRow>
              <IonCol>
                <div className="container">
                  <IonCol size='2'>
                    <IonIcon icon={cameraOutline} size='large' />
                  </IonCol>
                  <IonCol size='10'>
                    <IonLabel>
                      <h2>Scan Cart</h2>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="container">
                  <IonCol size='2'>
                    <IonIcon icon={documentAttachOutline} size='large' />
                  </IonCol>
                  <IonCol size='10'>
                    <IonLabel>
                      <h2>View Receipts</h2>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="container">
                  <IonCol size='2'>
                    <IonIcon icon={cubeOutline} size='large' />
                  </IonCol>
                  <IonCol size='10'>
                    <IonLabel>
                      <h2>Stock Overview</h2>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonLabel>
                  <h2>Recent Receipts</h2>
                </IonLabel>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                {
                  RECENT_RECEIPTS.map(({ amount, date, invoice, status }: ReceiptComponentInterface, index: number) => (
                    <ReceiptComponent key={index} amount={amount} date={date} invoice={invoice} status={status} />
                  ))
                }
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonGrid>
            <IonRow class='ion-text-center'>
              <IonCol>
                <IonButton mode='ios' fill='clear' color="dark">
                  View More
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonFab vertical='bottom' horizontal='end'>
            <IonFabButton
              color={'dark'}
              routerLink='/my_assistant'
              routerDirection='forward'>
              <IonIcon icon={chatbubblesOutline} />
            </IonFabButton>
          </IonFab>
        </IonContent>
      </IonPage>
    </React.Fragment>
  );
};

export default Home;
