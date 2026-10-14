import { Car, Zap, Gem, Truck, Users, Search, CalendarCheck, KeyRound, ShieldCheck, Headphones, BadgeIndianRupee, MapPin } from 'lucide-react';

export const locations = ['Nagercoil', 'Coimbatore', 'Chennai', 'Bengaluru', 'Kochi', 'Hyderabad', 'Mumbai', 'Delhi'];

export const categories = [
  { name: 'Hatchback', icon: Car, blurb: 'Nimble & fuel-efficient city drives', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=75' },
  { name: 'Sedan', icon: Car, blurb: 'Plush executive highway cruisers', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=75' },
  { name: 'SUV', icon: Truck, blurb: 'Commanding road presence & clearance', image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=75' },
  { name: 'MUV / MPV', icon: Users, blurb: 'Spacious 7-9 seater group journeys', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=75' },
  { name: 'Luxury', icon: Gem, blurb: 'Prestige, craftsmanship & performance', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=75' },
  { name: 'Electric Vehicles', icon: Zap, blurb: 'Silent, zero-emission green mobility', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=75' },
];

export const steps = [
  { icon: Search, title: 'Search', text: 'Pick your city, dates and the kind of car you need.' },
  { icon: CalendarCheck, title: 'Book', text: 'Add your details and any extras, then confirm the demo booking.' },
  { icon: KeyRound, title: 'Drive', text: 'Pick up your car at the chosen location and go.' },
];

export const benefits = [
  { icon: BadgeIndianRupee, title: 'Clear pricing', text: 'Every charge is shown before you confirm.' },
  { icon: ShieldCheck, title: 'Insurance options', text: 'Add premium cover in one tap during booking.' },
  { icon: Headphones, title: 'Support all week', text: 'Reach us by phone or email whenever you need help.' },
  { icon: MapPin, title: 'Many pickup points', text: 'Collect and return in seven cities.' },
];

export const offers = [
  { code: 'WELCOME10', title: '10% off your first trip', text: 'New customers save on any car, any length.' },
  { code: 'WEEKEND15', title: '15% off weekend rentals', text: 'Friday evening pickup to Monday morning return.' },
  { code: 'EVGO500', title: '₹500 off electric cars', text: 'Try an EV for a day and see the difference.' },
];

export const testimonials = [
  { name: 'Priya Raman', city: 'Coimbatore', text: 'Booking took under five minutes and the price matched what I saw at the start.' },
  { name: 'Arjun Mehta', city: 'Mumbai', text: 'The car was clean and ready on time. Returning it was just as easy.' },
  { name: 'Sneha Iyer', city: 'Chennai', text: 'I tried an electric car for the first time here and now I am sold.' },
];

export const faqs = [
  { q: 'Is this a real booking service?', a: 'No. Drivo is a frontend demo. Bookings and payments are simulated and stored only in your browser.' },
  { q: 'What documents will I need to rent a car?', a: 'A valid driving licence and a government photo ID. The booking form asks for your licence number.' },
  { q: 'Can I cancel a booking?', a: 'Yes. Eligible demo bookings can be cancelled from your dashboard. See the cancellation policy for details.' },
  { q: 'Is there a security deposit?', a: 'Some cars have a refundable deposit. It is shown in your booking summary before you confirm.' },
];
