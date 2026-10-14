import { Car, Zap, Gem, Truck, Search, CalendarCheck, KeyRound, ShieldCheck, Headphones, BadgeIndianRupee, MapPin } from 'lucide-react';

export const locations = ['Coimbatore', 'Chennai', 'Bengaluru', 'Kochi', 'Hyderabad', 'Mumbai', 'Delhi'];

export const categories = [
  { name: 'Hatchback', icon: Car, blurb: 'Easy city driving' },
  { name: 'Sedan', icon: Car, blurb: 'Comfortable highway cruisers' },
  { name: 'SUV', icon: Truck, blurb: 'Space for family and luggage' },
  { name: 'Luxury', icon: Gem, blurb: 'Arrive in style' },
  { name: 'Electric', icon: Zap, blurb: 'Quiet, clean, low running cost' },
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
