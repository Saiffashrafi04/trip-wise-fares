import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Star, Check } from "lucide-react";
import { calculateDistance } from "@/data/mumbaiStations";
import { calculateFares, FareOption } from "@/lib/fareCalculator";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const Comparison = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [fares, setFares] = useState<FareOption[]>([]);
  const [distance, setDistance] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedRide, setSelectedRide] = useState<FareOption | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const pickup = searchParams.get("pickup") || "";
  const drop = searchParams.get("drop") || "";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Calculate fares
      const dist = calculateDistance(pickup, drop);
      setDistance(dist);
      const calculatedFares = calculateFares(dist);
      setFares(calculatedFares);
    };
    
    checkAuth();
  }, [pickup, drop, navigate]);

  const handleSelectRide = async (fare: FareOption) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('ride_history').insert({
      user_id: session.user.id,
      pickup_location: pickup,
      drop_location: drop,
      distance,
      best_fare: fare.price,
      best_provider: `${fare.company} ${fare.vehicleType}`,
      comparison_data: fares,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSelectedRide(fare);
      toast({
        title: "Ride selected!",
        description: `${fare.company} ${fare.vehicleType} - ₹${fare.price} saved to history`,
      });
    }
  };

  const handleSaveRoute = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('favorite_routes').insert({
      user_id: session.user.id,
      pickup_location: pickup,
      drop_location: drop,
      distance,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSaved(true);
      toast({
        title: "Route saved!",
        description: "Added to your favorite routes",
      });
    }
  };

  const bestFare = fares[0];

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsNavOpen(true)} />
      <Navigation isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button 
              variant={isSaved ? "secondary" : "default"}
              onClick={handleSaveRoute}
              disabled={isSaved}
              className="gap-2"
            >
              <Heart className={isSaved ? "fill-current" : ""} />
              {isSaved ? "Saved" : "Save Route"}
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              From {pickup} to {drop}
            </h1>
            <p className="text-muted-foreground">
              Distance: {distance} km • Showing real-time fare comparison
            </p>
          </div>

          <Card className="overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="text-left p-4 font-semibold">Company</th>
                    <th className="text-left p-4 font-semibold">Vehicle Type</th>
                    <th className="text-left p-4 font-semibold">Price (₹)</th>
                    <th className="text-left p-4 font-semibold">ETA</th>
                    <th className="text-left p-4 font-semibold">Rating</th>
                    <th className="text-left p-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fares.map((fare, index) => {
                    const isSelected = selectedRide?.company === fare.company && 
                                      selectedRide?.vehicleType === fare.vehicleType;
                    return (
                      <tr 
                        key={index}
                        className={`border-b hover:bg-secondary/50 transition-colors ${isSelected ? 'bg-accent/10' : ''}`}
                      >
                        <td className="p-4 font-medium">{fare.company}</td>
                        <td className="p-4 text-muted-foreground">{fare.vehicleType}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">₹{fare.price}</span>
                            {index === 0 && (
                              <Badge className="bg-accent text-accent-foreground">
                                Best Price
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{fare.eta} min</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{fare.rating}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button 
                            size="sm"
                            onClick={() => handleSelectRide(fare)}
                            disabled={isSelected}
                            variant={isSelected ? "secondary" : "default"}
                            className="gap-2"
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-4 w-4" />
                                Selected
                              </>
                            ) : (
                              'Select'
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {bestFare && (
            <div className="mt-6 text-center text-muted-foreground">
              <p>
                Best fare: <span className="font-semibold text-accent">₹{bestFare.price}</span> with{" "}
                <span className="font-semibold">{bestFare.company}</span>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Comparison;
