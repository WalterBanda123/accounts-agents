import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonActionSheet,
  IonToast,
} from "@ionic/react";
import {
  printOutline,
  shareOutline,
  mailOutline,
  chatbubbleOutline,
  downloadOutline,
  receiptOutline,
  checkmarkCircle,
} from "ionicons/icons";
import { ALL_TRANSACTIONS } from "../mock/transactions";
import ProfilePopover from "../components/ProfilePopover";
import "./ReceiptDetail.css";

interface RouteParams {
  id: string;
}

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);

  const receipt = ALL_TRANSACTIONS.find((t) => t.id === id);

  if (!receipt) {
    return (
      <IonPage>
        <IonHeader mode="ios">
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/transactions" />
            </IonButtons>
            <IonTitle>Receipt Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="receipt-not-found">
            <IonIcon icon={receiptOutline} size="large" color="medium" />
            <h2>Receipt Not Found</h2>
            <p>The requested receipt could not be found.</p>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => history.push("/receipts")}
            >
              Back to Receipts
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handlePrint = () => {
    setToastMessage("Print functionality would be implemented here");
    setShowToast(true);
    setShowActionSheet(false);
  };

  const handleSendText = () => {
    setToastMessage("SMS functionality would be implemented here");
    setShowToast(true);
    setShowActionSheet(false);
  };

  const handleEmail = () => {
    setToastMessage("Email functionality would be implemented here");
    setShowToast(true);
    setShowActionSheet(false);
  };

  const handleDownload = () => {
    setToastMessage("Download PDF functionality would be implemented here");
    setShowToast(true);
    setShowActionSheet(false);
  };

  const handleShare = () => {
    setToastMessage("Share functionality would be implemented here");
    setShowToast(true);
    setShowActionSheet(false);
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
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Receipt Details</IonTitle>
          <IonButtons slot="end">
            <IonAvatar className="header-avatar" onClick={handleProfileClick}>
              <img src="https://picsum.photos/100" alt="Profile" />
            </IonAvatar>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="receipt-detail-content">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Receipt #{receipt.receiptNumber}</IonTitle>
          </IonToolbar>
        </IonHeader>
        {/* Cart Image Section */}
        {receipt.cartImage && (
          <div className="cart-image-section">
            <img
              src={receipt.cartImage}
              alt="Cart items"
              className="cart-image"
            />
            <div className="image-overlay">
              <IonIcon icon={checkmarkCircle} color="success" />
              <span>Transaction Completed</span>
            </div>
          </div>
        )}

        {/* Paper Receipt Style */}
        <div className="receipt-container">
          <div className="receipt-paper">
            {/* Header */}
            <div className="receipt-header">
              <h1>{receipt.merchant}</h1>
              <p className="store-tagline">Thank you for shopping with us!</p>
              <div className="receipt-divider"></div>
            </div>

            {/* Transaction Info */}
            <div className="receipt-section">
              <div className="receipt-row">
                <span className="label">Receipt #:</span>
                <span className="value">{receipt.receiptNumber}</span>
              </div>
              <div className="receipt-row">
                <span className="label">Date:</span>
                <span className="value">{receipt.date}</span>
              </div>
              <div className="receipt-row">
                <span className="label">Time:</span>
                <span className="value">{receipt.time}</span>
              </div>
              <div className="receipt-row">
                <span className="label">Cashier:</span>
                <span className="value">{receipt.cashierName}</span>
              </div>
            </div>

            {/* Customer Info */}
            {receipt.customer && (
              <div className="receipt-section">
                <div className="receipt-divider"></div>
                <h3>Customer Information</h3>
                <div className="receipt-row">
                  <span className="label">Name:</span>
                  <span className="value">{receipt.customer.name}</span>
                </div>
                {receipt.customer.email && (
                  <div className="receipt-row">
                    <span className="label">Email:</span>
                    <span className="value">{receipt.customer.email}</span>
                  </div>
                )}
                {receipt.customer.phone && (
                  <div className="receipt-row">
                    <span className="label">Phone:</span>
                    <span className="value">{receipt.customer.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="receipt-section">
              <div className="receipt-divider"></div>
              <h3>Items Purchased</h3>

              {receipt.cartItems.map((item) => (
                <div key={item.id} className="receipt-item">
                  <div className="item-header">
                    <span className="item-name">{item.name}</span>
                    <span className="item-total">
                      {formatAmount(item.totalPrice)}
                    </span>
                  </div>
                  <div className="item-details">
                    <span className="item-qty-price">
                      {item.quantity} × {formatAmount(item.unitPrice)}
                    </span>
                    {item.barcode && (
                      <span className="item-barcode">#{item.barcode}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="receipt-section">
              <div className="receipt-divider"></div>
              <div className="receipt-row">
                <span className="label">Subtotal:</span>
                <span className="value">{formatAmount(receipt.subtotal)}</span>
              </div>
              <div className="receipt-row">
                <span className="label">Tax:</span>
                <span className="value">{formatAmount(receipt.tax)}</span>
              </div>
              {receipt.discount && (
                <div className="receipt-row discount">
                  <span className="label">Discount:</span>
                  <span className="value">
                    -{formatAmount(receipt.discount)}
                  </span>
                </div>
              )}
              <div className="receipt-divider"></div>
              <div className="receipt-row total">
                <span className="label">TOTAL:</span>
                <span className="value">{formatAmount(receipt.amount)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="receipt-section">
              <div className="receipt-divider"></div>
              <div className="receipt-row">
                <span className="label">Payment Method:</span>
                <span className="value">{receipt.paymentMethod}</span>
              </div>
              <div className="receipt-row">
                <span className="label">Status:</span>
                <span className={`value status-${receipt.status}`}>
                  {receipt.status.charAt(0).toUpperCase() +
                    receipt.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="receipt-footer">
              <div className="receipt-divider"></div>
              <p className="footer-text">Items sold by {receipt.merchant}</p>
              <p className="footer-text">Thank you for your business!</p>
              <p className="footer-text small">Visit us again soon</p>

              {/* Decorative elements */}
              <div className="receipt-decoration">★ ★ ★ ★ ★</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <IonButton
            expand="block"
            fill="solid"
            color="primary"
            onClick={handlePrint}
          >
            <IonIcon icon={printOutline} slot="start" />
            Print Receipt
          </IonButton>

          <div className="button-row">
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              onClick={handleSendText}
            >
              <IonIcon icon={chatbubbleOutline} slot="start" />
              Send via Text
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              onClick={handleEmail}
            >
              <IonIcon icon={mailOutline} slot="start" />
              Email Receipt
            </IonButton>
          </div>
        </div>
      </IonContent>

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
            text: "Send via Text",
            icon: chatbubbleOutline,
            handler: handleSendText,
          },
          {
            text: "Email Receipt",
            icon: mailOutline,
            handler: handleEmail,
          },
          {
            text: "Download PDF",
            icon: downloadOutline,
            handler: handleDownload,
          },
          {
            text: "Share Receipt",
            icon: shareOutline,
            handler: handleShare,
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ]}
      />

      {/* Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
      />
    </IonPage>
  );
};

export default ReceiptDetail;
