import React from "react";
import { StockItem } from "../../mock/stocks";

export interface DataContextInterface {
    isLoading: boolean,
    error: unknown,
    inventory: Partial<StockItem>[],
    addNewProduct: (product: Partial<StockItem>) => Promise<unknown>,
    getProduct: (productId: string) => Promise<Partial<StockItem> | null>,
    getAllProducts: () => Promise<unknown>,
    searchProducts:(search:string)=>Promise<Partial<StockItem>[]>
    
}

const DataContext = React.createContext<DataContextInterface>({
    isLoading: true,
    error: null,
    inventory: [] as Partial<StockItem>[],
    addNewProduct: async () => {
        return Promise.resolve(null);
    },
    getProduct: async () => {
        return Promise.resolve({})
    },
    getAllProducts:async()=>{
        return Promise.resolve({})
    },
    searchProducts:async()=>{
        return Promise.resolve([])
    }
})

export default DataContext;