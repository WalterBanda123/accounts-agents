import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonSpinner,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/AccountSettings";
import Notifications from "./pages/Notifications";
import NotificationDetail from "./pages/NotificationDetail";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import Chat from "./pages/Chat";
import MiscActivities from "./pages/MiscActivities";
import Transactions from "./pages/Transactions";
import Stocks from "./pages/Stocks";
import NewProduct from "./pages/NewProduct";
import AddProductByImageDemo from "./pages/AddProductByImageDemo";
import ReceiptDetail from "./pages/ReceiptDetail";
import TransactionChat from "./pages/TransactionChat";
import useAuthContext from "./contexts/auth/UseAuthContext";

setupIonicReact();

const App: React.FC = () => {
  const { isLoggedIn, isLoading } = useAuthContext();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <IonApp>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
          }}
        >
          <IonSpinner name="circular"></IonSpinner>
          <p style={{ marginTop: "16px" }}>Loading...</p>
        </div>
      </IonApp>
    );
  }

  const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    path: string;
  }> = ({ children, path }) => {
    return (
      <Route
        exact
        path={path}
        render={() => (isLoggedIn ? children : <Redirect to="/login" />)}
      />
    );
  };

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            {isLoggedIn ? <Redirect to="/home" /> : <Login />}
          </Route>
          <Route exact path="/register">
            {isLoggedIn ? <Redirect to="/home" /> : <Register />}
          </Route>
          <ProtectedRoute path="/profile-setup">
            <ProfileSetup />
          </ProtectedRoute>
          <ProtectedRoute path="/profile">
            <Profile />
          </ProtectedRoute>
          <ProtectedRoute path="/account-settings">
            <AccountSettings />
          </ProtectedRoute>
          <ProtectedRoute path="/notifications">
            <Notifications />
          </ProtectedRoute>
          <ProtectedRoute path="/notification/:id">
            <NotificationDetail />
          </ProtectedRoute>
          <ProtectedRoute path="/home">
            <Home />
          </ProtectedRoute>
          <ProtectedRoute path="/my_assistant">
            <Chat />
          </ProtectedRoute>
          <ProtectedRoute path="/misc-activities">
            <MiscActivities />
          </ProtectedRoute>
          <ProtectedRoute path="/receipts">
            <Transactions />
          </ProtectedRoute>
          <ProtectedRoute path="/receipt/:id">
            <ReceiptDetail />
          </ProtectedRoute>
          <ProtectedRoute path="/stock-overview">
            <Stocks />
          </ProtectedRoute>
          <ProtectedRoute path="/new-product">
            <NewProduct />
          </ProtectedRoute>
          <ProtectedRoute path="/add-product-by-image">
            <AddProductByImageDemo />
          </ProtectedRoute>
          <ProtectedRoute path="/transaction-chat">
            <TransactionChat />
          </ProtectedRoute>
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
