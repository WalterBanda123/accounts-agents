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
import "./Chat.css";
import { useDataContext } from "../contexts/data/UseDataContext";
import { AgentInterface } from "../interfaces/agents";

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
  } = useDataContext();
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [profilePopoverEvent, setProfilePopoverEvent] =
    useState<CustomEvent | null>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);
  const [agent, setAgent] = useState<AgentInterface | null>();
  const [sessionInitialized, setSessionInitialized] = useState<boolean>(false);

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
    fetchAgentSession();
  }, [getAgentSession]);

  // Initialize chat session if not already available
  useEffect(() => {
    const initializeSession = async () => {
      if (!currentSessionId && !sessionInitialized) {
        try {
          setSessionInitialized(true);
          console.log(
            "No existing session found, creating new chat session..."
          );
          await createSession();
          console.log("New chat session initialized successfully");
        } catch (error) {
          console.error("Failed to initialize chat session:", error);
          setSessionInitialized(false);
        }
      } else if (currentSessionId) {
        setSessionInitialized(true);
        console.log("Using existing session:", currentSessionId);
      }
    };

    initializeSession();
  }, [currentSessionId, sessionInitialized, createSession]);

  const scrollToBottom = () => {
    setTimeout(() => {
      contentRef.current?.scrollToBottom(300);
    }, 100);
  };

  const getTodaysDate = (): string => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  const addMessage = useCallback((text: string, isBot: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
      text,
      isBot,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, newMessage]);
    scrollToBottom();
  }, []);

  const addTypingIndicator = useCallback(() => {
    const typingMessage: Message = {
      id: "typing-indicator",
      text: "...",
      isBot: true,
      timestamp: "typing",
    };
    setMessages((prev) => [...prev, typingMessage]);
    scrollToBottom();
  }, []);

  const removeTypingIndicator = useCallback(() => {
    setMessages((prev) => prev.filter((msg) => msg.id !== "typing-indicator"));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || chatLoading) {
      return;
    }

    const userMessage = message.trim();
    console.log("Sending message:", userMessage);
    console.log("Using session ID:", currentSessionId);

    addMessage(userMessage, false);

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
          addMessage(responseText, true);
        } else {
          addMessage(
            "I apologize, but I couldn't process your request at the moment. Please try again.",
            true
          );
        }
      } else {
        addMessage(
          "I apologize, but I couldn't process your request at the moment. Please try again.",
          true
        );
      }
    } catch (err) {
      removeTypingIndicator();

      setChatLoading(false);
      addMessage(
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
  }, [messages]);

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
          {messages.length > 0 && (
            <div className="date-separator">
              <span className="date-text">{getTodaysDate()}</span>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
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
