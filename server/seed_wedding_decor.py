from database import SessionLocal
from models import DecorationPackage

def seed_packages():
    db = SessionLocal()
    packages = [
        {
            "name": "Classic Wedding Decor",
            "slug": "classic-wedding-decor",
            "starting_price": 2000,
            "description": "Elegant and minimal wedding car styling with fresh roses, satin ribbon bonnet V-lines, and side mirror floral bows. Perfect for intimate ceremonies and modern city receptions.",
            "category": "Minimal & Ribbon",
            "image": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80"
            ],
            "included_items": [
                "Fresh Dutch Rose Bonnet Bouquet",
                "Dual-Tone Satin Ribbon V-Streamers",
                "4 Door Handle Ribbon Bows",
                "Both Side Mirrors Ribbon & Flower Accents",
                "Non-Damaging Surface Magnet & Suction Mounts",
                "On-Site Installation in Nagercoil & Kanyakumari"
            ],
            "duration": "1.5 - 2 Hours",
            "sort_order": 1,
        },
        {
            "name": "Traditional Floral Decor",
            "slug": "traditional-floral-decor",
            "starting_price": 3000,
            "description": "Authentic South Indian wedding decoration featuring fragrant fresh Jasmine (Malli), bright yellow and orange Marigolds, and traditional bonnet floral arches.",
            "category": "Traditional",
            "image": "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
            ],
            "included_items": [
                "Fresh Madurai Jasmine & Sevvanthi Bonnet Garland Arch",
                "Front Grille Traditional Floral Garland",
                "Side Mirror Jasmine Clusters",
                "4 Door Handles Jasmine & Rose Bows",
                "Rear Windshield Auspicious Floral Border",
                "Traditional Fragrance Spritz & Camphor Blessing"
            ],
            "duration": "2 - 2.5 Hours",
            "sort_order": 2,
        },
        {
            "name": "Premium Floral Decor",
            "slug": "premium-floral-decor",
            "starting_price": 4500,
            "description": "Contemporary luxury styling featuring imported purple & white Orchids, premium carnations, cascading bonnet waterfall flowers, and matching window borders.",
            "category": "Premium Floral",
            "image": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
            ],
            "included_items": [
                "Imported Bangkok Purple Orchids & White Lily Bonnet Waterfall",
                "Side Bodyline Organza Drape & Flower Sprays",
                "Rear Deck Grand Floral Cluster",
                "4 Door Handles Orchid & Gypsophila (Baby's Breath) Bunches",
                "Side Mirrors Orchid Bows",
                "Interior Dashboard Fresh Floral Fragrance Bouquet"
            ],
            "duration": "2.5 - 3 Hours",
            "sort_order": 3,
        },
        {
            "name": "Luxury Wedding Decor",
            "slug": "luxury-wedding-decor",
            "starting_price": 7000,
            "description": "The pinnacle of VIP bridal grandeur. Exotic Dutch roses, lilies, cascading carnations, full roof and trunk floral runners, and bespoke bride & groom monograms.",
            "category": "Luxury Royale",
            "image": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80"
            ],
            "included_items": [
                "Full Bonnet Imperial Floral Spread (150+ Fresh Red & White Dutch Roses)",
                "Grand Roof-to-Trunk Satin Ribbon Floral Runner",
                "Front & Rear Bumper Garland Accents",
                "All 4 Doors Elaborate Floral Crests with Silk Ribbons",
                "Rear Parcel Shelf Luxury Display",
                "Chauffeur Door Special Bride & Groom Boutonniere",
                "Custom Color Theme Matching Wedding Attire",
                "Dedicated Standby Touch-Up Florist at Venue"
            ],
            "duration": "3 - 4 Hours",
            "sort_order": 4,
        }
    ]

    for p in packages:
        existing = db.query(DecorationPackage).filter(DecorationPackage.slug == p["slug"]).first()
        if not existing:
            pkg = DecorationPackage(**p)
            db.add(pkg)
            print(f"Added package: {p['name']}")
        else:
            print(f"Package already exists: {p['name']}")
    db.commit()
    db.close()
    print("Decoration packages seeded successfully!")

if __name__ == "__main__":
    seed_packages()
