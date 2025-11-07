import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation as NavigationIcon, Car } from "lucide-react";
import { mumbaiStations } from "@/data/mumbaiStations";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleCompare = () => {
    if (!pickup || !drop) {
      toast({
        title: "Missing information",
        description: "Please select both pickup and drop locations",
        variant: "destructive",
      });
      return;
    }

    if (pickup === drop) {
      toast({
        title: "Invalid route",
        description: "Pickup and drop locations cannot be the same",
        variant: "destructive",
      });
      return;
    }

    navigate(`/comparison?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsNavOpen(true)} />
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Compare Ride Fares in Mumbai
            </h1>
            <Car className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground">
            Real-time prices based on distance and surge pricing
          </p>
        </div>

        <Card className="max-w-2xl mx-auto p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Where are you going?
          </h2>
          <p className="text-muted-foreground mb-6">
            Select locations to compare real prices
          </p>

          <div className="space-y-6">
            <div>
              <Label htmlFor="pickup" className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-accent" />
                Pickup Location
              </Label>
              <Select value={pickup} onValueChange={setPickup}>
                <SelectTrigger id="pickup">
                  <SelectValue placeholder="Select pickup location" />
                </SelectTrigger>
                <SelectContent>
                  {mumbaiStations.map((station) => (
                    <SelectItem key={station.name} value={station.name}>
                      {station.name} ({station.line})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="drop" className="flex items-center gap-2 mb-2">
                <NavigationIcon className="h-4 w-4 text-destructive" />
                Drop Location
              </Label>
              <Select value={drop} onValueChange={setDrop}>
                <SelectTrigger id="drop">
                  <SelectValue placeholder="Select drop location" />
                </SelectTrigger>
                <SelectContent>
                  {mumbaiStations.map((station) => (
                    <SelectItem key={station.name} value={station.name}>
                      {station.name} ({station.line})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full text-lg py-6" 
              size="lg"
              onClick={handleCompare}
            >
              Compare Prices
            </Button>
          </div>
        </Card>

        <footer className="text-center mt-12 text-muted-foreground">
          <p>© TripWise 2025</p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
