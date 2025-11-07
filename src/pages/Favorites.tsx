import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation as NavigationIcon, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface FavoriteRoute {
  id: string;
  pickup_location: string;
  drop_location: string;
  distance: number;
}

const Favorites = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('favorite_routes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setFavorites(data || []);
      }
    };

    fetchFavorites();
  }, [navigate, toast]);

  const handleDelete = async (id: string) => {
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
        title: "Route deleted",
        description: "Removed from favorites",
      });
    }
  };

  const handleCompare = (pickup: string, drop: string) => {
    navigate(`/comparison?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsNavOpen(true)} />
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Favorite Routes</h1>
            <p className="text-muted-foreground">
              Quick access to your saved routes
            </p>
          </div>

          {favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No favorite routes yet</p>
              <Button onClick={() => navigate("/")}>
                Compare Rides
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {favorites.map((favorite) => (
                <Card key={favorite.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="font-medium">{favorite.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <NavigationIcon className="h-4 w-4 text-destructive" />
                        <span className="font-medium">{favorite.drop_location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Distance: {favorite.distance} km
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCompare(favorite.pickup_location, favorite.drop_location)}
                      >
                        Compare
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(favorite.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Favorites;
