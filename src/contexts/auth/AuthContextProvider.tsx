import React, { useEffect, useState } from 'react'
import AuthContext from './AuthContext'
import { UserInterface } from '../../interfaces/user'

const AuthContextProvider: React.FC<{ children: React.ReactNode }> = (props) => {
    const [user, setUser] = useState<UserInterface | null>({
        name: 'John Doe',
        email: 'john.doe@example.com',
        businessName: 'Doe\'s General Store',
        phone: '+1 (555) 123-4567',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    })
    const [error, setError] = useState<unknown>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)


    const signInUserWithEmailAndPassword = async (email: string, password: string) => {
        console.log(email, password)
        setError(null)
        setIsLoading(false)
    }

    const signOut = async () => {
        setError(null)
        setUser(null)
    }

    const signUp = async (businessName: string, email: string, password: string, phone: string) => {
        console.log(businessName, email, password, phone)
    }

    useEffect(() => {
        setIsLoading(false)
        setIsLoggedIn(false)
    }, [])

    return (
        <AuthContext.Provider value={{ user, error, isLoading, isLoggedIn, signInUserWithEmailAndPassword, signOut, signUp }}>
            {props.children}
        </AuthContext.Provider>
    )
}

export default AuthContextProvider
