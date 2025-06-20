import React, { useState, useEffect, useMemo } from "react";
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
  IonSpinner,
} from "@ionic/react";
import {
  chatbubbleOutline,
  chatbubblesOutline,
  cubeOutline,
  cashOutline,
} from "ionicons/icons";
import ProfilePopover from "../components/ProfilePopover";
import InitialsAvatar from "../components/InitialsAvatar";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { useDataContext } from "../contexts/data/UseDataContext";
import { Transaction } from "../interfaces/transaction";
import "./Home.css";

const Home: React.FC = () => {
  // Existing state
  const [showProfilePopover, setShowProfilePopover] = useState<boolean>(false);
  const [profilePopoverEvent, setProfilePopoverEvent] = useState<
    Event | undefined
  >(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const history = useHistory();
  const { user } = useAuthContext();
  const { getTransactionHistory } = useDataContext();

  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const fetchedTransactions = await getTransactionHistory();
        setTransactions(fetchedTransactions || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [getTransactionHistory]);

  // Calculate today's sales metrics using real transaction data
  const todaysMetrics = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    const todaysTransactions = transactions.filter((transaction) => {
      // Handle both date formats
      const transactionDate = transaction.date || transaction.created_at?.split('T')[0];
      return transactionDate === todayStr;
    });

    const todaysRevenue = todaysTransactions.reduce(
      (sum, transaction) => sum + (transaction.total || 0),
      0
    );

    const itemsSoldToday = todaysTransactions.reduce(
      (sum, transaction) => {
        // Count items from transaction items array
        const itemCount = transaction.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0;
        return sum + itemCount;
      },
      0
    );

    return {
      revenue: todaysRevenue,
      transactionCount: todaysTransactions.length,
      itemsSold: itemsSoldToday
    };
  }, [transactions]);

  // Get the most recent transactions from the last 20 minutes (limit 5)
  const recentTransactions = useMemo(() => {
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes ago

    return transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.created_at || transaction.timestamp || '');
        return transactionDate >= twentyMinutesAgo;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.timestamp || '').getTime();
        const dateB = new Date(b.created_at || b.timestamp || '').getTime();
        return dateB - dateA;
      })
      .slice(0, 5); // Limit to 5 transactions
  }, [transactions]);

  const navigateToReceipts = () => {
    history.push("/transaction-history");
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

  // Miscellaneous activity handlers - REMOVED

  return (
    <React.Fragment>
      <IonPage>
        <IonHeader mode="ios">
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleProfileClick}>
                <InitialsAvatar
                  name={user?.name || "User"}
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
                        ${todaysMetrics.revenue.toFixed(2)}
                      </div>
                      <div className="metric-label">Revenue</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">
                        {todaysMetrics.transactionCount}
                      </div>
                      <div className="metric-label">Sales</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">{todaysMetrics.itemsSold}</div>
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
                    <IonIcon icon={cashOutline} size="large" />
                  </IonCol>
                  <IonCol size="10">
                    <IonLabel>
                      <h2>Transaction History</h2>
                      <p className="action-subtitle">
                        View sales history and analytics
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
                    <p>Last 20 minutes • Up to 5 most recent sales</p>
                  </IonLabel>
                </div>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <div className="recent-transactions-container">
                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <IonSpinner />
                      <p>Loading transactions...</p>
                    </div>
                  ) : recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id || transaction.transaction_id}
                        className="clickable-transaction"
                        onClick={() => history.push(`/transaction-detail/${transaction.id || transaction.transaction_id}`)}
                      >
                        <div className="transaction-card-wrapper">
                          <div className="transaction-item">
                            <div className="transaction-header">
                              <h3>Transaction #{(transaction.transaction_id || transaction.id || '').slice(-6)}</h3>
                              <span className="transaction-amount">${transaction.total?.toFixed(2)}</span>
                            </div>
                            <div className="transaction-details">
                              <p>
                                {transaction.items?.length || 0} items • {' '}
                                {new Date(transaction.created_at || transaction.timestamp || '').toLocaleDateString()} {' '}
                                {new Date(transaction.created_at || transaction.timestamp || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <span className="transaction-status">Completed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ion-color-medium)' }}>
                      <p>No transactions in the last 20 minutes. Start by recording your first sale!</p>
                    </div>
                  )}
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
                  routerLink="/transaction-history"
                  routerDirection="forward"
                >
                  View All Transactions • ${todaysMetrics.revenue.toFixed(2)} today
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
