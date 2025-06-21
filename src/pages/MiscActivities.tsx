import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "@ionic/react";
import { send } from "ionicons/icons";
import ProfilePopover from "../components/ProfilePopover";
import InitialsAvatar from "../components/InitialsAvatar";
import DateSeparator from "../components/DateSeparator";
import "./MiscActivities.css";
import { useDataContext } from "../contexts/data/UseDataContext";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { ChatMessage, MessageGroup } from "../interfaces/message";
import { groupMessagesByDate } from "../utils/messageUtils";
import { getTimeString } from "../utils/dateUtils";
import { parseBasicMarkdown } from "../utils/markdownUtils";

const MessageBubble: React.FC<{ message: ChatMessage }> = React.memo(
  ({ message }) => (
    <div className={`message-group ${message.isBot ? "" : "client"}`}>
      <div className={message.isBot ? "bot_message" : "client_message"}>
        {message.id === "typing-indicator" ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <div className="message-content">
            {parseBasicMarkdown(message.text)}
          </div>
        )}
      </div>
      {message.id !== "typing-indicator" && (
        <div className="message-timestamp">
          {getTimeString(message.timestamp)}
        </div>
      )}
    </div>
  )
);

MessageBubble.displayName = "MessageBubble";

const MiscActivities: React.FC = () => {
  const {
    askAiAssistant,
    error,
    getMiscActivitiesSession,
    createMiscActivitiesSession,
    miscActivitiesSessionId,
    saveMessage,
    loadMiscActivitiesMessages,
  } = useDataContext();
  const { user } = useAuthContext();
  const [message, setMessage] = useState<string>("");
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [sessionInitialized, setSessionInitialized] = useState<boolean>(false);
  const messagesLoadedRef = useRef<boolean>(false);
  const sendingMessageRef = useRef<boolean>(false);

  // Check if error exists and is a meaningful error
  const hasError = error !== null && error !== undefined;

  useEffect(() => {
    const fetchMiscActivitiesSession = async () => {
      try {
        // Use the miscellaneous activities session
        const response = await getMiscActivitiesSession();
        if (!response) {
          console.log(
            "No misc activities session found - this is normal for new users"
          );
          return;
        }
        const sessionData = response as { sessionId?: string };
        if (sessionData.sessionId) {
          console.log(
            "Found existing misc activities session:",
            sessionData.sessionId
          );
        }
      } catch (error) {
        console.error("Error fetching misc activities session:", error);
      }
    };

    if (user?.id) {
      fetchMiscActivitiesSession();
    } else {
      setSessionInitialized(false);
    }
  }, [getMiscActivitiesSession, user?.id]);

  // Initialize chat session
  useEffect(() => {
    const initializeSession = async () => {
      if (user?.id && !sessionInitialized) {
        try {
          console.log(
            "Initializing misc activities session for user:",
            user.id
          );

          // Try to get existing session or create new one
          const existingSession = await getMiscActivitiesSession();
          if (
            existingSession &&
            typeof existingSession === "object" &&
            "sessionId" in existingSession &&
            existingSession.sessionId
          ) {
            console.log(
              "Using existing misc activities session:",
              existingSession.sessionId
            );
            setSessionInitialized(true);
          } else {
            console.log("Creating new misc activities session...");
            const newSessionId = await createMiscActivitiesSession();
            if (newSessionId) {
              console.log(
                "New misc activities session created successfully:",
                newSessionId
              );
              setSessionInitialized(true);
            } else {
              console.error("Failed to create misc activities session");
            }
          }
        } catch (error) {
          console.error("Failed to initialize misc activities session:", error);
          setSessionInitialized(false);
        }
      }
    };

    if (user?.id) {
      initializeSession();
    }
  }, [
    user?.id,
    sessionInitialized,
    createMiscActivitiesSession,
    getMiscActivitiesSession,
  ]);

  // Load messages with initial helper message
  useEffect(() => {
    const loadMessages = async () => {
      if (
        user?.id &&
        !messagesLoadedRef.current
      ) {
        try {
          let loadedMessages: ChatMessage[] = [];
          
          if (miscActivitiesSessionId) {
            console.log(
              "Loading misc activities messages for session:",
              miscActivitiesSessionId
            );
            loadedMessages = await loadMiscActivitiesMessages();
          } else {
            console.log("No misc activities session yet, will show welcome message");
            loadedMessages = [];
          }
          
          messagesLoadedRef.current = true;
          const allMessages = loadedMessages || [];

          // Add initial helper message if no messages exist
          if (allMessages.length === 0) {
            // Initial helpful message for miscellaneous activities
            const initialMessage: ChatMessage = {
              id: "initial-helper",
              profileId: user?.id || "system",
              sessionId: miscActivitiesSessionId || "initial",
              text: `👋 **Welcome to Miscellaneous Activities!**

I'm here to help you record various business activities like:
• **Cash withdrawals** from the register
• **Petty purchases** and small expenses  
• **Payments** to suppliers or vendors
• **Other miscellaneous** transactions

**How to get started:**
Just tell me what activity you want to record! For example:
- "I took $50 from the register for petty cash"
- "Paid $25 for office supplies"
- "Cash withdrawal of $100 for business expenses"

I'll help you log it properly and update your registry. What would you like to record today?`,
              isBot: true,
              timestamp: new Date(),
              messageOrder: 0,
            };

            allMessages.unshift(initialMessage);
          }

          const grouped = groupMessagesByDate(allMessages);
          setMessageGroups(grouped);

          setTimeout(() => {
            contentRef.current?.scrollToBottom(300);
          }, 100);
        } catch (error) {
          console.error("Error loading misc messages:", error);
        }
      }
    };

    loadMessages();
  }, [
    user?.id,
    miscActivitiesSessionId,
    loadMiscActivitiesMessages,
  ]);

  const sendMessage = useCallback(async () => {
    if (
      !message.trim() ||
      sendingMessageRef.current ||
      !miscActivitiesSessionId ||
      !user?.id
    ) {
      return;
    }

    sendingMessageRef.current = true;
    const userMessage = message.trim();
    setMessage("");
    setChatLoading(true);

    try {
      // Add user message immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        profileId: user.id,
        sessionId: miscActivitiesSessionId,
        text: userMessage,
        isBot: false,
        timestamp: new Date(),
        messageOrder: Date.now(),
      };

      setMessageGroups((prev) => {
        const newMessages = [
          ...(prev.flatMap((group) => group.messages) || []),
          userMsg,
        ];
        return groupMessagesByDate(newMessages);
      });

      // Save user message
      await saveMessage({
        profileId: user.id,
        sessionId: miscActivitiesSessionId,
        text: userMessage,
        isBot: false,
        timestamp: new Date(),
        messageOrder: Date.now(),
      });

      // Add typing indicator
      const typingMsg: ChatMessage = {
        id: "typing-indicator",
        profileId: user.id,
        sessionId: miscActivitiesSessionId,
        text: "",
        isBot: true,
        timestamp: new Date(),
        messageOrder: Date.now(),
      };

      setMessageGroups((prev) => {
        const newMessages = [
          ...(prev.flatMap((group) => group.messages) || []),
          typingMsg,
        ];
        return groupMessagesByDate(newMessages);
      });

      setTimeout(() => {
        contentRef.current?.scrollToBottom(300);
      }, 100);

      // Send to AI with context about miscellaneous activities
      const contextualMessage = `[MISCELLANEOUS ACTIVITIES CONTEXT] The user is recording miscellaneous business activities like cash withdrawals, petty purchases, payments, etc. Please help them log this activity properly and update the registry accordingly.

User request: ${userMessage}`;

      const aiResponse = await askAiAssistant(
        contextualMessage,
        miscActivitiesSessionId
      );

      // Remove typing indicator first
      setMessageGroups((prev) => {
        const messagesWithoutTyping = prev
          .flatMap((group) => group.messages)
          .filter((msg) => msg.id !== "typing-indicator");
        return groupMessagesByDate(messagesWithoutTyping);
      });

      // Process and save AI response
      if (aiResponse) {
        let responseText: string = "";

        // Handle new response format with message and pdfData
        if (
          typeof aiResponse === "object" &&
          aiResponse !== null &&
          "message" in aiResponse
        ) {
          const response = aiResponse as {
            message: string;
            pdfData?: {
              pdf_base64: string;
              pdf_size: number;
              direct_download_url: string;
            };
          };
          responseText = response.message;
          // Note: MiscActivities doesn't currently support PDF downloads, but the message will be displayed
        } else if (typeof aiResponse === "string") {
          responseText = aiResponse;
        } else if (typeof aiResponse === "object" && aiResponse !== null) {
          const response = aiResponse as Record<string, unknown>;
          responseText =
            String(response.message || "") ||
            String(response.response || "") ||
            String(response.text || "") ||
            String(response.data || "") ||
            JSON.stringify(aiResponse);
        } else {
          responseText = "I received an unexpected response format.";
        }

        if (responseText.trim()) {
          // Save AI response to database
          await saveMessage({
            profileId: user.id,
            sessionId: miscActivitiesSessionId,
            text: responseText,
            isBot: true,
            timestamp: new Date(),
            messageOrder: Date.now(),
          });

          // Add AI response to UI
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            profileId: user.id,
            sessionId: miscActivitiesSessionId,
            text: responseText,
            isBot: true,
            timestamp: new Date(),
            messageOrder: Date.now(),
          };

          setMessageGroups((prev) => {
            const newMessages = [
              ...(prev.flatMap((group) => group.messages) || []),
              aiMsg,
            ];
            return groupMessagesByDate(newMessages);
          });
        } else {
          // Handle empty or invalid response
          const fallbackMsg =
            "I apologize, but I couldn't process your request at the moment. Please try again.";

          await saveMessage({
            profileId: user.id,
            sessionId: miscActivitiesSessionId,
            text: fallbackMsg,
            isBot: true,
            timestamp: new Date(),
            messageOrder: Date.now(),
          });

          const errorMsg: ChatMessage = {
            id: `fallback-${Date.now()}`,
            profileId: user.id,
            sessionId: miscActivitiesSessionId,
            text: fallbackMsg,
            isBot: true,
            timestamp: new Date(),
            messageOrder: Date.now(),
          };

          setMessageGroups((prev) => {
            const newMessages = [
              ...(prev.flatMap((group) => group.messages) || []),
              errorMsg,
            ];
            return groupMessagesByDate(newMessages);
          });
        }
      } else {
        // Handle null/undefined response
        const fallbackMsg =
          "I apologize, but I couldn't process your request at the moment. Please try again.";

        await saveMessage({
          profileId: user.id,
          sessionId: miscActivitiesSessionId,
          text: fallbackMsg,
          isBot: true,
          timestamp: new Date(),
          messageOrder: Date.now(),
        });

        const errorMsg: ChatMessage = {
          id: `no-response-${Date.now()}`,
          profileId: user.id,
          sessionId: miscActivitiesSessionId,
          text: fallbackMsg,
          isBot: true,
          timestamp: new Date(),
          messageOrder: Date.now(),
        };

        setMessageGroups((prev) => {
          const newMessages = [
            ...(prev.flatMap((group) => group.messages) || []),
            errorMsg,
          ];
          return groupMessagesByDate(newMessages);
        });
      }

      setTimeout(() => {
        contentRef.current?.scrollToBottom(300);
      }, 100);
    } catch (error) {
      console.error("Error sending misc activity message:", error);

      // Remove typing indicator on error
      setMessageGroups((prev) => {
        const messagesWithoutTyping = prev
          .flatMap((group) => group.messages)
          .filter((msg) => msg.id !== "typing-indicator");
        return groupMessagesByDate(messagesWithoutTyping);
      });

      // Save error message to database and show to user
      const errorMsg =
        "I'm experiencing some technical difficulties. Please try again later.";

      try {
        await saveMessage({
          profileId: user.id,
          sessionId: miscActivitiesSessionId,
          text: errorMsg,
          isBot: true,
          timestamp: new Date(),
          messageOrder: Date.now(),
        });
      } catch (saveError) {
        console.error("Error saving error message:", saveError);
      }

      const errorChatMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        profileId: user.id,
        sessionId: miscActivitiesSessionId,
        text: errorMsg,
        isBot: true,
        timestamp: new Date(),
        messageOrder: Date.now(),
      };

      setMessageGroups((prev) => {
        const newMessages = [
          ...(prev.flatMap((group) => group.messages) || []),
          errorChatMsg,
        ];
        return groupMessagesByDate(newMessages);
      });
    } finally {
      setChatLoading(false);
      sendingMessageRef.current = false;
    }
  }, [message, miscActivitiesSessionId, askAiAssistant, saveMessage, user?.id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleProfileClick = (event: React.MouseEvent) => {
    setProfilePopoverEvent(event.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  };

  const handleProfilePopoverDismiss = () => {
    setShowProfilePopover(false);
    setProfilePopoverEvent(null);
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/"></IonBackButton>
          </IonButtons>
          <IonTitle>Miscellaneous Activities</IonTitle>
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
            <IonTitle size="large">Misc Activities</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="messages_container misc-activities-theme">
          {hasError && (
            <div className="error-banner">
              <p>
                ⚠️ Connection issue. Please check your internet and try again.
              </p>
            </div>
          )}

          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <DateSeparator dateLabel={group.dateLabel} />
              {group.messages.map((msg, index) => (
                <MessageBubble key={`${groupIndex}-${index}`} message={msg} />
              ))}
            </div>
          ))}

          {!sessionInitialized && !hasError && (
            <div className="loading-banner">
              <p>🔄 Initializing miscellaneous activities chat...</p>
            </div>
          )}
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div className="input-container">
            <IonTextarea
              value={message}
              onIonInput={(e) => setMessage(e.detail.value!)}
              onKeyDown={handleKeyPress}
              placeholder="Describe the activity you want to record..."
              rows={1}
              autoGrow
              maxlength={1000}
              className="message-input"
              disabled={chatLoading || !sessionInitialized}
            />
            <div className="send-button-container">
              <IonButton
                onClick={sendMessage}
                disabled={!message.trim() || chatLoading || !sessionInitialized}
                className="send-button"
                fill="clear"
                size="large"
              >
                <IonIcon icon={send} />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>

      <ProfilePopover
        isOpen={showProfilePopover}
        event={profilePopoverEvent || undefined}
        onDidDismiss={handleProfilePopoverDismiss}
      />
    </IonPage>
  );
};

export default MiscActivities;
