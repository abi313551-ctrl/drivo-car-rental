// 14 sample cars (2 per city, 7 cities). Photos are generic stock images, not model-accurate.
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=70`;

const pool = {
  Hatchback: ['1552519507-da3b142c6e3d', '1502877338535-766e1452684a', '1549317661-bd32c8ce0db2'],
  Sedan: ['1503376780353-7e6692767b70', '1494976388531-d1058494cdd8', '1511919884226-fd3cad34687c'],
  SUV: ['1533473359331-0135ef1b58bf', '1519641471654-76ce0107ad1b', '1506015391300-4802dc74de2e'],
  Electric: ['1560958089-b8a1929cea89', '1593941707882-a5bba14938c7', '1617788138017-80ad40651399'],
  Luxury: ['1555215695-3004980ad54e', '1618843479313-40f8afb4b4d8', '1503736334956-4c8f8e92946d'],
};
const baseFeatures = ['Air conditioning', 'Bluetooth audio', 'Power windows', 'Dual airbags', 'ABS with EBD', 'Reverse parking sensors'];
const extraFeatures = {
  Hatchback: ['Fuel-efficient engine', 'Compact city size'],
  Sedan: ['Spacious rear seat', 'Cruise control'],
  SUV: ['High ground clearance', 'Large boot space'],
  Electric: ['Zero tailpipe emissions', 'Fast-charging support', 'Regenerative braking'],
  Luxury: ['Leather seats', 'Panoramic sunroof', 'Premium sound system', 'Ambient lighting'],
};
const deposits = { Hatchback: 3000, Sedan: 5000, SUV: 8000, Electric: 8000, Luxury: 25000 };

const make = (id, brand, model, year, category, fuel, transmission, seats, pricePerDay, rating, location, popularity) => {
  const images = [0, 1, 2].map((i) => U(pool[category][(id + i) % 3]));
  return {
    id, brand, model, year, category, fuel, transmission, seats, pricePerDay, rating, location, popularity,
    image: images[0],
    images,
    deposit: deposits[category],
    available: true,
    features: [...baseFeatures, ...extraFeatures[category]],
    description: `The ${year} ${brand} ${model} is a ${fuel.toLowerCase()} ${category.toLowerCase()} with ${transmission.toLowerCase()} transmission and room for ${seats}. It is cleaned and inspected before every pickup and available from ${location}.`,
  };
};

export const cars = [
  make(1, 'Maruti Suzuki', 'Swift', 2024, 'Hatchback', 'Petrol', 'Manual', 5, 1500, 4.5, 'Coimbatore', 95),
  make(2, 'Hyundai', 'i20', 2023, 'Hatchback', 'Petrol', 'Manual', 5, 1700, 4.4, 'Chennai', 80),
  make(3, 'Tata', 'Altroz', 2024, 'Hatchback', 'Diesel', 'Manual', 5, 1600, 4.3, 'Bengaluru', 62),
  make(4, 'Honda', 'City', 2023, 'Sedan', 'Petrol', 'Automatic', 5, 2500, 4.6, 'Chennai', 90),
  make(5, 'Hyundai', 'Verna', 2024, 'Sedan', 'Petrol', 'Automatic', 5, 2600, 4.5, 'Hyderabad', 70),
  make(6, 'Skoda', 'Slavia', 2023, 'Sedan', 'Petrol', 'Manual', 5, 2400, 4.4, 'Kochi', 55),
  make(7, 'Hyundai', 'Creta', 2024, 'SUV', 'Diesel', 'Automatic', 5, 3200, 4.7, 'Bengaluru', 98),
  make(8, 'Mahindra', 'XUV700', 2024, 'SUV', 'Diesel', 'Automatic', 7, 4000, 4.7, 'Hyderabad', 85),
  make(9, 'Toyota', 'Innova Crysta', 2023, 'SUV', 'Diesel', 'Manual', 7, 4200, 4.8, 'Coimbatore', 100),
  make(10, 'Mahindra', 'Thar', 2023, 'SUV', 'Diesel', 'Manual', 4, 3500, 4.6, 'Delhi', 88),
  make(11, 'Tata', 'Nexon EV', 2024, 'Electric', 'Electric', 'Automatic', 5, 3000, 4.4, 'Kochi', 66),
  make(12, 'MG', 'ZS EV', 2024, 'Electric', 'Electric', 'Automatic', 5, 3400, 4.5, 'Delhi', 60),
  make(13, 'BMW', '5 Series', 2024, 'Luxury', 'Petrol', 'Automatic', 5, 9500, 4.9, 'Mumbai', 75),
  make(14, 'Mercedes-Benz', 'E-Class', 2023, 'Luxury', 'Petrol', 'Automatic', 5, 11000, 4.8, 'Mumbai', 72),
];
