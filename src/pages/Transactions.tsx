import { IonBackButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRow, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react";
import { receiptOutline } from "ionicons/icons";
import React, { useState } from "react";
import './Transactions.css'

const Transactions: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
    const totalReceipts = 47;

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
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <div className="receipts-placeholder">
                                <p>Receipt components will be displayed here...</p>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    )
}

export default Transactions