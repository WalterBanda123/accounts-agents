import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
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
} from "@ionic/react";
import {
  chatbubbleOutline,
  chatbubblesOutline,
  cubeOutline,
  documentAttachOutline,
  cashOutline,
} from "ionicons/icons";
import RecentTransactionCard from "../components/RecentTransactionCard";
import ProfilePopover from "../components/ProfilePopover";
import ProfileSetupBanner from "../components/ProfileSetupBanner";
import AvatarComponent from "../components/AvatarComponent";
import { ALL_TRANSACTIONS } from "../mock/transactions";
import {
  checkProfileCompletion,
  isNewUser as checkIsNewUser,
} from "../utils/profileUtils";
import { UserProfile } from "../interfaces/user";
import { StoreProfile } from "../interfaces/store";
import useAuthContext from "../contexts/auth/UseAuthContext";
import "../components/RecentTransactionCard.css";
import "./Home.css";

const Home: React.FC = () => {
  // Existing state
  const [showProfilePopover, setShowProfilePopover] = useState<boolean>(false);
  const [profilePopoverEvent, setProfilePopoverEvent] = useState<
    Event | undefined
  >(undefined);

  // Profile setup banner state
  const [showProfileBanner, setShowProfileBanner] = useState<boolean>(true);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const history = useHistory();
  const { user } = useAuthContext();

  // Get actual profile data from localStorage
  const [actualUserProfile, setActualUserProfile] =
    useState<UserProfile | null>(null);
  const [actualStoreProfile, setActualStoreProfile] =
    useState<StoreProfile | null>(null);

  useEffect(() => {
    // Load actual profiles from localStorage
    const loadProfiles = () => {
      const savedUserProfile = localStorage.getItem("userProfile");
      const savedStoreProfile = localStorage.getItem("storeProfile");

      if (savedUserProfile) {
        setActualUserProfile(JSON.parse(savedUserProfile));
      }

      if (savedStoreProfile) {
        setActualStoreProfile(JSON.parse(savedStoreProfile));
      }
    };

    loadProfiles();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfiles();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  // Check profile completion status using actual data
  const completionStatus = checkProfileCompletion(
    actualUserProfile,
    actualStoreProfile
  );
  const isUserNew = checkIsNewUser(actualUserProfile);

  // Handle banner dismissal
  const handleBannerDismiss = () => {
    setBannerDismissed(true);
    setShowProfileBanner(false);
  };

  // Show banner conditions
  const shouldShowBanner =
    showProfileBanner &&
    !bannerDismissed &&
    user &&
    (!completionStatus.isFullyComplete || isUserNew);

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

  // Navigate to transaction chat
  const navigateToTransactionChat = () => {
    history.push("/transaction-chat");
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
    history.push("/misc-activities");
  };

  return (
    <React.Fragment>
      <IonPage>
        <IonHeader mode="ios">
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleProfileClick}>
                <AvatarComponent
                  initials={actualUserProfile?.avatar?.initials || user?.name?.substring(0, 2).toUpperCase() || 'U'}
                  color={actualUserProfile?.avatar?.color || '#3498db'}
                  size="small"
                  className="header-avatar"
                />
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

          {/* Profile Setup Banner */}
          {shouldShowBanner && (
            <ProfileSetupBanner
              completionStatus={completionStatus}
              isNewUser={isUserNew}
              onDismiss={handleBannerDismiss}
              showDismiss={true}
            />
          )}

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
                  className="container transaction-chat-highlighted"
                  onClick={navigateToTransactionChat}
                >
                  <IonCol size="2">
                    <IonIcon icon={chatbubbleOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Transaction Chat</h2>
                      <p className="action-subtitle">
                        Record sales by typing "3 bread @2.50, 1 milk @3.00"
                      </p>
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
                <div
                  className="container misc-activity-card"
                  onClick={handleMiscActivityOpen}
                >
                  <IonCol size="2">
                    <IonIcon icon={cashOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Record Activity</h2>
                      <p className="action-subtitle">
                        Log cash withdrawals & misc expenses
                      </p>
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
