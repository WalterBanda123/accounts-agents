import React, { useEffect, useState } from "react";
import DataContext from "./DataContext";
import { StockItem } from "../../mock/stocks";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { fStore } from "../../../firebase.config";

const DataContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const COLLECTION_NAMES = {
    PRODUCTS: "products",
  };
  const [inventory, setInventory] = useState<Partial<StockItem>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const addNewProduct = async (product: Partial<StockItem>) => {
    setInventory([]);
    return Promise.resolve(product);
  };

  const getProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      const doc_ref = await getDoc(
        doc(fStore, COLLECTION_NAMES.PRODUCTS, productId)
      );
      const product = { id: doc_ref.id, ...doc_ref.data() };
      setIsLoading(false)
      setError(null)
      if (!product) {
        return {} as Partial<StockItem>;
      }
      return product as Partial<StockItem>;
    } catch (error) {
        setError(error)
        setIsLoading(false)
        return null
    }
  };

  const getAllProducts = async () => {
    try {
      setIsLoading(true);
      const docs_ref = await getDocs(
        collection(fStore, COLLECTION_NAMES.PRODUCTS)
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
      }}
    >
      {props.children}
    </DataContext.Provider>
  );
};

export default DataContextProvider;
