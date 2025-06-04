import React, { useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import { UserInterface } from "../../interfaces/user";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { fAuth } from "../../../firebase.config";

const AuthContextProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const signInUserWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    try {
      setError(null);
      setIsLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        fAuth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update local user state with Firebase user data
      setUser({
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || email,
        businessName: firebaseUser.displayName || "My Business", // You can store this in custom claims or Firestore
        phone: firebaseUser.phoneNumber || "",
        profileImage:
          firebaseUser.photoURL ||
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      });

      setIsLoggedIn(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Sign in error:", error);
      setError(error);
      setIsLoading(false);
      throw error; // Re-throw error so it can be caught in the Login component
    }
  };

  const createUserProfile = async (
    businessName: string,
    email: string,
    phone: string,
    password: string
  ) => {
    try {
      setError(null);
      setIsLoading(true);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        fAuth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update profile with business name as display name
      await updateProfile(firebaseUser, {
        displayName: businessName,
      });

      // Update local state
      setUser({
        name: businessName,
        email: email,
        businessName: businessName,
        phone: phone,
        profileImage:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      });

      setIsLoggedIn(true);
      setIsLoading(false);

      console.log("User profile created:", businessName, email, phone);
    } catch (error) {
      console.error("Create profile error:", error);
      setError(error);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(fAuth);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Sign out error:", error);
      setError(error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    businessName: string,
    phone: string
  ) => {
    try {
      setError(null);
      setIsLoading(true);

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        fAuth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: businessName,
      });

      // Update local user state
      setUser({
        name: businessName,
        email: email,
        businessName: businessName,
        phone: phone,
        profileImage:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      });

      setIsLoggedIn(true);
      setIsLoading(false);

      console.log("User created successfully:", email, businessName);
    } catch (error) {
      console.error("Sign up error:", error);
      setError(error);
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    try {
      if (fAuth.currentUser) {
        setError(null);
        await updateProfile(fAuth.currentUser, {
          displayName: displayName || fAuth.currentUser.displayName,
          photoURL: photoURL || fAuth.currentUser.photoURL,
        });

        // Update local state
        setUser((prev) =>
          prev
            ? {
                ...prev,
                name: displayName || prev.name,
                businessName: displayName || prev.businessName,
                profileImage: photoURL || prev.profileImage,
              }
            : null
        );

        console.log("Profile updated successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Update profile error:", error);
      setError(error);
      return false;
    }
  };

  useEffect(() => {
    setIsLoading(true);

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(fAuth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser);
      if (firebaseUser) {
        // User is signed in
        setUser({
          name: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          businessName: firebaseUser.displayName || "My Business",
          phone: firebaseUser.phoneNumber || "",
          profileImage:
            firebaseUser.photoURL ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        });
        setIsLoggedIn(true);
      } else {
        // User is signed out
        setUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        error,
        isLoading,
        isLoggedIn,
        signInUserWithEmailAndPassword,
        signOut,
        signUp,
        createUserProfile,
        updateUserProfile,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
