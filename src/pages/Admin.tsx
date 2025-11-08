import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Users, Star, History as HistoryIcon } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface FavoriteRoute {
  id: string;
  user_id: string;
  pickup_location: string;
  drop_location: string;
  distance: number;
}

interface RideHistory {
  id: string;
  user_id: string;
  pickup_location: string;
  drop_location: string;
  best_fare: number;
  created_at: string;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [history, setHistory] = useState<RideHistory[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check admin status via edge function
      try {
        const { data, error } = await supabase.functions.invoke('check-admin');
        
        if (error || !data?.isAdmin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to verify admin access",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*');
      setUsers(usersData || []);

      // Fetch favorites
      const { data: favoritesData } = await supabase
        .from('favorite_routes')
        .select('*');
      setFavorites(favoritesData || []);

      // Fetch history
      const { data: historyData } = await supabase
        .from('ride_history')
        .select('*')
        .order('created_at', { ascending: false });
      setHistory(historyData || []);
      
      setLoading(false);
    };

    fetchData();
  }, [navigate, toast]);

  const handleDeleteFavorite = async (id: string) => {
    const { error } = await supabase
      .from('favorite_routes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: "Deleted",
        description: "Favorite route deleted",
      });
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const { error } = await supabase
      .from('ride_history')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setHistory(history.filter(h => h.id !== id));
      toast({
        title: "Deleted",
        description: "History entry deleted",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showMenu={false} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users and application data
            </p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Star className="h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <HistoryIcon className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Registered Users ({users.length})
                </h2>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  All Favorite Routes ({favorites.length})
                </h2>
                <div className="space-y-3">
                  {favorites.map((favorite) => (
                    <div key={favorite.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">
                          {favorite.pickup_location} → {favorite.drop_location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Distance: {favorite.distance} km
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFavorite(favorite.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  All Ride History ({history.length})
                </h2>
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">
                          {entry.pickup_location} → {entry.drop_location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Best Fare: ₹{entry.best_fare}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHistory(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
