import { IonAvatar, IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonTextarea, IonTitle, IonToolbar } from "@ionic/react";
import { add, send } from "ionicons/icons";
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProfilePopover from "../components/ProfilePopover";
import "./Chat.css";

interface Message {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: string;
}

interface LocationState {
    context?: string;
    productName?: string;
    action?: 'restock' | 'general';
}

const Chat: React.FC = () => {
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [showProfilePopover, setShowProfilePopover] = useState(false);
    const [profilePopoverEvent, setProfilePopoverEvent] = useState<CustomEvent | null>(null);
    const location = useLocation<LocationState>();
    const contentRef = useRef<HTMLIonContentElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            contentRef.current?.scrollToBottom(300);
        }, 100);
    };

    const getInitialMessage = (): string => {
        const state = location.state;

        if (state?.action === 'restock' && state?.productName) {
            return `Hello! I can help you restock "${state.productName}". Just tell me how many units you'd like to add. For example: "Add 50 bottles" or "Restock 20 units". I can also help with inventory reports, analytics, and general store management tasks.`;
        }

        return "Hello! I'm your AI Store Assistant. I can help you with:\n\n📦 **Inventory Management**\n• Restock products (just tell me what and how much)\n• Check stock levels and status\n• Generate inventory reports\n\n📊 **Analytics & Reports**\n• Sales performance analysis\n• Low stock alerts\n• Financial summaries\n\n💬 **General Assistance**\n• Store operations guidance\n• Customer service tips\n• Business insights\n\nWhat would you like me to help you with today?";
    };

    const getBotResponse = (userMessage: string): string => {
        const normalizedMessage = userMessage.toLowerCase().trim();

        // Handle greetings
        if (normalizedMessage.includes('hello') || normalizedMessage.includes('hi') || normalizedMessage.includes('hey')) {
            return "Hello! 👋 I'm here to help with your store management. You can ask me about inventory, analytics, restocking, or any other store-related questions. What can I help you with?";
        }

        // Handle help requests
        if (normalizedMessage.includes('help') || normalizedMessage.includes('what can you do')) {
            return "I'm your comprehensive store assistant! Here's what I can help with:\n\n🏪 **Store Operations:**\n• Inventory management and restocking\n• Product information and updates\n• Stock level monitoring\n\n📈 **Analytics & Reports:**\n• Sales performance tracking\n• Financial summaries\n• Low stock alerts\n• Customer insights\n\n💡 **Business Intelligence:**\n• Trend analysis\n• Optimization suggestions\n• Market insights\n\nJust ask me anything in natural language!";
        }

        // Handle inventory/stock queries
        if (normalizedMessage.includes('stock') || normalizedMessage.includes('inventory') || normalizedMessage.includes('restock')) {
            return "I can help you with inventory management! For restocking, just tell me:\n\n📦 **What to restock:** Product name\n📊 **How much:** Quantity to add\n\nFor example:\n• \"Restock Coca-Cola with 50 bottles\"\n• \"Add 20 iPhone 15 Pro to inventory\"\n• \"Increase Whole Milk by 15 cartons\"\n\nI'll process the update and confirm the changes for you. What would you like to restock?";
        }

        // Handle analytics/reports
        if (normalizedMessage.includes('report') || normalizedMessage.includes('analytics') || normalizedMessage.includes('sales') || normalizedMessage.includes('performance')) {
            return "📊 **Store Analytics Available:**\n\n**Current Inventory Status:**\n• Total items: 12 product types\n• Low stock alerts: 2 items\n• Out of stock: 1 item\n• Total inventory value: $47,329\n\n**Quick Insights:**\n• Top category: Electronics (40% of value)\n• Fastest moving: Beverages\n• Requires attention: Organic Bananas (out of stock)\n\nWould you like detailed reports on any specific area?";
        }

        // Handle specific restock commands (simulate processing)
        if (normalizedMessage.includes('add') || normalizedMessage.includes('restock') || normalizedMessage.includes('increase')) {
            return "✅ I understand you want to update inventory. While I can process natural language requests, for actual inventory updates, I'm currently in demo mode.\n\n🔄 **Your request:** \"" + userMessage + "\"\n\n📝 **I would normally:**\n• Parse the product name and quantity\n• Update the inventory system\n• Confirm the changes\n• Update stock status if needed\n\nIs there anything else I can help you with regarding store management?";
        }

        // Default response
        return `I understand you said "${userMessage}". I'm here to help with store management, inventory, analytics, and business operations. Try asking me about:\n\n• Stock levels or restocking\n• Sales reports and analytics\n• Product information\n• Store insights\n\nHow can I assist you with your store today?`;
    };

    const addMessage = (text: string, isBot: boolean = false) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            isBot,
            timestamp: 'Just now'
        };

        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            // Add user message
            addMessage(message, false);

            // Get bot response
            const botResponse = getBotResponse(message);

            // Add bot response after a short delay
            setTimeout(() => {
                addMessage(botResponse, true);
            }, 500);

            setMessage('');
        }
    };

    useEffect(() => {
        // Add initial message when component mounts
        if (messages.length === 0) {
            const initialMessage = getInitialMessage();
            addMessage(initialMessage, true);
        }
    }); // Empty dependency array is intentional for initial load

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAddMedia = () => {
        // TODO: Open media picker
        console.log('Opening media picker');
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
        setShowProfilePopover(true);
    };

    return (
        <IonPage>
            <IonHeader mode="ios">
                <IonToolbar>
                    <IonButtons slot='start' >
                        <IonBackButton color="dark" defaultHref='/'></IonBackButton>
                    </IonButtons>
                    <IonTitle>Chat</IonTitle>
                    <IonButtons slot="end">
                        <IonAvatar className="header-avatar" onClick={handleProfileClick}>
                            <img src="https://picsum.photos/100" alt="Profile" />
                        </IonAvatar>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen ref={contentRef}>
                <IonHeader collapse="condense" mode="ios">
                    <IonToolbar>
                        <IonTitle>AI Store Assistant</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <div className="messages_container">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message-group ${msg.isBot ? '' : 'client'}`}>
                            <div className={msg.isBot ? 'bot_message' : 'client_message'}>
                                {msg.text.split('\n').map((line, index) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < msg.text.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="message-timestamp">{msg.timestamp}</div>
                        </div>
                    ))}
                </div>

            </IonContent>
            <IonFooter mode="ios">
                <div className="chat_input_container">
                    <IonButton
                        fill="clear"
                        onClick={handleAddMedia}
                        className="add_media_button"
                    >
                        <IonIcon icon={add} slot="icon-only" />
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
                        color={'dark'}
                    >
                        <IonIcon icon={send} />
                    </IonButton>
                </div>
            </IonFooter>

            <ProfilePopover
                isOpen={showProfilePopover}
                event={profilePopoverEvent || undefined}
                onDidDismiss={() => setShowProfilePopover(false)}
            />
        </IonPage>
    )
}

export default Chat