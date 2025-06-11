import React from "react";
import "./AvatarComponent.css";

interface AvatarComponentProps {
  initials: string;
  color: string;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  className?: string;
}

const AvatarComponent: React.FC<AvatarComponentProps> = ({
  initials,
  color,
  size = "medium",
  onClick,
  className = "",
}) => {
  const sizeClass = `avatar-${size}`;

  return (
    <div
      className={`avatar-container ${sizeClass} ${className} ${
        onClick ? "clickable" : ""
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      <span className="avatar-initials">{initials}</span>
    </div>
  );
};

export default AvatarComponent;
