import React from "react";
import InitialsAvatar from "./InitialsAvatar";

interface AvatarComponentProps {
  name: string;
  size?: "small" | "medium" | "large" | "extra-large";
  className?: string;
  onClick?: () => void;
}

const AvatarComponent: React.FC<AvatarComponentProps> = ({
  name,
  size = "medium",
  className = "",
  onClick,
}) => {
  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <InitialsAvatar name={name} size={size} className={className} />
    </div>
  );
};

export default AvatarComponent;
