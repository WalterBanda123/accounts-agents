import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import "./SplashScreen.css";

const SplashScreen: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => {
      history.replace("/login");
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [history]);

  return (
    <div className="splash-container">
      <img src="/splash-logo.png" alt="Company Logo" className="splash-logo" />
    </div>
  );
};

export default SplashScreen;
