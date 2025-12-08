import { Mail } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: { icon: 20, text: "text-lg" },
    md: { icon: 28, text: "text-2xl" },
    lg: { icon: 40, text: "text-4xl" },
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
        <div className="relative bg-gradient-to-br from-primary to-purple-500 p-2.5 rounded-xl">
          <Mail size={sizes[size].icon} className="text-primary-foreground" />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${sizes[size].text} gradient-text`}>
          Inbox'd
        </span>
      )}
    </div>
  );
};

export default Logo;
