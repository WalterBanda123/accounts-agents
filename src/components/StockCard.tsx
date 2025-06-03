import React from 'react';
import { IonIcon, IonBadge } from '@ionic/react';
import { checkmarkCircle, alertCircle, closeCircle, cube } from 'ionicons/icons';
import { StockItem } from '../mock/stocks';

interface StockCardProps {
    stock: StockItem;
    compact?: boolean;
}

const StockCard: React.FC<StockCardProps> = ({ stock, compact = false }) => {
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const formatTotalValue = (price: number, quantity: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price * quantity);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'in-stock':
                return checkmarkCircle;
            case 'low-stock':
                return alertCircle;
            case 'out-of-stock':
                return closeCircle;
            default:
                return cube;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in-stock':
                return 'success';
            case 'low-stock':
                return 'warning';
            case 'out-of-stock':
                return 'danger';
            default:
                return 'medium';
        }
    };

    const getQuantityBadgeColor = (status: string) => {
        switch (status) {
            case 'in-stock':
                return 'success';
            case 'low-stock':
                return 'warning';
            case 'out-of-stock':
                return 'danger';
            default:
                return 'medium';
        }
    };

    return (
        <div className={`stock-card ${compact ? 'compact' : ''} ${stock.status}`}>
            <div className="stock-content">
                {/* Brand & Category - Left side */}
                <div className="stock-brand-section">
                    <div className="stock-brand">{stock.brand}</div>
                    <div className="stock-category">{stock.category}</div>
                </div>

                {/* Product Details - Middle */}
                <div className="stock-details">
                    <div className="stock-name">
                        {stock.name}
                        <IonBadge color={getQuantityBadgeColor(stock.status)} className="stock-size-badge">
                            {stock.size}
                        </IonBadge>
                    </div>
                    <div className="stock-description">
                        {stock.description}
                    </div>
                    <div className="stock-classification">
                        {stock.subcategory} • {stock.quantity} {stock.unit}
                    </div>
                </div>

                {/* Price & Value - Right side */}
                <div className="stock-pricing">
                    <div className="stock-unit-price">
                        {formatPrice(stock.unitPrice)}
                        <span className="price-label">per {stock.unit.slice(0, -1)}</span>
                    </div>
                    <div className="stock-total-value">
                        Total: {formatTotalValue(stock.unitPrice, stock.quantity)}
                    </div>
                    <div className="stock-last-restocked">
                        Restocked: {stock.lastRestocked}
                    </div>
                </div>
            </div>

            {/* Status indicator */}
            <div className={`stock-status ${stock.status}`}>
                <IonIcon
                    icon={getStatusIcon(stock.status)}
                    color={getStatusColor(stock.status)}
                    size="small"
                />
            </div>
        </div>
    );
};

export default StockCard;
