import React, { useState, useCallback, useMemo, useEffect } from "react";
import DataContext from "./DataContext";
import { StockItem } from "../../mock/stocks";
import { ChatMessage, MessageData } from "../../interfaces/message";
import { ProfileInterface } from "../../interfaces/profile";
import {
  Transaction,
  TransactionItem,
  TransactionSummary,
  TransactionFilter,
} from "../../interfaces/transaction";
import {
  Notification,
  NotificationFilter,
  NotificationSummary,
} from "../../interfaces/notification";
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
      transactions: "transactions",
      messages: "messages",
      sessions: "sessions",
      notifications: "notifications",
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
  const [miscActivitiesSessionId] = useState<string | null>(() => {
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
      sessionStorageUtils.initialize(user.id).catch((error) => {
        console.error("Error initializing session management:", error);
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

  // Helper function to clean product data before saving to Firestore
  const cleanProductData = useCallback((product: Partial<StockItem>) => {
    const cleaned = { ...product };

    // Remove undefined, null, empty string values, and NaN
    Object.keys(cleaned).forEach((key) => {
      const value = cleaned[key as keyof typeof cleaned];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "number" && isNaN(value))
      ) {
        delete cleaned[key as keyof typeof cleaned];
      }
    });

    console.log("🧹 Cleaned product data:", cleaned);
    return cleaned;
  }, []);

  const addNewProduct = useCallback(
    async (product: Partial<StockItem>) => {
      try {
        console.log(
          "🔥 DataContextProvider.addNewProduct called with:",
          product
        );
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

        // Clean the product data to remove undefined/null/NaN values
        const cleanedProduct = cleanProductData(product);

        // Convert to standardized product schema
        const now = new Date().toISOString();
        const standardizedProduct = {
          // Standardized fields
          userId: user.id,
          product_name: cleanedProduct.name || "Unknown Product",
          description: cleanedProduct.description || "",
          category: cleanedProduct.category || "General",
          subcategory: cleanedProduct.subcategory || "",
          brand: cleanedProduct.brand || "",
          unit_price: cleanedProduct.unitPrice || 0,
          cost_price: 0, // Default
          stock_quantity: cleanedProduct.quantity || 0,
          unit_of_measure: cleanedProduct.unit || "pcs",
          reorder_point: 5, // Default
          status:
            cleanedProduct.status === "out-of-stock" ? "inactive" : "active",
          created_at: now,
          updated_at: now,
          image: cleanedProduct.image || "",
          barcode: cleanedProduct.barcode || "",
          sku: cleanedProduct.barcode || "",
          supplier: cleanedProduct.supplier || "",
          size: cleanedProduct.size ? parseFloat(cleanedProduct.size) || 0 : 0,

          // Legacy compatibility fields
          name: cleanedProduct.name,
          unitPrice: cleanedProduct.unitPrice,
          quantity: cleanedProduct.quantity,
          unit: cleanedProduct.unit,
          createdAt: new Date(),
          lastRestocked: cleanedProduct.lastRestocked,
          store_id: `/store_profiles/${userProfile.id}`,
        };

        console.log(
          "📦 Standardized product data to save:",
          standardizedProduct
        );
        console.log(
          "💾 Saving to Firestore collection:",
          COLLECTION_NAMES.products
        );

        const doc_ref = await addDoc(
          collection(fStore, COLLECTION_NAMES.products),
          standardizedProduct
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
    },
    [
      user,
      getUserProfile,
      createUserProfile,
      cleanProductData,
      COLLECTION_NAMES.products,
    ]
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

        const currentQuantity = productData.stock_quantity || productData.quantity || 0;
        const product: Partial<StockItem> = {
          id: doc_ref.id,
          // Map standardized fields back to StockItem interface
          name: productData.product_name || productData.name,
          description: productData.description || "",
          category: productData.category || "",
          subcategory: productData.subcategory || "",
          brand: productData.brand || "",
          unitPrice: productData.unit_price || productData.unitPrice || 0,
          quantity: currentQuantity,
          unit: productData.unit_of_measure || productData.unit || "pcs",
          size: productData.size ? productData.size.toString() : "",
          status: calculateStockStatus(currentQuantity),
          lastRestocked: productData.lastRestocked || productData.updated_at?.split('T')[0] || productData.created_at?.split('T')[0] || "Unknown",
          supplier: productData.supplier || "",
          barcode: productData.barcode || productData.sku || "",
          image: productData.image || "",
          store_id: productData.store_id,
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
          const productData = product.data();
          const currentQuantity = productData.stock_quantity || productData.quantity || 0;
          
          const updatedProd: Partial<StockItem> = {
            id: product.id,
            // Map standardized fields back to StockItem interface
            name: productData.product_name || productData.name,
            description: productData.description || "",
            category: productData.category || "",
            subcategory: productData.subcategory || "",
            brand: productData.brand || "",
            unitPrice: productData.unit_price || productData.unitPrice || 0,
            quantity: currentQuantity,
            unit: productData.unit_of_measure || productData.unit || "pcs",
            size: productData.size ? productData.size.toString() : "",
            status: calculateStockStatus(currentQuantity),
            lastRestocked: productData.lastRestocked || productData.updated_at?.split('T')[0] || productData.created_at?.split('T')[0] || "Unknown",
            supplier: productData.supplier || "",
            barcode: productData.barcode || productData.sku || "",
            image: productData.image || "",
            store_id: productData.store_id,
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

  const getAllProducts = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        setIsProductsLoading(true);

        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        console.log(
          `🔄 ${
            forceRefresh ? "Force refreshing" : "Loading"
          } products for user:`,
          user.id
        );

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
          // Use standardized stock_quantity field first, fallback to legacy quantity field
          const currentQuantity =
            productData.stock_quantity || productData.quantity || 0;

          console.log(
            `📊 Product data for ${
              productData.product_name || productData.name
            }:`,
            {
              id: product.id,
              stock_quantity: productData.stock_quantity,
              quantity: productData.quantity,
              finalQuantity: currentQuantity,
              status: productData.status,
            }
          );

          const updatedProd: Partial<StockItem> = {
            id: product.id,
            // Map standardized fields back to StockItem interface
            name: productData.product_name || productData.name,
            description: productData.description || "",
            category: productData.category || "",
            subcategory: productData.subcategory || "",
            brand: productData.brand || "",
            unitPrice: productData.unit_price || productData.unitPrice || 0,
            quantity: currentQuantity,
            unit: productData.unit_of_measure || productData.unit || "pcs", // Use standardized field first, fallback to legacy
            size: productData.size ? productData.size.toString() : "",
            status: calculateStockStatus(currentQuantity),
            lastRestocked: productData.lastRestocked || productData.updated_at?.split('T')[0] || productData.created_at?.split('T')[0] || "Unknown",
            supplier: productData.supplier || "",
            barcode: productData.barcode || productData.sku || "",
            image: productData.image || "",
            store_id: productData.store_id,
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
    },
    [user?.id, queryUserProductsByUserId, getUserProfile, queryUserProducts]
  );

  // Convenience method to refresh inventory (force refresh)
  const refreshInventory = useCallback(async () => {
    return getAllProducts(true);
  }, [getAllProducts]);

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
        let responseData: Record<string, unknown> | null = null;

        console.log("🔍 askAiAssistant - Raw backend response:", {
          type: typeof botResponse,
          keys:
            typeof botResponse === "object" && botResponse !== null
              ? Object.keys(botResponse)
              : [],
          hasData:
            botResponse &&
            typeof botResponse === "object" &&
            "data" in botResponse,
          dataContent:
            botResponse && typeof botResponse === "object"
              ? botResponse.data
              : undefined,
          fullResponse: botResponse,
        });

        if (typeof botResponse === "string") {
          responseText = botResponse;
        } else if (botResponse && typeof botResponse === "object") {
          // Handle the specific backend response format
          if (botResponse.status === "success" && botResponse.message) {
            responseText = botResponse.message;
            pdfData = botResponse.pdf_data || null;
            responseData = botResponse.data || null; // FIXED: Extract the data object
          } else {
            // Fallback to other possible response structures
            responseText =
              botResponse?.message ||
              botResponse?.response ||
              botResponse?.text ||
              botResponse?.content ||
              JSON.stringify(botResponse);
            pdfData = botResponse?.pdf_data || null;
            responseData = botResponse?.data || null; // FIXED: Extract the data object
          }
        } else {
          responseText = "I received an unexpected response format.";
        }

        console.log("🔍 askAiAssistant - Extracted data:", {
          hasResponseData: !!responseData,
          responseDataKeys: responseData ? Object.keys(responseData) : [],
          responseDataContent: responseData,
          hasPdfData: !!pdfData,
        });

        // Return message, PDF data, AND data object
        return {
          message: responseText,
          pdfData: pdfData,
          data: responseData, // FIXED: Include the data object in the return
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

        const now = new Date();
        const messageData: MessageData = {
          ...message,
          timestamp: message.timestamp || now, // Ensure timestamp is always present
          messageOrder: message.messageOrder || 0, // Ensure messageOrder is always present
          createdAt: now,
          updatedAt: now,
        };

        console.log(`💾 Saving message to Firestore:`, {
          text: messageData.text.substring(0, 50) + "...",
          timestamp: messageData.timestamp.toISOString(),
          messageOrder: messageData.messageOrder,
          isBot: messageData.isBot,
          hasData: !!messageData.data,
          dataKeys: messageData.data ? Object.keys(messageData.data) : [],
          hasPdfData: !!messageData.pdfData,
          fullMessageData: messageData,
        });

        // CRITICAL DEBUG: Log the exact data being sent to Firestore
        console.log("🔥 FIRESTORE SAVE - Exact data being saved:", {
          messageText: messageData.text.substring(0, 100),
          hasDataField: "data" in messageData,
          dataFieldValue: messageData.data,
          dataFieldType: typeof messageData.data,
          dataIsNull: messageData.data === null,
          dataIsUndefined: messageData.data === undefined,
          dataStringified: messageData.data
            ? JSON.stringify(messageData.data)
            : "NO DATA",
        });

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
          orderBy("timestamp", "asc") // Use timestamp for consistent ordering
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
            messageOrder: data.messageOrder || 0, // Fallback to 0 if missing
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            isReceipt: data.isReceipt || false, // Include receipt flag
            transactionId: data.transactionId || undefined, // Include transaction ID
            pdfData: data.pdfData || undefined, // Include PDF data
          });
        });

        // Sort by timestamp as a backup to ensure correct order
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

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
        const message = {
          id: doc.id,
          profileId: data.profileId,
          sessionId: data.sessionId,
          text: data.text,
          isBot: data.isBot,
          timestamp: data.timestamp.toDate(),
          messageOrder: data.messageOrder,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          pdfData: data.pdfData || undefined, // Include PDF data
          data: data.data || undefined, // Include full data object
        };

        // Debug logging for messages with data
        if (data.data) {
          console.log("📥 Loading message with data from Firestore:", {
            messageId: doc.id,
            hasData: !!data.data,
            dataKeys: Object.keys(data.data),
            dataPreview: data.data,
            messageText: data.text.substring(0, 50) + "...",
          });
        }

        allMessages.push(message);
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

  // Load all transaction messages for the user (simplified approach)
  const loadAllUserTransactionMessages = useCallback(async (): Promise<
    ChatMessage[]
  > => {
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
        const message = {
          id: doc.id,
          profileId: data.profileId,
          sessionId: data.sessionId,
          text: data.text,
          isBot: data.isBot,
          timestamp: data.timestamp.toDate(),
          messageOrder: data.messageOrder,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          pdfData: data.pdfData || undefined, // Include PDF data
          data: data.data || undefined, // Include full data object
          isReceipt: data.isReceipt || false, // Include receipt flag for transaction messages
          transactionId: data.transactionId || undefined, // Include transaction ID
        };

        allMessages.push(message);
      });

      setError(null);
      setIsChatLoading(false);

      return allMessages;
    } catch (error) {
      setError(error);
      setIsChatLoading(false);
      console.error("Error loading all user transaction messages:", error);
      throw error;
    }
  }, [user?.id]);

  // Transaction Management Functions
  const createTransaction = useCallback(
    async (
      sessionId: string,
      items: TransactionItem[],
      customerInfo?: Transaction["customerInfo"],
      paymentMethod?: Transaction["paymentMethod"],
      notes?: string,
      chatMessages?: ChatMessage[]
    ): Promise<{
      success: boolean;
      transactionId?: string;
      error?: string;
    }> => {
      try {
        if (!user?.id) {
          return { success: false, error: "User not authenticated" };
        }

        console.log("💰 Creating transaction for user:", user.id);

        const userProfile = await getUserProfile();
        if (!userProfile) {
          return { success: false, error: "User profile not found" };
        }

        console.log("💰 User profile found:", userProfile.id);

        // Calculate totals
        const subtotal = items.reduce(
          (sum, item) => sum + (item.totalPrice || 0),
          0
        );
        const taxRate = 0.15; // 15% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        // Generate unique transaction ID
        const transactionId = `txn_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const now = new Date();
        const nowISO = now.toISOString();
        const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(" ")[0]; // HH:MM:SS

        const transactionData: Omit<Transaction, "id"> = {
          // Standardized fields
          transaction_id: transactionId,
          userId: user.id,
          store_id: userProfile.id,
          customer_name: customerInfo?.name || "",
          date: dateStr,
          time: timeStr,
          created_at: nowISO,
          items: items.map((item) => ({
            name: item.productName || "Unknown Product",
            quantity: item.quantity,
            unit_price: item.unitPrice || 0,
            line_total: item.totalPrice || 0,
            sku: item.productId || "",
            category: "", // TODO: Get from product data
            // Legacy compatibility
            productName: item.productName,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            productId: item.productId,
            stockReducedBy: item.stockReducedBy,
          })),
          subtotal,
          tax_amount: tax,
          tax_rate: taxRate,
          total,
          payment_method: paymentMethod || "cash",
          change_due: 0,
          status: "completed",
          notes: notes || "",
          chatMessages: chatMessages || [], // Save chat conversation

          // Legacy compatibility fields
          transactionId,
          storeId: userProfile.id,
          sessionId,
          customerInfo: customerInfo || {},
          tax,
          taxRate,
          timestamp: now,
          paymentMethod: paymentMethod || "cash",
          receiptGenerated: true,
          createdAt: now,
          updatedAt: now,
        };

        console.log("💰 Creating transaction with standardized schema:", {
          transaction_id: transactionData.transaction_id,
          userId: transactionData.userId,
          store_id: transactionData.store_id,
          created_at: transactionData.created_at,
          total: transactionData.total,
          itemCount: transactionData.items.length,
        });

        const docRef = await addDoc(
          collection(fStore, COLLECTION_NAMES.transactions),
          transactionData
        );

        console.log("✅ Transaction created successfully:", docRef.id);

        // Update product stock levels
        for (const item of items) {
          if (item.productId) {
            try {
              const productRef = doc(
                fStore,
                COLLECTION_NAMES.products,
                item.productId
              );
              const productDoc = await getDoc(productRef);

              if (productDoc.exists()) {
                const currentData = productDoc.data();
                // Check both standardized and legacy quantity fields
                const currentQuantity =
                  currentData.stock_quantity || currentData.quantity || 0;
                const newQuantity = Math.max(
                  0,
                  currentQuantity - item.quantity
                );

                console.log(
                  `📊 Stock update details for ${item.productName}:`,
                  {
                    productId: item.productId,
                    currentStockQuantity: currentData.stock_quantity,
                    currentQuantity: currentData.quantity,
                    finalCurrentQuantity: currentQuantity,
                    soldQuantity: item.quantity,
                    newQuantity: newQuantity,
                    reduction: currentQuantity - newQuantity,
                  }
                );

                // Update both standardized and legacy fields for consistency
                await updateDoc(productRef, {
                  stock_quantity: newQuantity, // Standardized field
                  quantity: newQuantity, // Legacy field for backward compatibility
                  status: calculateStockStatus(newQuantity),
                  updated_at: new Date().toISOString(),
                  updatedAt: new Date(), // Legacy field
                });

                console.log(
                  `📦 Updated stock for ${item.productName}: ${currentQuantity} -> ${newQuantity} (reduced by ${item.quantity} items)`
                );
              } else {
                console.error(
                  `Product with ID ${item.productId} not found in Firestore`
                );
              }
            } catch (stockError) {
              console.error(
                `Failed to update stock for ${item.productName}:`,
                stockError
              );
            }
          } else {
            console.warn(`No productId provided for item: ${item.productName}`);
          }
        }

        // Save chat messages separately for better tracking
        if (chatMessages && chatMessages.length > 0) {
          // TODO: Implement saveTransactionChatMessages function
          console.log(
            "Chat messages would be saved here:",
            chatMessages.length
          );
        }

        // Refresh inventory to reflect updated stock levels
        console.log("🔄 Refreshing inventory after transaction...");
        try {
          await getAllProducts(true); // Force refresh
          console.log("✅ Inventory refreshed successfully");
        } catch (refreshError) {
          console.error("⚠️ Failed to refresh inventory:", refreshError);
          // Don't fail the transaction if inventory refresh fails
        }

        return { success: true, transactionId: docRef.id };
      } catch (error) {
        console.error("❌ Error creating transaction:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [
      user,
      getUserProfile,
      COLLECTION_NAMES.transactions,
      COLLECTION_NAMES.products,
      getAllProducts,
    ]
  );

  const getTransactionHistory = useCallback(
    async (filter?: TransactionFilter): Promise<Transaction[]> => {
      try {
        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        const transactionsRef = collection(
          fStore,
          COLLECTION_NAMES.transactions
        );

        console.log("🔍 Fetching transactions for user:", user.id);

        // First try querying with the standardized userId field
        let q = query(
          transactionsRef,
          where("userId", "==", user.id),
          orderBy("created_at", "desc")
        );

        // Apply additional filters if provided
        if (filter?.status) {
          q = query(q, where("status", "==", filter.status));
        }

        if (filter?.dateFrom) {
          q = query(
            q,
            where("created_at", ">=", filter.dateFrom.toISOString())
          );
        }

        if (filter?.dateTo) {
          q = query(q, where("created_at", "<=", filter.dateTo.toISOString()));
        }

        const snapshot = await getDocs(q);
        const transactions: Transaction[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const transaction = {
            id: doc.id,
            ...data,
            // Handle both standardized and legacy timestamp fields
            timestamp:
              data.timestamp?.toDate() ||
              (data.created_at ? new Date(data.created_at) : new Date()),
            createdAt:
              data.createdAt?.toDate() ||
              (data.created_at ? new Date(data.created_at) : new Date()),
            updatedAt:
              data.updatedAt?.toDate() ||
              (data.updated_at ? new Date(data.updated_at) : new Date()),
          } as Transaction;
          transactions.push(transaction);
        });

        console.log(
          `💰 Found ${transactions.length} transactions with userId field`
        );

        // If no transactions found with userId, try legacy user_id field
        if (transactions.length === 0) {
          console.log(
            "🔄 No transactions found with userId, trying legacy user_id field..."
          );

          let legacyQ = query(
            transactionsRef,
            where("user_id", "==", user.id),
            orderBy("created_at", "desc")
          );

          // Apply additional filters if provided
          if (filter?.status) {
            legacyQ = query(legacyQ, where("status", "==", filter.status));
          }

          if (filter?.dateFrom) {
            legacyQ = query(
              legacyQ,
              where("created_at", ">=", filter.dateFrom.toISOString())
            );
          }

          if (filter?.dateTo) {
            legacyQ = query(
              legacyQ,
              where("created_at", "<=", filter.dateTo.toISOString())
            );
          }

          const legacySnapshot = await getDocs(legacyQ);

          legacySnapshot.forEach((doc) => {
            const data = doc.data();
            const transaction = {
              id: doc.id,
              ...data,
              // Handle both standardized and legacy timestamp fields
              timestamp:
                data.timestamp?.toDate() ||
                (data.created_at ? new Date(data.created_at) : new Date()),
              createdAt:
                data.createdAt?.toDate() ||
                (data.created_at ? new Date(data.created_at) : new Date()),
              updatedAt:
                data.updatedAt?.toDate() ||
                (data.updated_at ? new Date(data.updatedAt) : new Date()),
            } as Transaction;
            transactions.push(transaction);
          });

          console.log(
            `💰 Found ${legacySnapshot.size} transactions with legacy user_id field`
          );
        }

        // Apply client-side filters for amount range (Firestore doesn't support multiple range queries)
        let filteredTransactions = transactions;
        if (filter?.minAmount) {
          filteredTransactions = filteredTransactions.filter(
            (t) => t.total >= filter.minAmount!
          );
        }
        if (filter?.maxAmount) {
          filteredTransactions = filteredTransactions.filter(
            (t) => t.total <= filter.maxAmount!
          );
        }

        console.log(
          `💰 Returning ${filteredTransactions.length} filtered transactions`
        );
        return filteredTransactions;
      } catch (error) {
        console.error("❌ Error fetching transaction history:", error);
        return [];
      }
    },
    [user?.id, COLLECTION_NAMES.transactions]
  );

  const getTransactionById = useCallback(
    async (transactionId: string): Promise<Transaction | null> => {
      try {
        const transactionRef = doc(
          fStore,
          COLLECTION_NAMES.transactions,
          transactionId
        );
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
          return null;
        }

        const data = transactionDoc.data();
        return {
          id: transactionDoc.id,
          ...data,
          timestamp:
            data.timestamp?.toDate() ||
            (data.created_at ? new Date(data.created_at) : new Date()),
          createdAt:
            data.createdAt?.toDate() ||
            (data.created_at ? new Date(data.created_at) : new Date()),
          updatedAt:
            data.updatedAt?.toDate() ||
            (data.updated_at ? new Date(data.updatedAt) : new Date()),
        } as Transaction;
      } catch (error) {
        console.error("❌ Error fetching transaction:", error);
        return null;
      }
    },
    [COLLECTION_NAMES.transactions]
  );

  // TODO: Placeholder functions for miscellaneous activities (to be implemented)
  const getMiscActivitiesSession = useCallback(async () => {
    console.warn("getMiscActivitiesSession not yet implemented");
    return null;
  }, []);

  const createMiscActivitiesSession = useCallback(async () => {
    console.warn("createMiscActivitiesSession not yet implemented");
    return "";
  }, []);

  const loadMiscActivitiesMessages = useCallback(async (): Promise<
    ChatMessage[]
  > => {
    console.warn("loadMiscActivitiesMessages not yet implemented");
    return [];
  }, []);

  const saveTransactionChatMessages = useCallback(
    async (transactionId: string, messages: ChatMessage[]) => {
      console.warn("saveTransactionChatMessages not yet implemented", {
        transactionId,
        messageCount: messages.length,
      });
    },
    []
  );

  // Transaction Chat Functions
  const getTransactionChat = useCallback(
    async (transactionId: string): Promise<ChatMessage[]> => {
      try {
        const messagesRef = collection(fStore, COLLECTION_NAMES.messages);
        const q = query(
          messagesRef,
          where("transactionId", "==", transactionId),
          where("type", "==", "transaction_chat"),
          orderBy("messageIndex", "asc")
        );

        const snapshot = await getDocs(q);
        const messages: ChatMessage[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            profileId: data.profileId,
            sessionId: data.sessionId,
            text: data.text,
            isBot: data.isBot,
            timestamp: data.timestamp.toDate(),
            messageOrder: data.messageOrder || data.messageIndex,
            createdAt: data.createdAt?.toDate() || data.timestamp.toDate(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        console.log(
          `📞 Retrieved ${messages.length} chat messages for transaction ${transactionId}`
        );
        return messages;
      } catch (error) {
        console.error("❌ Error getting transaction chat:", error);
        return [];
      }
    },
    [COLLECTION_NAMES.messages]
  );

  const getTransactionChatSummary = useCallback(
    async (
      transactionId: string
    ): Promise<{
      transactionId: string;
      messageCount: number;
      chatDuration: number;
      firstMessage: Date;
      lastMessage: Date;
      userMessageCount: number;
      botMessageCount: number;
    } | null> => {
      try {
        const messages = await getTransactionChat(transactionId);

        if (messages.length === 0) {
          return null;
        }

        const timestamps = messages.map((m) => m.timestamp);
        const firstMessage = new Date(
          Math.min(...timestamps.map((t) => t.getTime()))
        );
        const lastMessage = new Date(
          Math.max(...timestamps.map((t) => t.getTime()))
        );
        const chatDuration =
          (lastMessage.getTime() - firstMessage.getTime()) / (1000 * 60); // minutes

        return {
          transactionId,
          messageCount: messages.length,
          chatDuration: Math.round(chatDuration * 100) / 100, // Round to 2 decimal places
          firstMessage,
          lastMessage,
          userMessageCount: messages.filter((m) => !m.isBot).length,
          botMessageCount: messages.filter((m) => m.isBot).length,
        };
      } catch (error) {
        console.error("❌ Error getting transaction chat summary:", error);
        return null;
      }
    },
    [getTransactionChat]
  );

  const getTransactionSummary = useCallback(
    async (
      dateFrom?: Date,
      dateTo?: Date
    ): Promise<TransactionSummary | null> => {
      try {
        const transactions = await getTransactionHistory({
          status: "completed",
          dateFrom,
          dateTo,
        });

        if (transactions.length === 0) {
          return {
            totalSales: 0,
            totalTransactions: 0,
            averageTransactionValue: 0,
            topSellingItems: [],
            dateRange: {
              from: dateFrom || new Date(),
              to: dateTo || new Date(),
            },
          };
        }

        const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalTransactions = transactions.length;
        const averageTransactionValue = totalSales / totalTransactions;

        // Calculate top selling items
        const itemSales = new Map<
          string,
          { quantitySold: number; revenue: number }
        >();

        transactions.forEach((transaction) => {
          transaction.items.forEach((item) => {
            const productName =
              item.name || item.productName || "Unknown Product";
            const lineTotal = item.line_total || item.totalPrice || 0;
            const existing = itemSales.get(productName) || {
              quantitySold: 0,
              revenue: 0,
            };
            itemSales.set(productName, {
              quantitySold: existing.quantitySold + item.quantity,
              revenue: existing.revenue + lineTotal,
            });
          });
        });

        const topSellingItems = Array.from(itemSales.entries())
          .map(([productName, stats]) => ({
            productName,
            quantitySold: stats.quantitySold,
            revenue: stats.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        return {
          totalSales,
          totalTransactions,
          averageTransactionValue,
          topSellingItems,
          dateRange: {
            from:
              dateFrom ||
              new Date(
                Math.min(
                  ...transactions.map((t) =>
                    (t.timestamp || t.createdAt || new Date()).getTime()
                  )
                )
              ),
            to:
              dateTo ||
              new Date(
                Math.max(
                  ...transactions.map((t) =>
                    (t.timestamp || t.createdAt || new Date()).getTime()
                  )
                )
              ),
          },
        };
      } catch (error) {
        console.error("❌ Error generating transaction summary:", error);
        return null;
      }
    },
    [getTransactionHistory]
  );

  const updateTransactionStatus = useCallback(
    async (
      transactionId: string,
      status: Transaction["status"],
      notes?: string
    ): Promise<boolean> => {
      try {
        const transactionRef = doc(
          fStore,
          COLLECTION_NAMES.transactions,
          transactionId
        );
        await updateDoc(transactionRef, {
          status,
          notes: notes || "",
          updatedAt: new Date(),
        });

        console.log(
          `✅ Transaction ${transactionId} status updated to: ${status}`
        );
        return true;
      } catch (error) {
        console.error("❌ Error updating transaction status:", error);
        return false;
      }
    },
    [COLLECTION_NAMES.transactions]
  );

  // Link transaction to chat session for history tracking
  const linkTransactionToSession = useCallback(
    async (transactionId: string, sessionId: string): Promise<boolean> => {
      try {
        // Update the session with transaction reference
        const sessionRef = doc(fStore, COLLECTION_NAMES.sessions, sessionId);
        const sessionDoc = await getDoc(sessionRef);

        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();
          const transactions = sessionData.transactions || [];

          if (!transactions.includes(transactionId)) {
            transactions.push(transactionId);

            await updateDoc(sessionRef, {
              transactions,
              updatedAt: new Date(),
            });

            console.log(
              `🔗 Linked transaction ${transactionId} to session ${sessionId}`
            );
          }
        }

        return true;
      } catch (error) {
        console.error("❌ Error linking transaction to session:", error);
        return false;
      }
    },
    [COLLECTION_NAMES.sessions]
  );

  // === NOTIFICATION FUNCTIONS ===

  const createNotification = useCallback(
    async (
      notification: Omit<Notification, "id" | "createdAt" | "updatedAt">
    ): Promise<string | null> => {
      try {
        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        const profile = await getUserProfile();
        if (!profile?.id) {
          throw new Error("User profile not found");
        }

        const notificationData = {
          ...notification,
          userId: user.id,
          storeId: profile.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const notificationsRef = collection(
          fStore,
          COLLECTION_NAMES.notifications
        );
        const docRef = await addDoc(notificationsRef, notificationData);

        console.log(`✅ Notification created: ${docRef.id}`);
        return docRef.id;
      } catch (error) {
        console.error("❌ Error creating notification:", error);
        return null;
      }
    },
    [user?.id, getUserProfile, COLLECTION_NAMES.notifications]
  );

  const createTransactionNotification = useCallback(
    async (transaction: Transaction): Promise<string | null> => {
      try {
        const notification: Omit<
          Notification,
          "id" | "createdAt" | "updatedAt"
        > = {
          userId: transaction.userId,
          storeId: transaction.store_id || transaction.storeId || "",
          title: "Transaction Completed",
          message: `Receipt saved for transaction #${(
            transaction.transaction_id ||
            transaction.transactionId ||
            "unknown"
          ).slice(-8)} - ${
            transaction.items.length
          } items, $${transaction.total.toFixed(2)}`,
          type: "transaction",
          priority: "medium",
          isRead: false,
          actionUrl: `/transaction-detail/${transaction.id}`,
          transactionId: transaction.id,
        };

        return await createNotification(notification);
      } catch (error) {
        console.error("❌ Error creating transaction notification:", error);
        return null;
      }
    },
    [createNotification]
  );

  const getNotifications = useCallback(
    async (filter?: NotificationFilter): Promise<Notification[]> => {
      try {
        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        const notificationsRef = collection(
          fStore,
          COLLECTION_NAMES.notifications
        );
        let q = query(
          notificationsRef,
          where("userId", "==", user.id),
          orderBy("createdAt", "desc")
        );

        // Apply filters
        if (filter?.type) {
          q = query(q, where("type", "==", filter.type));
        }

        if (filter?.priority) {
          q = query(q, where("priority", "==", filter.priority));
        }

        if (filter?.isRead !== undefined) {
          q = query(q, where("isRead", "==", filter.isRead));
        }

        if (filter?.dateFrom) {
          q = query(q, where("createdAt", ">=", filter.dateFrom));
        }

        if (filter?.dateTo) {
          q = query(q, where("createdAt", "<=", filter.dateTo));
        }

        const snapshot = await getDocs(q);
        const notifications: Notification[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Notification);
        });

        return notifications;
      } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        return [];
      }
    },
    [user?.id, COLLECTION_NAMES.notifications]
  );

  const markNotificationAsRead = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const notificationRef = doc(
          fStore,
          COLLECTION_NAMES.notifications,
          notificationId
        );
        await updateDoc(notificationRef, {
          isRead: true,
          updatedAt: new Date(),
        });

        console.log(`✅ Notification ${notificationId} marked as read`);
        return true;
      } catch (error) {
        console.error("❌ Error marking notification as read:", error);
        return false;
      }
    },
    [COLLECTION_NAMES.notifications]
  );

  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const notificationsRef = collection(
        fStore,
        COLLECTION_NAMES.notifications
      );
      const q = query(
        notificationsRef,
        where("userId", "==", user.id),
        where("isRead", "==", false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          isRead: true,
          updatedAt: new Date(),
        })
      );

      await Promise.all(updatePromises);

      console.log(`✅ Marked ${snapshot.docs.length} notifications as read`);
      return true;
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
      return false;
    }
  }, [user?.id, COLLECTION_NAMES.notifications]);

  const deleteNotification = useCallback(
    async (notificationId: string): Promise<boolean> => {
      try {
        const notificationRef = doc(
          fStore,
          COLLECTION_NAMES.notifications,
          notificationId
        );
        await deleteDoc(notificationRef);

        console.log(`✅ Notification ${notificationId} deleted`);
        return true;
      } catch (error) {
        console.error("❌ Error deleting notification:", error);
        return false;
      }
    },
    [COLLECTION_NAMES.notifications]
  );

  const getNotificationSummary =
    useCallback(async (): Promise<NotificationSummary | null> => {
      try {
        const notifications = await getNotifications();

        const unreadCount = notifications.filter((n) => !n.isRead).length;

        const priorityBreakdown = {
          high: notifications.filter((n) => n.priority === "high").length,
          medium: notifications.filter((n) => n.priority === "medium").length,
          low: notifications.filter((n) => n.priority === "low").length,
        };

        const typeBreakdown = {
          info: notifications.filter((n) => n.type === "info").length,
          warning: notifications.filter((n) => n.type === "warning").length,
          success: notifications.filter((n) => n.type === "success").length,
          error: notifications.filter((n) => n.type === "error").length,
          transaction: notifications.filter((n) => n.type === "transaction")
            .length,
          inventory: notifications.filter((n) => n.type === "inventory").length,
        };

        return {
          totalNotifications: notifications.length,
          unreadCount,
          priorityBreakdown,
          typeBreakdown,
        };
      } catch (error) {
        console.error("❌ Error generating notification summary:", error);
        return null;
      }
    }, [getNotifications]);

  const contextValue = useMemo(
    () => ({
      addNewProduct,
      getProduct,
      inventory,
      isLoading,
      isProductsLoading,
      isChatLoading,
      getAllProducts,
      refreshInventory,
      error,
      searchProducts,
      askAiAssistant,
      getAgentSession,
      getChatSession,
      createSession,
      currentSessionId,
      deactivateSession,
      deactivateAllUserSessions,
      // Miscellaneous Activities Session Management (functions not implemented yet)
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
      loadAllUserTransactionMessages,
      // Transaction management
      createTransaction,
      getTransactionHistory,
      getTransactionById,
      getTransactionSummary,
      updateTransactionStatus,
      linkTransactionToSession,
      // Transaction chat management
      getTransactionChat,
      getTransactionChatSummary,
      // Notification management
      createNotification,
      createTransactionNotification,
      getNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      getNotificationSummary,
      saveTransactionChatMessages,
    }),
    [
      addNewProduct,
      getProduct,
      inventory,
      isLoading,
      isProductsLoading,
      isChatLoading,
      getAllProducts,
      refreshInventory,
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
      loadAllUserTransactionMessages,
      createTransaction,
      getTransactionHistory,
      getTransactionById,
      getTransactionSummary,
      updateTransactionStatus,
      linkTransactionToSession,
      getTransactionChat,
      getTransactionChatSummary,
      createNotification,
      createTransactionNotification,
      getNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      getNotificationSummary,
      saveTransactionChatMessages,
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
