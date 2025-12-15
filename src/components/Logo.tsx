import { Send } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: { icon: 18, container: "p-2", text: "text-lg" },
    md: { icon: 24, container: "p-2.5", text: "text-2xl" },
    lg: { icon: 36, container: "p-3", text: "text-4xl" },
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
        <div className={`relative bg-gradient-to-br from-indigo-500 via-primary to-purple-600 ${sizes[size].container} rounded-xl shadow-lg shadow-primary/25`}>
          <Send size={sizes[size].icon} className="text-white transform -rotate-12" />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${sizes[size].text} bg-gradient-to-r from-indigo-400 via-primary to-purple-400 bg-clip-text text-transparent`}>
          Inbox'd
        </span>
      )}
    </div>
  );
};

export default Logo;