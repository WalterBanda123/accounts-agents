import React, { useState } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonToast,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption
} from '@ionic/react';
import {
    closeOutline,
    checkmarkCircle,
    saveOutline
} from 'ionicons/icons';
import { CartItem, Customer } from '../mock/transactions';
import './ReceiptModal.css';

interface ReceiptModalProps {
    isOpen: boolean;
    onDidDismiss: () => void;
    cartImage: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onDidDismiss, cartImage }) => {
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [customer, setCustomer] = useState<Customer>({ name: '' });
    const [paymentMethod, setPaymentMethod] = useState('Credit Card');

    // Dummy cart data (simulating backend response)
    const dummyCartItems: CartItem[] = [
        {
            id: 'ITEM001',
            name: 'Organic Bananas',
            quantity: 2,
            unitPrice: 1.29,
            totalPrice: 2.58,
            barcode: '1234567890123'
        },
        {
            id: 'ITEM002',
            name: 'Whole Milk - 1 Gallon',
            quantity: 1,
            unitPrice: 3.49,
            totalPrice: 3.49,
            barcode: '2345678901234'
        },
        {
            id: 'ITEM003',
            name: 'Bread - Whole Wheat',
            quantity: 1,
            unitPrice: 2.99,
            totalPrice: 2.99,
            barcode: '3456789012345'
        }
    ];

    const subtotal = dummyCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.0825; // 8.25% tax
    const total = subtotal + tax;

    const formatAmount = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const handleSaveReceipt = () => {
        // Here we would save the receipt to the backend
        // For now, just show a success message
        setToastMessage('Receipt saved successfully!');
        setShowToast(true);

        // Close modal after a delay
        setTimeout(() => {
            onDidDismiss();
        }, 1500);
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
                <IonHeader mode="ios">
                    <IonToolbar>
                        <IonTitle>New Receipt</IonTitle>
                        <IonButtons slot="end">
                            <IonButton fill="clear" onClick={onDidDismiss}>
                                <IonIcon icon={closeOutline} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="receipt-modal-content">
                    {/* Cart Image Section */}
                    <div className="cart-image-section">
                        <img
                            src={cartImage}
                            alt="Scanned cart"
                            className="cart-image"
                        />
                        <div className="image-overlay">
                            <IonIcon icon={checkmarkCircle} color="success" />
                            <span>Cart Scanned Successfully</span>
                        </div>
                    </div>

                    {/* Receipt Preview */}
                    <IonCard className="receipt-preview">
                        <IonCardContent>
                            <div className="receipt-header">
                                <h2>QuickMart Store</h2>
                                <p>Receipt Preview</p>
                                <div className="receipt-divider"></div>
                            </div>

                            {/* Items */}
                            <div className="receipt-section">
                                <h3>Scanned Items</h3>
                                {dummyCartItems.map((item) => (
                                    <div key={item.id} className="receipt-item">
                                        <div className="item-details">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-quantity">Qty: {item.quantity}</span>
                                        </div>
                                        <span className="item-price">{formatAmount(item.totalPrice)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="receipt-section">
                                <div className="receipt-divider"></div>
                                <div className="receipt-row">
                                    <span>Subtotal:</span>
                                    <span>{formatAmount(subtotal)}</span>
                                </div>
                                <div className="receipt-row">
                                    <span>Tax (8.25%):</span>
                                    <span>{formatAmount(tax)}</span>
                                </div>
                                <div className="receipt-divider"></div>
                                <div className="receipt-row total">
                                    <span>Total:</span>
                                    <span>{formatAmount(total)}</span>
                                </div>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Customer Information Form */}
                    <IonCard>
                        <IonCardContent>
                            <h3>Customer Information (Optional)</h3>
                            <IonList>
                                <IonItem>
                                    <IonLabel position="stacked">Customer Name</IonLabel>
                                    <IonInput
                                        value={customer.name}
                                        placeholder="Enter customer name"
                                        onIonInput={(e) => setCustomer({ ...customer, name: e.detail.value! })}
                                    />
                                </IonItem>
                                <IonItem>
                                    <IonLabel position="stacked">Email (Optional)</IonLabel>
                                    <IonInput
                                        type="email"
                                        value={customer.email}
                                        placeholder="Enter email address"
                                        onIonInput={(e) => setCustomer({ ...customer, email: e.detail.value! })}
                                    />
                                </IonItem>
                                <IonItem>
                                    <IonLabel position="stacked">Payment Method</IonLabel>
                                    <IonSelect value={paymentMethod} onIonChange={(e) => setPaymentMethod(e.detail.value)}>
                                        <IonSelectOption value="Credit Card">Credit Card</IonSelectOption>
                                        <IonSelectOption value="Debit Card">Debit Card</IonSelectOption>
                                        <IonSelectOption value="Cash">Cash</IonSelectOption>
                                        <IonSelectOption value="Mobile Payment">Mobile Payment</IonSelectOption>
                                    </IonSelect>
                                </IonItem>
                            </IonList>
                        </IonCardContent>
                    </IonCard>

                    {/* Save Button */}
                    <div className="save-button-container">
                        <IonButton
                            expand="block"
                            fill="solid"
                            color="primary"
                            onClick={handleSaveReceipt}
                            className="save-receipt-button"
                        >
                            <IonIcon icon={saveOutline} slot="start" />
                            Save Receipt - {formatAmount(total)}
                        </IonButton>
                    </div>
                </IonContent>
            </IonModal>

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={2000}
                position="bottom"
                color="success"
            />
        </>
    );
};

export default ReceiptModal;
