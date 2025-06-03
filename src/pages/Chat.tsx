import { IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import React from "react";

const Chat: React.FC = () => {
    return (
        <IonPage>
            <IonHeader mode="ios">
                <IonToolbar>
                    <IonTitle>Chat</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense" mode="ios">
                    <IonToolbar>
                        <IonTitle>AI Store Assistant</IonTitle>
                    </IonToolbar>
                </IonHeader>
            </IonContent>
            <IonGrid>
                <IonRow>
                    <IonCol>
                        Chat's coming sooon
                    </IonCol>
                </IonRow>
            </IonGrid>
        </IonPage>
    )
}

export default Chat