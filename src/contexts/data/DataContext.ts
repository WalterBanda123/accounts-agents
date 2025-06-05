import React from "react";
import { StockItem } from "../../mock/stocks";

export interface DataContextInterface {
    inventory: StockItem[],
    addNewProduct: (product: Partial<StockItem>) => Promise<unknown>,
    getProduct: (productId: string) => Promise<Partial<StockItem>>
}

const DataContext = React.createContext<DataContextInterface>({
    inventory: [] as StockItem[],
    addNewProduct: async () => {
        return Promise.resolve(null);
    },
    getProduct: async () => {
        return Promise.resolve({})
    }
})

export default DataContext;