import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonText,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonActionSheet,
} from "@ionic/react";
import {
  receiptOutline,
  printOutline,
  shareOutline,
  downloadOutline,
  cardOutline,
  cashOutline,
  personOutline,
  callOutline,
  mailOutline,
  calendarOutline,
  listOutline,
} from "ionicons/icons";
import { useParams, useHistory } from "react-router-dom";
import { useDataContext } from "../contexts/data/UseDataContext";
import { Transaction } from "../interfaces/transaction";
import { format } from "date-fns";
import "./TransactionDetail.css";

interface TransactionDetailParams {
  transactionId: string;
}

const TransactionDetail: React.FC = () => {
  const { transactionId } = useParams<TransactionDetailParams>();
  const history = useHistory();
  const { getTransactionById } = useDataContext();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showActionSheet, setShowActionSheet] = useState<boolean>(false);

  useEffect(() => {
    const loadTransaction = async () => {
      setIsLoading(true);
      try {
        if (transactionId) {
          const transactionData = await getTransactionById(transactionId);
          setTransaction(transactionData);
        }
      } catch (error) {
        console.error("Error loading transaction:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId, getTransactionById]);

  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log("Print receipt");
    setShowActionSheet(false);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share receipt");
    setShowActionSheet(false);
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download receipt");
    setShowActionSheet(false);
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

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case "cash":
        return cashOutline;
      case "card":
        return cardOutline;
      default:
        return cardOutline;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDateTime = (date: Date): string => {
    return format(date, "MMM dd, yyyy 'at' hh:mm a");
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/transaction-history" />
            </IonButtons>
            <IonTitle>Transaction Detail</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="transaction-detail-content">
          <div className="loading-container">
            <IonSpinner />
            <IonText color="medium">Loading transaction details...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!transaction) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/transaction-history" />
            </IonButtons>
            <IonTitle>Transaction Detail</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="transaction-detail-content">
          <div className="error-container">
            <IonIcon icon={receiptOutline} />
            <IonText color="medium">Transaction not found</IonText>
            <IonButton
              fill="clear"
              onClick={() => history.push("/transaction-history")}
            >
              Back to History
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/transaction-history" />
          </IonButtons>
          <IonTitle>Receipt</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={shareOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="transaction-detail-content">
        <div className="transaction-detail-container">
          {/* Receipt Header */}
          <IonCard className="receipt-header">
            <IonCardHeader>
              <div className="receipt-title">
                <IonIcon icon={receiptOutline} />
                <IonCardTitle>
                  Receipt #
                  {(
                    transaction.transaction_id ||
                    transaction.transactionId ||
                    "unknown"
                  ).slice(-8)}
                </IonCardTitle>
                <IonBadge color={getStatusColor(transaction.status)}>
                  {transaction.status.toUpperCase()}
                </IonBadge>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <div className="receipt-info">
                <div className="info-item">
                  <IonIcon icon={calendarOutline} />
                  <span>
                    {formatDateTime(
                      transaction.timestamp ||
                        transaction.createdAt ||
                        new Date()
                    )}
                  </span>
                </div>
                <div className="info-item">
                  <IonIcon
                    icon={getPaymentIcon(
                      transaction.payment_method || transaction.paymentMethod
                    )}
                  />
                  <span>
                    {(
                      transaction.payment_method || transaction.paymentMethod
                    )?.toUpperCase() || "N/A"}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Customer Information */}
          {transaction.customerInfo && (
            <IonCard className="customer-info">
              <IonCardHeader>
                <IonCardTitle>Customer Information</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {transaction.customerInfo.name && (
                  <div className="info-item">
                    <IonIcon icon={personOutline} />
                    <span>{transaction.customerInfo.name}</span>
                  </div>
                )}
                {transaction.customerInfo.email && (
                  <div className="info-item">
                    <IonIcon icon={mailOutline} />
                    <span>{transaction.customerInfo.email}</span>
                  </div>
                )}
                {transaction.customerInfo.phone && (
                  <div className="info-item">
                    <IonIcon icon={callOutline} />
                    <span>{transaction.customerInfo.phone}</span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Items */}
          <IonCard className="items-section">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={listOutline} />
                Items ({transaction.items.length})
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {transaction.items.map((item, index) => (
                  <IonItem key={index}>
                    <IonLabel>
                      <h3>
                        {item.name || item.productName || "Unknown Product"}
                      </h3>
                      <p>
                        {item.quantity} ×{" "}
                        {formatCurrency(item.unit_price || item.unitPrice || 0)}
                      </p>
                    </IonLabel>
                    <IonNote slot="end">
                      {formatCurrency(item.line_total || item.totalPrice || 0)}
                    </IonNote>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Totals */}
          <IonCard className="totals-section">
            <IonCardContent>
              <div className="total-line">
                <span>Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              <div className="total-line">
                <span>
                  Tax (
                  {(
                    (transaction.tax_rate || transaction.taxRate || 0) * 100
                  ).toFixed(1)}
                  %):
                </span>
                <span>
                  {formatCurrency(
                    transaction.tax_amount || transaction.tax || 0
                  )}
                </span>
              </div>
              <div className="total-line total-amount">
                <span>Total:</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Notes */}
          {transaction.notes && (
            <IonCard className="notes-section">
              <IonCardHeader>
                <IonCardTitle>Notes</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>{transaction.notes}</IonText>
              </IonCardContent>
            </IonCard>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <IonButton expand="block" fill="solid" onClick={handlePrint}>
              <IonIcon icon={printOutline} slot="start" />
              Print Receipt
            </IonButton>
          </div>
        </div>

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Print Receipt",
              icon: printOutline,
              handler: handlePrint,
            },
            {
              text: "Share Receipt",
              icon: shareOutline,
              handler: handleShare,
            },
            {
              text: "Download PDF",
              icon: downloadOutline,
              handler: handleDownload,
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

export default TransactionDetail;
