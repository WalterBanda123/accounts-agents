import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonPage,
  IonRow,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  IonSpinner,
} from "@ionic/react";
import {
  receiptOutline,
  checkmarkCircle,
  timeOutline,
  closeCircle,
} from "ionicons/icons";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Transaction } from "../interfaces/transaction";
import { profileService } from "../services/profileService";
import ProfilePopover from "../components/ProfilePopover";
import InitialsAvatar from "../components/InitialsAvatar";
import useAuthContext from "../contexts/auth/UseAuthContext";
import "./Transactions.css";

const Transactions: React.FC = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();
  const history = useHistory();

  // Load user transactions on component mount
  useEffect(() => {
    loadTransactions();
  });

  const loadTransactions = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userTransactions = await profileService.getUserTransactions(
        user.id
      );
      setTransactions(userTransactions);
      console.log(
        `Loaded ${userTransactions.length} transactions for user ${user.id}`
      );
    } catch (err) {
      console.error("Error loading transactions:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const totalReceipts = transactions.length;

  const filteredTransactions = transactions.filter(
    (transaction: Transaction) => {
      const searchLower = searchText.toLowerCase();
      return (
        transaction.notes?.toLowerCase().includes(searchLower) ||
        transaction.customer_name?.toLowerCase().includes(searchLower) ||
        transaction.payment_method?.toLowerCase().includes(searchLower) ||
        transaction.items?.some((item) =>
          item.name.toLowerCase().includes(searchLower)
        )
      );
    }
  );

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const truncateDescription = (
    description: string,
    maxLength: number = 50
  ): string => {
    return description.length > maxLength
      ? description.substring(0, maxLength) + "..."
      : description;
  };

  const handleTransactionClick = (transactionId: string) => {
    // Navigate to receipt detail page
    history.push(`/receipt/${transactionId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return checkmarkCircle;
      case "pending":
        return timeOutline;
      case "failed":
      case "cancelled":
        return closeCircle;
      default:
        return checkmarkCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
      case "cancelled":
        return "danger";
      default:
        return "medium";
    }
  };

  const formatTransactionDescription = (transaction: Transaction): string => {
    if (transaction.notes) {
      return transaction.notes;
    }
    if (transaction.items && transaction.items.length > 0) {
      const itemCount = transaction.items.length;
      const firstItem = transaction.items[0].name;
      return itemCount === 1
        ? firstItem
        : `${firstItem} and ${itemCount - 1} more item${
            itemCount > 2 ? "s" : ""
          }`;
    }
    return "Transaction";
  };

  const getMerchantName = (transaction: Transaction): string => {
    return (
      transaction.customer_name || transaction.store_id || "Store Transaction"
    );
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons>
            <IonBackButton color={"dark"} defaultHref="/" />
          </IonButtons>
          <IonTitle>All Receipts</IonTitle>
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
            <IonTitle size="large">All Receipts</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="search-section">
          <IonSearchbar
            value={searchText}
            debounce={300}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search receipts..."
            mode="md"
            className="search-bar"
          />
        </div>
        <IonGrid>
          <IonRow>
            <IonCol>
              <div className="transactions-header">
                <div className="header-content">
                  <div className="header-icon">
                    <IonIcon icon={receiptOutline} />
                  </div>
                  <div className="header-text">
                    <h2>All Transaction Receipts</h2>
                    <p>{totalReceipts} receipts found</p>
                  </div>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Loading State */}
        {isLoading && (
          <div
            className="loading-container"
            style={{ textAlign: "center", padding: "2rem" }}
          >
            <IonSpinner name="crescent" />
            <p>Loading transactions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className="error-container"
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--ion-color-danger)",
            }}
          >
            <p>{error}</p>
          </div>
        )}

        {/* Transaction List - Gmail Style */}
        {!isLoading && !error && (
          <div className="transaction-list">
            {filteredTransactions.map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className="transaction-item"
                onClick={() => handleTransactionClick(transaction.id!)}
              >
                <div className="transaction-content">
                  {/* Amount - Left side like email sender */}
                  <div className="transaction-amount">
                    {formatAmount(transaction.total)}
                  </div>

                  {/* Description - Middle like email content */}
                  <div className="transaction-details">
                    <div className="transaction-merchant">
                      {getMerchantName(transaction)}
                    </div>
                    <div className="transaction-description">
                      {truncateDescription(
                        formatTransactionDescription(transaction),
                        60
                      )}
                    </div>
                  </div>

                  {/* Date & Time - Right side like email date */}
                  <div className="transaction-datetime">
                    <div className="transaction-date">{transaction.date}</div>
                    <div className="transaction-time">{transaction.time}</div>
                  </div>
                </div>

                {/* Status indicator with icon */}
                <div className={`transaction-status ${transaction.status}`}>
                  <IonIcon
                    icon={getStatusIcon(transaction.status)}
                    color={getStatusColor(transaction.status)}
                    size="small"
                  />
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && !isLoading && (
              <div className="no-transactions">
                <p>No transactions found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </IonContent>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
      />
    </IonPage>
  );
};

export default Transactions;
