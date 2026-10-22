import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Car,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  X,
  Loader2,
  Phone,
  Info,
  DollarSign,
  User,
  Filter,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCars } from '../context/CarContext.jsx';
import {
  getDecorationPackages,
  calculateDecorationPrice,
  createDecorationBooking,
} from '../services/api.js';
import { formatINR } from '../utils/pricing.js';
import { locations } from '../data/homeContent.js';

const ADDON_OPTIONS = [
  { id: 'ribbons_bows', name: 'Gold/Silver Satin Ribbon Streamers', price: 500 },
  { id: 'handle_mirrors_decor', name: '4x Door Handle & Mirror Floral Ties', price: 500 },
  { id: 'trunk_swag', name: 'Rear Trunk Lid Accent Swag Bouquet', price: 1000 },
  { id: 'custom_nameplate_ribbon', name: 'Customized Couple Nameplate Ribbon', price: 800 },
];

// Fallback catalog of all 24 decorated wedding cars for immediate rendering
const FALLBACK_CARS = [
  {
    id: 1,
    name: 'Mercedes-Benz E-Class',
    slug: 'mercedes-benz-e-class-wedding-white',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Pearl White · Luxury Sedan',
    subtitle: 'Royal White Lily & Orchid Suite with Satin Silver Ribbons',
    starting_price: 14500,
    startingPrice: 14500,
    description: 'Pristine white Mercedes-Benz E-Class sedan fully styled for high-end wedding processions. Adorned with an imperial bonnet crest of white Oriental lilies, snow-white Dutch roses, cascading gypsophila, and lustrous satin silver ribbons. Soft-cushion scratch-safe mounts.',
    image: '/decorations/decor-1.jpg',
    included_items: ['White Oriental Lilies Bonnet Crest', 'Fresh Dutch White Roses Garland', '4x Door Handle Satin Bows', 'Roof & Mirror Floral Ties', 'Optional Chauffeur Service Supported'],
    includedItems: ['White Oriental Lilies Bonnet Crest', 'Fresh Dutch White Roses Garland', '4x Door Handle Satin Bows', 'Roof & Mirror Floral Ties', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Marthandam & All Kanniyakumari Hubs',
  },
  {
    id: 2,
    name: 'BMW 5 Series',
    slug: 'bmw-5-series-wedding-black',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Sapphire Black · Executive Sport',
    subtitle: 'Crimson Rose & Gold Organza Cascade',
    starting_price: 13800,
    startingPrice: 13800,
    description: "Commanding sapphire black BMW 5 Series featuring an opulent diagonal cascade of 120+ velvet Dutch crimson roses, white baby's breath, and flowing royal gold satin streamers. Door handles feature hand-tied crimson corsages.",
    image: '/decorations/decor-2.jpg',
    included_items: ['120+ Dutch Crimson Roses Bonnet Swag', 'Gold Silk Streamers', '4x Door Handle Rose Corsages', 'Windshield Pillar Floral Swags', 'Optional Chauffeur Service Supported'],
    includedItems: ['120+ Dutch Crimson Roses Bonnet Swag', 'Gold Silk Streamers', '4x Door Handle Rose Corsages', 'Windshield Pillar Floral Swags', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Marthandam & All Kanniyakumari Hubs',
  },
  {
    id: 3,
    name: 'Audi A6',
    slug: 'audi-a6-wedding-silver',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Floret Silver · Bridal Elegance',
    subtitle: 'Blush Pink Peony & Pastel Crescent',
    starting_price: 12900,
    startingPrice: 12900,
    description: 'Sophisticated floret silver Audi A6 with a delicate crescent arrangement of imported blush pink roses, peach garden peonies, white carnations, and soft pastel organza ribbons streaming across the front hood.',
    image: '/decorations/decor-3.jpg',
    included_items: ['Blush Pink Peony & Rose Crescent', 'Pastel Organza Ribbon Drapes', '4x Door Ribbon Bows', 'Rear Deck Floral Accent', 'Optional Chauffeur Service Supported'],
    includedItems: ['Blush Pink Peony & Rose Crescent', 'Pastel Organza Ribbon Drapes', '4x Door Ribbon Bows', 'Rear Deck Floral Accent', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Colachel & All Kanniyakumari Hubs',
  },
  {
    id: 4,
    name: 'Toyota Fortuner',
    slug: 'toyota-fortuner-wedding-white',
    theme: 'SUV',
    category: 'Premium SUV',
    badge: 'Super White · Heritage Favorite',
    subtitle: 'Traditional Golden Marigold & Madurai Jasmine Festoon',
    starting_price: 10500,
    startingPrice: 10500,
    description: 'Commanding super white Toyota Fortuner decorated in authentic South Indian heritage style with thick strings of golden temple marigolds, orange flowers, and fragrant Madurai jasmine draped across the hood and grille.',
    image: '/decorations/decor-4.jpg',
    included_items: ['Golden Temple Marigold Hood Garland', 'Bumper & Grille Fresh Flower Swags', 'Madurai Jasmine Strings', '4x Traditional Door Bows', 'Optional Chauffeur Service Supported'],
    includedItems: ['Golden Temple Marigold Hood Garland', 'Bumper & Grille Fresh Flower Swags', 'Madurai Jasmine Strings', '4x Traditional Door Bows', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['SUV', 'Luxury'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Thuckalay & All Kanniyakumari Hubs',
  },
  {
    id: 5,
    name: 'Toyota Innova Crysta',
    slug: 'toyota-innova-crysta-wedding',
    theme: 'MPV',
    category: 'Premium MUV',
    badge: 'Pearl White · Family Choice',
    subtitle: 'Muhurtham Red & White Rose Symphony',
    starting_price: 7800,
    startingPrice: 7800,
    description: 'Spacious pearl white Toyota Innova Crysta styled for bridal entourage and muhurtham travel. Features a central bouquet of red Dutch roses and white lilies bordered with fine white tulle net flowing towards the windshield.',
    image: '/decorations/decor-5.jpg',
    included_items: ['Dual-Tone Red & White Hood Bouquet', 'White Tulle Net Streamers', '4x Door Handle Flower Corsages', 'Roofline Accent Ribbons', 'Optional Chauffeur Service Supported'],
    includedItems: ['Dual-Tone Red & White Hood Bouquet', 'White Tulle Net Streamers', '4x Door Handle Flower Corsages', 'Roofline Accent Ribbons', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['MUV / MPV', 'SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Marthandam & All Kanniyakumari Hubs',
  },
  {
    id: 6,
    name: 'Mercedes-Benz S-Class',
    slug: 'mercedes-benz-s-class-vip',
    theme: 'Luxury',
    category: 'Ultra Luxury',
    badge: 'Obsidian Black · Presidential VIP',
    subtitle: 'Presidential Sovereign Orchid & White Rose Garland',
    starting_price: 18500,
    startingPrice: 18500,
    description: 'The pinnacle of automotive wedding luxury. Flagship obsidian black Mercedes-Benz S-Class featuring a 360-degree floral treatment with imported white Phalaenopsis orchids, calla lilies, and emerald Italian ruscus.',
    image: '/decorations/decor-6.jpg',
    included_items: ['Presidential Orchid & Lily Hood Crest', 'Full Roofline Garland', 'Windshield Pillar Floral Pillars', '4x Sovereign Door Corsages', 'Rear Deck Grand Swag', 'VIP Chauffeur Service Supported'],
    includedItems: ['Presidential Orchid & Lily Hood Crest', 'Full Roofline Garland', 'Windshield Pillar Floral Pillars', '4x Sovereign Door Corsages', 'Rear Deck Grand Swag', 'VIP Chauffeur Service Supported'],
    compatibleCategories: ['Luxury'],
    duration: 'Full Event / Day',
    serviceAreas: 'All Kanniyakumari District & Kerala Border Venues',
  },
  {
    id: 7,
    name: 'Range Rover Velar',
    slug: 'range-rover-velar-wedding-white',
    theme: 'Luxury',
    category: 'Luxury SUV',
    badge: 'Fuji White · Elite SUV',
    subtitle: 'Pure White Casablanca Lily & Silver Streamer Canopy',
    starting_price: 17200,
    startingPrice: 17200,
    description: 'Striking Fuji white Range Rover Velar luxury SUV featuring an elegant hood arrangement of pure white Casablanca lilies, avalanche roses, and platinum satin streamers. Provides unforgettable visual impact.',
    image: '/decorations/decor-7.jpg',
    included_items: ['Pure White Casablanca Lily Arch', 'Platinum Satin Streamers', '4x Door Mirror & Handle Accents', 'Trunk Deck Floral Spray', 'Optional Chauffeur Service Supported'],
    includedItems: ['Pure White Casablanca Lily Arch', 'Platinum Satin Streamers', '4x Door Mirror & Handle Accents', 'Trunk Deck Floral Spray', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Colachel & All Kanniyakumari Hubs',
  },
  {
    id: 8,
    name: 'Audi Q7',
    slug: 'audi-q7-wedding-white',
    theme: 'Luxury',
    category: 'Luxury SUV',
    badge: 'Glacier White · Grand Entrance',
    subtitle: 'Exotic Purple Orchid & Calla Lily Crown',
    starting_price: 16500,
    startingPrice: 16500,
    description: 'Imposing glacier white Audi Q7 decorated with vibrant purple and white Dendrobium orchids, white calla lilies, and lustrous silver satin ribbons. A showstopping choice for modern evening wedding receptions.',
    image: '/decorations/decor-8.jpg',
    included_items: ['Dendrobium Orchid & Calla Lily Hood Swag', 'Silver Satin Ribbons', '4x Door Handle Floral Bows', 'Full Grille Floral Garland', 'Optional Chauffeur Service Supported'],
    includedItems: ['Dendrobium Orchid & Calla Lily Hood Swag', 'Silver Satin Ribbons', '4x Door Handle Floral Bows', 'Full Grille Floral Garland', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Marthandam & All Kanniyakumari Hubs',
  },
  {
    id: 9,
    name: 'Toyota Camry Hybrid',
    slug: 'toyota-camry-hybrid-wedding',
    theme: 'Sedan',
    category: 'Executive Sedan',
    badge: 'Silver Metallic · Quiet Luxury',
    subtitle: 'Champagne Silk & Cream Garden Rose Arch',
    starting_price: 9800,
    startingPrice: 9800,
    description: "Understated metallic silver Toyota Camry Hybrid adorned with cream garden roses, delicate baby's breath, and champagne silk ribbons. Whispering elegance for groom or bride arrival.",
    image: '/decorations/decor-9.jpg',
    included_items: ['Cream Rose & Gypsophila Hood Crescent', 'Champagne Silk Ribbon Streamers', '4x Door Handle Flower Corsages', 'Mirror Ribbon Accents', 'Optional Chauffeur Service Supported'],
    includedItems: ['Cream Rose & Gypsophila Hood Crescent', 'Champagne Silk Ribbon Streamers', '4x Door Handle Flower Corsages', 'Mirror Ribbon Accents', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Sedan', 'Luxury'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Kuzhithurai & All Kanniyakumari Hubs',
  },
  {
    id: 10,
    name: 'Jaguar XF',
    slug: 'jaguar-xf-wedding-burgundy',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Rosso Burgundy · Royal Edition',
    subtitle: 'Royal Scarlet Emperor Dutch Rose Crest',
    starting_price: 14000,
    startingPrice: 14000,
    description: 'Dramatic dark burgundy Jaguar XF styled for a royal wedding entrance. Displays a majestic crown arrangement of 100+ scarlet Dutch roses, gold netting streamers, and royal gold door ties.',
    image: '/decorations/decor-10.jpg',
    included_items: ['100+ Scarlet Dutch Roses Hood Bouquet', 'Gold Netting Streamers', '4x Royal Gold Door Ties', 'Rear Deck Rose Wreath', 'Optional Chauffeur Service Supported'],
    includedItems: ['100+ Scarlet Dutch Roses Hood Bouquet', 'Gold Netting Streamers', '4x Royal Gold Door Ties', 'Rear Deck Rose Wreath', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Padmanabhapuram & All Kanniyakumari Hubs',
  },
  {
    id: 11,
    name: 'BMW X5',
    slug: 'bmw-x5-wedding-white',
    theme: 'Luxury',
    category: 'Luxury SUV',
    badge: 'Mineral White · Romantic Grandeur',
    subtitle: 'Grand Heart-Shaped Crimson Rose Wreath',
    starting_price: 15500,
    startingPrice: 15500,
    description: "Prestige mineral white BMW X5 luxury SUV crowned with an iconic heart-shaped front bonnet wreath of red roses bordered by white baby's breath and cascading white silk ribbons.",
    image: '/decorations/decor-11.jpg',
    included_items: ['Grand Heart-Shaped Rose & Gypsophila Wreath', 'Cascading Silk Ribbons', '4x Door Handle Ribbon Bows', 'Rear Window Floral Corner', 'Optional Chauffeur Service Supported'],
    includedItems: ['Grand Heart-Shaped Rose & Gypsophila Wreath', 'Cascading Silk Ribbons', '4x Door Handle Ribbon Bows', 'Rear Window Floral Corner', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Karungal & All Kanniyakumari Hubs',
  },
  {
    id: 12,
    name: 'Mercedes-Benz C-Class',
    slug: 'mercedes-benz-c-class-white',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Polar White · Bridal Delight',
    subtitle: 'Pastel Pink Rose & Hydrangea Arch',
    starting_price: 11500,
    startingPrice: 11500,
    description: "Charming polar white Mercedes-Benz C-Class adorned with pastel pink garden roses, white Dutch hydrangeas, and ivory organza ribbons. Ideal for the bride's grand wedding arrival.",
    image: '/decorations/decor-12.jpg',
    included_items: ['Pastel Pink Rose & Hydrangea Hood Arc', 'Ivory Organza Ribbons', '4x Door Handle Floral Bows', 'Side Mirror Silk Corsages', 'Optional Chauffeur Service Supported'],
    includedItems: ['Pastel Pink Rose & Hydrangea Hood Arc', 'Ivory Organza Ribbons', '4x Door Handle Floral Bows', 'Side Mirror Silk Corsages', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Colachel & All Kanniyakumari Hubs',
  },
  {
    id: 13,
    name: 'Mahindra XUV700',
    slug: 'mahindra-xuv700-wedding-white',
    theme: 'SUV',
    category: 'Premium SUV',
    badge: 'Everest White · Festive Grandeur',
    subtitle: 'Auspicious Tuberose & Golden Marigold Festoon',
    starting_price: 8200,
    startingPrice: 8200,
    description: 'Modern Everest white Mahindra XUV700 styled in radiant South Indian festive decor featuring fresh fragrant white tuberose (rajnigandha) and golden marigold swags across the bonnet and grille.',
    image: '/decorations/decor-13.jpg',
    included_items: ['Tuberose & Marigold Hood Festoon', 'Grille Traditional Garland', '4x Door Handle Floral Ties', 'Fresh Jasmine Fragrance Mist', 'Optional Chauffeur Service Supported'],
    includedItems: ['Tuberose & Marigold Hood Festoon', 'Grille Traditional Garland', '4x Door Handle Floral Ties', 'Fresh Jasmine Fragrance Mist', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['SUV', 'MUV / MPV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Kulasekharam & All Kanniyakumari Hubs',
  },
  {
    id: 14,
    name: 'Mahindra Scorpio-N',
    slug: 'mahindra-scorpio-n-wedding',
    theme: 'SUV',
    category: 'Premium SUV',
    badge: 'Stealth Black · Bold & Royal',
    subtitle: 'Crimson Rose Cluster & Ruby Satin Cascade',
    starting_price: 7500,
    startingPrice: 7500,
    description: 'Commanding dark Mahindra Scorpio-N adorned with deep red roses, eucalyptus greenery, and ruby red satin ribbons across the bold hood. A striking blend of power and festive elegance.',
    image: '/decorations/decor-14.jpg',
    included_items: ['Bonnet Crimson Rose Cluster', 'Ruby Red Satin Ribbons', '4x Door Handle Rose Corsages', 'Bumper Accent Garland', 'Optional Chauffeur Service Supported'],
    includedItems: ['Bonnet Crimson Rose Cluster', 'Ruby Red Satin Ribbons', '4x Door Handle Rose Corsages', 'Bumper Accent Garland', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Thuckalay & All Kanniyakumari Hubs',
  },
  {
    id: 15,
    name: 'Honda City',
    slug: 'honda-city-wedding-white',
    theme: 'Sedan',
    category: 'Premium Sedan',
    badge: 'Platinum White · Heritage Classic',
    subtitle: 'Heritage Marigold & Sevvanthi Garland',
    starting_price: 5500,
    startingPrice: 5500,
    description: 'Graceful platinum white Honda City decorated with dense temple marigolds, yellow sevvanthi, and sacred mango leaf tassels along the hood and radiator grille.',
    image: '/decorations/decor-15.jpg',
    included_items: ['Full Hood Marigold Festoon', 'Grille & Bumper Garland', '4x Door Traditional Garlands', 'Soft-Cushion Scratch-Safe Mounts', 'Optional Chauffeur Service Supported'],
    includedItems: ['Full Hood Marigold Festoon', 'Grille & Bumper Garland', '4x Door Traditional Garlands', 'Soft-Cushion Scratch-Safe Mounts', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Kuzhithurai & All Kanniyakumari Hubs',
  },
  {
    id: 16,
    name: 'Hyundai Verna',
    slug: 'hyundai-verna-wedding-silver',
    theme: 'Sedan',
    category: 'Executive Sedan',
    badge: 'Starry Night Silver · Modern Romance',
    subtitle: 'Lilac & Peach Dream Cascade with Satin Drapes',
    starting_price: 6000,
    startingPrice: 6000,
    description: 'Sleek Hyundai Verna featuring pastel peach roses, lilac carnations, and flowing lilac satin ribbons draped diagonally across the front bonnet.',
    image: '/decorations/decor-16.jpg',
    included_items: ['Diagonal Peach & Lilac Flower Swag', 'Flowing Satin Ribbons', '4x Door Handle Bows', 'Mirror Floral Corsages', 'Optional Chauffeur Service Supported'],
    includedItems: ['Diagonal Peach & Lilac Flower Swag', 'Flowing Satin Ribbons', '4x Door Handle Bows', 'Mirror Floral Corsages', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Colachel & All Kanniyakumari Hubs',
  },
  {
    id: 17,
    name: 'Toyota Etios',
    slug: 'toyota-etios-wedding-white',
    theme: 'Sedan',
    category: 'Economy Wedding Sedan',
    badge: 'Classic White · Budget Heritage',
    subtitle: 'Fragrant Madurai Jasmine & Rose Garland',
    starting_price: 4500,
    startingPrice: 4500,
    description: 'Authentic traditional wedding sedan adorned with strings of fresh Madurai Malli (jasmine), interspersed with fragrant red rose buds and auspicious leaves.',
    image: '/decorations/decor-17.jpg',
    included_items: ['Dense Jasmine String Swag', 'Red Rose Bud Accents', '4x Door Handle Jasmine Garlands', 'Vehicle Paint Protection Shield', 'Optional Chauffeur Service Supported'],
    includedItems: ['Dense Jasmine String Swag', 'Red Rose Bud Accents', '4x Door Handle Jasmine Garlands', 'Vehicle Paint Protection Shield', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Marthandam & All Kanniyakumari Hubs',
  },
  {
    id: 18,
    name: 'Mercedes-Benz E-Class VIP',
    slug: 'mercedes-benz-e-class-vip-symphony',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Polar Silver · VIP Luxury',
    subtitle: 'Imperial Orchid & Crimson Rose Symphony',
    starting_price: 14200,
    startingPrice: 14200,
    description: 'Exquisite silver Mercedes-Benz E-Class with a full bonnet symphonic arrangement of white orchids, crimson roses, and silver-threaded ribbons for the bride and groom.',
    image: '/decorations/decor-18.jpg',
    included_items: ['Full Hood Orchid & Rose Symphony', 'Silver Threaded Ribbons', '4x Door Handle Flower Corsages', 'Windshield Pillar Floral Swags', 'Optional Chauffeur Service Supported'],
    includedItems: ['Full Hood Orchid & Rose Symphony', 'Silver Threaded Ribbons', '4x Door Handle Flower Corsages', 'Windshield Pillar Floral Swags', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari & All Kanniyakumari Hubs',
  },
  {
    id: 19,
    name: 'Audi A4',
    slug: 'audi-a4-wedding-white',
    theme: 'Luxury',
    category: 'Luxury Sedan',
    badge: 'Ibis White · Fairytale Bridal',
    subtitle: 'Princess Blush Rose & Peony Arch',
    starting_price: 11800,
    startingPrice: 11800,
    description: 'Graceful white Audi A4 decorated with blush pink garden roses, white gypsophila, and soft tulle ribbons ideal for the bridal reception.',
    image: '/decorations/decor-19.jpg',
    included_items: ['Blush Rose & Gypsophila Arch', 'Soft Tulle Ribbons', '4x Door Handle Floral Bows', 'Trunk Accent Flower Cluster', 'Optional Chauffeur Service Supported'],
    includedItems: ['Blush Rose & Gypsophila Arch', 'Soft Tulle Ribbons', '4x Door Handle Floral Bows', 'Trunk Accent Flower Cluster', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari, Padmanabhapuram & All Kanniyakumari Hubs',
  },
  {
    id: 20,
    name: 'Skoda Superb',
    slug: 'skoda-superb-wedding-white',
    theme: 'Sedan',
    category: 'Executive Luxury',
    badge: 'Candy White · Executive Choice',
    subtitle: 'Pearl White Orchid & Lily Majesty',
    starting_price: 8900,
    startingPrice: 8900,
    description: 'Stately candy white Skoda Superb styled with an arched arrangement of exotic white orchids, calla lilies, and silver satin streamers.',
    image: '/decorations/decor-20.jpg',
    included_items: ['White Orchid & Lily Arched Crest', 'Silver Satin Streamers', '4x Door Handle Floral Bows', 'Mirror Ribbons', 'Optional Chauffeur Service Supported'],
    includedItems: ['White Orchid & Lily Arched Crest', 'Silver Satin Streamers', '4x Door Handle Floral Bows', 'Mirror Ribbons', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari & All Kanniyakumari Hubs',
  },
  {
    id: 21,
    name: 'Kia Seltos',
    slug: 'kia-seltos-wedding-grey',
    theme: 'SUV',
    category: 'Compact SUV',
    badge: 'Gravity Grey · Popular Muhurtham',
    subtitle: 'Red Rose & White Chrysanthemum Muhurtham Arc',
    starting_price: 6800,
    startingPrice: 6800,
    description: 'Sharp gravity grey Kia Seltos styled with vibrant red Dutch roses and snow-white chrysanthemums with flowing satin streamers along the hood.',
    image: '/decorations/decor-21.jpg',
    included_items: ['Red Rose & Chrysanthemum Arc', 'Dual Satin Ribbon Streamers', '4x Door Handle Flower Bows', 'Rear Windshield Floral Corner', 'Optional Chauffeur Service Supported'],
    includedItems: ['Red Rose & Chrysanthemum Arc', 'Dual Satin Ribbon Streamers', '4x Door Handle Flower Bows', 'Rear Windshield Floral Corner', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari & All Kanniyakumari Hubs',
  },
  {
    id: 22,
    name: 'BMW 3 Series',
    slug: 'bmw-3-series-wedding-white',
    theme: 'Luxury',
    category: 'Sports Luxury Sedan',
    badge: 'Alpine White · Signature Sport',
    subtitle: 'Royal Crimson Emperor Bonnet Crest',
    starting_price: 12500,
    startingPrice: 12500,
    description: 'Sporty alpine white BMW 3 Series decorated with a bold emperor crest of crimson roses, gold mesh ribbons, and aerodynamic mirror ribbons.',
    image: '/decorations/decor-22.jpg',
    included_items: ['Emperor Crest of Crimson Dutch Roses', 'Gold Mesh Satin Ribbons', '4x Door Handle Rose Corsages', 'Side Mirror Ribbons', 'Optional Chauffeur Service Supported'],
    includedItems: ['Emperor Crest of Crimson Dutch Roses', 'Gold Mesh Satin Ribbons', '4x Door Handle Rose Corsages', 'Side Mirror Ribbons', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'Sedan'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari & All Kanniyakumari Hubs',
  },
  {
    id: 23,
    name: 'Mercedes-Benz GLA',
    slug: 'mercedes-benz-gla-wedding-black',
    theme: 'Luxury',
    category: 'Luxury Compact SUV',
    badge: 'Cosmos Black · Modern Luxury',
    subtitle: 'Midnight Velvet Rose & Gold Swag',
    starting_price: 11200,
    startingPrice: 11200,
    description: 'Glossy cosmos black Mercedes-Benz compact SUV adorned with velvet crimson roses, eucalyptus foliage, and gold ribbons for an exclusive celebration.',
    image: '/decorations/decor-23.jpg',
    included_items: ['Velvet Crimson Rose Bonnet Cluster', 'Gold Ribbon Swags', '4x Door Handle Floral Ties', 'Mirror Floral Bows', 'Optional Chauffeur Service Supported'],
    includedItems: ['Velvet Crimson Rose Bonnet Cluster', 'Gold Ribbon Swags', '4x Door Handle Floral Ties', 'Mirror Floral Bows', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['Luxury', 'SUV'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari & All Kanniyakumari Hubs',
  },
  {
    id: 24,
    name: 'Toyota Innova Hycross',
    slug: 'toyota-innova-hycross-wedding',
    theme: 'MPV',
    category: 'Executive MPV',
    badge: 'Attitude Black · VIP Family Lounge',
    subtitle: 'Sovereign Gold Marigold & Jasmine Garland',
    starting_price: 9500,
    startingPrice: 9500,
    description: 'Executive attitude black Toyota Innova Hycross MPV adorned with lush golden marigolds, fragrant white tuberose, and festive satin ribbons.',
    image: '/decorations/decor-24.jpg',
    included_items: ['Golden Marigold & Tuberose Bonnet Swag', 'Grille Traditional Garlands', '4x Door Handle Garlands', 'Car Paint Protection Layer', 'Optional Chauffeur Service Supported'],
    includedItems: ['Golden Marigold & Tuberose Bonnet Swag', 'Grille Traditional Garlands', '4x Door Handle Garlands', 'Car Paint Protection Layer', 'Optional Chauffeur Service Supported'],
    compatibleCategories: ['MUV / MPV', 'Luxury'],
    duration: 'Full Event / Day',
    serviceAreas: 'Nagercoil, Kanyakumari & All Kanniyakumari Hubs',
  },
];

export default function WeddingDecorations() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { cars } = useCars();

  const [packages, setPackages] = useState(FALLBACK_CARS);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [activePackage, setActivePackage] = useState(null);
  const [driveMode, setDriveMode] = useState('with_driver'); // 'with_driver' | 'decor_only'
  const [selectedCarId, setSelectedCarId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [completionTime, setCompletionTime] = useState('06:30 AM');
  const [serviceCity, setServiceCity] = useState('Nagercoil');
  const [venueLocation, setVenueLocation] = useState('');
  const [selectedAddons, setSelectedAddons] = useState(['ribbons_bows', 'handle_mirrors_decor']);
  const [specialNotes, setSpecialNotes] = useState('');
  const [flowerColors, setFlowerColors] = useState('');

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Real-time Pricing State
  const [livePricing, setLivePricing] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Tomorrow's date string YYYY-MM-DD
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch all 24 decoration packages from backend MySQL
  useEffect(() => {
    getDecorationPackages()
      .then((res) => {
        if (Array.isArray(res.packages) && res.packages.length > 0) {
          setPackages(res.packages);
        }
      })
      .catch((err) => {
        console.warn('Using fallback decorated cars catalog:', err.message);
      });
  }, []);

  // Prefill user contact details
  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName || '');
      setCustomerPhone(user.phone || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Filter Categories
  const filterOptions = [
    { label: 'All Wedding Cars', value: 'All' },
    { label: 'Luxury Sedans', value: 'Luxury' },
    { label: 'Premium SUVs', value: 'SUV' },
    { label: 'Family MPVs', value: 'MPV' },
    { label: 'Executive Sedans', value: 'Sedan' },
  ];

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const matchFilter =
        selectedFilter === 'All' ||
        (p.theme && p.theme.toLowerCase() === selectedFilter.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(selectedFilter.toLowerCase()));

      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchFilter && matchQ;
    });
  }, [packages, selectedFilter, searchQuery]);

  // Calculate authoritative pricing whenever modal inputs change
  useEffect(() => {
    if (!activePackage) {
      setLivePricing(null);
      return;
    }

    setCalculatingPrice(true);
    const payload = {
      packageId: activePackage.id,
      carId: driveMode === 'with_driver' && selectedCarId ? Number(selectedCarId) : null,
      driveMode,
      serviceCity,
      venueLocation,
      additionalAddons: selectedAddons,
    };

    calculateDecorationPrice(payload)
      .then((res) => {
        if (res.ok && res.pricing) {
          setLivePricing(res.pricing);
        }
      })
      .catch(() => {
        // Fallback estimate
      })
      .finally(() => {
        setCalculatingPrice(false);
      });
  }, [activePackage, driveMode, selectedCarId, serviceCity, venueLocation, selectedAddons]);

  const handleOpenBooking = (pkg) => {
    setActivePackage(pkg);
    setDriveMode('with_driver'); // Fleet + Chauffeur default for wedding cars

    // Pre-select matching vehicle from cars fleet if available
    if (cars && cars.length > 0) {
      const pkgNameLower = (pkg.name || '').toLowerCase();
      const match = cars.find((c) => {
        const fullModel = `${c.brand} ${c.model}`.toLowerCase();
        return fullModel.includes(pkgNameLower) || pkgNameLower.includes(c.model.toLowerCase());
      });
      if (match) {
        setSelectedCarId(String(match.id));
      } else {
        setSelectedCarId(String(cars[0].id));
      }
    }
  };

  const handleToggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter the customer / couple name');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Please enter a contact phone number');
      return;
    }
    if (!customerEmail.trim()) {
      toast.error('Please enter an email address for confirmation receipt');
      return;
    }
    if (!eventDate) {
      toast.error('Please choose the wedding / event date');
      return;
    }
    if (!venueLocation.trim()) {
      toast.error('Please enter the marriage hall or venue address');
      return;
    }

    // Login guard
    if (!isAuthenticated) {
      toast('Please sign in or register to complete your wedding booking.', { icon: '🔐' });
      const currentPath = '/wedding-cars';
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, {
        state: { from: currentPath },
      });
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        packageId: activePackage.id,
        carId: driveMode === 'with_driver' && selectedCarId ? Number(selectedCarId) : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        eventType: 'Wedding',
        eventDate: eventDate,
        completionTime: completionTime,
        venueLocation: venueLocation.trim(),
        pickupLocation: `${serviceCity} Hub`,
        destination: venueLocation.trim(),
        serviceCity: serviceCity,
        driveMode: driveMode,
        additionalAddons: selectedAddons,
        flowerColors: flowerColors.trim(),
        specialNotes: specialNotes.trim(),
      };

      const res = await createDecorationBooking(payload);
      if (res.booking) {
        toast.success(`Wedding Car Booked Successfully! Token: ${res.booking.ref}`, { duration: 6000 });
        setActivePackage(null);
        navigate('/my-bookings');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit wedding reservation');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#0F172A] py-10 sm:py-14">
      <div className="container-x">
        {/* 1. Header & Tagline */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-rose-50 border border-rose-200/80 px-3.5 py-1 text-[11px] font-bold text-rose-800 tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
              <Sparkles size={13} className="text-rose-600" />
              Kanniyakumari District Official Wedding Fleet
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Decorated Wedding Cars
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Reserve premium cars decorated with authentic fresh flowers, bonnet crests, garlands, and satin ribbons for weddings and special functions. Serving Nagercoil, Kanyakumari, Marthandam, Thuckalay, and all Kanniyakumari hubs with optional certified chauffeurs.
          </p>
        </div>

        {/* 2. Four Feature Assurance Badges */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">100% Real Decorated Cars</h4>
              <p className="text-[11px] text-slate-500">Full vehicle photo catalog</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1E3A8A] shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">Scratch-Safe Mounts</h4>
              <p className="text-[11px] text-slate-500">Paint protection guarantee</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">Muhurtham On-Time</h4>
              <p className="text-[11px] text-slate-500">Arrives 2 hrs before event</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <Car size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-[#0A142F]">Fleet + Chauffeur</h4>
              <p className="text-[11px] text-slate-500">Rent our car or decorate yours</p>
            </div>
          </div>
        </div>

        {/* 3. Filter Bar & Search */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedFilter(opt.value)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  selectedFilter === opt.value
                    ? 'bg-[#0A142F] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search car model or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
            />
          </div>
        </div>

        {/* 4. Decorated Vehicle Cards Grid (At least 20 options) */}
        {filteredPackages.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white mt-8">
            <Car size={36} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-display font-bold text-base text-[#0A142F]">No Wedding Cars Found</h3>
            <p className="mt-1 text-xs text-slate-500">Try selecting another filter category or clear search filter.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="group rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* High Quality Photo of Complete Decorated Car */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={pkg.image || `/decorations/decor-${pkg.id || 1}.jpg`}
                      alt={`${pkg.name} Decorated Wedding Car`}
                      onError={(e) => {
                        e.currentTarget.src = '/decorations/decor-1.jpg';
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Top Badge: Car Model Category / Color */}
                    {pkg.badge && (
                      <span className="absolute top-3 left-3 rounded-full bg-[#0A142F]/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-md border border-white/10 flex items-center gap-1.5">
                        <Car size={12} className="text-rose-400" />
                        {pkg.badge}
                      </span>
                    )}
                    {/* Starting Price Pill */}
                    <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-slate-100 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-none">Starting From</span>
                      <span className="text-sm sm:text-base font-black text-[#0A142F] tracking-tight">
                        {formatINR(pkg.startingPrice || pkg.starting_price)}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Card Body */}
                  <div className="p-5">
                    {/* 1. Actual Car Model Name */}
                    <h3 className="font-display font-black text-lg sm:text-xl text-[#0A142F] group-hover:text-blue-900 transition leading-snug">
                      {pkg.name}
                    </h3>

                    {/* 2. Short Description of Decoration Style */}
                    <p className="mt-1 text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <Sparkles size={13} className="shrink-0 text-rose-600" />
                      <span className="line-clamp-1">{pkg.subtitle}</span>
                    </p>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>

                    {/* 3. Included Decorations (Garlands, bonnet flowers, door ribbons, roof decor) */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                        Included Floral Decorations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          🌸 Bonnet Flowers
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          🌿 Flower Garlands
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          🎀 Door Ribbons
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          🚗 Roof &amp; Mirrors
                        </span>
                      </div>
                    </div>

                    {/* 4. Optional Chauffeur Service Supported */}
                    <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>Optional Chauffeur Service Supported</span>
                    </div>
                  </div>
                </div>

                {/* 5. Clear "Book This Car" Button */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(pkg)}
                    className="w-full rounded-2xl bg-[#0A142F] hover:bg-[#1E3A8A] text-white py-3 px-4 text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Book This Car</span>
                    <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Interactive Booking Modal Flow */}
      {activePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Kanniyakumari Wedding Car Reservation
                </span>
                <h3 className="font-display font-black text-lg sm:text-xl text-[#0A142F]">
                  Book {activePackage.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{activePackage.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePackage(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-black transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitBooking} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Option: Service Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Choose Service Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDriveMode('with_driver')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      driveMode === 'with_driver'
                        ? 'border-[#0A142F] bg-blue-50/30 ring-2 ring-[#0A142F]/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0A142F]">Fleet Car + Chauffeur</h4>
                      <CheckCircle2 size={16} className={driveMode === 'with_driver' ? 'text-[#0A142F]' : 'text-slate-300'} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Rent a luxury Drivo vehicle decorated and driven by a certified wedding chauffeur.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDriveMode('decor_only')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      driveMode === 'decor_only'
                        ? 'border-[#0A142F] bg-blue-50/30 ring-2 ring-[#0A142F]/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0A142F]">Decorate My Own Car</h4>
                      <CheckCircle2 size={16} className={driveMode === 'decor_only' ? 'text-[#0A142F]' : 'text-slate-300'} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Our floral artist decorates your personal car at the marriage venue or our hub.
                    </p>
                  </button>
                </div>
              </div>

              {/* If Fleet Car selected: Select vehicle */}
              {driveMode === 'with_driver' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <label htmlFor="wedding-car-select" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assigned Fleet Vehicle (Pre-selected)
                  </label>
                  <select
                    id="wedding-car-select"
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} ({c.category}) &bull; {formatINR(c.pricePerDay)}/day
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event Date, Time & City in Kanniyakumari */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Muhurtham &amp; Venue Details (Kanniyakumari District)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Event Date *</label>
                    <input
                      type="date"
                      min={minDate}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Completion Time *</label>
                    <select
                      value={completionTime}
                      onChange={(e) => setCompletionTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    >
                      <option value="05:30 AM">05:30 AM (Early Muhurtham)</option>
                      <option value="06:30 AM">06:30 AM (Morning Muhurtham)</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="11:00 AM">11:00 AM (Noon Function)</option>
                      <option value="04:30 PM">04:30 PM (Evening Reception)</option>
                      <option value="06:30 PM">06:30 PM (Night Reception)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pickup Hub / City *</label>
                    <select
                      value={serviceCity}
                      onChange={(e) => setServiceCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc} Hub
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Marriage Hall / Venue Name &amp; Full Address *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Krishna Kalyana Mandapam, WCC Road, Nagercoil"
                    value={venueLocation}
                    onChange={(e) => setVenueLocation(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
                  />
                </div>
              </div>

              {/* Decoration Style & Flower Color Customization */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Decoration Style &amp; Flower Color Preferences
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Flower Color Theme</label>
                    <input
                      type="text"
                      placeholder="e.g. Crimson Red Dutch Roses, Pearl White Lilies, Golden Marigold"
                      value={flowerColors}
                      onChange={(e) => setFlowerColors(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Notes / Requests</label>
                    <input
                      type="text"
                      placeholder="e.g. Match ribbons to bridal attire, early morning arrival"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Addons */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  4. Select Add-on Embellishments
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ADDON_OPTIONS.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <button
                        type="button"
                        key={addon.id}
                        onClick={() => handleToggleAddon(addon.id)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                          isChecked
                            ? 'border-blue-300 bg-blue-50/40 text-blue-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-medium">{addon.name}</span>
                        <span className="text-xs font-bold shrink-0 ml-2">+{formatINR(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  5. Contact &amp; Couple Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Couple / Contact Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Saravanan & Priya"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="saravanan@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0A142F]"
                    />
                  </div>
                </div>
              </div>

              {/* Authoritative Live Price Breakdown */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
                <div className="flex items-center justify-between border-b border-blue-100/80 pb-2 mb-2">
                  <span className="text-xs font-bold text-[#0A142F]">Authoritative Tariff Breakdown</span>
                  {calculatingPrice && <Loader2 size={14} className="animate-spin text-blue-600" />}
                </div>

                {livePricing ? (
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Vehicle &amp; Floral Package ({activePackage.name}):</span>
                      <span className="font-semibold">{formatINR(livePricing.decorPackagePrice)}</span>
                    </div>
                    {livePricing.carRentalCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Vehicle Fleet Rental:</span>
                        <span className="font-semibold">{formatINR(livePricing.carRentalCharge)}</span>
                      </div>
                    )}
                    {livePricing.driverBaseCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Chauffeur Service ({livePricing.durationHours || 8}h):</span>
                        <span className="font-semibold">{formatINR(livePricing.driverBaseCharge)}</span>
                      </div>
                    )}
                    {livePricing.addonsTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Selected Embellishments:</span>
                        <span className="font-semibold">{formatINR(livePricing.addonsTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Applicable GST (18%):</span>
                      <span className="font-semibold">{formatINR(livePricing.gst)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 text-sm font-black text-[#0A142F]">
                      <span>Estimated Total:</span>
                      <span className="text-base text-blue-900">{formatINR(livePricing.total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    From {formatINR(activePackage.startingPrice || activePackage.starting_price)} + taxes
                  </div>
                )}
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="w-full rounded-2xl bg-[#0A142F] hover:bg-[#1E293B] text-white py-3.5 px-6 font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingBooking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Wedding Car Booking &rarr;</span>
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Instant booking confirmation with reference token generated in your account.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
