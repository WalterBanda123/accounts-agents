import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
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
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import {
  cameraOutline,
  chatbubblesOutline,
  cubeOutline,
  documentAttachOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeOutline,
} from "ionicons/icons";
import RecentTransactionCard from "../components/RecentTransactionCard";
import ReceiptModal from "../components/ReceiptModal";
import ProfilePopover from "../components/ProfilePopover";
import ToastComponent from "../components/ToastComponent";
import { useDataContext } from "../contexts/data/UseDataContext";
import { ALL_TRANSACTIONS } from "../mock/transactions";
import "../components/RecentTransactionCard.css";
import "./Home.css";

const Home: React.FC = () => {
  // Existing state
  const [toastError, setToastError] = useState<string>("");
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [showProfilePopover, setShowProfilePopover] = useState<boolean>(false);
  const [profilePopoverEvent, setProfilePopoverEvent] = useState<
    Event | undefined
  >(undefined);
  
  // Miscellaneous activity states
  const [showMiscModal, setShowMiscModal] = useState<boolean>(false);
  const [miscActivityData, setMiscActivityData] = useState({
    type: "cash_withdrawal", // cash_withdrawal, petty_purchase, payment, other
    amount: "",
    description: "",
    purpose: "",
    recipient: ""
  });
  const [isProcessingMisc, setIsProcessingMisc] = useState<boolean>(false);
  const [miscToastMessage, setMiscToastMessage] = useState<string>("");
  const [showMiscToast, setShowMiscToast] = useState<boolean>(false);
  
  const history = useHistory();
  const { askAiAssistant, currentSessionId } = useDataContext();

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

  // Miscellaneous activity handlers
  const handleMiscActivityOpen = () => {
    setShowMiscModal(true);
  };

  const handleMiscActivityClose = () => {
    setShowMiscModal(false);
    setMiscActivityData({
      type: "cash_withdrawal",
      amount: "",
      description: "",
      purpose: "",
      recipient: ""
    });
  };

  const handleMiscInputChange = (field: string, value: string) => {
    setMiscActivityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMiscActivitySubmit = async () => {
    if (!miscActivityData.amount || !miscActivityData.description) {
      setMiscToastMessage("Please fill in amount and description");
      setShowMiscToast(true);
      return;
    }

    setIsProcessingMisc(true);
    
    try {
      const activityMessage = `Record miscellaneous activity:
Type: ${miscActivityData.type.replace('_', ' ')}
Amount: $${miscActivityData.amount}
Description: ${miscActivityData.description}
${miscActivityData.purpose ? `Purpose: ${miscActivityData.purpose}` : ''}
${miscActivityData.recipient ? `Recipient: ${miscActivityData.recipient}` : ''}

Please log this activity and update the registry accordingly. Provide a confirmation with the activity details and current registry status.`;

      await askAiAssistant(activityMessage, currentSessionId || undefined);
      
      setMiscToastMessage("✅ Activity recorded successfully! Check chat for details.");
      setShowMiscToast(true);
      
      // Close modal after successful submission
      setTimeout(() => {
        handleMiscActivityClose();
      }, 1000);
      
    } catch (error) {
      console.error("Error recording misc activity:", error);
      setMiscToastMessage("❌ Failed to record activity. Please try again.");
      setShowMiscToast(true);
    } finally {
      setIsProcessingMisc(false);
    }
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
            <IonRow>
              <IonCol>
                <div className="container misc-activity-card" onClick={handleMiscActivityOpen}>
                  <IonCol size="2">
                    <IonIcon icon={cashOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Record Activity</h2>
                      <p className="action-subtitle">Log cash withdrawals & misc expenses</p>
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

          {/* Miscellaneous Activity Modal */}
          <IonModal isOpen={showMiscModal} onDidDismiss={handleMiscActivityClose}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Record Miscellaneous Activity</IonTitle>
                <IonButtons slot="end">
                  <IonButton fill="clear" onClick={handleMiscActivityClose}>
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Activity Details</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ marginBottom: "16px" }}>
                    <IonLabel>Activity Type</IonLabel>
                    <IonSelect
                      value={miscActivityData.type}
                      onIonChange={(e) => handleMiscInputChange("type", e.detail.value)}
                      interface="popover"
                    >
                      <IonSelectOption value="cash_withdrawal">Cash Withdrawal</IonSelectOption>
                      <IonSelectOption value="petty_purchase">Petty Purchase</IonSelectOption>
                      <IonSelectOption value="payment">Payment</IonSelectOption>
                      <IonSelectOption value="other">Other</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <IonLabel>Amount ($)</IonLabel>
                    <IonInput
                      type="number"
                      value={miscActivityData.amount}
                      onIonInput={(e) => handleMiscInputChange("amount", e.detail.value!)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <IonLabel>Description</IonLabel>
                    <IonTextarea
                      value={miscActivityData.description}
                      onIonInput={(e) => handleMiscInputChange("description", e.detail.value!)}
                      placeholder="Describe the activity..."
                      rows={3}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <IonLabel>Purpose (Optional)</IonLabel>
                    <IonInput
                      value={miscActivityData.purpose}
                      onIonInput={(e) => handleMiscInputChange("purpose", e.detail.value!)}
                      placeholder="What was this for?"
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <IonLabel>Recipient (Optional)</IonLabel>
                    <IonInput
                      value={miscActivityData.recipient}
                      onIonInput={(e) => handleMiscInputChange("recipient", e.detail.value!)}
                      placeholder="Who received the payment/purchase?"
                    />
                  </div>

                  <IonButton 
                    expand="block" 
                    onClick={handleMiscActivitySubmit}
                    disabled={isProcessingMisc || !miscActivityData.amount || !miscActivityData.description}
                  >
                    {isProcessingMisc ? (
                      <>
                        <IonSpinner name="crescent" />
                        &nbsp;Recording...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        Record Activity
                      </>
                    )}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonContent>
          </IonModal>

          {/* Misc Activity Toast */}
          <IonToast
            isOpen={showMiscToast}
            onDidDismiss={() => setShowMiscToast(false)}
            message={miscToastMessage}
            duration={3000}
            position="top"
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
