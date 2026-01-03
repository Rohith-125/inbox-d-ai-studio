import { Mail } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: { icon: 16, container: "w-8 h-8", text: "text-lg" },
    md: { icon: 20, container: "w-10 h-10", text: "text-xl" },
    lg: { icon: 28, container: "w-14 h-14", text: "text-3xl" },
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size].container} rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg`}>
        <Mail size={sizes[size].icon} className="text-primary-foreground" />
      </div>
      {showText && (
        <span className={`font-bold ${sizes[size].text} text-foreground`}>
          Inbox'd
        </span>
      )}
    </div>
  );
};

export default Logo;