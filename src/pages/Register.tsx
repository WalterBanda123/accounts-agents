import React, { useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Register.css";
import useAuthContext from "../contexts/auth/UseAuthContext";

const Register: React.FC = () => {
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const history = useHistory();
  const { signUp } = useAuthContext();

  const handleRegister = async () => {
    if (!isFormValid) {
      console.error("Please fill in all fields and ensure passwords match");
      return;
    }

    try {
      console.log("Register:", { businessName, phone, email, password });
      await signUp(email, password, businessName, phone);
      history.push("/home");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleSignInClick = () => {
    history.push("/login");
  };

  const isFormValid =
    businessName &&
    phone &&
    email &&
    password &&
    confirmPassword &&
    password === confirmPassword;

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="register-content">
        <div className="register-container">
          {/* App Logo/Title */}
          <div className="register-header">
            <h1>Account Manager</h1>
            <p>Create your business account</p>
          </div>

          {/* Simple Register Form */}
          <div className="register-form">
            {/* Business Name Input */}
            <IonItem className="register-item">
              <IonLabel position="stacked">Business Name</IonLabel>
              <IonInput
                type="text"
                value={businessName}
                onIonInput={(e) => setBusinessName(e.detail.value!)}
                placeholder="Enter your business name"
              />
            </IonItem>

            {/* Phone Input */}
            <IonItem className="register-item">
              <IonLabel position="stacked">Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={phone}
                onIonInput={(e) => setPhone(e.detail.value!)}
                placeholder="Enter your phone number"
              />
            </IonItem>

            {/* Email Input */}
            <IonItem className="register-item">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                placeholder="Enter your email"
              />
            </IonItem>

            {/* Password Input */}
            <IonItem className="register-item">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                placeholder="Create a password"
              />
            </IonItem>

            {/* Confirm Password Input */}
            <IonItem className="register-item">
              <IonLabel position="stacked">Confirm Password</IonLabel>
              <IonInput
                type="password"
                value={confirmPassword}
                onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                placeholder="Confirm your password"
              />
            </IonItem>

            {/* Password mismatch warning */}
            {password && confirmPassword && password !== confirmPassword && (
              <div className="password-warning">
                <IonText color="danger">
                  <p>Passwords do not match</p>
                </IonText>
              </div>
            )}

            {/* Register Button */}
            <IonButton
              expand="block"
              color="primary"
              className="register-button"
              onClick={handleRegister}
              disabled={!isFormValid}
            >
              Create Account
            </IonButton>

            {/* Terms and Conditions */}
            <div className="terms-text">
              <IonText color="medium">
                <p>
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
              </IonText>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="signin-link">
            <IonText color="medium">
              <p>
                Already have an account?{" "}
                <span className="link-text" onClick={handleSignInClick}>
                  Sign in
                </span>
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
