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
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Login.css";
import useAuthContext from "../contexts/auth/UseAuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();
  const { signInUserWithEmailAndPassword, isLoading } = useAuthContext();

  const handleEmailLogin = async () => {
    try {
      console.log("Email login:", { email, password });
      await signInUserWithEmailAndPassword(email, password);
      setToastMessage("Login successful! Welcome back.");
      setShowSuccessToast(true);
        history.push("/home");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setToastMessage("Login failed. Please try again.");
      setShowErrorToast(true);
    }
  };

  const handleSignUpClick = () => {
    history.push("/register");
  };

  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar>
          <IonTitle>Welcome Back</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="login-content">
        <div className="login-container">
          <div className="login-header">
            <h1>Account Manager</h1>
            <p>Sign in to continue</p>
          </div>

          <div className="login-form">
            <IonItem className="login-item">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                placeholder="Enter your email"
              />
            </IonItem>

            <IonItem className="login-item">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                placeholder="Enter your password"
              />
            </IonItem>

            <IonButton
              expand="block"
              color="primary"
              className="login-button"
              onClick={handleEmailLogin}
              disabled={!email || !password || isLoading}
            >
              {isLoading ? (
                <>
                  <IonSpinner name="circular" style={{ marginRight: "8px" }} />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </IonButton>

            <div className="forgot-password">
              <IonText color="medium">
                <p>Forgot your password?</p>
              </IonText>
            </div>
          </div>

          <div className="signup-link">
            <IonText color="medium">
              <p>
                Don't have an account?
                <span className="link-text" onClick={handleSignUpClick}>
                  Sign up
                </span>
              </p>
            </IonText>
          </div>
        </div>

        <IonToast
          isOpen={showErrorToast}
          onDidDismiss={() => setShowErrorToast(false)}
          message={toastMessage}
          duration={6000}
          color="danger"
          position="top"
        />

        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
