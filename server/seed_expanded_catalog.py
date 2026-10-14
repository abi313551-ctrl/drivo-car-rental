import os
import sys
import json
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models import Car

# Verified Unsplash photo IDs for car categories
HATCHBACK_IMAGES = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1541447271487-09612b3f49f7?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=75',
]

SEDAN_IMAGES = [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=75',
]

SUV_IMAGES = [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1566473965997-3de9c817e938?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=800&q=75',
]

MUV_IMAGES = [
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?auto=format&fit=crop&w=800&q=75',
]

LUXURY_IMAGES = [
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=800&q=75',
]

ELECTRIC_IMAGES = [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=75',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=75',
]

LOCATIONS = ['Coimbatore', 'Chennai', 'Bengaluru', 'Kochi', 'Hyderabad', 'Mumbai', 'Delhi', 'Nagercoil']

BASE_FEATS = ['Air conditioning', 'Power windows', 'Dual front airbags', 'ABS with EBD', 'Reverse parking sensors']

# Target Catalog Definition: 15-16 distinct vehicles per category
CATALOG = {
    'Hatchback': [
        ('Maruti Suzuki', 'Swift VXi', 2024, 'Petrol', 'Manual', 5, 1500, 4.6, 95, 3000, 'Sporty compact hatchback with best-in-class mileage for effortless city hops.'),
        ('Tata', 'Altroz iTurbo', 2024, 'Petrol', 'Manual', 5, 1700, 4.5, 82, 3500, '5-star Global NCAP rated premium hatchback with solid build and agile handling.'),
        ('Hyundai', 'i20 Asta', 2024, 'Petrol', 'Automatic', 5, 1900, 4.7, 88, 3500, 'Feature-rich stylish hatchback with sunroof and fluid IVT automatic transmission.'),
        ('Maruti Suzuki', 'Baleno Alpha', 2024, 'Petrol', 'Automatic', 5, 1800, 4.6, 90, 3000, 'Spacious cabin, head-up display, and ultra-smooth AMT city cruising.'),
        ('Tata', 'Tiago XZ Plus', 2023, 'Petrol', 'Manual', 5, 1400, 4.4, 76, 2500, 'Nimble city hatchback with Harman sound system and reassuring safety rating.'),
        ('Maruti Suzuki', 'Wagon R ZXi 1.2', 2024, 'Petrol', 'Manual', 5, 1450, 4.5, 85, 2500, 'Tall-boy design offering enormous headroom and easy elderly accessibility.'),
        ('Hyundai', 'Grand i10 Nios Asta', 2024, 'Petrol', 'Automatic', 5, 1650, 4.5, 80, 3000, 'Quiet refined engine, wireless charger, and effortless urban parking.'),
        ('Maruti Suzuki', 'Celerio ZXi Plus', 2023, 'Petrol', 'Manual', 5, 1350, 4.3, 72, 2500, 'Segment leader in fuel economy, lightweight and dependable city runabout.'),
        ('Maruti Suzuki', 'Ignis Alpha', 2024, 'Petrol', 'Manual', 5, 1550, 4.4, 74, 3000, 'Urban SUV stance with high ground clearance and vibrant retro cabin.'),
        ('Toyota', 'Glanza V', 2024, 'Petrol', 'Automatic', 5, 1850, 4.6, 83, 3500, 'Toyota reliability backed with 360-degree camera and plush rear bench.'),
        ('Citroen', 'C3 Shine Turbo', 2024, 'Petrol', 'Manual', 5, 1600, 4.4, 70, 3000, 'Flying carpet suspension tuning that swallows Indian road potholes.'),
        ('Renault', 'Kwid Climber', 2023, 'Petrol', 'Manual', 5, 1250, 4.2, 68, 2000, 'Budget-friendly rugged mini-hatchback with touchscreen infotainment.'),
        ('Volkswagen', 'Polo GT TSI Demo', 2023, 'Petrol', 'Automatic', 5, 2100, 4.8, 92, 4500, 'Driver-focused punchy turbo DSG hatchback engineered for twisty roads.'),
        ('Honda', 'Jazz ZX', 2023, 'Petrol', 'Automatic', 5, 1950, 4.6, 78, 3500, 'Legendary Magic Seats flexibility with expansive glasshouse visibility.'),
        ('Maruti Suzuki', 'Alto K10 VXi+', 2024, 'Petrol', 'Manual', 4, 1100, 4.2, 65, 2000, 'Pocket-friendly compact runabout perfect for tight alleyways and errands.'),
    ],
    'Sedan': [
        ('Honda', 'City ZX', 2024, 'Petrol', 'Automatic', 5, 2600, 4.7, 94, 5000, 'The benchmark mid-size sedan with legendary i-VTEC engine and ADAS safety.'),
        ('Hyundai', 'Verna Turbo SX(O)', 2024, 'Petrol', 'Automatic', 5, 2900, 4.8, 91, 5500, '160 PS turbocharged power, heated/ventilated front seats, and futuristic styling.'),
        ('Skoda', 'Slavia Style 1.5 TSI', 2024, 'Petrol', 'Automatic', 5, 3000, 4.8, 89, 6000, 'European highway composure, DSG lightning shifts, and expansive 521L boot.'),
        ('Volkswagen', 'Virtus GT Plus', 2024, 'Petrol', 'Automatic', 5, 3100, 4.9, 93, 6000, '5-star safety, paddle shifters, and crisp German steering precision.'),
        ('Maruti Suzuki', 'Ciaz Alpha', 2023, 'Petrol', 'Manual', 5, 2200, 4.5, 80, 4000, 'Executive rear lounge legroom with mild-hybrid fuel efficiency.'),
        ('Maruti Suzuki', 'Dzire ZXi+', 2024, 'Petrol', 'Automatic', 5, 1850, 4.6, 92, 3500, 'India’s favorite compact sedan offering incredible boot practicality.'),
        ('Honda', 'Amaze VX CVT', 2024, 'Petrol', 'Automatic', 5, 1900, 4.5, 84, 3500, 'Smooth step-less CVT transmission and spacious Honda man-maximum packaging.'),
        ('Hyundai', 'Aura SX+', 2024, 'Petrol', 'Automatic', 5, 1750, 4.4, 75, 3000, 'Comfortable compact sedan with cruise control and wireless Apple CarPlay.'),
        ('Tata', 'Tigor XZ+ Tech', 2023, 'Petrol', 'Manual', 5, 1600, 4.3, 73, 3000, 'Coupe-like roofline with dual airbags and 4-star Global NCAP safety.'),
        ('Toyota', 'Camry Hybrid Executive', 2024, 'Hybrid', 'Automatic', 5, 6500, 4.9, 88, 12000, 'Self-charging quiet hybrid powertrain with reclining executive rear seats.'),
        ('Skoda', 'Octavia L&K Edition', 2023, 'Petrol', 'Automatic', 5, 4800, 4.8, 86, 10000, 'Notchback tailgate practicality, Canton 12-speaker audio, and 190 PS surge.'),
        ('Honda', 'Civic ZX Sport', 2023, 'Petrol', 'Automatic', 5, 3800, 4.7, 85, 8000, 'Low-slung aggressive stance, sunroof, and agile multi-link rear suspension.'),
        ('Hyundai', 'Elantra SX(O)', 2023, 'Diesel', 'Automatic', 5, 3400, 4.6, 80, 7000, 'Torquey diesel cruiser with hands-free smart trunk and memory driver seat.'),
        ('Toyota', 'Yaris V CVT', 2023, 'Petrol', 'Automatic', 5, 2300, 4.4, 70, 4500, '7 airbags as standard, roof-mounted air vents, and acoustic vibration damping.'),
        ('Nissan', 'Sunny Special Edition', 2023, 'Diesel', 'Manual', 5, 1700, 4.3, 67, 3000, 'Colossal rear sofa-like legroom engineered for long intercity family travel.'),
    ],
    'SUV': [
        ('Hyundai', 'Creta SX(O)', 2024, 'Diesel', 'Automatic', 5, 3200, 4.7, 98, 6000, 'India’s premier midsize SUV with panoramic sunroof and Bose sound system.'),
        ('Mahindra', 'XUV700 AX7 Luxury', 2024, 'Diesel', 'Automatic', 7, 4200, 4.8, 96, 8000, 'AdrenoX dual 10.25-inch displays, Level 2 ADAS, and muscular 185 PS diesel.'),
        ('Mahindra', 'Thar 4x4 Hard Top', 2024, 'Diesel', 'Manual', 4, 3500, 4.7, 95, 7000, 'Iconic off-road capability with shift-on-fly 4WD and roll-cage construction.'),
        ('Kia', 'Seltos GTX+ Dark', 2024, 'Petrol', 'Automatic', 5, 3300, 4.7, 92, 6000, 'Sporty 160 PS turbo DCT with dual-pane panoramic sunroof and heads-up display.'),
        ('Mahindra', 'Scorpio-N Z8L 4x4', 2024, 'Diesel', 'Automatic', 7, 4400, 4.8, 94, 8000, 'The Big Daddy of SUVs with ladder-frame toughness and 4XPLOR terrain modes.'),
        ('Tata', 'Harrier Fearless+ Dark', 2024, 'Diesel', 'Automatic', 5, 3800, 4.7, 90, 7000, 'Land Rover derived D8 platform giving commanding highway posture.'),
        ('Tata', 'Safari Accomplished+', 2024, 'Diesel', 'Automatic', 7, 4300, 4.8, 92, 8000, 'Flagship 7-seater with ventilated captain seats and ambient mood lighting.'),
        ('Tata', 'Nexon Fearless+ S', 2024, 'Petrol', 'Automatic', 5, 2500, 4.6, 90, 5000, '5-star Global NCAP champion with sequential LED indicators and paddle shifts.'),
        ('Maruti Suzuki', 'Grand Vitara Alpha AWD', 2024, 'Hybrid', 'Automatic', 5, 3100, 4.6, 87, 6000, 'AllGrip electronic all-wheel drive paired with smart hybrid fuel savings.'),
        ('Toyota', 'Urban Cruiser Hyryder Strong Hybrid', 2024, 'Hybrid', 'Automatic', 5, 3300, 4.7, 88, 6000, 'Electric-only silent low speed city driving with 28 km/l efficiency.'),
        ('Hyundai', 'Venue SX(O) Turbo', 2024, 'Petrol', 'Automatic', 5, 2400, 4.5, 84, 5000, 'Connected car tech with Alexa home-to-car support and cornering headlamps.'),
        ('Kia', 'Sonet X-Line Turbo', 2024, 'Diesel', 'Automatic', 5, 2600, 4.6, 85, 5000, 'Matte graphite finish, front parking sensors, and punchy 115 PS CRDi diesel.'),
        ('Maruti Suzuki', 'Brezza ZXi+ Dual Tone', 2024, 'Petrol', 'Automatic', 5, 2300, 4.5, 86, 4500, 'Proven 1.5L K-series motor with head-up display and Arkamys acoustic tuning.'),
        ('Mahindra', 'Scorpio Classic S11', 2024, 'Diesel', 'Manual', 7, 3600, 4.6, 91, 7000, 'Legendary road presence with mHawk 130 diesel torque for rough countryside.'),
        ('MG', 'Hector Sharp Pro', 2024, 'Petrol', 'Automatic', 5, 3200, 4.5, 82, 6000, 'Massive 14-inch HD portrait screen with panoramic sunroof and power tailgate.'),
        ('Jeep', 'Compass Model S 4x4', 2024, 'Diesel', 'Automatic', 5, 4800, 4.8, 89, 10000, 'Trail-rated Selec-Terrain 4WD with 360-degree camera and Alpine sound.'),
    ],
    'MUV / MPV': [
        ('Toyota', 'Innova Crysta 2.4 VX', 2024, 'Diesel', 'Manual', 7, 4500, 4.9, 100, 8000, 'Undisputed king of Indian touring with bulletproof reliability and plush ride.'),
        ('Maruti Suzuki', 'Ertiga ZXi+ Smart Hybrid', 2024, 'Petrol', 'Manual', 7, 2600, 4.6, 95, 5000, 'Practical 7-seater with air-cooled cup holders and easy folding third row.'),
        ('Kia', 'Carens Luxury Plus', 2024, 'Diesel', 'Automatic', 7, 3100, 4.7, 92, 6000, 'Smart air purifier, one-touch electric tumble middle seats, and 6 airbags.'),
        ('Toyota', 'Innova Hycross ZX(O)', 2024, 'Hybrid', 'Automatic', 7, 5500, 4.9, 99, 10000, 'Ottoman recliners with leg rest, monocoque luxury chassis, and panoramic roof.'),
        ('Maruti Suzuki', 'XL6 Alpha+ Dual Tone', 2024, 'Petrol', 'Automatic', 6, 2900, 4.6, 88, 5500, 'All-black premium 6-seater captain seat cabin with ventilated front seats.'),
        ('Renault', 'Triber RXZ Dual Tone', 2024, 'Petrol', 'Manual', 7, 1800, 4.3, 78, 3500, 'Modular 7-seater with removable third row converting into 625L luggage bay.'),
        ('Mahindra', 'Marazzo M6+ 8-Seater', 2023, 'Diesel', 'Manual', 8, 3000, 4.4, 76, 5500, 'Shark-inspired aerodynamic frame with roof-mounted surround cooling system.'),
        ('Toyota', 'Rumion V Automatic', 2024, 'Petrol', 'Automatic', 7, 2800, 4.5, 82, 5000, 'Toyota assured family cruiser with steering mounted controls and cruise control.'),
        ('Kia', 'Carnival Limousine Plus', 2024, 'Diesel', 'Automatic', 7, 7500, 4.9, 93, 15000, 'VIP lounge with rear dual touchscreens, VIP captain seats, and dual sunroof.'),
        ('Toyota', 'Vellfire Executive Lounge', 2024, 'Hybrid', 'Automatic', 7, 18000, 5.0, 97, 35000, 'First-class private jet experience on wheels with heated massage thrones.'),
        ('MG', 'G10 Executive Tourer', 2023, 'Diesel', 'Automatic', 7, 4800, 4.5, 75, 9000, 'Spacious business shuttle with dual power sliding doors and conference seating.'),
        ('Force', 'Urbania Luxury Cruiser', 2024, 'Diesel', 'Manual', 9, 6500, 4.7, 85, 12000, 'Next-generation monocoque van with individual AC vents and reclining seats.'),
        ('Maruti Suzuki', 'Eeco 7-Seater AC', 2024, 'Petrol', 'Manual', 7, 1300, 4.1, 70, 2000, 'Maximum utilitarian room for group pilgrimages and luggage-heavy trips.'),
        ('Mahindra', 'Bolero Neo N10(O)', 2024, 'Diesel', 'Manual', 7, 2400, 4.5, 87, 4500, 'Multi-Terrain Technology (MTT) with rugged ladder-frame durability for hills.'),
        ('Mahindra', 'Bolero Power Plus D7', 2023, 'Diesel', 'Manual', 7, 2200, 4.4, 84, 4000, 'Time-tested heavy metal workhorse ready for remote mountain roads.'),
    ],
    'Luxury': [
        ('BMW', '5 Series 530i M Sport', 2024, 'Petrol', 'Automatic', 5, 9500, 4.9, 96, 25000, 'M Aerodynamic package, Harman Kardon audio, and 252 hp sheer driving pleasure.'),
        ('Mercedes-Benz', 'E-Class Exclusive E220d', 2024, 'Diesel', 'Automatic', 5, 11000, 4.9, 98, 25000, 'Long wheelbase rear comfort package with electric recliner and Burmester sound.'),
        ('Audi', 'A6 45 TFSI Technology', 2024, 'Petrol', 'Automatic', 5, 8800, 4.8, 91, 22000, 'Virtual cockpit plus, dual touch MMI navigation, and Bang & Olufsen 3D sound.'),
        ('BMW', '3 Series Gran Limousine', 2024, 'Petrol', 'Automatic', 5, 8200, 4.9, 94, 20000, 'Class-leading rear legroom, illuminated panoramic sunroof, and sport suspension.'),
        ('Mercedes-Benz', 'C-Class C200 Progressive', 2024, 'Petrol', 'Automatic', 5, 7800, 4.8, 92, 20000, 'Baby S-Class vertical central display with 64-colour ambient lighting.'),
        ('Audi', 'A4 40 TFSI Premium Plus', 2024, 'Petrol', 'Automatic', 5, 7200, 4.7, 88, 18000, 'Quattro inspired agility, 190 hp TFSI, and whisper quiet acoustic windshield.'),
        ('Mercedes-Benz', 'S-Class S450 4MATIC', 2024, 'Petrol', 'Automatic', 5, 24000, 5.0, 99, 50000, 'The pinnacle of automotive luxury with rear massage, OLED screens, and airmatic suspension.'),
        ('BMW', '7 Series 740i M Sport', 2024, 'Petrol', 'Automatic', 5, 22000, 5.0, 97, 45000, '31.3-inch rear Theatre Screen, Interaction Bar, and crystal glass controls.'),
        ('Audi', 'Q7 55 TFSI Quattro', 2024, 'Petrol', 'Automatic', 7, 13500, 4.9, 93, 30000, 'Permanent Quattro all-wheel-drive with adaptive air suspension and 7 luxury seats.'),
        ('BMW', 'X5 xDrive40i M Sport', 2024, 'Petrol', 'Automatic', 5, 14000, 4.9, 95, 30000, 'Laserlight illumination, panoramic Sky Lounge, and twin-turbo 381 hp sprint.'),
        ('Mercedes-Benz', 'GLE 450 4MATIC', 2024, 'Petrol', 'Automatic', 5, 15000, 4.9, 96, 32000, 'E-Active Body Control, soft-close doors, and grand SUV presence.'),
        ('Volvo', 'XC90 B6 Ultimate AWD', 2024, 'Petrol', 'Automatic', 7, 13000, 4.9, 90, 28000, 'Scandinavian sanctuary with Bowers & Wilkins audio and Orrefors crystal gear shifter.'),
        ('Porsche', 'Macan GTS Sport Edition', 2024, 'Petrol', 'Automatic', 5, 16500, 4.9, 94, 35000, 'Sports exhaust symphony, Porsche PDK gearbox, and race-bred cornering grip.'),
        ('Range Rover', 'Velar Dynamic SE', 2024, 'Diesel', 'Automatic', 5, 14500, 4.8, 92, 30000, 'Avant-garde reductive silhouette with Meridian 3D sound and flush door handles.'),
        ('Lexus', 'ES 300h Luxury Hybrid', 2024, 'Hybrid', 'Automatic', 5, 9800, 4.8, 89, 22000, 'Takumi craftsmanship, Mark Levinson 17-speaker audio, and vibration-free serenity.'),
    ],
    'Electric Vehicles': [
        ('Tata', 'Nexon EV Empowered+ LR', 2024, 'Electric', 'Automatic', 5, 3200, 4.7, 95, 6000, '465 km ARAI range, V2V and V2L charging support, and cinematic 12.3-inch screen.'),
        ('MG', 'ZS EV Exclusive Pro', 2024, 'Electric', 'Automatic', 5, 3500, 4.6, 90, 6500, '50.3 kWh battery, dual-pane panoramic sunroof, and Level 2 autonomous driving.'),
        ('BYD', 'Atto 3 Superior Extended', 2024, 'Electric', 'Automatic', 5, 4200, 4.7, 91, 8000, 'Ultra-safe Blade Battery, rotating 12.8-inch screen, and gym-inspired futuristic cockpit.'),
        ('Tata', 'Punch EV Empowered+ S', 2024, 'Electric', 'Automatic', 5, 2300, 4.5, 88, 4500, 'Acti.EV architecture with 360-degree camera, frunk storage, and ventilated seats.'),
        ('Tata', 'Tiago EV Tech Lux Long Range', 2024, 'Electric', 'Automatic', 5, 1900, 4.4, 84, 3500, 'India’s most accessible electric hatch with cruise control and multi-mode regeneration.'),
        ('Tata', 'Tigor EV XZ+ Lux', 2024, 'Electric', 'Automatic', 5, 2100, 4.4, 80, 4000, 'Ziptron high-voltage electric sedan delivering silent and economical daily travel.'),
        ('Mahindra', 'XUV400 EV EL Pro', 2024, 'Electric', 'Automatic', 5, 3100, 4.5, 86, 6000, '0-100 in 8.3 seconds with dual 10.25-inch screens and copper accents.'),
        ('Hyundai', 'Ioniq 5 RWD', 2024, 'Electric', 'Automatic', 5, 6500, 4.9, 96, 15000, 'E-GMP 800V ultra-fast architecture, relaxation seats, and Parametric Pixel LED styling.'),
        ('Kia', 'EV6 GT-Line AWD', 2024, 'Electric', 'Automatic', 5, 7500, 4.9, 94, 18000, 'Dual-motor 325 hp supercar acceleration with head-up display and Meridian sound.'),
        ('BYD', 'Seal Performance AWD', 2024, 'Electric', 'Automatic', 5, 6800, 4.9, 95, 16000, '530 hp dual motors, 0-100 in 3.8s, and cell-to-body aerodynamic design.'),
        ('Volvo', 'EX40 Recharge Twin AWD', 2024, 'Electric', 'Automatic', 5, 8000, 4.8, 90, 20000, '408 hp blisteringly fast Swedish electric SUV with Google built-in interface.'),
        ('BMW', 'i4 eDrive40 M Sport', 2024, 'Electric', 'Automatic', 5, 10500, 4.9, 93, 25000, 'Sleek gran coupe delivering up to 590 km real-world range with iconic BMW dynamics.'),
        ('Mercedes-Benz', 'EQE 500 4MATIC SUV', 2024, 'Electric', 'Automatic', 5, 16000, 4.9, 92, 35000, 'Hyperscreen triple display, air suspension, and whisper-quiet electric touring.'),
        ('Audi', 'e-tron 55 Quattro', 2024, 'Electric', 'Automatic', 5, 15000, 4.8, 89, 32000, 'Electric Quattro torque vectoring, matrix LED headlights, and virtual mirrors.'),
        ('Porsche', 'Taycan 4S Cross Turismo', 2024, 'Electric', 'Automatic', 5, 25000, 5.0, 97, 50000, 'Gravel mode high clearance with 530 hp launch control and Porsche sports sound.'),
        ('Tata', 'Curvv EV Accomplished+ 55', 2024, 'Electric', 'Automatic', 5, 3600, 4.7, 92, 7000, 'Futuristic electric SUV coupe with 502 km range, gesture tailgate, and Level 2 ADAS.'),
    ]
}

def seed():
    db = SessionLocal()
    print("Normalizing existing cars...")
    existing = db.query(Car).all()
    
    # 1. Update existing cars' categories to standard names
    for c in existing:
        if c.category in ('MUV', 'Family'):
            c.category = 'MUV / MPV'
        elif c.category in ('Electric',):
            c.category = 'Electric Vehicles'
    db.commit()

    # Re-fetch
    existing = db.query(Car).all()
    existing_keys = {(c.brand.strip().lower(), c.model.strip().lower()) for c in existing}
    print(f"Current cars before expansion: {len(existing)}")

    # Category image map
    cat_img_map = {
        'Hatchback': HATCHBACK_IMAGES,
        'Sedan': SEDAN_IMAGES,
        'SUV': SUV_IMAGES,
        'MUV / MPV': MUV_IMAGES,
        'Luxury': LUXURY_IMAGES,
        'Electric Vehicles': ELECTRIC_IMAGES,
    }

    inserted_count = 0
    cat_idx = {k: 0 for k in CATALOG}

    for cat_name, car_list in CATALOG.items():
        imgs = cat_img_map[cat_name]
        for item in car_list:
            brand, model, year, fuel, trans, seats, price, rating, pop, dep, desc = item
            key = (brand.strip().lower(), model.strip().lower())
            
            # Check if this exact brand/model already exists
            if key in existing_keys:
                continue

            img_url = imgs[cat_idx[cat_name] % len(imgs)]
            cat_idx[cat_name] += 1
            loc = LOCATIONS[(len(existing) + inserted_count) % len(LOCATIONS)]

            extra_feat = [
                'Touchscreen infotainment',
                'Keyless entry & push start',
                'Fast USB-C charging ports',
                'Rear air conditioning vents'
            ]
            if fuel == 'Electric':
                extra_feat.extend(['Regenerative braking', 'Fast DC charging support'])
            elif cat_name == 'Luxury':
                extra_feat.extend(['Panoramic sunroof', 'Ambient lighting', 'Leather upholstery'])

            new_car = Car(
                brand=brand,
                model=model,
                year=year,
                category=cat_name,
                fuel=fuel,
                transmission=trans,
                seats=seats,
                price_per_day=price,
                rating=rating,
                location=loc,
                popularity=pop,
                image=img_url,
                images=[img_url],
                deposit=dep,
                available=True,
                features=BASE_FEATS + extra_feat,
                description=desc
            )
            db.add(new_car)
            existing_keys.add(key)
            inserted_count += 1

    db.commit()
    print(f"Inserted {inserted_count} new cars.")

    # Verification
    all_cars = db.query(Car).all()
    print(f"\n--- VERIFICATION: Total Cars in Database: {len(all_cars)} ---")
    counts = Counter(c.category for c in all_cars)
    for cat, cnt in sorted(counts.items()):
        status = "PASS (>=15)" if cnt >= 15 else "FAIL (<15)"
        print(f"  {cat}: {cnt} cars -> {status}")

    db.close()

if __name__ == '__main__':
    seed()
