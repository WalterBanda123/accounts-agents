import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonPage, IonRow, IonTextarea, IonTitle, IonToolbar } from "@ionic/react";
import { add, send } from "ionicons/icons";
import React, { useState } from "react";
import "./Chat.css";

const Chat: React.FC = () => {
    const [message, setMessage] = useState<string>('');

    const handleSendMessage = () => {
        if (message.trim()) {
            // TODO: Add message to chat
            console.log('Sending message:', message);
            setMessage('');
        }
    };

    const handleAddMedia = () => {
        // TODO: Open media picker
        console.log('Opening media picker');
    };

    return (
        <IonPage>
            <IonHeader mode="ios">
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonBackButton defaultHref='/'></IonBackButton>
                    </IonButtons>
                    <IonTitle>Chat</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense" mode="ios">
                    <IonToolbar>
                        <IonTitle>AI Store Assistant</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <div className="messages_container">
                                <div className="bot_message">
                                    Hello! I'm your AI Store Assistant. How can I help you today?
                                </div>
                                <div className="client_message">
                                    Hi! I'm looking for some help with my account
                                </div>
                                <div className="bot_message">
                                    I'd be happy to help you with your account! What specific information do you need assistance with?
                                </div>
                                <div className="client_message">
                                    Can you help me check my recent transactions?
                                </div>
                                <div className="bot_message">
                                    Of course! I can help you review your recent transactions. Let me pull up that information for you.
                                </div>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <div className="chat_input_container">
                        <IonButton
                            fill="clear"
                            size="small"
                            onClick={handleAddMedia}
                            className="add_media_button"
                        >
                            <IonIcon icon={add} />
                        </IonButton>
                        <IonTextarea
                            value={message}
                            mode="ios"
                            placeholder="Type a message..."
                            onIonInput={(e) => setMessage(e.detail.value!)}
                            className="chat_input"
                            rows={1}
                            autoGrow={true}
                            wrap="soft"
                        />
                        <IonButton
                            fill="solid"
                            size="small"
                            onClick={handleSendMessage}
                            disabled={!message.trim()}
                            className="send_button"
                        >
                            <IonIcon icon={send} />
                        </IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    )
}

export default Chat