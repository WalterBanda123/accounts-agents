import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, timeOutline, closeCircle } from 'ionicons/icons';
import { TransactionReceiptInterface } from '../mock/transactions';

interface RecentTransactionProps {
    transaction: TransactionReceiptInterface;
    compact?: boolean;
}

const RecentTransactionCard: React.FC<RecentTransactionProps> = ({ transaction, compact = true }) => {
    const formatAmount = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const truncateDescription = (description: string, maxLength: number = 40): string => {
        return description.length > maxLength
            ? description.substring(0, maxLength) + '...'
            : description;
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

    return (
        <div className={`recent-transaction-card ${compact ? 'compact' : ''}`}>
            <div className="recent-transaction-content">
                <div className="recent-transaction-amount">
                    {formatAmount(transaction.amount)}
                </div>

                <div className="recent-transaction-details">
                    <div className="recent-transaction-merchant">
                        {transaction.merchant}
                    </div>
                    <div className="recent-transaction-description">
                        {truncateDescription(transaction.description, compact ? 35 : 50)}
                    </div>
                </div>

                <div className="recent-transaction-datetime">
                    <div className="recent-transaction-date">
                        {transaction.date}
                    </div>
                    {!compact && (
                        <div className="recent-transaction-time">
                            {transaction.time}
                        </div>
                    )}
                </div>
            </div>

            <div className={`recent-transaction-status ${transaction.status}`}>
                <IonIcon
                    icon={getStatusIcon(transaction.status)}
                    color={getStatusColor(transaction.status)}
                    size="small"
                />
            </div>
        </div>
    );
};

export default RecentTransactionCard;
