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
import { parseBasicMarkdown } from "../utils/markdownUtils";
import { getTimeString } from "../utils/dateUtils";
import { debugSessionUtils } from "../utils/debugSessionUtils";
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

// MessageBubble component similar to Chat.tsx
const MessageBubble: React.FC<{ message: TransactionMessage }> = React.memo(
  ({ message }) => {
    return (
      <div
        className={`message-bubble-wrapper ${
          message.isBot ? "bot-message" : "user-message"
        }`}
      >
        <div
          className={`message-bubble ${
            message.isBot ? "bot-bubble" : "user-bubble"
          }`}
        >
          {message.id === "typing-indicator" ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <>
              <div className="message-text">
                {message.isReceipt && (
                  <div className="receipt-header">
                    <IonIcon icon={receiptOutline} />
                    <span>Transaction Receipt</span>
                  </div>
                )}
                {parseBasicMarkdown(message.text)}
              </div>
              <div className="message-meta">
                <span className="message-timestamp">
                  {getTimeString(message.timestamp)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

const TransactionChat: React.FC = () => {
  const {
    askAiAssistant,
    currentSessionId,
    createTransaction,
    linkTransactionToSession,
    createTransactionNotification,
    getTransactionById,
  } = useDataContext();
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
            // If valid, create transaction with our transaction system
            const transactionItems = validatedItems
              .filter((item) => item.isValid)
              .map((item) => ({
                productId: item.stockItem?.id,
                name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                line_total: item.totalPrice,
              }));

            try {
              // Record the transaction in Firestore
              const transactionResult = await createTransaction(
                currentSessionId || "default_session",
                transactionItems,
                undefined, // customerInfo
                "cash", // default payment method
                `Transaction from chat: ${userMessage}`
              );

              if (transactionResult.success) {
                // Show the receipt
                addMessage(
                  receiptText,
                  true,
                  true,
                  transactionResult.transactionId
                );

                // Add confirmation message
                addMessage(
                  `✅ Transaction recorded successfully!\n\n**Transaction ID:** ${transactionResult.transactionId}\n\nStock levels have been automatically updated.`,
                  true
                );

                // Link transaction to session for history tracking
                if (transactionResult.transactionId && currentSessionId) {
                  await linkTransactionToSession(
                    transactionResult.transactionId,
                    currentSessionId
                  );
                }

                // Create a notification for the completed transaction
                if (transactionResult.transactionId) {
                  try {
                    const transaction = await getTransactionById(
                      transactionResult.transactionId
                    );
                    if (transaction) {
                      await createTransactionNotification(transaction);
                      console.log(
                        `✅ Transaction notification created for ${transactionResult.transactionId}`
                      );
                    }
                  } catch (notificationError) {
                    console.error(
                      "Failed to create transaction notification:",
                      notificationError
                    );
                    // Don't fail the transaction if notification creation fails
                  }
                }
              } else {
                throw new Error(
                  transactionResult.error || "Failed to create transaction"
                );
              }
            } catch (transactionError) {
              console.error("Transaction Error:", transactionError);
              // Show receipt but indicate transaction failed
              addMessage(receiptText, true, true);
              addMessage(
                `❌ Failed to record transaction: ${
                  transactionError instanceof Error
                    ? transactionError.message
                    : "Unknown error"
                }\n\nPlease try again or record manually.`,
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
    createTransaction,
    linkTransactionToSession,
    createTransactionNotification,
    getTransactionById,
  ]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

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
      // Log session debug info when component loads
      debugSessionUtils.logSessionDebugInfo();

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
        <div className="messages_container">
          {/* Sales Examples */}
          {messages.length <= 1 && (
            <div className="sales-examples">
              <h4>💰 Record Sales Quickly</h4>
              {salesExamples.map((example, index) => (
                <div
                  key={index}
                  className="example-item"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                  <div className="example-description">
                    {index === 0 &&
                      "Record multiple items with quantities and prices"}
                    {index === 1 && "Simple format: quantity product @price"}
                    {index === 2 && "Works with different formats"}
                  </div>
                </div>
              ))}
              <p
                style={{
                  margin: "12px 0 0 0",
                  fontSize: "12px",
                  color: "#6c757d",
                }}
              >
                Type your items to create transaction receipts instantly!
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="message-bubble-wrapper bot-message">
              <div className="message-bubble bot-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>

      <IonFooter mode="ios" className="modern-chat-footer">
        <div className="modern-input-container">
          <div className="modern-input-wrapper">
            <IonTextarea
              value={message}
              mode="ios"
              placeholder="Type items like: 3 bread @2.50, 1 milk @3.00"
              onIonInput={(e) => setMessage(e.detail.value!)}
              onKeyDown={handleKeyPress}
              className="modern-message-input"
              rows={1}
              autoGrow={true}
              maxlength={1000}
              wrap="soft"
              enterkeyhint="send"
            />
          </div>

          <IonButton
            fill="solid"
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className={`modern-send-btn ${!message.trim() ? "disabled" : ""} ${
              isLoading ? "loading" : ""
            }`}
          >
            {isLoading ? (
              <div className="modern-spinner"></div>
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
