import { Car, LogOut, Menu, User } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export const Header = ({ onMenuClick, showMenu = true }: HeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }
      }
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        fetchUserProfile();
      } else {
        setIsAuthenticated(false);
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
    navigate("/auth");
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showMenu && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary/90"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-primary-foreground text-primary p-2 rounded-lg">
              <Car className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">TripWise</h1>
          </div>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4" />
              <span>Hi, {userName || "User"}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary/90"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
