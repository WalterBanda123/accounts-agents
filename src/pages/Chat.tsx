import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonSpinner,
} from "@ionic/react";
import {
  send,
  documentText,
  downloadOutline,
  checkmarkCircle,
} from "ionicons/icons";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ProfilePopover from "../components/ProfilePopover";
import InitialsAvatar from "../components/InitialsAvatar";
import DateSeparator from "../components/DateSeparator";
import "./Chat.css";
import { useDataContext } from "../contexts/data/UseDataContext";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { AgentInterface } from "../interfaces/agents";
import { MessageGroup } from "../interfaces/message";
import { groupMessagesByDate } from "../utils/messageUtils";
import { getTimeString } from "../utils/dateUtils";
import { parseBasicMarkdown } from "../utils/markdownUtils";
import {
  extractDownloadableContent,
  downloadFile,
  formatFileSize,
  generateReportPDF,
  downloadFileFromBase64,
  downloadPDF,
  testFirebaseStorageUrl,
} from "../utils/downloadUtils";
import {
  parseSalesText,
  validateSaleItems,
  generateSalesReceipt,
  formatReceiptText,
  createTransactionFromReceipt,
  isSalesText,
} from "../utils/salesUtils";
import { ALL_STOCK_ITEMS } from "../mock/stocks";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  pdfData?: {
    pdf_base64: string;
    pdf_size: number;
    direct_download_url: string;
  };
  data?: Record<string, unknown>;
}

// Enhanced MessageBubble component with download functionality
const MessageBubble: React.FC<{
  message: Message;
  userId?: string;
  sessionId?: string;
}> = React.memo(({ message, userId, sessionId }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Check if this message contains downloadable content
  const downloadableFile = message.isBot
    ? extractDownloadableContent(message.text, message.pdfData, message.data)
    : null;

  const handleDownload = async () => {
    if (!downloadableFile || !userId || !sessionId) return;

    setIsDownloading(true);

    try {
      let success = false;

      // PRIORITY 1: If we have a direct download URL from data object (Firebase Storage)
      if (downloadableFile.url && downloadableFile.url.startsWith("http")) {
        // For Firebase Storage URLs, test accessibility first
        if (
          downloadableFile.url.includes("storage.googleapis.com") ||
          downloadableFile.url.includes("firebasestorage.app")
        ) {
          const testResult = await testFirebaseStorageUrl(downloadableFile.url);

          if (!testResult.accessible) {
            console.warn(
              "⚠️ Firebase URL test failed, but proceeding with download attempt anyway"
            );
          }
        }

        success = await downloadFile(
          downloadableFile.url,
          downloadableFile.filename
        );
      }
      // PRIORITY 2: If we have the complete PDF data from the backend with base64
      else if (message.pdfData && message.pdfData.pdf_base64) {
        downloadPDF({
          pdf_data: message.pdfData,
          data: { filename: downloadableFile.filename },
        });
        success = true;
      }
      // PRIORITY 3: If we have base64 PDF data from downloadableFile
      else if (downloadableFile.base64Data) {
        success = downloadFileFromBase64(
          downloadableFile.base64Data,
          downloadableFile.filename,
          "application/pdf"
        );
      }
      // PRIORITY 4: If we have pdfData with direct_download_url
      else if (message.pdfData && message.pdfData.direct_download_url) {
        success = await downloadFile(
          message.pdfData.direct_download_url,
          downloadableFile.filename
        );
      }
      // FALLBACK: Generate PDF from text content
      else if (downloadableFile.content) {
        const pdfUrl = generateReportPDF(
          downloadableFile.content,
          userId,
          sessionId,
          "general"
        );
        success = await downloadFile(pdfUrl, downloadableFile.filename);
        window.URL.revokeObjectURL(pdfUrl);
      }
      // No valid download option found
      else {
        console.error("❌ No valid download option found:", {
          hasDownloadableFile: !!downloadableFile,
          hasUrl: !!downloadableFile.url,
          hasPdfData: !!message.pdfData,
          hasMessageData: !!message.data,
          downloadableFile: downloadableFile,
          messagePdfData: message.pdfData,
          messageData: message.data,
        });
        throw new Error("No valid download source available");
      }

      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } else {
        throw new Error("Download operation returned false");
      }
    } catch (error) {
      console.error("❌ Download failed:", error);
      // You could add a toast notification here to inform the user
    } finally {
      setIsDownloading(false);
    }
  };

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
              {parseBasicMarkdown(message.text)}
            </div>
            <div className="message-meta">
              <span className="message-timestamp">{message.timestamp}</span>
            </div>
            {downloadableFile && (
              <div className="message-attachment">
                <div className="attachment-info">
                  <IonIcon icon={documentText} className="attachment-icon" />
                  <div className="attachment-details">
                    <div className="attachment-filename">
                      {downloadableFile.filename}
                    </div>
                    {downloadableFile.size && (
                      <div className="attachment-size">
                        {formatFileSize(downloadableFile.size)}
                      </div>
                    )}
                    <div className="pdf-preview-text">
                      📄 PDF Report ready for download
                    </div>
                  </div>
                </div>
                <IonButton
                  size="small"
                  fill="solid"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`download-button ${
                    isDownloading ? "downloading" : ""
                  } ${downloadSuccess ? "download-success" : ""}`}
                >
                  {isDownloading ? (
                    <>
                      <IonSpinner name="crescent" />
                      Downloading...
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <IonIcon icon={checkmarkCircle} />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <IonIcon icon={downloadOutline} />
                      Download PDF
                    </>
                  )}
                </IonButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

const Chat: React.FC = () => {
  const {
    askAiAssistant,
    error,
    getAgentSession,
    createSession,
    currentSessionId,
    saveMessage,
    loadAllUserMessages,
  } = useDataContext();
  const { user } = useAuthContext();
  const [message, setMessage] = useState<string>("");
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [agent, setAgent] = useState<AgentInterface | null>();
  const [sessionInitialized, setSessionInitialized] = useState<boolean>(false);
  const messagesLoadedRef = useRef<boolean>(false);
  const sendingMessageRef = useRef<boolean>(false); // Prevent double sends

  // Welcome message state for first-time users
  const [hasLoadedMessages, setHasLoadedMessages] = useState<boolean>(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(false);

  // Check if error exists and is a meaningful error
  const hasError = error !== null && error !== undefined;

  useEffect(() => {
    const fetchAgentSession = async () => {
      try {
        const response = await getAgentSession();
        if (!response) {
          console.log("No agent session found - this is normal for new users");
          setAgent(null);
          return;
        }
        setAgent(response as AgentInterface);
        // Session ID is already set in the context by getAgentSession
        const sessionData = response as { sessionId?: string };
        if (sessionData.sessionId) {
          console.log("Found existing session:", sessionData.sessionId);
        }
      } catch (error) {
        console.error("Error fetching agent session:", error);
        setAgent(null);
      }
    };

    // Only fetch if user is authenticated
    if (user?.id) {
      fetchAgentSession();
    } else {
      // Clear agent and session if user is not authenticated
      setAgent(null);
      setSessionInitialized(false);
    }
  }, [getAgentSession, user?.id]);

  // Initialize chat session if not already available
  useEffect(() => {
    const initializeSession = async () => {
      if (user?.id && !sessionInitialized) {
        try {
          // Try to get or create a session
          console.log("Initializing chat session for user:", user.id);

          // First try to get an existing session
          const existingSession = await getAgentSession();
          if (
            existingSession &&
            typeof existingSession === "object" &&
            "sessionId" in existingSession &&
            existingSession.sessionId
          ) {
            console.log("Using existing session:", existingSession.sessionId);
            setSessionInitialized(true);
          } else {
            // Create a new session if none exists
            console.log("Creating new chat session...");
            const newSessionId = await createSession();
            if (newSessionId) {
              console.log(
                "New chat session created successfully:",
                newSessionId
              );
              setSessionInitialized(true);
            } else {
              console.error("Failed to create session");
              // Still mark as initialized so messages can be loaded/shown
              setSessionInitialized(true);
            }
          }
        } catch (error) {
          console.error("Failed to initialize chat session:", error);
          // Mark as initialized even on error so we can show welcome message
          setSessionInitialized(true);
        }
      }
    };

    initializeSession();
  }, [user?.id, sessionInitialized, createSession, getAgentSession]);

  // Load messages when session is available OR when user is authenticated but no session exists
  useEffect(() => {
    const loadAllChatMessages = async () => {
      if (!user?.id) {
        console.log("⏸️ Skipping message load - no user authenticated");
        return;
      }

      if (messagesLoadedRef.current) {
        console.log("⏸️ Messages already loaded, skipping");
        return;
      }

      try {
        console.log("Loading all user messages for date-based grouping");
        messagesLoadedRef.current = true;
        const allMessages = await loadAllUserMessages();

        // If we have a session but no messages, or if we have no session at all
        if (allMessages.length === 0) {
          console.log(
            "🆕 No existing messages found - showing welcome message"
          );
          setShowWelcomeMessage(true);
        } else {
          console.log(`✅ Found ${allMessages.length} existing messages`);
          setShowWelcomeMessage(false);
        }

        // Group messages by date
        const grouped = groupMessagesByDate(allMessages);
        setMessageGroups(grouped);
        setHasLoadedMessages(true);

        console.log(
          `Loaded and grouped ${allMessages.length} messages into ${grouped.length} date groups`
        );
      } catch (error) {
        console.error("Error loading all user messages:", error);
        messagesLoadedRef.current = false;
        // Show welcome message if loading failed
        setShowWelcomeMessage(true);
        setHasLoadedMessages(true);
      }
    };

    // Load messages regardless of session state, but only if user is authenticated
    if (user?.id) {
      loadAllChatMessages();
    }
  }, [user?.id, loadAllUserMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(300);
    }, 100);
  };

  const addMessage = useCallback(
    async (
      text: string,
      isBot: boolean = false,
      pdfData?: {
        pdf_base64: string;
        pdf_size: number;
        direct_download_url: string;
      },
      data?: Record<string, unknown>
    ) => {
      // Create a more unique ID to prevent duplicate keys
      const timestamp = performance.now(); // More precise than Date.now()
      const randomId = Math.random().toString(36).substr(2, 9);
      const messageId = `msg-${timestamp}-${randomId}-${
        isBot ? "bot" : "user"
      }`;

      // Create a new message that will be added to current group
      const newChatMessage = {
        profileId: user?.id || "",
        sessionId: currentSessionId || "",
        text,
        isBot,
        timestamp: new Date(),
        messageOrder: 1, // Will be updated when saved
        ...(pdfData && { pdfData }), // Add PDF data if available
        ...(data && { data }), // Add full data object if available
      };

      // Update the message groups by adding the new message to today's group
      setMessageGroups((prevGroups) => {
        const today = new Date();
        const todayDateString = today.toISOString().split("T")[0];

        // Find today's group or create it
        const updatedGroups = [...prevGroups];
        const todayGroupIndex = updatedGroups.findIndex(
          (group) => group.date === todayDateString
        );

        if (todayGroupIndex === -1) {
          // Create today's group
          const todayGroup: MessageGroup = {
            date: todayDateString,
            dateLabel: "Today",
            messages: [{ id: messageId, ...newChatMessage }],
          };
          updatedGroups.push(todayGroup); // Add to end (chronological order)
        } else {
          // Add to existing today's group
          const newMessage = { id: messageId, ...newChatMessage };
          updatedGroups[todayGroupIndex].messages.push(newMessage);
        }

        return updatedGroups;
      });

      scrollToBottom();

      // Save message to Firestore if we have a session and user
      if (currentSessionId && user?.id) {
        try {
          // Use a ref to get the current messageGroups length to avoid stale closure
          let totalMessages = 0;
          setMessageGroups((currentGroups) => {
            totalMessages = currentGroups.reduce(
              (acc, group) => acc + group.messages.length,
              0
            );
            return currentGroups; // Don't change the state, just read it
          });

          await saveMessage({
            ...newChatMessage,
            messageOrder: totalMessages,
          });
        } catch (error) {
          console.error("Error saving message to Firestore:", error);
        }
      }
    },
    [currentSessionId, user?.id, saveMessage]
  );

  const addTypingIndicator = useCallback(() => {
    setMessageGroups((prevGroups) => {
      const today = new Date();
      const todayDateString = today.toISOString().split("T")[0];

      // Find today's group or create it
      const updatedGroups = [...prevGroups];
      const todayGroupIndex = updatedGroups.findIndex(
        (group) => group.date === todayDateString
      );

      // Check if typing indicator already exists to prevent duplicates
      const existingTypingIndicator = updatedGroups.some((group) =>
        group.messages.some((msg) => msg.id === "typing-indicator")
      );

      if (existingTypingIndicator) {
        return prevGroups; // Don't add if already exists
      }

      const typingMessage = {
        id: "typing-indicator",
        profileId: "",
        sessionId: "",
        text: "...",
        isBot: true,
        timestamp: new Date(),
        messageOrder: 0,
      };

      if (todayGroupIndex === -1) {
        // Create today's group with typing indicator
        const todayGroup: MessageGroup = {
          date: todayDateString,
          dateLabel: "Today",
          messages: [typingMessage],
        };
        updatedGroups.push(todayGroup); // Add to end (chronological order)
      } else {
        // Add typing indicator to existing today's group
        updatedGroups[todayGroupIndex].messages.push(typingMessage);
      }

      return updatedGroups;
    });
    scrollToBottom();
  }, []);

  const removeTypingIndicator = useCallback(() => {
    setMessageGroups((prevGroups) => {
      return prevGroups.map((group) => ({
        ...group,
        messages: group.messages.filter((msg) => msg.id !== "typing-indicator"),
      }));
    });
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || chatLoading || sendingMessageRef.current) {
      return;
    }

    // Set sending flag to prevent double execution
    sendingMessageRef.current = true;

    const userMessage = message.trim();
    console.log("Sending message:", userMessage);
    console.log("Using session ID:", currentSessionId);

    await addMessage(userMessage, false);

    setMessage("");
    setChatLoading(true);

    addTypingIndicator();

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

          // Remove typing indicator and show receipt
          removeTypingIndicator();
          setChatLoading(false);

          await addMessage(receiptText, true);

          // If successful, send to API for confirmation
          if (receipt.isValid) {
            console.log("Transaction successful:", receipt);

            // Create transaction ID
            const transactionId = `TXN_${user?.id || "user"}_${Date.now()}`;

            // Send transaction to API for processing
            try {
              const transactionData = createTransactionFromReceipt(
                receipt,
                user?.email || "Unknown"
              );

              // Call the API to process the transaction
              const apiResponse = await fetch("http://localhost:8003/run", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: `Record transaction: ${JSON.stringify(
                    transactionData
                  )}`,
                  context: { user_id: user?.id || "test_user" },
                  session_id: currentSessionId || "default_session",
                }),
              });

              if (apiResponse.ok) {
                const apiResult = await apiResponse.json();
                console.log("Transaction recorded successfully:", apiResult);

                // Optionally show confirmation message
                await addMessage(
                  `✅ **Transaction Recorded Successfully**\n\nTransaction ID: ${transactionId}\n\nYour sale has been saved to the system.`,
                  true
                );
              } else {
                console.error(
                  "Failed to record transaction:",
                  apiResponse.statusText
                );
                await addMessage(
                  "⚠️ **Transaction Generated** but could not be saved to the system. Please try again or contact support.",
                  true
                );
              }
            } catch (apiError) {
              console.error("API Error:", apiError);
              await addMessage(
                "⚠️ **Transaction Generated** but could not connect to the system. The receipt is valid but not saved.",
                true
              );
            }
          }

          // Reset flag and return early
          sendingMessageRef.current = false;
          return;
        }
      }

      // If not a sales entry, proceed with normal AI chat
      console.log("Processing as regular chat message");
      console.log("agent info:", agent);

      // Pass the current session ID to askAiAssistant
      const botResponse = await askAiAssistant(
        userMessage,
        currentSessionId || undefined
      );

      // Always remove typing indicator regardless of response
      removeTypingIndicator();
      setChatLoading(false);

      if (botResponse) {
        let responseText: string = "";
        let pdfData:
          | {
              pdf_base64: string;
              pdf_size: number;
              direct_download_url: string;
            }
          | undefined;
        let responseData: Record<string, unknown> | undefined;

        // Handle the updated askAiAssistant response format: {message, pdfData, data}
        if (
          typeof botResponse === "object" &&
          botResponse !== null &&
          "message" in botResponse
        ) {
          const response = botResponse as {
            message: string;
            pdfData?: {
              pdf_base64: string;
              pdf_size: number;
              direct_download_url: string;
            } | null;
            data?: Record<string, unknown> | null;
          };

          responseText = response.message;
          pdfData = response.pdfData || undefined;
          responseData = response.data || undefined;
        } else if (typeof botResponse === "string") {
          responseText = botResponse;
        } else {
          responseText = "I received an unexpected response format.";
        }

        if (responseText.trim()) {
          await addMessage(responseText, true, pdfData, responseData);
        } else {
          await addMessage(
            "I apologize, but I couldn't process your request at the moment. Please try again.",
            true
          );
        }
      } else {
        await addMessage(
          "I apologize, but I couldn't process your request at the moment. Please try again.",
          true
        );
      }
    } catch (err) {
      // Always remove typing indicator and stop loading on error
      removeTypingIndicator();
      setChatLoading(false);

      await addMessage(
        "I'm experiencing some technical difficulties. Please try again later.",
        true
      );
      console.error("Chat error:", err);
    } finally {
      // Always reset the sending flag
      sendingMessageRef.current = false;
    }
  }, [
    message,
    chatLoading,
    addMessage,
    addTypingIndicator,
    removeTypingIndicator,
    askAiAssistant,
    agent,
    currentSessionId,
    user?.email,
    user?.id,
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

  useEffect(() => {
    scrollToBottom();
  }, [messageGroups]);

  // Reset messages loaded ref when user changes
  useEffect(() => {
    if (user?.id) {
      // Reset messages loaded flag when user changes (new user login)
      messagesLoadedRef.current = false;
    } else {
      // Clear state when user logs out
      setMessageGroups([]);
      setSessionInitialized(false);
      messagesLoadedRef.current = false;
    }
  }, [user?.id]);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  }, []);

  // Welcome message effect - show initial message for first-time users
  useEffect(() => {
    if (
      hasLoadedMessages &&
      messageGroups.length === 0 &&
      user?.id &&
      showWelcomeMessage
    ) {
      console.log("🎉 Adding welcome message for new user");

      // Add welcome message for general chat
      addMessage(
        `👋 **Welcome to Account Manager Chat!**

I'm your AI assistant here to help you manage your business efficiently. Here's what I can help you with:

🏪 **Store Management:**
• Track inventory and stock levels
• Manage product information
• Monitor sales performance

💰 **Financial Operations:**
• Record transactions and sales
• Track expenses and income
• Generate financial reports

📊 **Business Analytics:**
• View sales summaries and trends
• Analyze customer behavior
• Monitor business performance

📱 **Quick Actions:**
• Use the home screen for rapid access to features
• Navigate to Transaction Chat for sales recording
• Check Miscellaneous Activities for other operations

**How to get started:**
Simply ask me questions or tell me what you'd like to do! For example:
- "Show me today's sales summary"
- "Help me track inventory"
- "Generate a financial report"

What would you like to do today?`,
        true // isBot = true
      );

      // Prevent showing welcome message again
      setShowWelcomeMessage(false);
    }
  }, [
    hasLoadedMessages,
    messageGroups.length,
    user?.id,
    showWelcomeMessage,
    addMessage,
  ]);

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton color="dark" defaultHref="/"></IonBackButton>
          </IonButtons>
          <IonTitle>Chat</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleProfileClick}>
              <InitialsAvatar
                name={user?.name || "User"}
                size="small"
                className="header-avatar"
              />
            </IonButton>
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
          {messageGroups.length === 0 && (
            <div className="sales-examples">
              <h4>💰 Record Sales Quickly</h4>
              <div
                className="example-item"
                onClick={() => setMessage("3 bread @2.50, 1 milk @3.00")}
              >
                3 bread @2.50, 1 milk @3.00
                <div className="example-description">
                  Record multiple items with quantities and prices
                </div>
              </div>
              <div
                className="example-item"
                onClick={() => setMessage("5 apples @0.30, 2 coke @1.75")}
              >
                5 apples @0.30, 2 coke @1.75
                <div className="example-description">
                  Simple format: quantity product @price
                </div>
              </div>
              <div
                className="example-item"
                onClick={() => setMessage("1 soap @1.20")}
              >
                1 soap @1.20
                <div className="example-description">
                  Single item transaction
                </div>
              </div>
              <p
                style={{
                  margin: "12px 0 0 0",
                  fontSize: "12px",
                  color: "#6c757d",
                }}
              >
                Or ask me anything about your business, inventory, or reports!
              </p>
            </div>
          )}

          {messageGroups.map((group) => (
            <React.Fragment key={group.date}>
              {/* Only show date separator if it's not the only group, or if it's not today */}
              {(messageGroups.length > 1 || group.dateLabel !== "Today") && (
                <DateSeparator dateLabel={group.dateLabel} />
              )}
              {group.messages.map((msg) => {
                // Debug logging for each message being rendered
                if (msg.isBot && (msg.pdfData || msg.data)) {
                  console.log("🖼️ Rendering bot message with data:", {
                    messageId: msg.id,
                    hasData: !!msg.data,
                    hasPdfData: !!msg.pdfData,
                    dataKeys: msg.data ? Object.keys(msg.data) : [],
                    pdfDataPreview: msg.pdfData,
                    dataPreview: msg.data,
                  });
                }

                return (
                  <MessageBubble
                    key={msg.id}
                    message={{
                      id: msg.id || Date.now().toString(),
                      text: msg.text,
                      isBot: msg.isBot,
                      timestamp:
                        msg.id === "typing-indicator"
                          ? "typing"
                          : getTimeString(msg.timestamp),
                      pdfData: msg.pdfData, // Pass through the PDF data
                      data: msg.data, // Pass through the full data object
                    }}
                    userId={user?.id || undefined}
                    sessionId={currentSessionId || undefined}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {hasError && (
            <div className="error-message">
              <div className="error-content">
                <strong>Connection Error:</strong> Unable to reach the AI
                assistant. Please check your connection and try again.
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
              placeholder="Type a message..."
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
            disabled={
              !message.trim() || chatLoading || sendingMessageRef.current
            }
            className={`modern-send-btn ${!message.trim() ? "disabled" : ""} ${
              chatLoading ? "loading" : ""
            }`}
          >
            {chatLoading ? (
              <div className="modern-spinner"></div>
            ) : (
              <IonIcon icon={send} />
            )}
          </IonButton>
        </div>
      </IonFooter>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={() => setShowProfilePopover(false)}
      />
    </IonPage>
  );
};

export default Chat;
