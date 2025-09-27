import { useState } from "react";
import { LogOut, Settings, User, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to get initials from display name
const getInitials = (name: string): string => {
  if (!name) return "U";

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join("");
};

interface UserProfileProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const UserProfile = ({ className = "", size = "md", showName = false }: UserProfileProps) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  if (!currentUser) {
    // Show a placeholder if no user is authenticated
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
        <span>Loading...</span>
      </div>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = currentUser.displayName || userProfile?.displayName || "User";
  const photoURL = userProfile?.photoURL || currentUser.photoURL;
  const initials = getInitials(displayName);

  // Debug logging to see what's happening with display names and photo URLs
  console.log('UserProfile Debug:', {
    userProfile: userProfile,
    userProfileDisplayName: userProfile?.displayName,
    currentUserDisplayName: currentUser.displayName,
    finalDisplayName: displayName,
    userProfilePhoto: userProfile?.photoURL,
    currentUserPhoto: currentUser.photoURL,
    finalPhotoURL: photoURL
  });

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  // Check if user signed in with Google
  const isGoogleUser = currentUser?.providerData?.some(provider => provider.providerId === 'google.com');
  const joinedDate = userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative ${sizeClasses[size]} rounded-full p-0 hover:ring-2 hover:ring-blue-200 transition-all ${className}`}>
          <Avatar className={`${sizeClasses[size]} border-2 border-white shadow-lg`}>
            {photoURL && (
              <AvatarImage
                src={photoURL}
                alt={displayName}
                className="object-cover"
                onError={() => console.log('Image failed to load:', photoURL)}
                onLoad={() => console.log('Image loaded successfully:', photoURL)}
              />
            )}
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {photoURL && (
                <AvatarImage
                  src={photoURL}
                  alt={displayName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
              <div className="flex items-center mt-1">
                <Mail className="w-3 h-3 text-muted-foreground mr-1" />
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {userProfile?.email || currentUser.email}
                </p>
              </div>
              <div className="flex items-center mt-1">
                <Calendar className="w-3 h-3 text-muted-foreground mr-1" />
                <p className="text-xs leading-none text-muted-foreground">
                  Joined {joinedDate}
                </p>
              </div>
              <div className="mt-2">
                {isGoogleUser ? (
                  <Badge variant="outline" className="text-xs">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google Account
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Email Account
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;