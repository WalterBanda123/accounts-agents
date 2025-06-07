import React, { useState, useCallback, useMemo } from "react";
import DataContext from "./DataContext";
import { StockItem } from "../../mock/stocks";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
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
    }),
    []
  );

  const [inventory, setInventory] = useState<Partial<StockItem>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const addNewProduct = useCallback(
    async (product: Partial<StockItem>) => {
      try {
        setIsProductsLoading(true);
        const doc_ref = await addDoc(
          collection(fStore, COLLECTION_NAMES.products),
          product
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
    [COLLECTION_NAMES.products]
  );

  const getProduct = useCallback(
    async (productId: string) => {
      try {
        setIsProductsLoading(true);
        const doc_ref = await getDoc(
          doc(fStore, COLLECTION_NAMES.products, productId)
        );
        const product = { id: doc_ref.id, ...doc_ref.data() };
        setIsProductsLoading(false);
        setError(null);
        if (!product) {
          return {} as Partial<StockItem>;
        }
        return product as Partial<StockItem>;
      } catch (error) {
        setError(error);
        setIsProductsLoading(false);
        return null;
      }
    },
    [COLLECTION_NAMES.products]
  );

  const searchProducts = useCallback(
    async (search: string) => {
      try {
        setIsProductsLoading(true);
        console.log(search);
        const results = [...inventory];
        setIsProductsLoading(false);
        return Promise.resolve(results);
      } catch (error) {
        console.error(error);
        setError(error);
        setIsProductsLoading(false);
        return [];
      }
    },
    [inventory]
  );

  const getAllProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true);
      const docs_ref = await getDocs(
        collection(fStore, COLLECTION_NAMES.products)
      );
      const products: Partial<StockItem>[] = [];
      docs_ref.forEach((product) => {
        const updatedProd: Partial<StockItem> = {
          id: product.id,
          ...product.data(),
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
  }, [COLLECTION_NAMES.products]);

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

        // Use provided sessionId or current session, create new one if none exists
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
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
