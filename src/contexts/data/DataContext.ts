import React from "react";
import { StockItem } from "../../mock/stocks";
import { ChatMessage } from "../../interfaces/message";

export interface DataContextInterface {
    isLoading: boolean,
    isProductsLoading: boolean,
    isChatLoading: boolean,
    error: unknown,
    inventory: Partial<StockItem>[],
    addNewProduct: (product: Partial<StockItem>) => Promise<unknown>,
    getProduct: (productId: string) => Promise<Partial<StockItem> | null>,
    getAllProducts: () => Promise<unknown>,
    searchProducts: (search: string) => Promise<Partial<StockItem>[]>
    askAiAssistant: (message: string, sessionId?: string) => Promise<unknown>,
    getAgentSession: () => Promise<unknown>,
    getChatSession: () => Promise<unknown>,
    createSession: () => Promise<string>,
    currentSessionId: string | null,
    deactivateSession: (sessionId: string) => Promise<void>,
    // Message management functions
    saveMessage: (message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>,
    loadMessages: (sessionId: string) => Promise<ChatMessage[]>,
    deleteMessage: (messageId: string) => Promise<void>
}

const DataContext = React.createContext<DataContextInterface>({
    isLoading: true,
    isProductsLoading: false,
    isChatLoading: false,
    error: null,
    inventory: [] as Partial<StockItem>[],
    addNewProduct: async () => {
        return Promise.resolve(null);
    },
    getProduct: async () => {
        return Promise.resolve({})
    },
    getAllProducts: async () => {
        return Promise.resolve({})
    },
    searchProducts: async () => {
        return Promise.resolve([])
    },
    askAiAssistant: async () => { },
    getAgentSession: async () => { },
    getChatSession: async () => { },
    createSession: async () => Promise.resolve(''),
    currentSessionId: null,
    deactivateSession: async () => Promise.resolve(),
    // Message management function defaults
    saveMessage: async () => Promise.resolve(''),
    loadMessages: async () => Promise.resolve([]),
    deleteMessage: async () => Promise.resolve()
})

export default DataContext;