import React, { useState } from 'react';
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
    IonText
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';
import useAuthContext from '../contexts/auth/UseAuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const history = useHistory();
    const {signInUserWithEmailAndPassword} = useAuthContext()

    const handleEmailLogin = async() => {
        // Login logic will be handled later
        console.log('Email login:', { email, password });
        await signInUserWithEmailAndPassword(email, password)
        // For now, just navigate to home
        history.push('/home');
    };

    const handleSignUpClick = () => {
        history.push('/register');
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
                    {/* App Logo/Title */}
                    <div className="login-header">
                        <h1>Account Manager</h1>
                        <p>Sign in to continue</p>
                    </div>

                    {/* Simple Login Form */}
                    <div className="login-form">
                        {/* Email Input */}
                        <IonItem className="login-item">
                            <IonLabel position="stacked">Email</IonLabel>
                            <IonInput
                                type="email"
                                value={email}
                                onIonInput={(e) => setEmail(e.detail.value!)}
                                placeholder="Enter your email"
                            />
                        </IonItem>

                        {/* Password Input */}
                        <IonItem className="login-item">
                            <IonLabel position="stacked">Password</IonLabel>
                            <IonInput
                                type="password"
                                value={password}
                                onIonInput={(e) => setPassword(e.detail.value!)}
                                placeholder="Enter your password"
                            />
                        </IonItem>

                        {/* Login Button */}
                        <IonButton
                            expand="block"
                            color="primary"
                            className="login-button"
                            onClick={handleEmailLogin}
                            disabled={!email || !password}
                        >
                            Sign In
                        </IonButton>

                        {/* Forgot Password Link */}
                        <div className="forgot-password">
                            <IonText color="medium">
                                <p>Forgot your password?</p>
                            </IonText>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="signup-link">
                        <IonText color="medium">
                            <p>Don't have an account? <span className="link-text" onClick={handleSignUpClick}>Sign up</span></p>
                        </IonText>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Login;
