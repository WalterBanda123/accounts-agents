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
  IonActionSheet,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import {
  receiptOutline,
  checkmarkDoneOutline,
  timeOutline,
  ellipsisVertical,
  trashOutline,
  eyeOutline,
  alertCircleOutline,
  businessOutline,
} from "ionicons/icons";
import { useDataContext } from "../contexts/data/UseDataContext";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { profileService } from "../services/profileService";
import { Transaction } from "../interfaces/transaction";
import { Notification } from "../interfaces/notification";
import { format } from "date-fns";
import { useHistory } from "react-router-dom";
import "./TransactionHistory.css";

const TransactionHistory: React.FC = () => {
  console.log("🏗️ TransactionHistory component initializing...");

  const history = useHistory();
  const { user } = useAuthContext();
  const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useDataContext();

  console.log("🔧 TransactionHistory setup - User from auth:", user);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSegment, setSelectedSegment] = useState<
    "notifications" | "transactions"
  >("notifications");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showActionSheet, setShowActionSheet] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    console.log("🔄 TransactionHistory: Starting to load data...");
    console.log("👤 Current user:", user);
    console.log("🆔 User ID:", user?.id);

    try {
      // Load transactions from Firestore using profileService
      const transactionPromise = user?.id
        ? profileService.getUserTransactions(user.id)
        : Promise.resolve([]);

      const notificationPromise = getNotifications({ type: "transaction" });

      console.log("📡 Making API calls...");
      const [transactionData, notificationData] = await Promise.all([
        transactionPromise,
        notificationPromise,
      ]);

      console.log("✅ Raw transaction data received:", transactionData);
      console.log("📊 Transaction count:", transactionData.length);
      console.log("📋 First few transactions:", transactionData.slice(0, 3));
      console.log("🔔 Notification data:", notificationData);

      // Log each transaction details
      transactionData.forEach((transaction, index) => {
        console.log(`📄 Transaction ${index + 1}:`, {
          id: transaction.id,
          transaction_id: transaction.transaction_id,
          userId: transaction.userId,
          total: transaction.total,
          status: transaction.status,
          created_at: transaction.created_at,
          items: transaction.items.length,
        });
      });

      setTransactions(transactionData);
      setNotifications(notificationData);

      console.log(
        `✅ Loaded ${transactionData.length} transactions for user ${user?.id}`
      );
    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setIsLoading(false);
      console.log("🏁 TransactionHistory: Data loading complete");
    }
  }, [user, getNotifications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Log transactions whenever they change
  useEffect(() => {
    console.log("📈 Transactions state updated:", {
      count: transactions.length,
      transactions: transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        total: t.total,
        status: t.status,
      })),
    });
  }, [transactions]);

  const handleRefresh = async (event: CustomEvent) => {
    await loadData();
    event.detail.complete();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id!);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    // Navigate to transaction detail if there's an actionUrl
    if (notification.actionUrl) {
      history.push(notification.actionUrl);
    } else if (notification.transactionId) {
      history.push(`/transaction-detail/${notification.transactionId}`);
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    history.push(`/transaction-detail/${transaction.id}`);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setShowActionSheet(false);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setShowActionSheet(false);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
    );
  });

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const isMatch =
      (
        transaction.transaction_id ||
        transaction.transactionId ||
        transaction.id ||
        ""
      )
        .toLowerCase()
        .includes(query) ||
      transaction.items.some((item) =>
        (item.name || item.productName || "").toLowerCase().includes(query)
      ) ||
      transaction.customerInfo?.name?.toLowerCase().includes(query) ||
      transaction.customerInfo?.email?.toLowerCase().includes(query) ||
      transaction.customer_name?.toLowerCase().includes(query) ||
      transaction.notes?.toLowerCase().includes(query) ||
      transaction.payment_method?.toLowerCase().includes(query);

    if (searchQuery && isMatch) {
      console.log(
        "🔍 Transaction matches search:",
        transaction.id,
        "for query:",
        searchQuery
      );
    }

    return isMatch;
  });

  // Log filtered results
  console.log("🎯 Filtered transactions:", {
    totalTransactions: transactions.length,
    filteredCount: filteredTransactions.length,
    searchQuery: searchQuery,
  });

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case "transaction":
        return receiptOutline;
      case "success":
        return checkmarkDoneOutline;
      case "error":
        return alertCircleOutline;
      case "inventory":
        return businessOutline;
      default:
        return receiptOutline;
    }
  };

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

  const truncateMessage = (message: string, maxLength: number = 80): string => {
    return message.length > maxLength
      ? message.substring(0, maxLength) + "..."
      : message;
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
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
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
          {/* Segment Control */}
          <IonSegment
            value={selectedSegment}
            onIonChange={(e) =>
              setSelectedSegment(
                e.detail.value as "notifications" | "transactions"
              )
            }
            className="segment-control"
          >
            <IonSegmentButton value="notifications">
              <IonText>Receipt Notifications</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="transactions">
              <IonText>All Transactions</IonText>
            </IonSegmentButton>
          </IonSegment>

          {/* Search Section */}
          <div className="search-section">
            <IonSearchbar
              value={searchQuery}
              debounce={300}
              onIonInput={(e) => setSearchQuery(e.detail.value!)}
              placeholder={
                selectedSegment === "notifications"
                  ? "Search notifications..."
                  : "Search transactions..."
              }
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
            <>
              {/* Notifications View */}
              {selectedSegment === "notifications" && (
                <div className="notifications-list">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        !notification.isRead ? "unread" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-content">
                        {/* Icon */}
                        <div className="notification-icon">
                          <IonIcon icon={getNotificationIcon(notification)} />
                        </div>

                        {/* Content */}
                        <div className="notification-details">
                          <div className="notification-title">
                            {notification.title}
                            {!notification.isRead && (
                              <div className="unread-indicator"></div>
                            )}
                          </div>
                          <div className="notification-message">
                            {truncateMessage(notification.message)}
                          </div>
                          <div className="notification-timestamp">
                            <IonIcon icon={timeOutline} />
                            <span>{getTimeAgo(notification.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <div className="no-notifications">
                      <IonIcon icon={receiptOutline} />
                      <h3>No receipt notifications found</h3>
                      <p>
                        {searchQuery
                          ? "No notifications match your search criteria."
                          : "Complete transactions in the Transaction Chat to see receipt notifications here."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions View */}
              {selectedSegment === "transactions" && (
                <div className="transactions-list">
                  {/* Transaction Summary */}
                  {!isLoading && transactions.length > 0 && (
                    <div className="transaction-summary">
                      <div className="summary-stats">
                        <div className="stat-item">
                          <div className="stat-value">
                            {transactions.length}
                          </div>
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

                  {filteredTransactions.map((transaction) => {
                    console.log(
                      "🎨 Rendering transaction:",
                      transaction.id,
                      "Total:",
                      transaction.total
                    );
                    return (
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
                              {(
                                transaction.transaction_id ||
                                transaction.transactionId ||
                                transaction.id ||
                                "unknown"
                              ).slice(-8)}
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
                              {(transaction.customerInfo?.name ||
                                transaction.customer_name) && (
                                <span>
                                  {" "}
                                  •{" "}
                                  {transaction.customerInfo?.name ||
                                    transaction.customer_name}
                                </span>
                              )}
                            </div>
                            <div className="notification-timestamp">
                              <IonIcon icon={timeOutline} />
                              <span>
                                {getTimeAgo(
                                  transaction.created_at
                                    ? new Date(transaction.created_at)
                                    : transaction.timestamp ||
                                        transaction.createdAt ||
                                        new Date()
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
                    );
                  })}

                  {filteredTransactions.length === 0 && !isLoading && (
                    <div className="no-notifications">
                      <IonIcon icon={receiptOutline} />
                      <h3>No transactions found</h3>
                      <p>
                        {searchQuery
                          ? "No transactions match your search criteria."
                          : !user?.id
                          ? "Please log in to view your transactions."
                          : "Complete transactions in the Transaction Chat to see them here."}
                      </p>
                    </div>
                  )}

                  {isLoading && selectedSegment === "transactions" && (
                    <div
                      className="loading-container"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      <IonSpinner name="crescent" />
                      <p>Loading transactions...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Mark All as Read",
              icon: checkmarkDoneOutline,
              handler: handleMarkAllAsRead,
            },
            {
              text: "Clear All Notifications",
              icon: trashOutline,
              role: "destructive",
              handler: handleClearAll,
            },
            {
              text: "Cancel",
              role: "cancel",
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TransactionHistory;
