import React, { useState, useCallback, useMemo, useEffect } from "react";
import DataContext from "./DataContext";
import { StockItem } from "../../mock/stocks";
import { ChatMessage, MessageData } from "../../interfaces/message";
import { ProfileInterface } from "../../interfaces/profile";
import { ensureUserProfileExists } from "../../utils/profileUtils";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { fStore } from "../../../firebase.config";
import useAuthContext from "../auth/UseAuthContext";

const DataContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const { user } = useAuthContext();

  const COLLECTION_NAMES = useMemo(
    () => ({
      products: "products",
      profiles: "profiles",
    }),
    []
  );

  const [inventory, setInventory] = useState<Partial<StockItem>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => {
      // Initialize from sessionStorage if available
      if (typeof window !== "undefined") {
        return sessionStorage.getItem("currentSessionId") || null;
      }
      return null;
    }
  );

  // Persist session ID to sessionStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentSessionId) {
        sessionStorage.setItem("currentSessionId", currentSessionId);
      } else {
        sessionStorage.removeItem("currentSessionId");
      }
    }
  }, [currentSessionId]);

  // Helper function to check if a store_id matches the user's profile
  const isUserStore = useCallback(
    (storeId: string | undefined, profileId: string): boolean => {
      if (!storeId) return false;
      return storeId === profileId || storeId === `/profiles/${profileId}`;
    },
    []
  );

  // Helper function to get products with fallback queries
  const queryUserProducts = useCallback(
    async (profileId: string) => {
      const productsRef = collection(fStore, COLLECTION_NAMES.products);

      // Try querying with profile reference path first (more likely format)
      const profileRefPath = `/profiles/${profileId}`;
      let q = query(productsRef, where("store_id", "==", profileRefPath));
      let docs_ref = await getDocs(q);

      // If no results, try querying with direct profile ID
      if (docs_ref.empty) {
        q = query(productsRef, where("store_id", "==", profileId));
        docs_ref = await getDocs(q);
      }

      return docs_ref;
    },
    [COLLECTION_NAMES.products]
  );

  const getUserProfile = useCallback(async () => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const profilesRef = collection(fStore, COLLECTION_NAMES.profiles);
      const q = query(profilesRef, where("user_id", "==", user.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const profileDoc = querySnapshot.docs[0];
      const profile = {
        id: profileDoc.id,
        ...profileDoc.data(),
      } as ProfileInterface;

      return profile;
    } catch (error) {
      console.error("Error getting user profile:", error);
      setError(error);
      return null;
    }
  }, [user?.id, COLLECTION_NAMES.profiles]);

  const createUserProfile = useCallback(
    async (userData: {
      businessName: string;
      email: string;
      phone: string;
    }) => {
      try {
        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        // Check if profile already exists
        const existingProfile = await getUserProfile();
        if (existingProfile) {
          return existingProfile;
        }

        const profileData: Omit<ProfileInterface, "id"> = {
          user_id: user.id,
          businessName: userData.businessName,
          email: userData.email,
          phone: userData.phone,
          profileImage: user.profileImage,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const profileDocRef = await addDoc(
          collection(fStore, COLLECTION_NAMES.profiles),
          profileData
        );

        const newProfile: ProfileInterface = {
          id: profileDocRef.id,
          ...profileData,
        };

        return newProfile;
      } catch (error) {
        console.error("Error creating user profile:", error);
        setError(error);
        return null;
      }
    },
    [user?.id, user?.profileImage, COLLECTION_NAMES.profiles, getUserProfile]
  );

  const addNewProduct = useCallback(
    async (product: Partial<StockItem>) => {
      try {
        setIsProductsLoading(true);

        // Ensure user profile exists
        const userProfile = await ensureUserProfileExists(
          getUserProfile,
          createUserProfile,
          user
        );
        if (!userProfile) {
          throw new Error("Failed to get or create user profile");
        }

        // Add store_id to the product (referencing the profile as store)
        // Store as reference path format to match existing data
        const productWithProfile = {
          ...product,
          store_id: `/profiles/${userProfile.id}`,
        };

        const doc_ref = await addDoc(
          collection(fStore, COLLECTION_NAMES.products),
          productWithProfile
        );
        setError(null);
        setIsProductsLoading(false);
        return {
          data: {
            id: doc_ref.id,
          },
        };
      } catch (error) {
        setError(error);
        setIsProductsLoading(false);
        return null;
      }
    },
    [COLLECTION_NAMES.products, getUserProfile, createUserProfile, user]
  );

  const getProduct = useCallback(
    async (productId: string) => {
      try {
        setIsProductsLoading(true);

        // Get user profile first
        const userProfile = await getUserProfile();
        if (!userProfile) {
          throw new Error("User profile not found");
        }

        const doc_ref = await getDoc(
          doc(fStore, COLLECTION_NAMES.products, productId)
        );

        if (!doc_ref.exists()) {
          setIsProductsLoading(false);
          setError(null);
          return {} as Partial<StockItem>;
        }

        const productData = doc_ref.data();

        // Verify the product belongs to the user's store
        const belongsToUser = isUserStore(productData.store_id, userProfile.id);

        if (!belongsToUser) {
          setIsProductsLoading(false);
          setError(null);
          return {} as Partial<StockItem>;
        }

        const product = { id: doc_ref.id, ...productData };
        setIsProductsLoading(false);
        setError(null);
        return product as Partial<StockItem>;
      } catch (error) {
        setError(error);
        setIsProductsLoading(false);
        return null;
      }
    },
    [COLLECTION_NAMES.products, getUserProfile, isUserStore]
  );

  const searchProducts = useCallback(
    async (search: string) => {
      try {
        setIsProductsLoading(true);

        // Get user profile first
        const userProfile = await getUserProfile();
        if (!userProfile) {
          throw new Error("User profile not found");
        }

        // Query products that belong to the user's store using helper function
        const docs_ref = await queryUserProducts(userProfile.id);

        const allProducts: Partial<StockItem>[] = [];
        docs_ref.forEach((product) => {
          const updatedProd: Partial<StockItem> = {
            id: product.id,
            ...product.data(),
          };
          allProducts.push(updatedProd);
        });

        // Filter by search term
        const searchLower = search.toLowerCase();
        const results = allProducts.filter(
          (product) =>
            product.name?.toLowerCase().includes(searchLower) ||
            product.brand?.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower) ||
            product.subcategory?.toLowerCase().includes(searchLower)
        );

        setIsProductsLoading(false);
        return results;
      } catch (error) {
        console.error(error);
        setError(error);
        setIsProductsLoading(false);
        return [];
      }
    },
    [getUserProfile, queryUserProducts]
  );

  const getAllProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true);

      // Get user profile first
      const userProfile = await getUserProfile();
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      const docs_ref = await queryUserProducts(userProfile.id);

      const products: Partial<StockItem>[] = [];
      docs_ref.forEach((product) => {
        const productData = product.data();
        const updatedProd: Partial<StockItem> = {
          id: product.id,
          ...productData,
        };
        products.push(updatedProd);
      });
      setInventory(products);
      setIsProductsLoading(false);
      setError(null);

      return products;
    } catch (error) {
      console.error(error);
      setError(error);
      setIsProductsLoading(false);
      return null;
    }
  }, [getUserProfile, queryUserProducts]);

  const getAgentSession = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!user?.id) {
        setIsLoading(false);
        return null;
      }

      const sessionsRef = collection(fStore, "sessions");
      const q = query(
        sessionsRef,
        where("profileId", "==", user.id),
        where("appName", "==", "store_assistant") // Only get store assistant sessions
        // Removed orderBy to avoid index requirement - we'll sort in code
      );

      const querySnapshot = await getDocs(q);

      setIsLoading(false);
      setError(null);

      if (querySnapshot.empty) {
        return null;
      }

      // Sort sessions by createdAt in JavaScript to get the most recent
      const sessions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        ref: doc.ref,
      }));

      // Sort by createdAt descending (most recent first)
      sessions.sort((a, b) => {
        const aTime = a.data.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.data.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });

      // Get the most recent session (first document) - we'll reuse it regardless of active status
      const sessionDoc = sessions[0];
      const sessionDocData = sessionDoc.data;
      const sessionData = { sessionId: sessionDoc.id, ...sessionDocData };

      // Reactivate the session if it's not active
      if (!sessionDocData.isActive) {
        await updateDoc(sessionDoc.ref, {
          isActive: true,
          updatedAt: new Date(),
        });
      }

      // Update current session ID
      setCurrentSessionId(sessionDoc.id);

      return sessionData;
    } catch (error) {
      console.error("Error getting agent session:", error);
      setError(error);
      setIsLoading(false);
      return null;
    }
  }, [user?.id]);

  const getChatSession = useCallback(async () => {
    try {
      setIsLoading(true);

      const sessionsRef = collection(fStore, "sessions");
      const q = query(sessionsRef, where("profileId", "==", user?.id));

      const querySnapshot = await getDocs(q);
      const sessionDoc = querySnapshot.docs[0];

      setIsLoading(false);
      setError(null);

      if (!sessionDoc) return null;
      return { sessionId: sessionDoc.id, ...sessionDoc.data() };
    } catch (error) {
      setError(error);
      setIsLoading(false);
      return null;
    }
  }, [user]);

  const createSession = useCallback(async (): Promise<string> => {
    try {
      setIsChatLoading(true);

      const userId = user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Always check for existing session first
      const existingSession = await getAgentSession();
      if (existingSession && existingSession.sessionId) {
        setIsChatLoading(false);
        return existingSession.sessionId;
      }

      // Only create a new session if no session exists at all
      const sessionData = {
        profileId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        appName: "store_assistant",
        isActive: true,
      };

      const sessionDocRef = await addDoc(
        collection(fStore, "sessions"),
        sessionData
      );

      const sessionId = sessionDocRef.id;

      setCurrentSessionId(sessionId);
      setError(null);
      setIsChatLoading(false);

      return sessionId;
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error creating session:", error);
      throw error;
    }
  }, [user?.id, getAgentSession]);

  const askAiAssistant = useCallback(
    async (message: string, sessionId?: string, imageFile?: File | Blob) => {
      try {
        setIsChatLoading(true);

        const userId = user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        let activeSessionId = sessionId || currentSessionId;

        if (!activeSessionId) {
          activeSessionId = await createSession();
        }

        // Use different endpoints for different request types
        let endpoint: string;
        let requestBody: FormData | string;
        const headers: Record<string, string> = {};

        if (imageFile) {
          // Use separate endpoint for image analysis
          endpoint = `http://127.0.0.1:8003/analyze-image`;
          
          // Use FormData for image uploads
          const formData = new FormData();
          formData.append('message', message);
          formData.append('session_id', activeSessionId);
          formData.append('user_id', userId);
          formData.append('image', imageFile, 'product-image.jpg');

          requestBody = formData;
          // Don't set Content-Type header, let browser set it with boundary
        } else {
          // Use separate endpoint for text-only AI requests
          endpoint = `http://127.0.0.1:8003/run`;
          
          // Use JSON for text-only requests
          requestBody = JSON.stringify({
            message,
            context: {
              user_id: userId,
            },
            session_id: activeSessionId,
          });
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: requestBody,
        });

        if (!response.ok) {
          const endpointType = imageFile ? "image analysis" : "text AI";
          
          if (response.status === 404) {
            throw new Error(`${endpointType} endpoint not found. Please check if the backend server is running and the ${imageFile ? '/analyze-image' : '/askAI'} endpoint is available.`);
          } else if (response.status === 500) {
            throw new Error(`Internal server error in ${endpointType} service. The AI model may not be properly configured.`);
          } else if (response.status === 413) {
            throw new Error("Image file too large. Please try with a smaller image.");
          } else {
            throw new Error(
              `${endpointType} request failed! status: ${response.status} - ${response.statusText}`
            );
          }
        }

        const botResponse = await response.json();
        
        setError(null);
        setIsChatLoading(false);

        // Extract response text from various possible response structures
        if (typeof botResponse === "string") {
          return botResponse;
        }

        // Handle different response formats
        return (
          botResponse?.response ||
          botResponse?.message ||
          botResponse?.text ||
          botResponse?.content ||
          JSON.stringify(botResponse)
        );
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error in askAiAssistant:", error);
        throw error;
      }
    },
    [user?.id, currentSessionId, createSession]
  );

  const deactivateSession = useCallback(
    async (sessionId: string) => {
      try {
        setIsChatLoading(true);

        await updateDoc(doc(fStore, "sessions", sessionId), {
          isActive: false,
          updatedAt: new Date(),
        });

        // Clear current session if it's the one being deactivated
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
        }

        setError(null);
        setIsChatLoading(false);
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error deactivating session:", error);
        throw error;
      }
    },
    [currentSessionId]
  );

  const deactivateAllUserSessions = useCallback(async (userId: string) => {
    try {
      setIsChatLoading(true);

      const sessionsRef = collection(fStore, "sessions");
      const q = query(
        sessionsRef,
        where("profileId", "==", userId),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      // Deactivate all active sessions for this user
      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          isActive: false,
          updatedAt: new Date(),
        })
      );

      await Promise.all(updatePromises);

      // Clear current session
      setCurrentSessionId(null);

      setError(null);
      setIsChatLoading(false);
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error deactivating user sessions:", error);
      throw error;
    }
  }, []);

  // Message management functions
  const saveMessage = useCallback(
    async (
      message: Omit<ChatMessage, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
      try {
        setIsChatLoading(true);

        const messageData: MessageData = {
          ...message,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const messageDocRef = await addDoc(
          collection(fStore, "messages"),
          messageData
        );

        setError(null);
        setIsChatLoading(false);

        return messageDocRef.id;
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error saving message:", error);
        throw error;
      }
    },
    []
  );

  const loadMessages = useCallback(
    async (sessionId: string): Promise<ChatMessage[]> => {
      try {
        setIsChatLoading(true);

        const messagesRef = collection(fStore, "messages");
        const q = query(
          messagesRef,
          where("sessionId", "==", sessionId),
          orderBy("messageOrder", "asc")
        );

        const querySnapshot = await getDocs(q);
        const messages: ChatMessage[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            profileId: data.profileId,
            sessionId: data.sessionId,
            text: data.text,
            isBot: data.isBot,
            timestamp: data.timestamp.toDate(),
            messageOrder: data.messageOrder,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          });
        });

        setError(null);
        setIsChatLoading(false);

        return messages;
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error loading messages:", error);
        throw error;
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      try {
        setIsChatLoading(true);

        await deleteDoc(doc(fStore, "messages", messageId));

        setError(null);
        setIsChatLoading(false);
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error deleting message:", error);
        throw error;
      }
    },
    []
  );

  // Load all messages for the user (simplified approach)
  const loadAllUserMessages = useCallback(async (): Promise<ChatMessage[]> => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      setIsChatLoading(true);

      // Query messages directly by profileId (user ID)
      const messagesRef = collection(fStore, "messages");
      const q = query(
        messagesRef,
        where("profileId", "==", user.id),
        orderBy("timestamp", "asc") // Order by timestamp for chronological display
      );

      const querySnapshot = await getDocs(q);
      const allMessages: ChatMessage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allMessages.push({
          id: doc.id,
          profileId: data.profileId,
          sessionId: data.sessionId,
          text: data.text,
          isBot: data.isBot,
          timestamp: data.timestamp.toDate(),
          messageOrder: data.messageOrder,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      setError(null);
      setIsChatLoading(false);

      return allMessages;
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error loading all user messages:", error);
      throw error;
    }
  }, [user?.id]);

  const contextValue = useMemo(
    () => ({
      addNewProduct,
      getProduct,
      inventory,
      isLoading,
      isProductsLoading,
      isChatLoading,
      getAllProducts,
      error,
      searchProducts,
      askAiAssistant,
      getAgentSession,
      getChatSession,
      createSession,
      currentSessionId,
      deactivateSession,
      deactivateAllUserSessions,
      getUserProfile,
      createUserProfile,
      saveMessage,
      loadMessages,
      deleteMessage,
      loadAllUserMessages,
    }),
    [
      addNewProduct,
      getProduct,
      inventory,
      isLoading,
      isProductsLoading,
      isChatLoading,
      getAllProducts,
      error,
      searchProducts,
      askAiAssistant,
      getAgentSession,
      getChatSession,
      createSession,
      currentSessionId,
      deactivateSession,
      deactivateAllUserSessions,
      getUserProfile,
      createUserProfile,
      saveMessage,
      loadMessages,
      deleteMessage,
      loadAllUserMessages,
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
