import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal, engine, Base
from models import Car

# High quality photo pool per category
POOLS = {
    "Hatchback": [
        "1552519507-da3b142c6e3d", "1502877338535-766e1452684a", "1549317661-bd32c8ce0db2",
        "1583121274602-3e2820c69888", "1605559424843-9e4c228bf1c2", "1617469767053-d3b523a0b982",
        "1541447271487-09612b3f49f7", "1570125909232-eb263c188f7e", "1508974239320-0a029497e820",
        "1619767886558-efdc259cde1a", "1617814076367-b759c7d7e738", "1541899481282-d53bffe3c35d"
    ],
    "Sedan": [
        "1503376780353-7e6692767b70", "1494976388531-d1058494cdd8", "1511919884226-fd3cad34687c",
        "1550355291-bbee04a92027", "1526726538690-5cbf956ae2fd", "1542282088-72c9c27ed0cd",
        "1553440569-bcc63803a83d", "1503736334956-4c8f8e92946d", "1514316454349-750a7fd3da3a",
        "1568605117036-5fe5e7bab0b7", "1584345604476-8ec5e12e42dd", "1580273916550-e323be2ae537"
    ],
    "SUV": [
        "1533473359331-0135ef1b58bf", "1519641471654-76ce0107ad1b", "1506015391300-4802dc74de2e",
        "1544829099-b9a0c07fad1a", "1563720360172-67b8f3dce741", "1609521263047-f8f205293f24",
        "1590362891991-f776e747a588", "1616422285623-13ff0162193c", "1532581140115-3e355d1ed1de",
        "1559416523-140ddc3d238c", "1504215680853-026ed2a45def", "1575089976121-8ed7b2a54265"
    ],
    "MUV / MPV": [
        "1517524008697-84bbe3c3fd98", "1546614042-7df3c24c9e5d", "1520050206274-a1ae44613e6d",
        "1541899481282-d53bffe3c35d", "1563720223185-11003d516935", "1511919884226-fd3cad34687c",
        "1533473359331-0135ef1b58bf", "1519641471654-76ce0107ad1b", "1506015391300-4802dc74de2e",
        "1544829099-b9a0c07fad1a", "1503376780353-7e6692767b70", "1580273916550-e323be2ae537"
    ],
    "Luxury": [
        "1555215695-3004980ad54e", "1618843479313-40f8afb4b4d8", "1503736334956-4c8f8e92946d",
        "1563720223185-11003d516935", "1617788138017-80ad40651399", "1502877338535-766e1452684a",
        "1549317661-bd32c8ce0db2", "1552519507-da3b142c6e3d", "1542282088-72c9c27ed0cd",
        "1550355291-bbee04a92027", "1553440569-bcc63803a83d", "1514316454349-750a7fd3da3a"
    ],
    "Electric": [
        "1560958089-b8a1929cea89", "1593941707882-a5bba14938c7", "1617788138017-80ad40651399",
        "1536700503339-1e4b06520771", "1542282088-72c9c27ed0cd", "1553440569-bcc63803a83d",
        "1526726538690-5cbf956ae2fd", "1503376780353-7e6692767b70", "1550355291-bbee04a92027",
        "1580273916550-e323be2ae537", "1618843479313-40f8afb4b4d8", "1555215695-3004980ad54e"
    ]
}

def img_url(pid):
    return f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&w=1000&q=75"

CITIES = [
    "Nagercoil", "Kanyakumari", "Marthandam", "Thuckalay",
    "Kuzhithurai", "Colachel", "Padmanabhapuram", "Karungal", "Kulasekharam"
]

BASE_FEATURES = [
    "Air conditioning", "Power windows", "ABS with EBD",
    "Reverse parking sensors", "Bluetooth audio", "Dual airbags"
]

EXTRA_FEATURES = {
    "Hatchback": ["Fuel-efficient engine", "Compact city size", "Keyless entry"],
    "Sedan": ["Spacious rear bench", "Cruise control", "Apple CarPlay & Android Auto", "Large 500L boot"],
    "SUV": ["High ground clearance (200mm+)", "Hill hold assist", "Roof rails", "Commanding driving position"],
    "MUV / MPV": ["Individual rear AC vents", "One-touch tumble seats", "Capacious 7/8-seater cabin", "ISOFIX child anchors"],
    "Luxury": ["Panoramic sunroof", "Ambient mood lighting", "Ventilated leather seats", "Burmester/Harman sound system", "Wireless phone charging"],
    "Electric": ["Zero tailpipe emissions", "Fast DC charging support", "Regenerative braking modes", "Silent cabin drive", "Connected car app"]
}

DEPOSITS = {
    "Hatchback": 3000,
    "Sedan": 5000,
    "SUV": 7000,
    "MUV / MPV": 6000,
    "Luxury": 25000,
    "Electric": 6000
}

# 126 Master Cars Dataset
RAW_CARS = [
    # --- Hatchback (18) ---
    ("Maruti Suzuki", "Swift VXi", 2024, "Hatchback", "Petrol", "Manual", 5, 1500, 4.6, 95, "Sporty compact hatchback with best-in-class mileage for effortless city hops."),
    ("Hyundai", "i20 Asta IVT", 2024, "Hatchback", "Petrol", "Automatic", 5, 1900, 4.7, 88, "Feature-rich stylish hatchback with sunroof and fluid automatic transmission."),
    ("Tata", "Altroz XZ+ i-Turbo", 2024, "Hatchback", "Petrol", "Manual", 5, 1700, 4.5, 82, "5-star Global NCAP rated premium hatchback with solid build and agile handling."),
    ("Maruti Suzuki", "Baleno Alpha", 2024, "Hatchback", "Petrol", "Automatic", 5, 1800, 4.6, 90, "Spacious cabin, head-up display, and ultra-smooth city cruising."),
    ("Tata", "Tiago XZ Plus", 2023, "Hatchback", "Petrol", "Manual", 5, 1350, 4.4, 76, "Nimble city hatchback with Harman sound system and reassuring safety rating."),
    ("Maruti Suzuki", "Wagon R ZXi 1.2", 2024, "Hatchback", "Petrol", "Manual", 5, 1400, 4.5, 85, "Tall-boy design offering enormous headroom and easy accessibility."),
    ("Hyundai", "Grand i10 Nios Asta", 2024, "Hatchback", "Petrol", "Automatic", 5, 1650, 4.5, 80, "Quiet refined engine, wireless charger, and effortless urban parking."),
    ("Maruti Suzuki", "Celerio ZXi Plus", 2023, "Hatchback", "Petrol", "Manual", 5, 1300, 4.3, 72, "Segment leader in fuel economy, lightweight and dependable city runabout."),
    ("Maruti Suzuki", "Ignis Alpha", 2024, "Hatchback", "Petrol", "Manual", 5, 1550, 4.4, 74, "Urban SUV stance with high ground clearance and vibrant retro cabin."),
    ("Toyota", "Glanza V", 2024, "Hatchback", "Petrol", "Automatic", 5, 1850, 4.6, 83, "Toyota reliability backed with 360-degree camera and plush rear bench."),
    ("Citroen", "C3 Shine Turbo", 2024, "Hatchback", "Petrol", "Manual", 5, 1600, 4.4, 70, "Advanced comfort suspension tuning that swallows Indian road potholes."),
    ("Renault", "Kwid Climber", 2023, "Hatchback", "Petrol", "Manual", 5, 1200, 4.2, 68, "Budget-friendly rugged mini-hatchback with touchscreen infotainment."),
    ("Volkswagen", "Polo GT TSI", 2023, "Hatchback", "Petrol", "Automatic", 5, 2100, 4.8, 92, "Driver-focused punchy turbo DSG hatchback engineered for twisty roads."),
    ("Honda", "Jazz ZX CVT", 2023, "Hatchback", "Petrol", "Automatic", 5, 1950, 4.6, 78, "Legendary Magic Seats flexibility with expansive glasshouse visibility."),
    ("Maruti Suzuki", "Alto K10 VXi+", 2024, "Hatchback", "Petrol", "Manual", 4, 1100, 4.2, 65, "Pocket-friendly compact runabout perfect for tight alleyways and errands."),
    ("Tata", "Altroz Racer R3", 2024, "Hatchback", "Petrol", "Manual", 5, 2000, 4.7, 85, "High-performance hot hatch with sport exhaust and track-inspired telemetry."),
    ("Hyundai", "i20 N Line N8", 2024, "Hatchback", "Petrol", "Automatic", 5, 2200, 4.8, 89, "Firm dynamic suspension, paddle shifters, and aggressive exhaust note."),
    ("Maruti Suzuki", "S-Presso VXi+", 2023, "Hatchback", "Petrol", "Manual", 5, 1250, 4.3, 70, "Mini-SUV styling with great forward visibility and impressive fuel efficiency."),

    # --- Sedan (18) ---
    ("Honda", "City ZX i-VTEC", 2024, "Sedan", "Petrol", "Automatic", 5, 2600, 4.7, 94, "The benchmark mid-size sedan with legendary i-VTEC engine and ADAS safety."),
    ("Hyundai", "Verna Turbo SX(O)", 2024, "Sedan", "Petrol", "Automatic", 5, 2900, 4.8, 91, "160 PS turbocharged power, heated/ventilated front seats, and futuristic styling."),
    ("Skoda", "Slavia Style 1.5 TSI DSG", 2024, "Sedan", "Petrol", "Automatic", 5, 3000, 4.8, 89, "European highway composure, DSG lightning shifts, and expansive 521L boot."),
    ("Volkswagen", "Virtus GT Plus", 2024, "Sedan", "Petrol", "Automatic", 5, 3100, 4.9, 93, "5-star safety, paddle shifters, and crisp German steering precision."),
    ("Maruti Suzuki", "Ciaz Alpha", 2023, "Sedan", "Petrol", "Manual", 5, 2200, 4.5, 80, "Executive rear lounge legroom with mild-hybrid fuel efficiency."),
    ("Maruti Suzuki", "Dzire ZXi+", 2024, "Sedan", "Petrol", "Automatic", 5, 1850, 4.6, 92, "India's favorite compact sedan offering incredible boot practicality."),
    ("Honda", "Amaze VX CVT", 2024, "Sedan", "Petrol", "Automatic", 5, 1900, 4.5, 84, "Smooth step-less CVT transmission and spacious Honda man-maximum packaging."),
    ("Hyundai", "Aura SX+", 2024, "Sedan", "Petrol", "Automatic", 5, 1750, 4.4, 75, "Comfortable compact sedan with cruise control and wireless Apple CarPlay."),
    ("Tata", "Tigor XZ+", 2023, "Sedan", "Petrol", "Manual", 5, 1600, 4.3, 73, "Coupe-like roofline with dual airbags and 4-star Global NCAP safety."),
    ("Toyota", "Camry Hybrid Executive", 2024, "Sedan", "Hybrid", "Automatic", 5, 6500, 4.9, 88, "Self-charging quiet hybrid powertrain with reclining executive rear seats."),
    ("Skoda", "Octavia L&K Edition", 2023, "Sedan", "Petrol", "Automatic", 5, 4800, 4.8, 86, "Notchback tailgate practicality, Canton 12-speaker audio, and 190 PS surge."),
    ("Skoda", "Superb L&K Flagship", 2023, "Sedan", "Petrol", "Automatic", 5, 5500, 4.9, 90, "Limousine-grade legroom with ventilated massage seats and matrix beam headlights."),
    ("Honda", "Civic ZX Sport", 2023, "Sedan", "Petrol", "Automatic", 5, 3800, 4.7, 85, "Low-slung aggressive stance, sunroof, and agile multi-link rear suspension."),
    ("Hyundai", "Elantra SX(O)", 2023, "Sedan", "Diesel", "Automatic", 5, 3400, 4.6, 80, "Torquey diesel cruiser with hands-free smart trunk and memory driver seat."),
    ("Toyota", "Yaris V CVT", 2023, "Sedan", "Petrol", "Automatic", 5, 2300, 4.4, 70, "7 airbags as standard, roof-mounted air vents, and acoustic vibration damping."),
    ("Volkswagen", "Vento Highline Plus", 2023, "Sedan", "Petrol", "Automatic", 5, 2500, 4.5, 78, "Timeless European silhouette with torquey TSI engine and cruise control."),
    ("Nissan", "Sunny Special Edition", 2023, "Sedan", "Diesel", "Manual", 5, 1700, 4.3, 67, "Colossal rear sofa-like legroom engineered for long intercity family travel."),
    ("Tata", "Manza Club Class", 2023, "Sedan", "Diesel", "Manual", 5, 1500, 4.2, 64, "Spacious budget sedan designed for relaxed long-distance touring."),

    # --- Compact & Midsize SUV (20) ---
    ("Hyundai", "Creta SX(O)", 2024, "SUV", "Diesel", "Automatic", 5, 3200, 4.7, 98, "India's premier midsize SUV with panoramic sunroof and Bose sound system."),
    ("Kia", "Seltos GTX+ Dark", 2024, "SUV", "Petrol", "Automatic", 5, 3300, 4.7, 92, "Sporty 160 PS turbo DCT with dual-pane panoramic sunroof and heads-up display."),
    ("Maruti Suzuki", "Brezza ZXi+ Dual Tone", 2024, "SUV", "Petrol", "Automatic", 5, 2300, 4.5, 86, "Proven 1.5L motor with head-up display and 360 view parking camera."),
    ("Tata", "Nexon Fearless+ S", 2024, "SUV", "Petrol", "Automatic", 5, 2500, 4.6, 90, "5-star Global NCAP champion with sequential LED indicators and paddle shifts."),
    ("Hyundai", "Venue SX(O) Turbo", 2024, "SUV", "Petrol", "Automatic", 5, 2400, 4.5, 84, "Connected car tech with Alexa home-to-car support and cornering headlamps."),
    ("Kia", "Sonet X-Line Turbo", 2024, "SUV", "Diesel", "Automatic", 5, 2600, 4.6, 85, "Matte graphite finish, front parking sensors, and punchy 115 PS CRDi diesel."),
    ("Maruti Suzuki", "Grand Vitara Alpha AWD", 2024, "SUV", "Hybrid", "Automatic", 5, 3100, 4.6, 87, "AllGrip electronic all-wheel drive paired with smart hybrid fuel savings."),
    ("Toyota", "Urban Cruiser Hyryder", 2024, "SUV", "Hybrid", "Automatic", 5, 3300, 4.7, 88, "Electric-only silent low speed city driving with 28 km/l efficiency."),
    ("Skoda", "Kushaq Monte Carlo 1.5", 2024, "SUV", "Petrol", "Automatic", 5, 3200, 4.7, 89, "European safety, red accented interiors, and brilliant high-speed poise."),
    ("Volkswagen", "Taigun GT Plus", 2024, "SUV", "Petrol", "Automatic", 5, 3200, 4.7, 89, "German engineering with active cylinder technology and digital cockpit."),
    ("Honda", "Elevate ZX CVT", 2024, "SUV", "Petrol", "Automatic", 5, 2700, 4.6, 87, "Best-in-segment 220mm ground clearance and class-leading boot capacity."),
    ("MG", "Astor Sharp Pro", 2024, "SUV", "Petrol", "Automatic", 5, 2800, 4.5, 82, "AI personal assistant robot, Level 2 ADAS, and sangria red leather cabin."),
    ("Maruti Suzuki", "Fronx Alpha Turbo", 2024, "SUV", "Petrol", "Automatic", 5, 2200, 4.5, 86, "Coupe SUV crossover with Boosterjet engine and geometric LED DRLs."),
    ("Tata", "Punch Creative Flagship", 2024, "SUV", "Petrol", "Manual", 5, 1800, 4.5, 85, "Micro-SUV with 5-star safety, 90-degree opening doors, and high hip point."),
    ("Hyundai", "Exter SX(O) Connect", 2024, "SUV", "Petrol", "Automatic", 5, 1900, 4.5, 84, "Dual-camera dashcam built-in with voice-enabled smart electric sunroof."),
    ("Renault", "Kiger RXZ Turbo", 2023, "SUV", "Petrol", "Automatic", 5, 1850, 4.4, 78, "Muscular French styling with massive 405L luggage space and driving modes."),
    ("Nissan", "Magnite Kuro Edition", 2024, "SUV", "Petrol", "Automatic", 5, 1800, 4.4, 80, "Midnight black aesthetics, wireless Android Auto, and 4-star safety rating."),
    ("Mahindra", "XUV300 W8(O)", 2023, "SUV", "Diesel", "Manual", 5, 2200, 4.5, 82, "Class-highest 300 Nm torque with heated ORVMs and 7 airbags."),
    ("Mahindra", "3XO AX7L Luxury", 2024, "SUV", "Petrol", "Automatic", 5, 2500, 4.6, 88, "Skyroof, Harman Kardon 7-speaker audio, and Level 2 360-degree ADAS."),
    ("Citroen", "C3 Aircross Max 7S", 2024, "SUV", "Petrol", "Automatic", 7, 2400, 4.4, 79, "Removable third-row seats with 511L luggage capacity and plush ride."),

    # --- Rugged & Full-Size SUV (18) ---
    ("Mahindra", "XUV700 AX7 Luxury", 2024, "SUV", "Diesel", "Automatic", 7, 4200, 4.8, 96, "AdrenoX dual 10.25-inch displays, Level 2 ADAS, and muscular 185 PS diesel."),
    ("Mahindra", "Scorpio-N Z8L 4x4", 2024, "SUV", "Diesel", "Automatic", 7, 4400, 4.8, 94, "The Big Daddy of SUVs with ladder-frame toughness and 4XPLOR terrain modes."),
    ("Mahindra", "Thar 4x4 Hard Top", 2024, "SUV", "Diesel", "Manual", 4, 3500, 4.7, 95, "Iconic off-road capability with shift-on-fly 4WD and roll-cage construction."),
    ("Mahindra", "Thar Roxx 4x4", 2024, "SUV", "Diesel", "Automatic", 5, 4200, 4.8, 97, "5-door ultimate adventure SUV with panoramic sunroof and Harman Kardon audio."),
    ("Tata", "Safari Accomplished+", 2024, "SUV", "Diesel", "Automatic", 7, 4300, 4.8, 92, "Flagship 7-seater with ventilated captain seats and ambient mood lighting."),
    ("Tata", "Harrier Fearless+ Dark", 2024, "SUV", "Diesel", "Automatic", 5, 3800, 4.7, 90, "Land Rover derived D8 platform giving commanding highway posture."),
    ("Toyota", "Fortuner Legender 4x4", 2024, "SUV", "Diesel", "Automatic", 7, 6500, 4.9, 99, "Legendary unbreakable off-roader with aggressive styling and 500 Nm torque."),
    ("Toyota", "Fortuner 4x2 AT", 2024, "SUV", "Diesel", "Automatic", 7, 5500, 4.8, 95, "Commanding presence with leather interior, paddle shifts, and high ground clearance."),
    ("Ford", "Endeavour Titanium+ 4x4", 2023, "SUV", "Diesel", "Automatic", 7, 6000, 4.8, 93, "Terrain management system, active noise cancellation, and panoramic glass roof."),
    ("MG", "Gloster Savvy 4WD", 2024, "SUV", "Diesel", "Automatic", 7, 5800, 4.8, 90, "Twin-turbo diesel with massaging driver seat, ADAS safety, and 12-speaker audio."),
    ("Jeep", "Compass Model S 4x4", 2024, "SUV", "Diesel", "Automatic", 5, 4800, 4.8, 89, "Trail-rated Selec-Terrain 4WD with 360-degree camera and Alpine sound."),
    ("Jeep", "Meridian Overland 4x4", 2024, "SUV", "Diesel", "Automatic", 7, 5200, 4.8, 91, "Three-row authentic Jeep capability with panoramic sunroof and imperial tan leather."),
    ("Mahindra", "Scorpio Classic S11", 2024, "SUV", "Diesel", "Manual", 7, 3600, 4.6, 91, "Legendary road presence with mHawk 130 diesel torque for rough countryside."),
    ("Isuzu", "D-Max V-Cross 4x4", 2023, "SUV", "Diesel", "Automatic", 5, 4500, 4.7, 86, "Lifestyle pickup with shift-on-the-fly 4WD and immense rear cargo deck."),
    ("Force", "Gurkha 4x4 5-Door", 2024, "SUV", "Diesel", "Manual", 5, 3400, 4.6, 84, "Snorkel air intake, front and rear locking differentials for extreme trails."),
    ("MG", "Hector Sharp Pro", 2024, "SUV", "Petrol", "Automatic", 5, 3200, 4.5, 82, "Massive 14-inch HD portrait screen with panoramic sunroof and power tailgate."),
    ("MG", "Hector Plus 7-Seater", 2024, "SUV", "Diesel", "Manual", 7, 3500, 4.6, 84, "Spacious 3-row layout with panoramic i-Smart roof and electric tailgate."),
    ("Hyundai", "Alcazar Signature", 2024, "SUV", "Diesel", "Automatic", 7, 3700, 4.7, 89, "Second-row wireless console charging with rear seat table and Bose acoustics."),

    # --- MUV & MPV Family Fleet (18) ---
    ("Toyota", "Innova Crysta 2.4 VX", 2024, "MUV / MPV", "Diesel", "Manual", 7, 4500, 4.9, 100, "Undisputed king of Indian touring with bulletproof reliability and plush ride."),
    ("Toyota", "Innova Hycross ZX(O)", 2024, "MUV / MPV", "Hybrid", "Automatic", 7, 5500, 4.9, 99, "Ottoman recliners with leg rest, monocoque luxury chassis, and panoramic roof."),
    ("Maruti Suzuki", "Ertiga ZXi+ Hybrid", 2024, "MUV / MPV", "Petrol", "Manual", 7, 2600, 4.6, 95, "Practical 7-seater with air-cooled cup holders and easy folding third row."),
    ("Kia", "Carens Luxury Plus", 2024, "MUV / MPV", "Diesel", "Automatic", 7, 3100, 4.7, 92, "Smart air purifier, one-touch electric tumble middle seats, and 6 airbags."),
    ("Maruti Suzuki", "XL6 Alpha+ Dual Tone", 2024, "MUV / MPV", "Petrol", "Automatic", 6, 2900, 4.6, 88, "All-black premium 6-seater captain seat cabin with ventilated front seats."),
    ("Renault", "Triber RXZ Dual Tone", 2024, "MUV / MPV", "Petrol", "Manual", 7, 1800, 4.3, 78, "Modular 7-seater with removable third row converting into 625L luggage bay."),
    ("Mahindra", "Marazzo M6+ 8-Seater", 2023, "MUV / MPV", "Diesel", "Manual", 8, 3000, 4.4, 76, "Shark-inspired aerodynamic frame with roof-mounted surround cooling system."),
    ("Toyota", "Rumion V Automatic", 2024, "MUV / MPV", "Petrol", "Automatic", 7, 2800, 4.5, 82, "Toyota assured family cruiser with steering mounted controls and cruise control."),
    ("Kia", "Carnival Limousine Plus", 2024, "MUV / MPV", "Diesel", "Automatic", 7, 7500, 4.9, 93, "VIP lounge with rear dual touchscreens, VIP captain seats, and dual sunroof."),
    ("Toyota", "Vellfire Executive Lounge", 2024, "MUV / MPV", "Hybrid", "Automatic", 7, 18000, 5.0, 97, "First-class private jet experience on wheels with heated massage thrones."),
    ("Force", "Urbania Luxury Cruiser", 2024, "MUV / MPV", "Diesel", "Manual", 9, 6500, 4.7, 85, "Next-generation monocoque van with individual AC vents and reclining seats."),
    ("Force", "Traveller 9-Seater Royal", 2023, "MUV / MPV", "Diesel", "Manual", 9, 5500, 4.6, 82, "Spacious corporate and pilgrim van with individual reclining high-back seats."),
    ("Mahindra", "Bolero Neo N10(O)", 2024, "MUV / MPV", "Diesel", "Manual", 7, 2400, 4.5, 87, "Multi-Terrain Technology (MTT) with rugged ladder-frame durability for hills."),
    ("Mahindra", "Bolero B6(O) Classic", 2023, "MUV / MPV", "Diesel", "Manual", 7, 2200, 4.4, 84, "Time-tested heavy metal workhorse ready for remote countryside terrains."),
    ("Maruti Suzuki", "Eeco 7-Seater AC", 2024, "MUV / MPV", "Petrol", "Manual", 7, 1300, 4.1, 70, "Maximum utilitarian room for group pilgrimages and luggage-heavy trips."),
    ("MG", "G10 Executive Tourer", 2023, "MUV / MPV", "Diesel", "Automatic", 7, 4800, 4.5, 75, "Spacious business shuttle with dual power sliding doors and conference seating."),
    ("Toyota", "Innova 2.5V Classic", 2023, "MUV / MPV", "Diesel", "Manual", 7, 3400, 4.6, 83, "Legendary D-4D diesel endurance with cold air conditioning and smooth ride."),
    ("Nissan", "Evalia XV Executive", 2023, "MUV / MPV", "Diesel", "Manual", 7, 2400, 4.3, 72, "Sliding passenger doors, boxy voluminous luggage capacity, and low floor step."),

    # --- Luxury & Prestige (18) ---
    ("BMW", "5 Series 530i M Sport", 2024, "Luxury", "Petrol", "Automatic", 5, 9500, 4.9, 96, "M Aerodynamic package, Harman Kardon audio, and 252 hp sheer driving pleasure."),
    ("Mercedes-Benz", "E-Class E220d Exclusive", 2024, "Luxury", "Diesel", "Automatic", 5, 11000, 4.9, 98, "Long wheelbase rear comfort package with electric recliner and Burmester sound."),
    ("Audi", "A6 45 TFSI Technology", 2024, "Luxury", "Petrol", "Automatic", 5, 8800, 4.8, 91, "Virtual cockpit plus, dual touch MMI navigation, and Bang & Olufsen 3D sound."),
    ("BMW", "3 Series Gran Limousine", 2024, "Luxury", "Petrol", "Automatic", 5, 8200, 4.9, 94, "Class-leading rear legroom, illuminated panoramic sunroof, and sport suspension."),
    ("Mercedes-Benz", "C-Class C200", 2024, "Luxury", "Petrol", "Automatic", 5, 7800, 4.8, 92, "Baby S-Class vertical central display with 64-colour ambient lighting."),
    ("Audi", "A4 40 TFSI Premium", 2024, "Luxury", "Petrol", "Automatic", 5, 7200, 4.7, 88, "Quattro inspired agility, 190 hp TFSI, and whisper quiet acoustic windshield."),
    ("Mercedes-Benz", "S-Class S450 4MATIC", 2024, "Luxury", "Petrol", "Automatic", 5, 24000, 5.0, 99, "The pinnacle of automotive luxury with rear massage, OLED screens, and airmatic suspension."),
    ("BMW", "7 Series 740i M Sport", 2024, "Luxury", "Petrol", "Automatic", 5, 22000, 5.0, 97, "31.3-inch rear Theatre Screen, Interaction Bar, and crystal glass controls."),
    ("Audi", "Q7 55 TFSI Quattro", 2024, "Luxury", "Petrol", "Automatic", 7, 13500, 4.9, 93, "Permanent Quattro all-wheel-drive with adaptive air suspension and 7 luxury seats."),
    ("BMW", "X5 xDrive40i M Sport", 2024, "Luxury", "Petrol", "Automatic", 5, 14000, 4.9, 95, "Laserlight illumination, panoramic Sky Lounge, and twin-turbo 381 hp sprint."),
    ("Mercedes-Benz", "GLE 450 4MATIC", 2024, "Luxury", "Petrol", "Automatic", 5, 15000, 4.9, 96, "E-Active Body Control, soft-close doors, and grand SUV presence."),
    ("Mercedes-Benz", "GLA 200 Progressive", 2024, "Luxury", "Petrol", "Automatic", 5, 7500, 4.8, 90, "Dynamic compact luxury crossover with MBUX dual digital screens."),
    ("BMW", "X1 sDrive18i M Sport", 2024, "Luxury", "Petrol", "Automatic", 5, 7200, 4.8, 91, "Curved display, sports seats, and dynamic agile city handling."),
    ("Audi", "Q3 40 TFSI Quattro", 2024, "Luxury", "Petrol", "Automatic", 5, 6800, 4.7, 88, "All-weather Quattro traction with progressive steering and panoramic sunroof."),
    ("Range Rover", "Velar Dynamic SE", 2024, "Luxury", "Diesel", "Automatic", 5, 14500, 4.8, 92, "Avant-garde reductive silhouette with Meridian 3D sound and flush door handles."),
    ("Range Rover", "Evoque R-Dynamic", 2024, "Luxury", "Petrol", "Automatic", 5, 11000, 4.8, 90, "Coupe SUV styling, ClearSight ground view, and perforated Windsor leather."),
    ("Porsche", "Macan GTS Sport Edition", 2024, "Luxury", "Petrol", "Automatic", 5, 16500, 4.9, 94, "Sports exhaust symphony, Porsche PDK gearbox, and race-bred cornering grip."),
    ("Jaguar", "XF R-Dynamic Black", 2024, "Luxury", "Petrol", "Automatic", 5, 9000, 4.8, 89, "British craftsmanship with Pivi Pro infotainment and active road noise cancellation."),

    # --- Electric Vehicles (16) ---
    ("Tata", "Nexon EV Empowered+ LR", 2024, "Electric", "Electric", "Automatic", 5, 3200, 4.7, 95, "465 km ARAI range, V2V and V2L charging support, and cinematic 12.3-inch screen."),
    ("MG", "ZS EV Exclusive Pro", 2024, "Electric", "Electric", "Automatic", 5, 3500, 4.6, 90, "50.3 kWh battery, dual-pane panoramic sunroof, and Level 2 autonomous driving."),
    ("BYD", "Atto 3 Superior Extended", 2024, "Electric", "Electric", "Automatic", 5, 4200, 4.7, 91, "Ultra-safe Blade Battery, rotating 12.8-inch screen, and gym-inspired futuristic cockpit."),
    ("Tata", "Punch EV Empowered+ S", 2024, "Electric", "Electric", "Automatic", 5, 2300, 4.5, 88, "Acti.EV architecture with 360-degree camera, frunk storage, and ventilated seats."),
    ("Tata", "Tiago EV Tech Lux", 2024, "Electric", "Electric", "Automatic", 5, 1900, 4.4, 84, "India's most accessible electric hatch with cruise control and multi-mode regeneration."),
    ("Tata", "Tigor EV XZ+ Lux", 2024, "Electric", "Electric", "Automatic", 5, 2100, 4.4, 80, "Ziptron high-voltage electric sedan delivering silent and economical daily travel."),
    ("Mahindra", "XUV400 EV EL Pro", 2024, "Electric", "Electric", "Automatic", 5, 3100, 4.5, 86, "0-100 in 8.3 seconds with dual 10.25-inch screens and copper accents."),
    ("Hyundai", "Ioniq 5 RWD", 2024, "Electric", "Electric", "Automatic", 5, 6500, 4.9, 96, "E-GMP 800V ultra-fast architecture, relaxation seats, and Parametric Pixel LED styling."),
    ("Kia", "EV6 GT-Line AWD", 2024, "Electric", "Electric", "Automatic", 5, 7500, 4.9, 94, "Dual-motor 325 hp supercar acceleration with head-up display and Meridian sound."),
    ("BYD", "Seal Performance AWD", 2024, "Electric", "Electric", "Automatic", 5, 6800, 4.9, 95, "530 hp dual motors, 0-100 in 3.8s, and cell-to-body aerodynamic design."),
    ("Tata", "Curvv EV Accomplished+ 55", 2024, "Electric", "Electric", "Automatic", 5, 3600, 4.7, 92, "Futuristic electric SUV coupe with 502 km range, gesture tailgate, and Level 2 ADAS."),
    ("Volvo", "EX40 Recharge Twin AWD", 2024, "Electric", "Electric", "Automatic", 5, 8000, 4.8, 90, "408 hp blisteringly fast Swedish electric SUV with Google built-in interface."),
    ("BMW", "i4 eDrive40 M Sport", 2024, "Electric", "Electric", "Automatic", 5, 10500, 4.9, 93, "Sleek gran coupe delivering up to 590 km real-world range with iconic BMW dynamics."),
    ("BMW", "iX1 xDrive30 M Sport", 2024, "Electric", "Electric", "Automatic", 5, 8500, 4.8, 91, "Dual electric motors with 313 hp boost and adaptive M suspension."),
    ("Mercedes-Benz", "EQE 500 4MATIC SUV", 2024, "Electric", "Electric", "Automatic", 5, 16000, 4.9, 92, "Hyperscreen triple display, air suspension, and whisper-quiet electric touring."),
    ("Audi", "e-tron 55 Quattro", 2024, "Electric", "Electric", "Automatic", 5, 15000, 4.8, 89, "Electric Quattro torque vectoring, matrix LED headlights, and virtual mirrors.")
]

print(f"Total RAW Cars defined: {len(RAW_CARS)}")

def build_data():
    built_cars = []
    reg_series = ["AB", "AC", "AD", "AE", "AF", "AG", "AH", "AJ", "AK", "AL", "AM", "AN", "AP", "AR"]
    rto_dist = ["TN 74", "TN 75"] # Nagercoil & Marthandam

    for idx, item in enumerate(RAW_CARS, start=1):
        brand, model, year, category, fuel, trans, seats, price, rating, pop, desc = item
        pool = POOLS[category]
        p_len = len(pool)
        
        # 3 distinct angles for each car
        img1 = img_url(pool[(idx * 3) % p_len])
        img2 = img_url(pool[(idx * 3 + 1) % p_len])
        img3 = img_url(pool[(idx * 3 + 2) % p_len])
        images = [img1, img2, img3]

        loc = CITIES[(idx - 1) % len(CITIES)]
        reg_code = rto_dist[(idx - 1) % len(rto_dist)]
        reg_letters = reg_series[(idx - 1) % len(reg_series)]
        reg_number = f"{reg_code} {reg_letters} {1000 + idx}"

        feats = BASE_FEATURES + EXTRA_FEATURES[category]

        car_obj = {
            "id": idx,
            "brand": brand,
            "model": model,
            "registrationNumber": reg_number,
            "year": year,
            "category": category,
            "fuel": fuel,
            "transmission": trans,
            "seats": seats,
            "pricePerDay": price,
            "rating": rating,
            "location": loc,
            "popularity": pop,
            "image": img1,
            "images": images,
            "deposit": DEPOSITS[category],
            "available": True,
            "features": feats,
            "description": desc
        }
        built_cars.append(car_obj)

    return built_cars

if __name__ == "__main__":
    cars = build_data()
    print(f"Built {len(cars)} cars.")

    # 1. Write to client/src/data/cars.js
    client_cars_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "src", "data", "cars.js"))
    with open(client_cars_path, "w", encoding="utf-8") as f:
        f.write("// Complete 126+ Verified DRIVO Self-Drive Fleet across Kanniyakumari District\n")
        f.write("export const cars = ")
        json.dump(cars, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print(f"[1/3] Successfully wrote {len(cars)} cars to {client_cars_path}")

    # 2. Update Database
    db = SessionLocal()
    try:
        # Check existing cars in database
        existing_cars = {c.id: c for c in db.query(Car).all()}
        print(f"[2/3] Existing cars in database: {len(existing_cars)}")

        for car_data in cars:
            cid = car_data["id"]
            if cid in existing_cars:
                c = existing_cars[cid]
                c.brand = car_data["brand"]
                c.model = car_data["model"]
                c.registration_number = car_data["registrationNumber"]
                c.year = car_data["year"]
                c.category = car_data["category"]
                c.fuel = car_data["fuel"]
                c.transmission = car_data["transmission"]
                c.seats = car_data["seats"]
                c.price_per_day = car_data["pricePerDay"]
                c.rating = car_data["rating"]
                c.location = car_data["location"]
                c.popularity = car_data["popularity"]
                c.image = car_data["image"]
                c.images = car_data["images"]
                c.deposit = car_data["deposit"]
                c.available = car_data["available"]
                c.features = car_data["features"]
                c.description = car_data["description"]
            else:
                new_c = Car(
                    id=cid,
                    brand=car_data["brand"],
                    model=car_data["model"],
                    registration_number=car_data["registrationNumber"],
                    year=car_data["year"],
                    category=car_data["category"],
                    fuel=car_data["fuel"],
                    transmission=car_data["transmission"],
                    seats=car_data["seats"],
                    price_per_day=car_data["pricePerDay"],
                    rating=car_data["rating"],
                    location=car_data["location"],
                    popularity=car_data["popularity"],
                    image=car_data["image"],
                    images=car_data["images"],
                    deposit=car_data["deposit"],
                    available=car_data["available"],
                    features=car_data["features"],
                    description=car_data["description"]
                )
                db.add(new_c)

        db.commit()
        total_in_db = db.query(Car).count()
        print(f"[2/3] Successfully synchronized database. Total cars in DB: {total_in_db}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database sync error: {e}")
        raise
    finally:
        db.close()

