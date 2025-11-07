import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation as NavigationIcon, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RideHistoryEntry {
  id: string;
  pickup_location: string;
  drop_location: string;
  distance: number;
  best_fare: number;
  best_provider: string;
  created_at: string;
}

const History = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [history, setHistory] = useState<RideHistoryEntry[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('ride_history')
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
        setHistory(data || []);
      }
    };

    fetchHistory();
  }, [navigate, toast]);

  const handleDelete = async (id: string) => {
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
        title: "Entry deleted",
        description: "Removed from history",
      });
    }
  };

  const handleCompareAgain = (pickup: string, drop: string) => {
    navigate(`/comparison?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsNavOpen(true)} />
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Comparison History</h1>
            <p className="text-muted-foreground">
              Your recent ride fare comparisons
            </p>
          </div>

          {history.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No comparison history yet</p>
              <Button onClick={() => navigate("/")}>
                Compare Rides
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <Card key={entry.id} className="p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-accent" />
                        <span className="font-medium">{entry.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <NavigationIcon className="h-4 w-4 text-destructive" />
                        <span className="font-medium">{entry.drop_location}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Best Price</p>
                          <p className="font-semibold text-accent text-lg">₹{entry.best_fare}</p>
                          <p className="text-xs text-muted-foreground">{entry.best_provider}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Distance</p>
                          <p className="font-semibold">{entry.distance} km</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-semibold">
                            {format(new Date(entry.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCompareAgain(entry.pickup_location, entry.drop_location)}
                      >
                        Compare Again
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
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

export default History;
