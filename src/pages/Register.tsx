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
  IonSpinner,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Register.css";
import useAuthContext from "../contexts/auth/UseAuthContext";
import LocationAutoComplete from "../components/LocationAutoComplete";

const Register: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [languagePreference, setLanguagePreference] = useState("English");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();
  const { signUp, isLoading, error, isLoggedIn } = useAuthContext();

  const handleRegister = async () => {
    if (!isFormValid) {
      console.error("Please fill in all fields and ensure passwords match");
      setToastMessage(
        "Please fill in all fields correctly and ensure passwords match"
      );
      setShowErrorToast(true);
      return;
    }

    try {
      console.log("Register:", {
        fullName,
        businessName,
        phone,
        email,
        password,
        location,
        languagePreference,
        preferredCurrency,
        isBusinessOwner,
      });
      await signUp(email, password, fullName, phone);

      setTimeout(() => {
        if (isLoggedIn && !error) {
          setToastMessage(
            `Welcome to Account Manager, ${fullName}! Your account has been created successfully.`
          );
          setShowSuccessToast(true);
          setTimeout(() => {
            history.push("/home");
          }, 2000);
        } else if (error) {
          setToastMessage(
            "Registration failed. Please try again with different credentials."
          );
          setShowErrorToast(true);
        }
      }, 100);
    } catch (err) {
      console.error("Registration failed:", err);
      setToastMessage("Registration failed. Please try again.");
      setShowErrorToast(true);
    }
  };

  const handleSignInClick = () => {
    history.push("/login");
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const isFormValid =
    fullName &&
    email &&
    validateEmail(email) &&
    phone &&
    validatePhone(phone) &&
    password &&
    password.length >= 6 &&
    confirmPassword &&
    password === confirmPassword &&
    location &&
    languagePreference &&
    preferredCurrency;

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

      <IonContent className="">
        <div className="">
          {/* App Logo/Title */}
          <div className="register-header">
            <h1>Account Manager</h1>
            <p>Create your account and personalized profile</p>
          </div>

          <div className="register-form">
            <IonItem className="register-item">
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                type="text"
                value={fullName}
                onIonInput={(e) => setFullName(e.detail.value!)}
                placeholder="Enter your full name"
              />
            </IonItem>

            <IonItem className="register-item">
              <IonLabel position="stacked">Business Name (Optional)</IonLabel>
              <IonInput
                type="text"
                value={businessName}
                onIonInput={(e) => setBusinessName(e.detail.value!)}
                placeholder="Enter your business name"
              />
            </IonItem>

            <IonItem className="register-item">
              <IonLabel position="stacked">Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={phone}
                onIonInput={(e) => setPhone(e.detail.value!)}
                placeholder="Enter your phone number"
              />
            </IonItem>
            {phone && !validatePhone(phone) && (
              <div className="password-warning">
                <IonText color="danger">
                  <p>Please enter a valid phone number</p>
                </IonText>
              </div>
            )}

            <IonItem className="register-item">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                placeholder="Enter your email"
              />
            </IonItem>
            {email && !validateEmail(email) && (
              <div className="password-warning">
                <IonText color="danger">
                  <p>Please enter a valid email address</p>
                </IonText>
              </div>
            )}

            <LocationAutoComplete
              value={location}
              onLocationChange={setLocation}
              className="register-item"
              placeholder="Search for your location"
            />

            <IonItem className="register-item">
              <IonLabel position="stacked">Language Preference</IonLabel>
              <IonSelect
                value={languagePreference}
                onIonChange={(e) => setLanguagePreference(e.detail.value)}
              >
                <IonSelectOption value="English">English</IonSelectOption>
                <IonSelectOption value="Shona">Shona</IonSelectOption>
                <IonSelectOption value="Ndebele">Ndebele</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem className="register-item">
              <IonLabel position="stacked">Preferred Currency</IonLabel>
              <IonSelect
                value={preferredCurrency}
                onIonChange={(e) => setPreferredCurrency(e.detail.value)}
              >
                <IonSelectOption value="USD">USD</IonSelectOption>
                <IonSelectOption value="ZWL">ZWL</IonSelectOption>
                <IonSelectOption value="EUR">EUR</IonSelectOption>
                <IonSelectOption value="GBP">GBP</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem className="register-item">
              <IonLabel>Business Owner</IonLabel>
              <IonCheckbox
                slot="end"
                checked={isBusinessOwner}
                onIonChange={(e) => setIsBusinessOwner(e.detail.checked)}
              />
            </IonItem>

            <IonItem className="register-item">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                placeholder="Create a password (min 6 characters)"
              />
            </IonItem>
            {password && password.length < 6 && (
              <div className="password-warning">
                <IonText color="danger">
                  <p>Password must be at least 6 characters long</p>
                </IonText>
              </div>
            )}

            <IonItem className="register-item">
              <IonLabel position="stacked">Confirm Password</IonLabel>
              <IonInput
                type="password"
                value={confirmPassword}
                onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                placeholder="Confirm your password"
              />
            </IonItem>

            {password && confirmPassword && password !== confirmPassword && (
              <div className="password-warning">
                <IonText color="danger">
                  <p>Passwords do not match</p>
                </IonText>
              </div>
            )}

            <IonButton
              expand="block"
              color="primary"
              className="register-button"
              onClick={handleRegister}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <IonSpinner name="circular" style={{ marginRight: "8px" }} />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </IonButton>

            <div className="terms-text">
              <IonText color="medium">
                <p>
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
              </IonText>
            </div>
          </div>

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

        <IonToast
          isOpen={showErrorToast}
          onDidDismiss={() => setShowErrorToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
          position="top"
        />

        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message={toastMessage}
          duration={3000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
