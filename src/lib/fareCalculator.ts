export interface FareOption {
  company: string;
  vehicleType: string;
  price: number;
  eta: number;
  rating: number;
}

const getCurrentSurgeFactor = (): number => {
  const hour = new Date().getHours();
  // Morning peak: 7-11 AM (1.4x)
  if (hour >= 7 && hour < 11) return 1.4;
  // Evening peak: 5-10 PM (1.6x)
  if (hour >= 17 && hour < 22) return 1.6;
  // Off-peak (1.0x)
  return 1.0;
};

const getTimeFactor = (): number => {
  const hour = new Date().getHours();
  // Late night: 11 PM - 6 AM (1.3x)
  if (hour >= 23 || hour < 6) return 1.3;
  return 1.0;
};

export const calculateFares = (distance: number): FareOption[] => {
  const surge = getCurrentSurgeFactor();
  const timeFactor = getTimeFactor();
  
  // Base rates per km for different services
  const baseRates = {
    ola: {
      mini: 12,
      sedan: 16,
      suv: 22,
    },
    uber: {
      go: 13,
      premier: 18,
      black: 28,
    },
    rapido: {
      bike: 7,
      auto: 10,
    },
    indrive: {
      auto: 9,
      sedan: 14,
    }
  };
  
  const calculatePrice = (baseRate: number) => {
    return Math.round((baseRate * distance * surge * timeFactor));
  };
  
  const calculateETA = (vehicleType: string) => {
    const baseTime = distance * 2.5; // Base: ~2.5 min per km
    const variation = Math.random() * 5; // Random 0-5 min variation
    return Math.round(baseTime + variation);
  };
  
  const fares: FareOption[] = [
    // Ola
    { company: "Ola", vehicleType: "Mini", price: calculatePrice(baseRates.ola.mini), eta: calculateETA("mini"), rating: 4.6 },
    { company: "Ola", vehicleType: "Prime Sedan", price: calculatePrice(baseRates.ola.sedan), eta: calculateETA("sedan"), rating: 4.5 },
    { company: "Ola", vehicleType: "SUV", price: calculatePrice(baseRates.ola.suv), eta: calculateETA("suv"), rating: 4.6 },
    
    // Uber
    { company: "Uber", vehicleType: "Go", price: calculatePrice(baseRates.uber.go), eta: calculateETA("go"), rating: 4.3 },
    { company: "Uber", vehicleType: "Premier", price: calculatePrice(baseRates.uber.premier), eta: calculateETA("premier"), rating: 4.8 },
    { company: "Uber", vehicleType: "Black", price: calculatePrice(baseRates.uber.black), eta: calculateETA("black"), rating: 4.9 },
    
    // Rapido
    { company: "Rapido", vehicleType: "Bike", price: calculatePrice(baseRates.rapido.bike), eta: calculateETA("bike"), rating: 4.4 },
    { company: "Rapido", vehicleType: "Auto", price: calculatePrice(baseRates.rapido.auto), eta: calculateETA("auto"), rating: 4.7 },
    
    // InDrive
    { company: "InDrive", vehicleType: "Auto", price: calculatePrice(baseRates.indrive.auto), eta: calculateETA("auto"), rating: 4.8 },
    { company: "InDrive", vehicleType: "Sedan", price: calculatePrice(baseRates.indrive.sedan), eta: calculateETA("sedan"), rating: 4.5 },
  ];
  
  // Sort by price
  return fares.sort((a, b) => a.price - b.price);
};
