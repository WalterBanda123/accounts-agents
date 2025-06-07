import React, { useState, useCallback, useMemo } from "react";
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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

      console.log("Getting user profile for user ID:", user.id);
      const profilesRef = collection(fStore, COLLECTION_NAMES.profiles);
      const q = query(profilesRef, where("user_id", "==", user.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No profile found for user:", user.id);
        return null;
      }

      const profileDoc = querySnapshot.docs[0];
      const profile = {
        id: profileDoc.id,
        ...profileDoc.data(),
      } as ProfileInterface;

      console.log("Found user profile:", profile);
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
          console.log("Profile already exists for user:", user.id);
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

        console.log("Created user profile:", newProfile);
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

        console.log("Ensuring user profile exists for user:", user?.id);
        // Ensure user profile exists
        const userProfile = await ensureUserProfileExists(
          getUserProfile,
          createUserProfile,
          user
        );
        if (!userProfile) {
          throw new Error("Failed to get or create user profile");
        }
        console.log("Using profile/store ID:", userProfile.id);

        // Add store_id to the product (referencing the profile as store)
        // Store as reference path format to match existing data
        const productWithProfile = {
          ...product,
          store_id: `/profiles/${userProfile.id}`,
        };

        console.log(
          "Adding product with store_id reference path:",
          productWithProfile
        );

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
          console.log(
            "Product does not belong to user store. Store ID:",
            productData.store_id,
            "User Profile ID:",
            userProfile.id
          );
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
      console.log(docs_ref);
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

      console.log("Retrieved products:", products);
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

      const sessionsRef = collection(fStore, "sessions");
      const q = query(
        sessionsRef,
        where("profileId", "==", user?.id),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);

      setIsLoading(false);
      setError(null);

      if (querySnapshot.empty) {
        console.log("No active agent session found for user");
        return null;
      }

      // Get the most recent session (first document)
      const sessionDoc = querySnapshot.docs[0];
      const sessionData = { sessionId: sessionDoc.id, ...sessionDoc.data() };

      // Update current session ID if we found an active session
      setCurrentSessionId(sessionDoc.id);

      return sessionData;
    } catch (error) {
      console.error("Error getting agent session:", error);
      setError(error);
      setIsLoading(false);
      return null;
    }
  }, [user]);

  const getChatSession = useCallback(async () => {
    try {
      setIsLoading(true);

      const sessionsRef = collection(fStore, "sessions");
      console.log(user);
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

      // Create session document in Firestore
      const sessionData = {
        profileId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        appName: "store_assistant",
        isActive: true,
      };

      console.log("Creating session in Firestore for user:", userId);

      const sessionDocRef = await addDoc(
        collection(fStore, "sessions"),
        sessionData
      );

      const sessionId = sessionDocRef.id;

      setCurrentSessionId(sessionId);
      setError(null);
      setIsChatLoading(false);

      console.log("Created session:", sessionId);
      return sessionId;
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error creating session:", error);
      throw error;
    }
  }, [user?.id]);

  const askAiAssistant = useCallback(
    async (message: string, sessionId?: string) => {
      try {
        setIsChatLoading(true);

        const userId = user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        let activeSessionId = sessionId || currentSessionId;

        if (!activeSessionId) {
          console.log("No session available, creating new session...");
          activeSessionId = await createSession();
        }

        // Use the simple endpoint structure
        const endpoint = `http://127.0.0.1:8003/run`;

        const requestBody = {
          message,
          context: {
            user_id: userId,
          },
          session_id: activeSessionId,
        };

        console.log("Making request to:", endpoint);
        console.log("Request body:", requestBody);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
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
        console.log("Deactivated session:", sessionId);
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error deactivating session:", error);
        throw error;
      }
    },
    [currentSessionId]
  );

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

        console.log("Saving message to Firestore:", messageData);

        const messageDocRef = await addDoc(
          collection(fStore, "messages"),
          messageData
        );

        setError(null);
        setIsChatLoading(false);
        console.log("Saved message with ID:", messageDocRef.id);

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
        console.log(
          `Loaded ${messages.length} messages for session:`,
          sessionId
        );

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
        console.log("Deleted message:", messageId);
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error deleting message:", error);
        throw error;
      }
    },
    []
  );

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
      getUserProfile,
      createUserProfile,
      saveMessage,
      loadMessages,
      deleteMessage,
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
      getUserProfile,
      createUserProfile,
      saveMessage,
      loadMessages,
      deleteMessage,
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
