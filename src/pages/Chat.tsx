import {
  IonAvatar,
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
import { add, send } from "ionicons/icons";
import React, { useState, useRef, useEffect, useCallback } from "react";
import ProfilePopover from "../components/ProfilePopover";
import DateSeparator from "../components/DateSeparator";
import "./Chat.css";
import { useDataContext } from "../contexts/data/UseDataContext";
import useAuthContext from "../contexts/auth/UseAuthContext";
import { AgentInterface } from "../interfaces/agents";
import { MessageGroup } from "../interfaces/message";
import { groupMessagesByDate } from "../utils/messageUtils";
import { getTimeString } from "../utils/dateUtils";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
}

const MessageBubble: React.FC<{ message: Message }> = React.memo(
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
          message.text.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < message.text.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))
        )}
      </div>
      {message.id !== "typing-indicator" && (
        <div className="message-timestamp">{message.timestamp}</div>
      )}
    </div>
  )
);

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
          if (existingSession && typeof existingSession === "object" && 
              "sessionId" in existingSession && existingSession.sessionId) {
            console.log("Using existing session:", existingSession.sessionId);
            setSessionInitialized(true); // Only set to true when we have a session
          } else {
            // Create a new session if none exists
            console.log("Creating new chat session...");
            const newSessionId = await createSession();
            if (newSessionId) {
              console.log("New chat session created successfully:", newSessionId);
              setSessionInitialized(true); // Only set to true when we have a session
            } else {
              console.error("Failed to create session");
            }
          }
        } catch (error) {
          console.error("Failed to initialize chat session:", error);
          setSessionInitialized(false);
        }
      }
    };

    initializeSession();
  }, [user?.id, sessionInitialized, createSession, getAgentSession]);

  // Load messages when session is available
  useEffect(() => {
    const loadAllChatMessages = async () => {
      if (sessionInitialized && user?.id && !messagesLoadedRef.current) {
        try {
          console.log("Loading all user messages for date-based grouping");
          messagesLoadedRef.current = true;
          const allMessages = await loadAllUserMessages();

          // Group messages by date
          const grouped = groupMessagesByDate(allMessages);
          setMessageGroups(grouped);
          
          console.log(`Loaded and grouped ${allMessages.length} messages into ${grouped.length} date groups`);
        } catch (error) {
          console.error("Error loading all user messages:", error);
          messagesLoadedRef.current = false;
        }
      }
    };

    loadAllChatMessages();
  }, [sessionInitialized, user?.id, loadAllUserMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(300);
    }, 100);
  };

  const addMessage = useCallback(
    async (text: string, isBot: boolean = false) => {
      // Create a more unique ID to prevent duplicate keys
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${isBot ? 'bot' : 'user'}`;
      
      // Create a new message that will be added to current group
      const newChatMessage = {
        profileId: user?.id || "",
        sessionId: currentSessionId || "",
        text,
        isBot,
        timestamp: new Date(),
        messageOrder: 1, // Will be updated when saved
      };

      // Update the message groups by adding the new message to today's group
      setMessageGroups((prevGroups) => {
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];
        
        // Find today's group or create it
        const updatedGroups = [...prevGroups];
        const todayGroupIndex = updatedGroups.findIndex(group => group.date === todayDateString);
        
        if (todayGroupIndex === -1) {
          // Create today's group
          const todayGroup: MessageGroup = {
            date: todayDateString,
            dateLabel: 'Today',
            messages: [{ id: messageId, ...newChatMessage }]
          };
          updatedGroups.unshift(todayGroup); // Add to beginning (most recent)
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
          setMessageGroups(currentGroups => {
            totalMessages = currentGroups.reduce((acc, group) => acc + group.messages.length, 0);
            return currentGroups; // Don't change the state, just read it
          });
          
          await saveMessage({
            ...newChatMessage,
            messageOrder: totalMessages,
          });
          console.log("Message saved to Firestore");
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
      const todayDateString = today.toISOString().split('T')[0];
      
      // Find today's group or create it
      const updatedGroups = [...prevGroups];
      const todayGroupIndex = updatedGroups.findIndex(group => group.date === todayDateString);
      
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
          dateLabel: 'Today',
          messages: [typingMessage]
        };
        updatedGroups.unshift(todayGroup);
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
      return prevGroups.map(group => ({
        ...group,
        messages: group.messages.filter((msg) => msg.id !== "typing-indicator")
      }));
    });
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || chatLoading) {
      return;
    }

    const userMessage = message.trim();
    console.log("Sending message:", userMessage);
    console.log("Using session ID:", currentSessionId);

    await addMessage(userMessage, false);

    setMessage("");
    setChatLoading(true);

    addTypingIndicator();

    try {
      console.log("agent info:", agent);
      // Pass the current session ID to askAiAssistant
      const botResponse = await askAiAssistant(
        userMessage,
        currentSessionId || undefined
      );
      removeTypingIndicator();

      setChatLoading(false);

      if (botResponse) {
        let responseText: string = "";

        if (typeof botResponse === "string") {
          responseText = botResponse;
        } else if (typeof botResponse === "object" && botResponse !== null) {
          const response = botResponse as Record<string, unknown>;
          responseText =
            String(response.message || "") ||
            String(response.response || "") ||
            String(response.text || "") ||
            String(response.data || "") ||
            JSON.stringify(botResponse);
        } else {
          responseText = "I received an unexpected response format.";
        }

        if (responseText.trim()) {
          await addMessage(responseText, true);
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
      removeTypingIndicator();

      setChatLoading(false);
      await addMessage(
        "I'm experiencing some technical difficulties. Please try again later.",
        true
      );
      console.error("Chat error:", err);
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

  const handleAddMedia = useCallback(() => {
    console.log("Opening media picker");
  }, []);

  const handleProfileClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setProfilePopoverEvent(e.nativeEvent as unknown as CustomEvent);
    setShowProfilePopover(true);
  }, []);

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton color="dark" defaultHref="/"></IonBackButton>
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
          {messageGroups.map((group) => (
            <React.Fragment key={group.date}>
              {/* Only show date separator if it's not the only group, or if it's not today */}
              {(messageGroups.length > 1 || group.dateLabel !== 'Today') && (
                <DateSeparator dateLabel={group.dateLabel} />
              )}
              {group.messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={{
                    id: msg.id || Date.now().toString(),
                    text: msg.text,
                    isBot: msg.isBot,
                    timestamp: msg.id === "typing-indicator" ? "typing" : getTimeString(msg.timestamp),
                  }} 
                />
              ))}
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
            onKeyUp={handleKeyPress}
            className="chat_input"
            rows={1}
            autoGrow={true}
            wrap="soft"
          />
          <IonButton
            fill="solid"
            size="small"
            onClick={handleSendMessage}
            disabled={!message.trim() || chatLoading}
            className={`send_button ${chatLoading ? "loading" : ""}`}
            color={"dark"}
          >
            {chatLoading ? (
              <div className="loading-spinner"></div>
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
