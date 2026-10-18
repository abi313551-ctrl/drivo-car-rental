import { Car, Zap, Gem, Truck, Users, Search, CalendarCheck, KeyRound, ShieldCheck, Headphones, BadgeIndianRupee, MapPin } from 'lucide-react';

export const locations = [
  'Nagercoil',
  'Kanyakumari',
  'Marthandam',
  'Thuckalay',
  'Kuzhithurai',
  'Colachel',
  'Padmanabhapuram',
  'Karungal',
  'Kulasekharam',
  'Suchindram',
];

export const categories = [
  { name: 'Hatchback', icon: Car, blurb: 'Nimble & fuel-efficient city drives', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=75' },
  { name: 'Sedan', icon: Car, blurb: 'Plush executive highway cruisers', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=75' },
  { name: 'SUV', icon: Truck, blurb: 'Commanding road presence & clearance', image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=600&q=75' },
  { name: 'MUV / MPV', icon: Users, blurb: 'Spacious 7-9 seater group journeys', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=75' },
  { name: 'Luxury', icon: Gem, blurb: 'Prestige, craftsmanship & performance', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=75' },
  { name: 'Electric Vehicles', icon: Zap, blurb: 'Silent, zero-emission green mobility', image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=75' },
];

export const steps = [
  { icon: Search, title: 'Search', text: 'Select your Kanniyakumari pickup hub, rental dates, and preferred car category.' },
  { icon: CalendarCheck, title: 'Book', text: 'Add your details and any extras, with transparent pricing and real-time availability.' },
  { icon: KeyRound, title: 'Drive', text: 'Pick up your sanitized car at the verified Kanniyakumari hub and hit the road.' },
];

export const benefits = [
  { icon: BadgeIndianRupee, title: 'Clear pricing', text: 'Every charge is shown upfront before you confirm.' },
  { icon: ShieldCheck, title: 'Insurance options', text: 'Comprehensive cover available for peaceful travel.' },
  { icon: Headphones, title: 'Dedicated Local Support', text: 'Available 24/7 with on-ground assistance across Kanniyakumari district.' },
  { icon: MapPin, title: 'Kanniyakumari Hubs', text: 'Collect and return across verified hubs in Nagercoil, Kanyakumari, Marthandam, and more.' },
];

export const offers = [
  { code: 'WELCOME10', title: '10% off your first trip', text: 'New customers save on any car, any length.' },
  { code: 'WEEKEND15', title: '15% off weekend rentals', text: 'Friday evening pickup to Monday morning return.' },
  { code: 'EVGO500', title: '₹500 off electric cars', text: 'Try an EV for a day and see the difference.' },
];

export const testimonials = [
  { name: 'Priya Raman', city: 'Nagercoil', text: 'Booking took under three minutes and the vehicle handover at WCC Road hub was impeccably prompt.' },
  { name: 'Arjun Mehta', city: 'Kanyakumari', text: 'The car was thoroughly sanitized, full tank, and ready on time. Returning it at Beach Road was effortless.' },
  { name: 'Dr. Sneha Iyer', city: 'Marthandam', text: 'I booked a Creta for a family wedding weekend across Kanniyakumari. Smooth drive and total transparency in pricing.' },
];

export const faqs = [
  { q: 'How does renting a car with Drivo work?', a: 'Select your preferred pickup hub across Kanniyakumari district, choose your rental dates, browse verified vehicles with real-time pricing, and confirm your booking securely online.' },
  { q: 'What documents will I need to rent a car?', a: 'A valid Indian driving licence (or IDP for international visitors) and an original government-issued photo ID (Aadhaar or Passport) presented during vehicle pickup.' },
  { q: 'Can I cancel or reschedule my booking?', a: 'Yes. Confirmed bookings can be cancelled free of charge up to 24 hours prior to scheduled pickup directly through your My Bookings dashboard.' },
  { q: 'How is the security deposit managed?', a: 'Vehicles require a refundable security deposit clearly calculated upfront. It is released back to your original payment method promptly after damage-free vehicle return.' },
];
