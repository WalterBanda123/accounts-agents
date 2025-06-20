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
  IonActionSheet,
} from "@ionic/react";
import {
  receiptOutline,
  printOutline,
  shareOutline,
  downloadOutline,
  copyOutline,
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

  const handleCopyTransactionId = async () => {
    const transactionId =
      transaction?.transaction_id ||
      transaction?.transactionId ||
      transaction?.id;
    if (transactionId) {
      try {
        await navigator.clipboard.writeText(transactionId);
        // Could add a toast notification here
        console.log("Transaction ID copied to clipboard");
      } catch {
        console.error("Failed to copy transaction ID");
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return "Unknown date";

    try {
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      return format(date, "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return "Invalid date";
    }
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
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/transaction-history" />
          </IonButtons>
          <IonTitle>Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="transaction-detail-content">
        <div className="transaction-detail-container">
          {/* Amount Section - Top Priority */}
          <div className="amount-section">
            <div className="amount-paid">
              <div className="amount-value">
                {formatCurrency(transaction.total)}
              </div>
              <div className="amount-label">Total Paid</div>
            </div>
            <div className="transaction-meta">
              <span className="transaction-date">
                {formatDateTime(
                  transaction.created_at || transaction.createdAt
                )}
              </span>
              <span className="transaction-id">
                #
                {(
                  transaction.transaction_id ||
                  transaction.transactionId ||
                  transaction.id ||
                  ""
                ).slice(-8)}
              </span>
            </div>
          </div>

          {/* Items Sold - Main Highlight */}
          <div className="items-section">
            <div className="section-title">
              Items Purchased ({transaction.items.length})
            </div>

            <div className="items-list">
              {transaction.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-details">
                    <div className="item-name">
                      {item.name || item.productName || "Unknown Product"}
                    </div>
                    <div className="item-quantity-price">
                      {item.quantity} ×{" "}
                      {formatCurrency(item.unit_price || item.unitPrice || 0)}
                    </div>
                  </div>
                  <div className="item-total">
                    {formatCurrency(item.line_total || item.totalPrice || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown - Clean */}
          <div className="payment-section">
            <div className="payment-row">
              <span>Subtotal</span>
              <span>{formatCurrency(transaction.subtotal)}</span>
            </div>
            {(transaction.tax_amount || transaction.tax || 0) > 0 && (
              <div className="payment-row">
                <span>Tax</span>
                <span>
                  {formatCurrency(
                    transaction.tax_amount || transaction.tax || 0
                  )}
                </span>
              </div>
            )}
            <div className="payment-divider"></div>
            <div className="payment-row payment-total">
              <span>Total</span>
              <span>{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="payment-method-section">
            <span>
              Paid via{" "}
              {(
                transaction.payment_method ||
                transaction.paymentMethod ||
                "cash"
              ).toLowerCase()}
            </span>
            <span className="status-indicator">{transaction.status}</span>
          </div>

          {/* Customer Info - If exists, minimal */}
          {(transaction.customerInfo?.name || transaction.customer_name) && (
            <div className="customer-section">
              <div className="section-title">Customer</div>
              <div className="customer-name">
                {transaction.customerInfo?.name || transaction.customer_name}
              </div>
              {transaction.customerInfo?.email && (
                <div className="customer-contact">
                  {transaction.customerInfo.email}
                </div>
              )}
              {transaction.customerInfo?.phone && (
                <div className="customer-contact">
                  {transaction.customerInfo.phone}
                </div>
              )}
            </div>
          )}

          {/* Notes - If exists */}
          {transaction.notes && (
            <div className="notes-section">
              <div className="section-title">Notes</div>
              <div className="notes-text">{transaction.notes}</div>
            </div>
          )}

          {/* Simple Actions */}
          <div className="actions-section">
            <IonButton
              fill="clear"
              onClick={handlePrint}
              className="action-button"
            >
              <IonIcon icon={printOutline} slot="start" />
              Print
            </IonButton>

            <IonButton
              fill="clear"
              onClick={handleShare}
              className="action-button"
            >
              <IonIcon icon={shareOutline} slot="start" />
              Share
            </IonButton>

            <IonButton
              fill="clear"
              onClick={handleCopyTransactionId}
              className="action-button"
            >
              <IonIcon icon={copyOutline} slot="start" />
              Copy ID
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
