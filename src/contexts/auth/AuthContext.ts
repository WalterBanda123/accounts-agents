import React from "react";
import { UserInterface } from "../../interfaces/user";

export interface AuthContextInterface {
    isLoading: boolean,
    error: unknown,
    isLoggedIn: boolean,
    user: UserInterface | null,
    signInUserWithEmailAndPassword: (email: string, password: string) => Promise<unknown>,
    signOut: () => Promise<unknown>,
    signUp: (businessName: string, email: string, phone: string, password: string) => Promise<unknown>
}


const AuthContext = React.createContext<AuthContextInterface>({
    isLoading: true,
    error: null,
    isLoggedIn: false,
    user: {} as UserInterface,
    signInUserWithEmailAndPassword: async (email: string, password: string) => {
        return Promise.resolve({ email, password });
    },
    signOut: async () => {
        return Promise.resolve(null)
    },
    signUp: async () => {
        return Promise.resolve(null)
    }
})

export default AuthContext;