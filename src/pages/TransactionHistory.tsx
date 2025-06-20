import React, { useState, useEffect, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import {
  receiptOutline,
  checkmarkDoneOutline,
  timeOutline,
  eyeOutline,
} from "ionicons/icons";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { profileService } from "../services/profileService";
import { Transaction } from "../interfaces/transaction";
import { format } from "date-fns";
import { useHistory } from "react-router-dom";
import "./TransactionHistory.css";

const TransactionHistory: React.FC = () => {
  const history = useHistory();
  const { user } = useAuthContext();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const transactionData = await profileService.getUserTransactions(user.id);
      setTransactions(transactionData);
    } catch (error) {
      console.error("❌ Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadData();
    event.detail.complete();
  };

  const handleTransactionClick = (transaction: Transaction) => {
    history.push(`/transaction-detail/${transaction.id}`);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (transaction.transaction_id || transaction.id || "")
        .toLowerCase()
        .includes(query) ||
      transaction.items.some((item) =>
        (item.name || "").toLowerCase().includes(query)
      ) ||
      transaction.customer_name?.toLowerCase().includes(query) ||
      transaction.payment_method?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "medium";
      case "refunded":
        return "danger";
      default:
        return "medium";
    }
  };

  const getTransactionIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return checkmarkDoneOutline;
      case "pending":
        return timeOutline;
      default:
        return receiptOutline;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return format(timestamp, "MMM dd, yyyy");
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Transaction History</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="transaction-history-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Transaction History</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="transaction-history-container">
          <div className="search-section">
            <IonSearchbar
              value={searchQuery}
              debounce={300}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
              placeholder="Search transactions..."
              mode="md"
              className="search-bar"
            />
          </div>

          {isLoading ? (
            <div className="loading-container">
              <IonSpinner />
              <IonText color="medium">Loading...</IonText>
            </div>
          ) : (
            <div className="transactions-list">
              {!isLoading && transactions.length > 0 && (
                <div className="transaction-summary">
                  <div className="summary-stats">
                    <div className="stat-item">
                      <div className="stat-value">{transactions.length}</div>
                      <div className="stat-label">Total Transactions</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {formatCurrency(
                          transactions.reduce((sum, t) => sum + t.total, 0)
                        )}
                      </div>
                      <div className="stat-label">Total Amount</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {
                          transactions.filter(
                            (t) => t.status === "completed"
                          ).length
                        }
                      </div>
                      <div className="stat-label">Completed</div>
                    </div>
                  </div>
                </div>
              )}

              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="transaction-item notification-item"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <div className="notification-content">
                    <div className="notification-icon">
                      <IonIcon
                        icon={getTransactionIcon(transaction.status)}
                        color={getStatusColor(transaction.status)}
                      />
                    </div>

                    <div className="notification-details">
                      <div className="notification-title">
                        Receipt #
                        {(transaction.transaction_id || transaction.id || "unknown").slice(-8)}
                        <span
                          className={`status-badge ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="notification-message">
                        {transaction.items.length} items •{" "}
                        {formatCurrency(transaction.total)}
                        {transaction.customer_name && (
                          <span> • {transaction.customer_name}</span>
                        )}
                      </div>
                      <div className="notification-timestamp">
                        <IonIcon icon={timeOutline} />
                        <span>
                          {getTimeAgo(
                            transaction.created_at
                              ? new Date(transaction.created_at)
                              : new Date()
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="transaction-actions">
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransactionClick(transaction);
                        }}
                      >
                        <IonIcon icon={eyeOutline} />
                      </IonButton>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && !isLoading && (
                <div className="no-notifications">
                  <IonIcon icon={receiptOutline} />
                  <h3>No transactions found</h3>
                  <p>
                    {searchQuery
                      ? "No transactions match your search."
                      : "Your transaction history is empty."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TransactionHistory;
