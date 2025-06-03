import { IonButton, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonLabel, IonPage, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { cameraOutline, chatbubblesOutline, cubeOutline, documentAttachOutline } from "ionicons/icons"
import './Home.css';
import RecentTransactionCard from '../components/RecentTransactionCard';
import '../components/RecentTransactionCard.css';
import { ALL_TRANSACTIONS } from '../mock/transactions';
import React from 'react';
import { useHistory } from 'react-router-dom';

const Home: React.FC = () => {
  const history = useHistory();

  // Get the most recent 5 transactions
  const recentTransactions = ALL_TRANSACTIONS
    .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
    .slice(0, 5);

  const navigateToReceipts = () => {
    history.push('/receipts');
  };

  const navigateToScanCart = () => {
    history.push('/scan-cart');
  };

  const navigateToStockOverview = () => {
    history.push('/stock-overview');
  };

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
                <div className="container" onClick={navigateToScanCart}>
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
                <div className="container" onClick={navigateToReceipts}>
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
                <div className="container" onClick={navigateToStockOverview}>
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
                <div className="section-header">
                  <IonLabel>
                    <h2>Recent Transactions</h2>
                    <p>Your latest financial activity</p>
                  </IonLabel>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="recent-transactions-container">
                  {recentTransactions.map((transaction) => (
                    <RecentTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      compact={true}
                    />
                  ))}
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonGrid>
            <IonRow class='ion-text-center'>
              <IonCol>
                <IonButton mode='ios' fill='outline' color="dark" routerLink='/transactions' routerDirection='forward'>
                  View All Transactions
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonFab vertical='bottom' horizontal='end' slot='fixed'>
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
