import React, { useState } from 'react';
import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonPage,
    IonTitle,
    IonToolbar,
    IonSearchbar,
    IonButton,
    IonActionSheet
} from '@ionic/react';
import {
    ellipsisVertical,
    checkmarkDoneOutline,
    trashOutline,
    timeOutline,
    businessOutline,
    receiptOutline,
    alertCircleOutline,
    informationCircleOutline,
    warningOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Notifications.css';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'transaction' | 'inventory';
    timestamp: string;
    isRead: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Low Stock Alert',
        message: 'Coca-Cola 2L bottles are running low. Only 5 units remaining.',
        type: 'warning',
        timestamp: '2 hours ago',
        isRead: false,
        priority: 'high',
        actionUrl: '/stock-overview'
    },
    {
        id: '2',
        title: 'Transaction Completed',
        message: 'Payment of $45.67 received from customer #1234.',
        type: 'success',
        timestamp: '3 hours ago',
        isRead: false,
        priority: 'medium',
        actionUrl: '/receipt/txn_001'
    },
    {
        id: '3',
        title: 'Daily Sales Report',
        message: 'Your daily sales report is ready. Total revenue: $567.89',
        type: 'info',
        timestamp: '5 hours ago',
        isRead: true,
        priority: 'low'
    },
    {
        id: '4',
        title: 'Inventory Update Required',
        message: 'Please update inventory counts for Electronics category.',
        type: 'inventory',
        timestamp: '1 day ago',
        isRead: true,
        priority: 'medium',
        actionUrl: '/stock-overview'
    },
    {
        id: '5',
        title: 'Payment Failed',
        message: 'Transaction #5678 failed due to insufficient funds.',
        type: 'error',
        timestamp: '2 days ago',
        isRead: false,
        priority: 'high'
    },
    {
        id: '6',
        title: 'New Product Added',
        message: 'iPhone 15 Pro has been successfully added to your inventory.',
        type: 'success',
        timestamp: '3 days ago',
        isRead: true,
        priority: 'low'
    }
];

const Notifications: React.FC = () => {
    const history = useHistory();
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [searchText, setSearchText] = useState<string>('');
    const [showActionSheet, setShowActionSheet] = useState(false);

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchText.toLowerCase());

        return matchesSearch;
    });

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );

        // Navigate to notification detail
        history.push(`/notification/${notification.id}`);
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setShowActionSheet(false);
    };

    const handleClearAll = () => {
        setNotifications([]);
        setShowActionSheet(false);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'warning': return warningOutline;
            case 'success': return checkmarkDoneOutline;
            case 'error': return alertCircleOutline;
            case 'transaction': return receiptOutline;
            case 'inventory': return businessOutline;
            default: return informationCircleOutline;
        }
    };

    const truncateMessage = (message: string, maxLength: number = 80): string => {
        return message.length > maxLength
            ? message.substring(0, maxLength) + '...'
            : message;
    };

    return (
        <IonPage>
            <IonHeader mode="ios">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>Notifications</IonTitle>
                    <IonButtons slot="end">
                        <IonButton fill="clear" onClick={() => setShowActionSheet(true)}>
                            <IonIcon icon={ellipsisVertical} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="notifications-content">
                <IonHeader collapse="condense" mode="ios">
                    <IonToolbar>
                        <IonTitle size="large">Notifications</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <div className="notifications-container">
                    {/* Search Section */}
                    <div className="search-section">
                        <IonSearchbar
                            value={searchText}
                            debounce={300}
                            onIonInput={(e) => setSearchText(e.detail.value!)}
                            placeholder="Search notifications..."
                            mode="md"
                            className="search-bar"
                        />
                    </div>

                    {/* Notifications List */}
                    <div className="notifications-list">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-content">
                                    {/* Icon and Type */}
                                    <div className="notification-icon">
                                        <IonIcon
                                            icon={getNotificationIcon(notification.type)}
                                        />
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
                                            <span>{notification.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredNotifications.length === 0 && (
                            <div className="no-notifications">
                                <h3>No notifications found</h3>
                                <p>
                                    {searchText
                                        ? "No notifications match your search criteria."
                                        : "You don't have any notifications yet."
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Sheet */}
                <IonActionSheet
                    isOpen={showActionSheet}
                    onDidDismiss={() => setShowActionSheet(false)}
                    buttons={[
                        {
                            text: 'Mark All as Read',
                            icon: checkmarkDoneOutline,
                            handler: handleMarkAllAsRead
                        },
                        {
                            text: 'Clear All Notifications',
                            icon: trashOutline,
                            role: 'destructive',
                            handler: handleClearAll
                        },
                        {
                            text: 'Cancel',
                            role: 'cancel'
                        }
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default Notifications;
