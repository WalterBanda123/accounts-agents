import React, { useEffect, useState } from "react";
import DataContext from "./DataContext";
import { StockItem } from "../../mock/stocks";
import { collection, doc, getDoc, getDocs, addDoc } from "firebase/firestore";
import { fStore } from "../../../firebase.config";
import useAuthContext from "../auth/UseAuthContext";

const DataContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const {user} = useAuthContext()

  const COLLECTION_NAMES = {
    products: "products",
  };
  const [inventory, setInventory] = useState<Partial<StockItem>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const addNewProduct = async (product: Partial<StockItem>) => {
    try {
      setIsLoading(true);
      const doc_ref = await addDoc(
        collection(fStore, COLLECTION_NAMES.products),
        product
      );
      setError(null);
      setIsLoading(false);
      return {
        data: {
          id: doc_ref.id,
        },
      };
    } catch (error) {
      setError(error);
      setIsLoading(false);
      return null;
    }
  };

  const getProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      const doc_ref = await getDoc(
        doc(fStore, COLLECTION_NAMES.products, productId)
      );
      const product = { id: doc_ref.id, ...doc_ref.data() };
      setIsLoading(false);
      setError(null);
      if (!product) {
        return {} as Partial<StockItem>;
      }
      return product as Partial<StockItem>;
    } catch (error) {
      setError(error);
      setIsLoading(false);
      return null;
    }
  };

  const searchProducts = async (search: string) => {
    try {
      setIsLoading(true);
      console.log(search);
      return Promise.resolve([...inventory]);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
      return [];
    }
  };

  const getAllProducts = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError(error);
      setIsLoading(false);
    }
  };

  const askAiAssistant = async (message: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const botResponse = await response.json()
      setError(null);
      setIsLoading(false);
      return botResponse;
    } catch (error) {
      setError(error);
      setIsLoading(false);
      console.error(error);
    }
  };

  const getAgentSession = async()=>{};
  const getChatDetails = async()=>{
    co
  };

  useEffect(() => {
    getAllProducts();
  });

  return (
    <DataContext.Provider
      value={{
        addNewProduct,
        getProduct,
        inventory,
        isLoading,
        getAllProducts,
        error,
        searchProducts,
        askAiAssistant,
        getAgentSession,
        getChatDetails,
      }}
    >
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
