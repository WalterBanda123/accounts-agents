import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonTextarea,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonChip,
  IonLabel,
  IonSpinner,
} from "@ionic/react";
import { send, receiptOutline } from "ionicons/icons";
import { useDataContext } from "../contexts/data/UseDataContext";
import useAuthContext from "../contexts/auth/UseAuthContext";
import {
  parseSalesText,
  validateSaleItems,
  generateSalesReceipt,
  formatReceiptText,
  isSalesText,
} from "../utils/salesUtils";
import { ALL_STOCK_ITEMS } from "../mock/stocks";
import "./TransactionChat.css";

interface TransactionMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isReceipt?: boolean;
  transactionId?: string;
}

const TransactionChat: React.FC = () => {
  const { askAiAssistant, currentSessionId } = useDataContext();
  const { user } = useAuthContext();
  const contentRef = useRef<HTMLIonContentElement>(null);

  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<TransactionMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sales examples for quick input
  const salesExamples = [
    "3 bread @2.50, 1 milk @3.00",
    "2 coke @1.75, 1 soap @1.20",
    "5 apples @0.50, 2 bananas @0.30",
  ];

  const scrollToBottom = () => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(300);
    }, 100);
  };

  const addMessage = useCallback(
    (
      text: string,
      isBot: boolean = false,
      isReceipt: boolean = false,
      transactionId?: string
    ) => {
      const newMessage: TransactionMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        isBot,
        timestamp: new Date(),
        isReceipt,
        transactionId,
      };

      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    },
    []
  );

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) {
      return;
    }

    const userMessage = message.trim();
    addMessage(userMessage, false);
    setMessage("");
    setIsLoading(true);

    try {
      // Check if this looks like a sales entry
      if (isSalesText(userMessage)) {
        console.log("Processing as sales entry:", userMessage);

        // Parse the sales text
        const parsedItems = parseSalesText(userMessage);
        console.log("Parsed items:", parsedItems);

        if (parsedItems.length > 0) {
          // Validate against inventory
          const validatedItems = validateSaleItems(
            parsedItems,
            ALL_STOCK_ITEMS
          );

          // Generate receipt
          const receipt = generateSalesReceipt(validatedItems);

          // Format receipt text for display
          const receiptText = formatReceiptText(receipt);

          if (receipt.isValid) {
            // If valid, create transaction ID and call API
            const transactionId = `TXN_${user?.id}_${Date.now()}`;

            try {
              // Call the transaction API
              const apiResponse = await fetch("http://localhost:8003/run", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: userMessage,
                  context: { user_id: user?.id || "unknown" },
                  session_id: currentSessionId || "default_session",
                }),
              });

              if (apiResponse.ok) {
                const result = await apiResponse.json();
                console.log("API Response:", result);

                // Show the receipt
                addMessage(receiptText, true, true, transactionId);

                // Add confirmation message
                addMessage(
                  `✅ Transaction recorded successfully!\n\n**Transaction ID:** ${transactionId}\n\nType "confirm ${transactionId}" to save this transaction to your records.`,
                  true
                );
              } else {
                throw new Error("API call failed");
              }
            } catch (apiError) {
              console.error("API Error:", apiError);
              // Fallback to local processing
              addMessage(receiptText, true, true, transactionId);
              addMessage(
                `⚠️ Transaction processed locally.\n\n**Transaction ID:** ${transactionId}\n\nType "confirm ${transactionId}" to save this transaction.`,
                true
              );
            }
          } else {
            // Show errors
            addMessage(receiptText, true);
          }

          setIsLoading(false);
          return;
        }
      }

      // Check if this is a confirmation message
      if (userMessage.toLowerCase().startsWith("confirm ")) {
        const transactionId = userMessage.split(" ")[1];

        try {
          // Call confirmation API
          const confirmResponse = await fetch("http://localhost:8003/run", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `confirm ${transactionId}`,
              context: { user_id: user?.id || "unknown" },
              session_id: currentSessionId || "default_session",
            }),
          });

          if (confirmResponse.ok) {
            addMessage(
              `✅ Transaction ${transactionId} has been confirmed and saved to your records!`,
              true
            );
          } else {
            throw new Error("Confirmation API call failed");
          }
        } catch (confirmError) {
          console.error("Confirmation Error:", confirmError);
          addMessage(
            `⚠️ Unable to confirm transaction ${transactionId}. Please try again later.`,
            true
          );
        }

        setIsLoading(false);
        return;
      }

      // For other messages, use the regular AI assistant
      const botResponse = await askAiAssistant(
        userMessage,
        currentSessionId || undefined
      );

      if (botResponse) {
        let responseText = "";
        if (typeof botResponse === "string") {
          responseText = botResponse;
        } else if (typeof botResponse === "object" && botResponse !== null) {
          const response = botResponse as Record<string, unknown>;
          responseText = String(
            response.message ||
              response.response ||
              response.text ||
              JSON.stringify(botResponse)
          );
        }

        if (responseText.trim()) {
          addMessage(responseText, true);
        } else {
          addMessage(
            "I'm here to help you record transactions. Try typing something like '3 bread @2.50, 1 milk @3.00'",
            true
          );
        }
      } else {
        addMessage(
          "I'm here to help you record transactions. Try typing something like '3 bread @2.50, 1 milk @3.00'",
          true
        );
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage(
        "I'm experiencing some technical difficulties. Please try again.",
        true
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    message,
    isLoading,
    addMessage,
    askAiAssistant,
    currentSessionId,
    user?.id,
  ]);

  const handleExampleClick = (example: string) => {
    setMessage(example);
  };

  const clearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage(
        "👋 Welcome to Transaction Chat!\n\n💡 **How to record a sale:**\nType your items like: `3 bread @2.50, 1 milk @3.00`\n\n✨ **Supported formats:**\n• `2 coke @1.75`\n• `5x apples at 0.50`\n• `1 soap 1.20`\n\nTry one of the examples below to get started!",
        true
      );
    }
  }, [addMessage, messages.length]);

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Transaction Chat</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={clearChat}>
              Clear
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen ref={contentRef}>
        <div className="transaction-chat-container">
          {/* Sales Examples */}
          {messages.length <= 1 && (
            <div className="sales-examples">
              <IonLabel>
                <h3>Quick Examples:</h3>
              </IonLabel>
              {salesExamples.map((example, index) => (
                <IonChip
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="example-chip"
                >
                  <IonLabel>{example}</IonLabel>
                </IonChip>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble ${msg.isBot ? "bot" : "user"} ${
                  msg.isReceipt ? "receipt" : ""
                }`}
              >
                <div className="message-content">
                  {msg.isReceipt && (
                    <div className="receipt-header">
                      <IonIcon icon={receiptOutline} />
                      <span>Transaction Receipt</span>
                    </div>
                  )}
                  <div
                    className="message-text"
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\n/g, "<br/>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                </div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-bubble bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <IonSpinner name="dots" />
                    <span>Processing transaction...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>

      <IonFooter mode="ios">
        <div className="chat-input-container">
          <IonTextarea
            value={message}
            placeholder="Type items like: 3 bread @2.50, 1 milk @3.00"
            onIonInput={(e) => setMessage(e.detail.value!)}
            className="transaction-input"
            rows={1}
            autoGrow={true}
            maxlength={2000}
            wrap="soft"
          />
          <IonButton
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="send-button"
            fill="clear"
          >
            {isLoading ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonIcon icon={send} />
            )}
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default TransactionChat;
