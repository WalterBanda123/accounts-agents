import React, { useEffect, useState } from "react";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonBadge,
  IonActionSheet,
} from "@ionic/react";
import {
  checkmarkDoneOutline,
  shareOutline,
  trashOutline,
  timeOutline,
  businessOutline,
  receiptOutline,
  alertCircleOutline,
  informationCircleOutline,
  warningOutline,
  ellipsisVertical,
  arrowForward,
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import "./NotificationDetail.css";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "transaction" | "inventory";
  timestamp: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  fullMessage?: string;
  additionalDetails?: {
    affectedItems?: string[];
    transactionId?: string;
    amount?: string;
    category?: string;
    location?: string;
  };
}

// Mock data - In a real app, this would come from an API
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Low Stock Alert",
    message: "Coca-Cola 2L bottles are running low. Only 5 units remaining.",
    fullMessage:
      "Your inventory levels for Coca-Cola 2L bottles have dropped below the minimum threshold of 10 units. Current stock: 5 units remaining. We recommend restocking soon to avoid potential stockouts during peak hours.",
    type: "warning",
    timestamp: "2 hours ago",
    isRead: false,
    priority: "high",
    actionUrl: "/stock-overview",
    additionalDetails: {
      affectedItems: ["Coca-Cola 2L", "Pepsi 2L", "Sprite 1.5L"],
      category: "Beverages",
      location: "Main Storage",
    },
  },
  {
    id: "2",
    title: "Transaction Completed",
    message: "Payment of $45.67 received from customer #1234.",
    fullMessage:
      "Transaction successfully completed. Payment of $45.67 has been received from customer #1234 via card payment. The transaction includes 3 items and has been processed without any issues.",
    type: "success",
    timestamp: "3 hours ago",
    isRead: false,
    priority: "medium",
    actionUrl: "/receipt/txn_001",
    additionalDetails: {
      transactionId: "TXN_001_2024",
      amount: "$45.67",
      category: "Sale",
    },
  },
  {
    id: "3",
    title: "Daily Sales Report",
    message: "Your daily sales report is ready. Total revenue: $567.89",
    fullMessage:
      "Your daily sales report for today has been generated and is ready for review. Total revenue: $567.89 across 23 transactions. This represents a 15% increase compared to yesterday.",
    type: "info",
    timestamp: "5 hours ago",
    isRead: true,
    priority: "low",
    additionalDetails: {
      amount: "$567.89",
      category: "Reports",
    },
  },
  {
    id: "4",
    title: "Inventory Update Required",
    message: "Please update inventory counts for Electronics category.",
    fullMessage:
      "It's time for your scheduled inventory count update. The Electronics category requires immediate attention due to recent stock movements. Please review and update counts for all items in this category.",
    type: "inventory",
    timestamp: "1 day ago",
    isRead: true,
    priority: "medium",
    actionUrl: "/stock-overview",
    additionalDetails: {
      category: "Electronics",
      affectedItems: ["iPhone 15", "Samsung Galaxy", "MacBook Air"],
    },
  },
  {
    id: "5",
    title: "Payment Failed",
    message: "Transaction #5678 failed due to insufficient funds.",
    fullMessage:
      "Payment processing failed for transaction #5678. The customer's card was declined due to insufficient funds. Please contact the customer to arrange alternative payment or retry the transaction.",
    type: "error",
    timestamp: "2 days ago",
    isRead: false,
    priority: "high",
    additionalDetails: {
      transactionId: "TXN_5678",
      category: "Payment Issues",
    },
  },
  {
    id: "6",
    title: "New Product Added",
    message: "iPhone 15 Pro has been successfully added to your inventory.",
    fullMessage:
      "iPhone 15 Pro has been successfully added to your inventory system. The product is now available for sale and has been assigned SKU: IPH15PRO001. Initial stock quantity: 10 units.",
    type: "success",
    timestamp: "3 days ago",
    isRead: true,
    priority: "low",
    additionalDetails: {
      category: "Inventory Management",
      affectedItems: ["iPhone 15 Pro"],
    },
  },
];

const NotificationDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    // Find the notification by ID
    const foundNotification = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (foundNotification) {
      setNotification(foundNotification);
    } else {
      history.push("/notifications");
    }
  }, [id, history]);

  if (!notification) {
    return null; 
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return warningOutline;
      case "success":
        return checkmarkDoneOutline;
      case "error":
        return alertCircleOutline;
      case "transaction":
        return receiptOutline;
      case "inventory":
        return businessOutline;
      default:
        return informationCircleOutline;
    }
  };

  const handleActionButton = () => {
    if (notification.actionUrl) {
      history.push(notification.actionUrl);
    }
  };

  const handleMarkAsRead = () => {
    setNotification((prev) => (prev ? { ...prev, isRead: true } : null));
    setShowActionSheet(false);
  };

  const handleDelete = () => {
    setShowActionSheet(false);
    history.push("/notifications");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: notification.title,
        text: notification.message,
      });
    }
    setShowActionSheet(false);
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/notifications" />
          </IonButtons>
          <IonTitle>Notification</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="notification-detail-content">
        <IonHeader collapse="condense" mode="ios">
          <IonToolbar>
            <IonTitle size="large">Notification</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="notification-detail-container">
          <div className="notification-header">
            <div className="notification-icon-large">
              <IonIcon icon={getNotificationIcon(notification.type)} />
            </div>
            <div className="notification-header-content">
              <div className="notification-title-large">
                {notification.title}
                {!notification.isRead && (
                  <IonBadge color="danger" className="unread-badge">
                    New
                  </IonBadge>
                )}
              </div>
              <div className="notification-timestamp-large">
                <IonIcon icon={timeOutline} />
                <span>{notification.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="notification-content-section">
            <div className="notification-message-full">
              {notification.fullMessage || notification.message}
            </div>
            {notification.additionalDetails && (
              <div className="additional-details">
                <h3>Details</h3>
                <div className="details-grid">
                  {notification.additionalDetails.transactionId && (
                    <div className="detail-item">
                      <span className="detail-label">Transaction ID:</span>
                      <span className="detail-value">
                        {notification.additionalDetails.transactionId}
                      </span>
                    </div>
                  )}
                  {notification.additionalDetails.amount && (
                    <div className="detail-item">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value">
                        {notification.additionalDetails.amount}
                      </span>
                    </div>
                  )}
                  {notification.additionalDetails.category && (
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">
                        {notification.additionalDetails.category}
                      </span>
                    </div>
                  )}
                  {notification.additionalDetails.location && (
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">
                        {notification.additionalDetails.location}
                      </span>
                    </div>
                  )}
                  {notification.additionalDetails.affectedItems && (
                    <div className="detail-item">
                      <span className="detail-label">Affected Items:</span>
                      <div className="affected-items">
                        {notification.additionalDetails.affectedItems.map(
                          (item, index) => (
                            <IonBadge
                              key={index}
                              color="light"
                              className="item-badge"
                            >
                              {item}
                            </IonBadge>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Priority Indicator */}
            <div className="priority-section">
              <span className="priority-label">Priority:</span>
              <IonBadge
                color={
                  notification.priority === "high"
                    ? "danger"
                    : notification.priority === "medium"
                    ? "warning"
                    : "success"
                }
                className="priority-badge"
              >
                {notification.priority.toUpperCase()}
              </IonBadge>
            </div>
          </div>
          {notification.actionUrl && (
            <div className="action-section">
              <IonButton
                expand="block"
                fill="solid"
                onClick={handleActionButton}
                className="action-button"
              >
                Take Action
                <IonIcon icon={arrowForward} slot="end" />
              </IonButton>
            </div>
          )}
        </div>
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            ...(!notification.isRead
              ? [
                  {
                    text: "Mark as Read",
                    icon: checkmarkDoneOutline,
                    handler: handleMarkAsRead,
                  },
                ]
              : []),
            {
              text: "Share",
              icon: shareOutline,
              handler: handleShare,
            },
            {
              text: "Delete",
              icon: trashOutline,
              role: "destructive",
              handler: handleDelete,
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

export default NotificationDetail;
