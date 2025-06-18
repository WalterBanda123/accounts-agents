import React from "react";
import "./InitialsAvatar.css";

interface InitialsAvatarProps {
  name: string;
  size?: "small" | "medium" | "large" | "extra-large";
  className?: string;
}

const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  size = "medium",
  className = "",
}) => {
  // Function to get initials from name
  const getInitials = (fullName: string): string => {
    if (!fullName) return "U";

    const names = fullName.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (
        names[0].charAt(0) + names[names.length - 1].charAt(0)
      ).toUpperCase();
    }
  };

  // Function to generate consistent background color based on name
  const getBackgroundColor = (fullName: string): string => {
    const colors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#96CEB4", // Green
      "#FFEAA7", // Yellow
      "#DDA0DD", // Plum
      "#98D8C8", // Mint
      "#F7DC6F", // Light Yellow
      "#BB8FCE", // Light Purple
      "#85C1E9", // Light Blue
      "#F8C471", // Light Orange
      "#82E0AA", // Light Green
    ];

    // Create a simple hash from the name to consistently assign colors
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const backgroundColor = getBackgroundColor(name);

  return (
    <div
      className={`initials-avatar ${size} ${className}`}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;
