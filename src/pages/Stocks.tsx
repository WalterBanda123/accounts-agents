import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonButton, IonModal, IonItem, IonTextarea, IonSearchbar } from "@ionic/react";
import { cubeOutline, chatbubbleEllipsesOutline, add, send } from "ionicons/icons";
import React, { useState, useRef } from "react";
import { ALL_STOCK_ITEMS, StockItem } from "../mock/stocks";
import StockCard from "../components/StockCard";
import '../components/StockCard.css';
import './Stocks.css';

const Stocks: React.FC = () => {
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
    const [searchText, setSearchText] = useState<string>('');
    const modal = useRef<HTMLIonModalElement>(null);

    const getTotalValue = () => {
        return ALL_STOCK_ITEMS.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    };

    const filteredStocks = ALL_STOCK_ITEMS.filter(stock => {
        if (!searchText) return true;

        const searchLower = searchText.toLowerCase();
        return (
            stock.name.toLowerCase().includes(searchLower) ||
            stock.brand.toLowerCase().includes(searchLower) ||
            stock.category.toLowerCase().includes(searchLower) ||
            stock.description.toLowerCase().includes(searchLower) ||
            stock.subcategory.toLowerCase().includes(searchLower)
        );
    });

    const handleStockClick = (stock: StockItem) => {
        setSelectedStock(stock);
        modal.current?.present();
    };

    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            // Here you would integrate with your chat system
            console.log('Chat message:', chatMessage);
            setChatMessage('');
        }
    };

    const totalInventoryValue = getTotalValue();

    return (
        <IonPage>
            <IonHeader mode='ios'>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton color={'dark'} defaultHref="/" />
                    </IonButtons>
                    <IonTitle>Stock Overview</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            fill="clear"
                            color="primary"
                            onClick={() => setChatOpen(!chatOpen)}
                        >
                            <IonIcon icon={chatbubbleEllipsesOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense" mode='ios'>
                    <IonToolbar>
                        <IonTitle size="large">Stock Overview</IonTitle>
                    </IonToolbar>
                </IonHeader>

                {/* Search Section */}
                <div className="search-section">
                    <IonSearchbar
                        value={searchText}
                        debounce={300}
                        onIonInput={(e) => setSearchText(e.detail.value!)}
                        placeholder="Search inventory..."
                        mode="md"
                        className="search-bar"
                    />
                </div>

                {/* Condensed Header */}
                <div className="stocks-condensed-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <IonIcon icon={cubeOutline} />
                        </div>
                        <div className="header-text">
                            <h2>Inventory</h2>
                            <p>{filteredStocks.length} of {ALL_STOCK_ITEMS.length} items • ${totalInventoryValue.toLocaleString()} total value</p>
                        </div>
                        <IonButton
                            fill="clear"
                            color="primary"
                            onClick={() => setChatOpen(true)}
                            className="chat-button"
                        >
                            <IonIcon icon={chatbubbleEllipsesOutline} size="large" />
                        </IonButton>
                    </div>
                </div>

                {/* Stock List */}
                <div className="simple-stock-list">
                    {filteredStocks.map((stock: StockItem) => (
                        <div key={stock.id} onClick={() => handleStockClick(stock)}>
                            <StockCard
                                stock={stock}
                                compact={true}
                            />
                        </div>
                    ))}

                    {filteredStocks.length === 0 && (
                        <div className="no-stocks">
                            <p>No items found matching "{searchText}"</p>
                        </div>
                    )}
                </div>

                {/* Chat Interface */}
                {chatOpen && (
                    <div className="chat-overlay">
                        <div className="chat-header">
                            <h3>Stock Assistant</h3>
                            <IonButton
                                fill="clear"
                                size="small"
                                onClick={() => setChatOpen(false)}
                            >
                                ×
                            </IonButton>
                        </div>
                        <div className="chat-messages">
                            <div className="assistant-message">
                                Hi! I can help you analyze your inventory. Ask me about stock levels, product information, or anything else related to your inventory.
                            </div>
                        </div>
                        <div className="chat-input">
                            <IonItem>
                                <IonTextarea
                                    value={chatMessage}
                                    placeholder="Ask about your inventory..."
                                    onIonInput={(e) => setChatMessage(e.detail.value!)}
                                    rows={2}
                                    autoGrow={true}
                                />
                                <IonButton
                                    slot="end"
                                    fill="clear"
                                    onClick={handleSendMessage}
                                    disabled={!chatMessage.trim()}
                                >
                                    <IonIcon icon={send} />
                                </IonButton>
                            </IonItem>
                        </div>
                    </div>
                )}

                {/* Add Product FAB */}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton color="primary">
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>

                {/* Product Detail Modal */}
                <IonModal ref={modal} trigger="open-modal">
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Product Details</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => modal.current?.dismiss()}>Close</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        {selectedStock && (
                            <div className="product-detail">
                                <div className="detail-section">
                                    <h3>{selectedStock.name}</h3>
                                    <p className="brand">{selectedStock.brand}</p>
                                    <p className="description">{selectedStock.description}</p>
                                </div>

                                <div className="detail-section">
                                    <h4>Category</h4>
                                    <p>{selectedStock.category} → {selectedStock.subcategory}</p>
                                </div>

                                <div className="detail-section">
                                    <h4>Pricing & Inventory</h4>
                                    <p><strong>Unit Price:</strong> ${selectedStock.unitPrice}</p>
                                    <p><strong>Quantity:</strong> {selectedStock.quantity} {selectedStock.unit}</p>
                                    <p><strong>Size:</strong> {selectedStock.size}</p>
                                    <p><strong>Total Value:</strong> ${(selectedStock.unitPrice * selectedStock.quantity).toLocaleString()}</p>
                                </div>

                                <div className="detail-section">
                                    <h4>Additional Info</h4>
                                    <p><strong>Status:</strong> {selectedStock.status}</p>
                                    <p><strong>Last Restocked:</strong> {selectedStock.lastRestocked}</p>
                                    <p><strong>Supplier:</strong> {selectedStock.supplier}</p>
                                    {selectedStock.barcode && <p><strong>Barcode:</strong> {selectedStock.barcode}</p>}
                                </div>
                            </div>
                        )}
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default Stocks;