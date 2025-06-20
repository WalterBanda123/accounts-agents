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
import { ChatMessage } from "../interfaces/message";
import { ALL_STOCK_ITEMS } from "../mock/stocks";
import "./TransactionChat.css";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { fStore } from "../../firebase.config";

interface TransactionMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isReceipt?: boolean;
  transactionId?: string;
  messageOrder?: number; // Add this field
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
    saveMessage,
  } = useDataContext();
  const { user } = useAuthContext();
  const contentRef = useRef<HTMLIonContentElement>(null);

  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<TransactionMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      text: string;
      isBot: boolean;
      timestamp: Date;
    }>
  >([]);
  const [messageOrder, setMessageOrder] = useState<number>(0);

  // Load transaction-specific messages with proper filtering
  const loadTransactionMessages = useCallback(
    async (sessionId: string): Promise<TransactionMessage[]> => {
      try {
        console.log(
          "📥 Loading transaction chat messages for session:",
          sessionId
        );

        const messagesRef = collection(fStore, "messages");

        // Try the query with index first, fall back if index doesn't exist
        let querySnapshot;
        try {
          // Primary query - requires index (sessionId + timestamp)
          const q = query(
            messagesRef,
            where("sessionId", "==", sessionId),
            orderBy("timestamp", "asc")
          );
          querySnapshot = await getDocs(q);
          console.log("✅ Used indexed query for message loading");
        } catch (indexError) {
          console.warn("⚠️ Indexed query failed, using fallback:", indexError);
          // Fallback query - get all messages for session without ordering
          const fallbackQuery = query(
            messagesRef,
            where("sessionId", "==", sessionId)
          );
          querySnapshot = await getDocs(fallbackQuery);
          console.log(
            "📋 Used fallback query - messages will be sorted client-side"
          );
        }

        const messages: TransactionMessage[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Detect if this is a receipt based on content or metadata
          const isReceiptMessage =
            data.isReceipt ||
            data.text.includes("Transaction Receipt") ||
            data.text.includes("Transaction ID:") ||
            data.text.includes("Total:") ||
            data.transactionId;

          messages.push({
            id: doc.id,
            text: data.text,
            isBot: data.isBot,
            timestamp: data.timestamp.toDate(),
            isReceipt: isReceiptMessage,
            transactionId: data.transactionId,
            messageOrder: data.messageOrder || 0,
          });
        });

        // Always sort by timestamp to ensure correct order (especially important for fallback)
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        console.log(
          `✅ Loaded ${messages.length} transaction messages from Firestore`
        );
        console.log(
          "📊 Message timestamps:",
          messages.map((m) => ({
            text: m.text.substring(0, 30) + "...",
            timestamp: m.timestamp.toISOString(),
            isBot: m.isBot,
            isReceipt: m.isReceipt,
          }))
        );

        return messages;
      } catch (error) {
        console.error("❌ Error loading transaction messages:", error);
        return [];
      }
    },
    []
  );

  // Debug function to check message order in Firestore
  const debugMessageOrder = useCallback(async () => {
    if (!currentSessionId) return;

    try {
      console.log("🔍 Debug: Checking message order in Firestore...");
      const messagesRef = collection(fStore, "messages");
      const q = query(messagesRef, where("sessionId", "==", currentSessionId));

      const querySnapshot = await getDocs(q);
      const allMessages: Array<{
        id: string;
        text: string;
        isBot: boolean;
        timestamp: Date;
        messageOrder?: number;
        createdAt: Date;
      }> = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allMessages.push({
          id: doc.id,
          text: data.text.substring(0, 30) + "...",
          isBot: data.isBot,
          timestamp: data.timestamp.toDate(),
          messageOrder: data.messageOrder,
          createdAt: data.createdAt?.toDate(),
        });
      });

      // Sort by different criteria to see the differences
      const byTimestamp = [...allMessages].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      const byMessageOrder = [...allMessages].sort(
        (a, b) => (a.messageOrder || 0) - (b.messageOrder || 0)
      );
      const byCreatedAt = [...allMessages].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      console.log("📊 Messages sorted by timestamp:", byTimestamp);
      console.log("📊 Messages sorted by messageOrder:", byMessageOrder);
      console.log("📊 Messages sorted by createdAt:", byCreatedAt);
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  }, [currentSessionId]);

  // Load previous messages when component mounts
  useEffect(() => {
    const loadPreviousMessages = async () => {
      if (!currentSessionId || !user?.id) {
        console.log("⏸️ Skipping message load - missing session or user:", {
          currentSessionId,
          userId: user?.id,
        });
        setHasLoadedMessages(true);
        setShowWelcomeMessage(true); // Show welcome if no session/user
        return;
      }

      try {
        console.log(
          "📥 Loading previous transaction chat messages for session:",
          currentSessionId
        );
        const transactionMessages = await loadTransactionMessages(
          currentSessionId
        );

        console.log(
          `📨 Found ${transactionMessages.length} existing messages in Firestore`
        );

        // Check if welcome message already exists
        const hasWelcomeMessage = transactionMessages.some(
          (msg) =>
            msg.text && msg.text.includes("👋 Welcome to Transaction Chat")
        );

        if (transactionMessages.length > 0) {
          // Set the loaded messages
          setMessages(transactionMessages);

          // Set messageOrder to the next available number based on loaded messages
          const maxOrder = transactionMessages.reduce((max, msg) => {
            const order = msg.messageOrder || 0;
            return Math.max(max, order);
          }, -1);
          const nextOrder = Math.max(maxOrder + 1, transactionMessages.length);

          setMessageOrder(nextOrder);
          console.log(
            "📋 Set next message order to:",
            nextOrder,
            "(max found:",
            maxOrder,
            ", count:",
            transactionMessages.length,
            ")"
          );

          // Set chat messages for transaction creation (only include non-receipt messages)
          const chatMsgs = transactionMessages
            .filter((msg) => !msg.isReceipt)
            .map((msg) => ({
              text: msg.text,
              isBot: msg.isBot,
              timestamp: msg.timestamp,
            }));
          setChatMessages(chatMsgs);

          console.log(
            `✅ Loaded ${transactionMessages.length} previous messages (${chatMsgs.length} for chat history)`
          );
          console.log(`🔍 Welcome message exists: ${hasWelcomeMessage}`);
          console.log("👋 User returning to existing conversation");

          // Don't show welcome message if it already exists
          setShowWelcomeMessage(false);

          // Scroll to bottom after loading messages
          setTimeout(() => scrollToBottom(), 500);
        } else {
          console.log("🆕 No existing messages found - fresh conversation");
          // Reset message order for new conversation
          setMessageOrder(0);
          // Show welcome message for new conversations only
          setShowWelcomeMessage(true);
        }

        // Mark that we've completed loading messages
        setHasLoadedMessages(true);

        // Debug: Check message order (can be removed in production)
        if (
          process.env.NODE_ENV === "development" &&
          transactionMessages.length > 0
        ) {
          debugMessageOrder();
        }
      } catch (error) {
        console.error("❌ Error loading previous messages:", error);
        // Reset to fresh state on error
        setMessageOrder(0);
        setHasLoadedMessages(true);
        setShowWelcomeMessage(true); // Show welcome message if loading failed
      }
    };

    loadPreviousMessages();
  }, [currentSessionId, user?.id, loadTransactionMessages, debugMessageOrder]);

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
    async (
      text: string,
      isBot: boolean = false,
      isReceipt: boolean = false,
      transactionId?: string
    ) => {
      const now = new Date(); // Single timestamp for consistency
      const newMessage: TransactionMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        isBot,
        timestamp: now,
        isReceipt,
        transactionId,
        messageOrder: messageOrder, // Include messageOrder in UI message too
      };

      setMessages((prev) => [...prev, newMessage]);

      // Save message to Firestore if we have a session and user
      // Only exclude typing indicators, but save all other messages including receipts
      if (currentSessionId && user?.id && !text.includes("typing-indicator")) {
        try {
          const messageToSave: Omit<
            ChatMessage,
            "id" | "createdAt" | "updatedAt"
          > = {
            profileId: user.id,
            sessionId: currentSessionId,
            text,
            isBot,
            timestamp: now, // Use the same timestamp
            messageOrder: messageOrder,
            isReceipt: isReceipt || false, // Include receipt flag
            // Only include transactionId if it's defined and not empty
            ...(transactionId && { transactionId }),
          };

          const savedMessageId = await saveMessage(messageToSave);
          setMessageOrder((prev) => prev + 1);

          console.log(
            `💾 Saved transaction chat message ${savedMessageId} to Firestore with order ${messageOrder}`
          );
          console.log(
            `📝 Message type: ${isBot ? "Bot" : "User"}${
              isReceipt ? " (Receipt)" : ""
            }`
          );
          console.log(`📅 Message timestamp: ${now.toISOString()}`);
          if (transactionId) {
            console.log(`🔗 Transaction ID: ${transactionId}`);
          }
        } catch (error) {
          console.error("❌ Failed to save message to Firestore:", error);
          // Don't block the UI if saving fails
        }
      }

      // Also add to chatMessages for transaction creation (excluding typing indicators and receipts)
      if (!text.includes("typing-indicator") && !isReceipt) {
        setChatMessages((prev) => [
          ...prev,
          {
            text,
            isBot,
            timestamp: now, // Use the same timestamp
          },
        ]);
      }

      scrollToBottom();
    },
    [currentSessionId, user?.id, saveMessage, messageOrder]
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
              // Convert chatMessages to ChatMessage format
              const formattedChatMessages: ChatMessage[] = chatMessages.map(
                (msg, index) => ({
                  id: `chat-${Date.now()}-${index}`,
                  profileId: user?.id || "unknown",
                  sessionId: currentSessionId || "default_session",
                  text: msg.text,
                  isBot: msg.isBot,
                  timestamp: msg.timestamp,
                  messageOrder: index,
                  createdAt: msg.timestamp,
                  updatedAt: msg.timestamp,
                })
              );

              // Record the transaction in Firestore
              const transactionResult = await createTransaction(
                currentSessionId || "default_session",
                transactionItems,
                undefined, // customerInfo
                "cash", // default payment method
                `Transaction from chat: ${userMessage}`,
                formattedChatMessages // Pass chat messages
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
    chatMessages,
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

  // Welcome message - only for truly new sessions
  const [hasLoadedMessages, setHasLoadedMessages] = useState<boolean>(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(false);

  useEffect(() => {
    // Only show welcome message after we've attempted to load messages and found none
    if (
      hasLoadedMessages &&
      messages.length === 0 &&
      currentSessionId &&
      user?.id &&
      showWelcomeMessage
    ) {
      console.log("🎉 Adding welcome message for new session");

      // Log session debug info when component loads
      debugSessionUtils.logSessionDebugInfo();

      // Add welcome message - this will be saved to Firestore
      addMessage(
        "👋 Welcome to Transaction Chat!\n\n💡 **How to record a sale:**\nType your items like: `3 bread @2.50, 1 milk @3.00`\n\n✨ **Supported formats:**\n• `2 coke @1.75`\n• `5x apples at 0.50`\n• `1 soap 1.20`\n\nTry one of the examples below to get started!",
        true
      );

      // Prevent showing welcome message again
      setShowWelcomeMessage(false);
    }
  }, [
    addMessage,
    messages.length,
    currentSessionId,
    user?.id,
    hasLoadedMessages,
    showWelcomeMessage,
  ]);

  useEffect(() => {
    console.log("🔧 TransactionChat component mounted/updated");
    console.log("📋 Current session ID:", currentSessionId);
    console.log("👤 Current user ID:", user?.id);

    return () => {
      console.log(
        "🔧 TransactionChat component unmounting or dependencies changed"
      );
    };
  }, [currentSessionId, user?.id]);

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
