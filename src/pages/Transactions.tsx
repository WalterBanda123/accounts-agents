import { IonAvatar, IonBackButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRow, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import { receiptOutline, checkmarkCircle, timeOutline, closeCircle } from "ionicons/icons";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { ALL_TRANSACTIONS, TransactionReceiptInterface } from "../mock/transactions";
import ProfilePopover from "../components/ProfilePopover";
import './Transactions.css'

const Transactions: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
    const [showProfilePopover, setShowProfilePopover] = useState(false);
    const [profilePopoverEvent, setProfilePopoverEvent] = useState<CustomEvent | null>(null);
    const history = useHistory();
    const totalReceipts = ALL_TRANSACTIONS.length;

    const filteredTransactions = ALL_TRANSACTIONS.filter(transaction =>
        transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.merchant.toLowerCase().includes(searchText.toLowerCase())
    );

    const formatAmount = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const truncateDescription = (description: string, maxLength: number = 50): string => {
        return description.length > maxLength
            ? description.substring(0, maxLength) + '...'
            : description;
    };

    const handleTransactionClick = (transactionId: string) => {
        // Navigate to receipt detail page
        history.push(`/receipt/${transactionId}`);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return checkmarkCircle;
            case 'pending':
                return timeOutline;
            case 'failed':
                return closeCircle;
            default:
                return checkmarkCircle;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'danger';
            default:
                return 'medium';
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
        setShowProfilePopover(true);
    };

    return (
        <IonPage>
            <IonHeader mode='ios'>
                <IonToolbar>
                    <IonButtons>
                        <IonBackButton color={'dark'} defaultHref="/" />
                    </IonButtons>
                    <IonTitle>All Receipts</IonTitle>
                    <IonButtons slot="end">
                        <IonAvatar className="header-avatar" onClick={handleProfileClick}>
                            <img src="https://picsum.photos/100" alt="Profile" />
                        </IonAvatar>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense" mode='ios'>
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
                </IonGrid>                {/* Transaction List - Gmail Style */}
                <div className="transaction-list">
                    {filteredTransactions.map((transaction: TransactionReceiptInterface) => (
                        <div
                            key={transaction.id}
                            className="transaction-item"
                            onClick={() => handleTransactionClick(transaction.id)}
                        >
                            <div className="transaction-content">
                                {/* Amount - Left side like email sender */}
                                <div className="transaction-amount">
                                    {formatAmount(transaction.amount)}
                                </div>

                                {/* Description - Middle like email content */}
                                <div className="transaction-details">
                                    <div className="transaction-merchant">
                                        {transaction.merchant}
                                    </div>
                                    <div className="transaction-description">
                                        {truncateDescription(transaction.description, 60)}
                                    </div>
                                </div>

                                {/* Date & Time - Right side like email date */}
                                <div className="transaction-datetime">
                                    <div className="transaction-date">
                                        {transaction.date}
                                    </div>
                                    <div className="transaction-time">
                                        {transaction.time}
                                    </div>
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

                    {filteredTransactions.length === 0 && (
                        <div className="no-transactions">
                            <p>No transactions found matching your search.</p>
                        </div>
                    )}
                </div>
            </IonContent>

            <ProfilePopover
                isOpen={showProfilePopover}
                event={profilePopoverEvent || undefined}
                onDidDismiss={() => setShowProfilePopover(false)}
            />
        </IonPage>
    )
}

export default Transactions