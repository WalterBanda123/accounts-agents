import React from "react";
import { UserInterface } from "../../interfaces/user";

export interface AuthContextInterface {
    isLoading: boolean,
    error: unknown,
    isLoggedIn: boolean,
    user: UserInterface | null,
    signInUserWithEmailAndPassword: (email: string, password: string) => Promise<unknown>,
    createUserProfile: (businessName: string, email: string, phone: string, password: string) => Promise<unknown>,
    signOut: () => Promise<unknown>,
    signUp: (email: string, password: string, businessName: string, phone: string) => Promise<unknown>,
    updateUserProfile: (displayName?: string, photoURL?: string) => Promise<boolean>
}


const AuthContext = React.createContext<AuthContextInterface>({
    isLoading: true,
    error: null,
    isLoggedIn: false,
    user: {} as UserInterface,
    signInUserWithEmailAndPassword: async (email: string, password: string) => {
        return Promise.resolve({ email, password });
    },
    createUserProfile: async (
        businessName: string,
        email: string, phone:
            string,
        password: string) => {
        return Promise.resolve({ businessName, email, phone, password })
    },
    signOut: async () => {
        return Promise.resolve(null)
    },
    signUp: async (email: string, password: string, businessName: string, phone: string) => {
        return Promise.resolve({ email, password, businessName, phone })
    },
    updateUserProfile: async (displayName?: string, photoURL?: string) => {
        console.log('Default updateUserProfile:', displayName, photoURL);
        return Promise.resolve(true)
    }
})

export default AuthContext;