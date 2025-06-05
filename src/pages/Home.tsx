import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  IonAvatar,
} from "@ionic/react";

import {
  cameraOutline,
  chatbubblesOutline,
  cubeOutline,
  documentAttachOutline,
} from "ionicons/icons";
import "./Home.css";
import RecentTransactionCard from "../components/RecentTransactionCard";
import "../components/RecentTransactionCard.css";
import { ALL_TRANSACTIONS } from "../mock/transactions";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import ReceiptModal from "../components/ReceiptModal";
import ProfilePopover from "../components/ProfilePopover";
import ToastComponent from "../components/ToastComponent";

const Home: React.FC = () => {
  const [toastError, setToastError] = useState<string>("");
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [showProfilePopover, setShowProfilePopover] = useState<boolean>(false);
  const [profilePopoverEvent, setProfilePopoverEvent] = useState<
    Event | undefined
  >(undefined);
  const history = useHistory();

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
      });

      if (photo.webPath) {
        setCapturedImage(photo.webPath);
        setShowReceiptModal(true);
      }
    } catch (error: unknown) {
      console.error(error);
      setToastError("Failed to take photo");
    }
  };

  // Calculate today's sales metrics
  const todaysTransactions = ALL_TRANSACTIONS.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const todayDate = new Date();
    return transactionDate.toDateString() === todayDate.toDateString();
  });

  const todaysRevenue = todaysTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );
  const itemsSoldToday = todaysTransactions.reduce(
    (sum, transaction) => sum + transaction.cartItems.length,
    0
  );

  // Get the most recent 5 transactions
  const recentTransactions = ALL_TRANSACTIONS.sort(
    (a, b) =>
      new Date(b.date + " " + b.time).getTime() -
      new Date(a.date + " " + a.time).getTime()
  ).slice(0, 5);

  const navigateToReceipts = () => {
    history.push("/receipts");
  };

  const navigateToStockOverview = () => {
    history.push("/stock-overview");
  };

  const handleModalDismiss = () => {
    setShowReceiptModal(false);
    setCapturedImage("");
  };

  const handleProfileClick = (event: React.MouseEvent) => {
    setProfilePopoverEvent(event.nativeEvent);
    setShowProfilePopover(true);
  };

  const handleProfilePopoverDismiss = () => {
    setShowProfilePopover(false);
    setProfilePopoverEvent(undefined);
  };

  return (
    <React.Fragment>
      <IonPage>
        <IonHeader mode="ios">
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleProfileClick}>
                <IonAvatar className="header-avatar">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                    alt="Profile"
                  />
                </IonAvatar>
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense" mode="ios">
            <IonToolbar>
              <IonTitle size="large">Welcome</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonGrid>
            <IonRow>
              <IonCol>
                <div className="today-summary">
                  <div className="summary-header">
                    <h3>Today's Overview</h3>
                    <p>Your business at a glance</p>
                  </div>
                  <div className="summary-metrics">
                    <div className="metric-card">
                      <div className="metric-value">
                        ${todaysRevenue.toFixed(2)}
                      </div>
                      <div className="metric-label">Revenue</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">
                        {todaysTransactions.length}
                      </div>
                      <div className="metric-label">Sales</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">{itemsSoldToday}</div>
                      <div className="metric-label">Items Sold</div>
                    </div>
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonGrid>
            <IonRow>
              <IonCol>
                <div
                  className="container scan-cart-highlighted"
                  onClick={takePhoto}
                >
                  <IonCol size="2">
                    <IonIcon icon={cameraOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Scan Cart</h2>
                      <p className="action-subtitle">Process new transaction</p>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="container" onClick={navigateToReceipts}>
                  <IonCol size="2">
                    <IonIcon icon={documentAttachOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>View Receipts</h2>
                      <p className="action-subtitle">
                        Browse transaction history
                      </p>
                    </IonLabel>
                  </IonCol>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="container" onClick={navigateToStockOverview}>
                  <IonCol size="2">
                    <IonIcon icon={cubeOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Stock Overview</h2>
                      <p className="action-subtitle">Manage your inventory</p>
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
                    <div
                      key={transaction.id}
                      className="clickable-transaction"
                      onClick={() => history.push(`/receipt/${transaction.id}`)}
                    >
                      <RecentTransactionCard
                        transaction={transaction}
                        compact={true}
                      />
                    </div>
                  ))}
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonGrid>
            <IonRow class="ion-text-center">
              <IonCol>
                <IonButton
                  mode="ios"
                  fill="outline"
                  color="primary"
                  routerLink="/receipts"
                  routerDirection="forward"
                >
                  View All Transactions • ${todaysRevenue.toFixed(2)} today
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton
              color={"primary"}
              routerLink="/my_assistant"
              routerDirection="forward"
            >
              <IonIcon icon={chatbubblesOutline} />
            </IonFabButton>
          </IonFab>
          <ToastComponent
            message={toastError}
            duration={3000}
            isError={!!toastError}
            isOpen={!!toastError}
          />

          <ReceiptModal
            isOpen={showReceiptModal}
            onDidDismiss={handleModalDismiss}
            cartImage={capturedImage}
          />

          <ProfilePopover
            isOpen={showProfilePopover}
            event={profilePopoverEvent}
            onDidDismiss={handleProfilePopoverDismiss}
          />
        </IonContent>
      </IonPage>
    </React.Fragment>
  );
};

export default Home;
