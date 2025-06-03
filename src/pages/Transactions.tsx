import { IonBackButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRow, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import { receiptOutline } from "ionicons/icons";
import React, { useState } from "react";
import { ALL_TRANSACTIONS, TransactionReceiptInterface } from "../mock/transactions";
import './Transactions.css'

const Transactions: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
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




    return (
        <IonPage>
            <IonHeader mode='ios'>
                <IonToolbar>
                    <IonButtons>
                        <IonBackButton color={'dark'} defaultHref="/" />
                    </IonButtons>
                    <IonTitle>All Receipts</IonTitle>
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
                </IonGrid>
                {/* Transaction List - Gmail Style */}
                <div className="transaction-list">
                    {filteredTransactions.map((transaction: TransactionReceiptInterface) => (
                        <div key={transaction.id} className="transaction-item">
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

                            {/* Status indicator */}
                            <div className={`transaction-status ${transaction.status}`}>
                                <span className="status-dot"></span>
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
        </IonPage>
    )
}

export default Transactions