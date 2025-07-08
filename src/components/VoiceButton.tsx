import { Mic, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const VoiceButton = ({ 
  isConnected, 
  isSpeaking, 
  isListening,
  onClick, 
  disabled = false 
}: VoiceButtonProps) => {
  const getButtonState = () => {
    if (!isConnected) return "disconnected";
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    return "ready";
  };

  const state = getButtonState();

  const stateConfig = {
    disconnected: {
      icon: Play,
      label: "Start Conversation",
      className: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
      iconClassName: "text-secondary-foreground",
      pulseClassName: ""
    },
    ready: {
      icon: Mic,
      label: "Ready to Listen",
      className: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-voice",
      iconClassName: "text-primary-foreground",
      pulseClassName: "animate-pulse-voice"
    },
    listening: {
      icon: Mic,
      label: "Listening...",
      className: "bg-green-500 hover:bg-green-600 text-white shadow-voice",
      iconClassName: "text-white",
      pulseClassName: "animate-pulse-voice"
    },
    speaking: {
      icon: Mic,
      label: "AI Speaking",
      className: "bg-orange-500 hover:bg-orange-600 text-white shadow-voice",
      iconClassName: "text-white",
      pulseClassName: "animate-pulse-voice"
    }
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className="relative flex flex-col items-center">
      {/* Ripple effects for active states */}
      {(isListening || isSpeaking) && (
        <>
          <div className="absolute inset-0 rounded-full bg-gradient-pulse animate-ripple" />
          <div className="absolute inset-0 rounded-full bg-gradient-pulse animate-ripple" style={{ animationDelay: "0.5s" }} />
        </>
      )}
      
      {/* Main button */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95",
          config.className,
          config.pulseClassName,
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Icon 
          size={32} 
          className={cn("transition-colors duration-300", config.iconClassName)} 
        />
      </button>
      
      {/* Status label */}
      <span className="mt-4 text-sm font-medium text-muted-foreground">
        {config.label}
      </span>
    </div>
  );
};