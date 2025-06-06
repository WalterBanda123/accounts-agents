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
      const q = query(sessionsRef, where("profileId", "==", user?.id));

      const querySnapshot = await getDocs(q);
      const sessionDoc = querySnapshot.docs[0];

      setIsLoading(false);
      setError(null);

      if (!sessionDoc) {
        console.log("No agent session found for user");
        return null;
      }

      const sessionData = { sessionId: sessionDoc.id, ...sessionDoc.data() };
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
      const appName = "store_assistant";

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const endpoint = `http://127.0.0.1:8000/apps/${appName}/users/${userId}/sessions`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Empty body as per API spec
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create session: ${response.status} - ${response.statusText}`
        );
      }

      const sessionData = await response.json();
      const sessionId = sessionData.sessionId || sessionData.id;

      if (!sessionId) {
        throw new Error("Session creation response missing sessionId");
      }

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
        const appName = "store_assistant";

        if (!userId) {
          throw new Error("User not authenticated");
        }

        let activeSessionId = sessionId || currentSessionId;
        if (!activeSessionId) {
          console.log("No session available, creating new session...");
          try {
            const createEndpoint = `http://127.0.0.1:8000/apps/${appName}/users/${userId}/sessions`;
            console.log("Creating new session at:", createEndpoint);

            const createResponse = await fetch(createEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            });

            if (!createResponse.ok) {
              throw new Error(
                `Failed to create session: ${createResponse.status} - ${createResponse.statusText}`
              );
            }

            const sessionData = await createResponse.json();
            activeSessionId = sessionData.sessionId || sessionData.id;

            if (!activeSessionId) {
              throw new Error("Session creation response missing sessionId");
            }

            setCurrentSessionId(activeSessionId);
            console.log("Created session:", activeSessionId);
          } catch (createError) {
            console.error("Error creating session:", createError);
            throw createError;
          }
        }

        // Construct the /run endpoint URL
        const endpoint = `http://127.0.0.1:8000/run`;

        const requestBody = {
          appName,
          userId,
          sessionId: activeSessionId,
          newMessage: {
            parts: [
              {
                text: message,
              },
            ],
          },
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

        // Extract text from response parts if available
        if (
          botResponse?.message?.parts &&
          Array.isArray(botResponse.message.parts)
        ) {
          return botResponse.message.parts
            .map((part: { text?: string }) => part.text || "")
            .join(" ");
        }

        // Fallback for different response structures
        return (
          botResponse?.message ||
          botResponse?.response ||
          JSON.stringify(botResponse)
        );
      } catch (error) {
        setError(error);
        setIsChatLoading(false);
        console.error("Error in askAiAssistant:", error);
        throw error;
      }
    },
    [user?.id, currentSessionId]
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
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
