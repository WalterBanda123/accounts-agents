import React, { useState, useCallback, useMemo, useEffect } from "react";
import DataContext from "./DataContext";
import { StockItem } from "../../mock/stocks";
import { ChatMessage, MessageData } from "../../interfaces/message";
import { ProfileInterface } from "../../interfaces/profile";
import { ensureUserProfileExists } from "../../utils/profileUtils";
import { calculateStockStatus } from "../../utils/stockUtils";
import { sessionStorageUtils } from "../../utils/sessionManagerUtils";
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
      profiles: "user_profiles",
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
      // Initialize from sessionStorage if available and not expired
      return sessionStorageUtils.getCurrentSession();
    }
  );

  // Independent session ID for miscellaneous activities
  const [miscActivitiesSessionId, setMiscActivitiesSessionId] = useState<
    string | null
  >(() => {
    // Initialize from sessionStorage if available and not expired
    return sessionStorageUtils.getMiscActivitiesSession();
  });

  // Persist session ID to sessionStorage when it changes
  useEffect(() => {
    if (currentSessionId) {
      sessionStorageUtils.setCurrentSession(currentSessionId);
    } else {
      sessionStorageUtils.clearAll();
    }
  }, [currentSessionId]);

  // Persist miscellaneous activities session ID to sessionStorage when it changes
  useEffect(() => {
    if (miscActivitiesSessionId) {
      sessionStorageUtils.setMiscActivitiesSession(miscActivitiesSessionId);
    }
  }, [miscActivitiesSessionId]);

  // Initialize session management when user changes
  useEffect(() => {
    if (user?.id) {
      sessionStorageUtils.initialize(user.id).catch(error => {
        console.error('Error initializing session management:', error);
      });
    }
  }, [user?.id]);

  // Helper function to check if a store_id matches the user's profile
  const isUserStore = useCallback(
    (storeId: string | undefined, profileId: string): boolean => {
      if (!storeId) return false;
      return storeId === profileId || storeId === `/profiles/${profileId}`;
    },
    []
  );

  // Helper function to get products by Firebase user ID
  const queryUserProductsByUserId = useCallback(
    async (firebaseUserId: string) => {
      const productsRef = collection(fStore, COLLECTION_NAMES.products);

      // Query by userId field (Firebase UID)
      const q = query(productsRef, where("userId", "==", firebaseUserId));
      const docs_ref = await getDocs(q);

      return docs_ref;
    },
    [COLLECTION_NAMES.products]
  );

  // Keep the old profile-based query as fallback
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

  const addNewProduct = useCallback(async (product: Partial<StockItem>) => {
      try {
        console.log("🔥 DataContextProvider.addNewProduct called with:", product);
        setIsProductsLoading(true);

        if (!user?.id) {
          console.log("❌ User not authenticated");
          throw new Error("User not authenticated");
        }

        console.log("👤 User ID:", user.id);

        // Ensure user profile exists
        console.log("🔍 Getting user profile...");
        const userProfile = await ensureUserProfileExists(
          getUserProfile,
          createUserProfile,
          user
        );
        if (!userProfile) {
          console.log("❌ Failed to get or create user profile", userProfile);
          throw new Error("Failed to get or create user profile");
        }

        console.log("✅ User profile:", userProfile);

        // Add both userId (Firebase UID) and store_id (profile reference) for compatibility
        const productWithIds = {
          ...product,
          userId: user.id,
          store_id: `/store_profiles/${userProfile.id}`,
        };

        console.log("📦 Product data with IDs to save:", productWithIds);
        console.log("💾 Saving to Firestore collection:", COLLECTION_NAMES.products);

        const doc_ref = await addDoc(
          collection(fStore, COLLECTION_NAMES.products),
          productWithIds
        );
        
        console.log("✅ Product saved successfully! Document ID:", doc_ref.id);
        
        setError(null);
        setIsProductsLoading(false);
        return {
          data: {
            id: doc_ref.id,
          },
        };
      } catch (error) {
        console.error("❌ Error in addNewProduct:", error);
        setError(error);
        setIsProductsLoading(false);
        return null;
      }
    }, [user, getUserProfile, createUserProfile, COLLECTION_NAMES.products]);

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

        const product = {
          id: doc_ref.id,
          ...productData,
          // Recalculate status based on current quantity
          status: calculateStockStatus(productData.quantity || 0),
        };
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

        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        // Query products by Firebase user ID first (primary method)
        let docs_ref = await queryUserProductsByUserId(user.id);

        // If no results found with userId, fallback to profile-based query
        if (docs_ref.empty) {
          const userProfile = await getUserProfile();
          if (userProfile) {
            docs_ref = await queryUserProducts(userProfile.id);
          }
        }

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
    [user?.id, queryUserProductsByUserId, getUserProfile, queryUserProducts]
  );

  const getAllProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Query products by Firebase user ID first (primary method)
      let docs_ref = await queryUserProductsByUserId(user.id);

      // If no results found with userId, fallback to profile-based query for backward compatibility
      if (docs_ref.empty) {
        console.log(
          "No products found with userId, trying profile-based query..."
        );
        const userProfile = await getUserProfile();
        if (userProfile) {
          docs_ref = await queryUserProducts(userProfile.id);
        }
      }

      const products: Partial<StockItem>[] = [];
      docs_ref.forEach((product) => {
        const productData = product.data();
        const updatedProd: Partial<StockItem> = {
          id: product.id,
          ...productData,
          // Recalculate status based on current quantity
          status: calculateStockStatus(productData.quantity || 0),
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
  }, [user?.id, queryUserProductsByUserId, getUserProfile, queryUserProducts]);

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
          // Use the new image analysis endpoint
          endpoint = `http://localhost:8000/analyze_image`;

          // Convert File/Blob to base64 for the new API format
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data:image/...;base64, prefix
              const base64 = result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });

          // Use JSON format for the new endpoint
          requestBody = JSON.stringify({
            message,
            image_data: base64Data,
            is_url: false,
            user_id: userId,
          });
          headers["Content-Type"] = "application/json";
        } else {
          endpoint = `http://localhost:8003/run`;

          requestBody = JSON.stringify({
            message,
            context: {
              user_id: userId,
            },
            session_id: activeSessionId,
          });
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: requestBody,
        });

        if (!response.ok) {
          const endpointType = imageFile ? "image analysis" : "text AI";

          if (response.status === 404) {
            throw new Error(
              `${endpointType} endpoint not found. Please check if the backend server is running and the ${
                imageFile ? "/analyze_image" : "/run"
              } endpoint is available.`
            );
          } else if (response.status === 500) {
            throw new Error(
              `Internal server error in ${endpointType} service. The AI model may not be properly configured.`
            );
          } else if (response.status === 413) {
            throw new Error(
              "Image file too large. Please try with a smaller image."
            );
          } else {
            throw new Error(
              `${endpointType} request failed! status: ${response.status} - ${response.statusText}`
            );
          }
        }

        const botResponse = await response.json();

        setError(null);
        setIsChatLoading(false);

        // Handle backend response structure: {status, message, data, pdf_data}
        let responseText: string;
        let pdfData: {
          pdf_base64: string;
          pdf_size: number;
          direct_download_url: string;
        } | null = null;

        if (typeof botResponse === "string") {
          responseText = botResponse;
        } else if (botResponse && typeof botResponse === "object") {
          // Handle the specific backend response format
          if (botResponse.status === "success" && botResponse.message) {
            responseText = botResponse.message;
            pdfData = botResponse.pdf_data || null;
          } else {
            // Fallback to other possible response structures
            responseText =
              botResponse?.message ||
              botResponse?.response ||
              botResponse?.text ||
              botResponse?.content ||
              JSON.stringify(botResponse);
            pdfData = botResponse?.pdf_data || null;
          }
        } else {
          responseText = "I received an unexpected response format.";
        }

        // Return both message and PDF data if available
        return {
          message: responseText,
          pdfData: pdfData,
        };
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

  // Miscellaneous Activities Session Management Functions
  const getMiscActivitiesSession = useCallback(async () => {
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
        where("appName", "==", "misc_activities") // Only get misc activities sessions
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

      // Update misc activities session ID
      setMiscActivitiesSessionId(sessionDoc.id);

      return sessionData;
    } catch (error) {
      console.error("Error getting misc activities session:", error);
      setError(error);
      setIsLoading(false);
      return null;
    }
  }, [user?.id]);

  const createMiscActivitiesSession = useCallback(async (): Promise<string> => {
    try {
      setIsChatLoading(true);

      const userId = user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Always check for existing session first
      const existingSession = await getMiscActivitiesSession();
      if (existingSession && existingSession.sessionId) {
        setIsChatLoading(false);
        return existingSession.sessionId;
      }

      // Only create a new session if no session exists at all
      const sessionData = {
        profileId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        appName: "misc_activities",
        isActive: true,
      };

      const sessionDocRef = await addDoc(
        collection(fStore, "sessions"),
        sessionData
      );

      const sessionId = sessionDocRef.id;

      setMiscActivitiesSessionId(sessionId);
      setError(null);
      setIsChatLoading(false);

      return sessionId;
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error creating misc activities session:", error);
      throw error;
    }
  }, [user?.id, getMiscActivitiesSession]);

  const loadMiscActivitiesMessages = useCallback(async (): Promise<
    ChatMessage[]
  > => {
    try {
      setIsChatLoading(true);

      if (!user?.id || !miscActivitiesSessionId) {
        setIsChatLoading(false);
        return [];
      }

      // Only load messages for the specific misc activities session
      const messagesRef = collection(fStore, "messages");
      const q = query(
        messagesRef,
        where("profileId", "==", user.id),
        where("sessionId", "==", miscActivitiesSessionId)
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

      // Sort messages by timestamp
      allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setError(null);
      setIsChatLoading(false);

      return allMessages;
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error loading misc activities messages:", error);
      throw error;
    }
  }, [user?.id, miscActivitiesSessionId]);

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
      // Miscellaneous Activities Session Management
      getMiscActivitiesSession,
      createMiscActivitiesSession,
      miscActivitiesSessionId,
      loadMiscActivitiesMessages,
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
      getMiscActivitiesSession,
      createMiscActivitiesSession,
      miscActivitiesSessionId,
      loadMiscActivitiesMessages,
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
