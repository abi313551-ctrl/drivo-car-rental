import sys
import json
from sqlalchemy import text
from database import engine

def migrate():
    print("Running Wedding Enhancement migration...")
    with engine.connect() as conn:
        # 1. Create drivers table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS drivers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(30) NOT NULL,
                license_number VARCHAR(50) NOT NULL,
                experience_years INT DEFAULT 5,
                rating FLOAT DEFAULT 4.9,
                photo VARCHAR(255) NULL,
                is_active TINYINT(1) DEFAULT 1,
                city VARCHAR(60) DEFAULT 'Nagercoil',
                notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))

        # 2. Create driver_pricing_configs table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS driver_pricing_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                base_driver_fee INT DEFAULT 1000,
                included_hours INT DEFAULT 8,
                included_km INT DEFAULT 100,
                overtime_rate_per_hour INT DEFAULT 200,
                extra_km_rate INT DEFAULT 20,
                is_active TINYINT(1) DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))

        # 3. Add columns to decoration_packages if missing
        cols_decor = [r[0] for r in conn.execute(text("SHOW COLUMNS FROM decoration_packages")).fetchall()]
        if "compatible_categories" not in cols_decor:
            conn.execute(text("ALTER TABLE decoration_packages ADD COLUMN compatible_categories JSON NULL"))
            print("Added compatible_categories to decoration_packages")
        if "theme" not in cols_decor:
            conn.execute(text("ALTER TABLE decoration_packages ADD COLUMN theme VARCHAR(60) NULL"))
            print("Added theme to decoration_packages")
        if "badge" not in cols_decor:
            conn.execute(text("ALTER TABLE decoration_packages ADD COLUMN badge VARCHAR(60) NULL"))
            print("Added badge to decoration_packages")
        if "subtitle" not in cols_decor:
            conn.execute(text("ALTER TABLE decoration_packages ADD COLUMN subtitle VARCHAR(120) NULL"))
            print("Added subtitle to decoration_packages")

        # 4. Add columns to wedding_decoration_bookings if missing
        cols_wbook = [r[0] for r in conn.execute(text("SHOW COLUMNS FROM wedding_decoration_bookings")).fetchall()]
        if "drive_mode" not in cols_wbook:
            conn.execute(text("ALTER TABLE wedding_decoration_bookings ADD COLUMN drive_mode VARCHAR(30) DEFAULT 'with_driver'"))
            print("Added drive_mode to wedding_decoration_bookings")
        if "pickup_location" not in cols_wbook:
            conn.execute(text("ALTER TABLE wedding_decoration_bookings ADD COLUMN pickup_location VARCHAR(255) NULL"))
            print("Added pickup_location to wedding_decoration_bookings")
        if "destination" not in cols_wbook:
            conn.execute(text("ALTER TABLE wedding_decoration_bookings ADD COLUMN destination VARCHAR(255) NULL"))
            print("Added destination to wedding_decoration_bookings")
        if "expected_duration_hours" not in cols_wbook:
            conn.execute(text("ALTER TABLE wedding_decoration_bookings ADD COLUMN expected_duration_hours INT DEFAULT 8"))
            print("Added expected_duration_hours to wedding_decoration_bookings")
        if "expected_distance_km" not in cols_wbook:
            conn.execute(text("ALTER TABLE wedding_decoration_bookings ADD COLUMN expected_distance_km INT DEFAULT 100"))
            print("Added expected_distance_km to wedding_decoration_bookings")
        if "driver_id" not in cols_wbook:
            conn.execute(text("ALTER TABLE wedding_decoration_bookings ADD COLUMN driver_id INT NULL"))
            print("Added driver_id to wedding_decoration_bookings")

        # 5. Seed default driver pricing config if empty
        count_cfg = conn.execute(text("SELECT COUNT(*) FROM driver_pricing_configs")).scalar()
        if count_cfg == 0:
            conn.execute(text("""
                INSERT INTO driver_pricing_configs (id, base_driver_fee, included_hours, included_km, overtime_rate_per_hour, extra_km_rate, is_active)
                VALUES (1, 1000, 8, 100, 200, 20, 1)
            """))
            print("Seeded default driver pricing config")

        # 6. Seed verified drivers if empty
        count_drivers = conn.execute(text("SELECT COUNT(*) FROM drivers")).scalar()
        if count_drivers == 0:
            sample_drivers = [
                ("Murugan S.", "+91 98421 11223", "TN74 20120004561", 12, 4.95, "Nagercoil", "Expert bridal chauffeur with 12+ years experience. Punctual and professional in traditional attire."),
                ("Antony Raj M.", "+91 98433 22334", "TN74 20150007892", 9, 4.90, "Kanyakumari", "Courteous driver specializing in VIP luxury processions and temple wedding drop-offs."),
                ("Rajesh Kumar V.", "+91 98412 33445", "TN75 20170001234", 7, 4.88, "Marthandam", "Smooth highway driver with defensive driving certification. Fluent in Tamil and Malayalam."),
                ("Selvam T.", "+91 94431 44556", "TN74 20100009876", 14, 4.98, "Nagercoil", "Senior master chauffeur for high-profile weddings in Nagercoil and Trivandrum routes.")
            ]
            for d in sample_drivers:
                conn.execute(text("""
                    INSERT INTO drivers (name, phone, license_number, experience_years, rating, city, notes, is_active)
                    VALUES (:name, :phone, :lic, :exp, :rat, :city, :notes, 1)
                """), {"name": d[0], "phone": d[1], "lic": d[2], "exp": d[3], "rat": d[4], "city": d[5], "notes": d[6]})
            print("Seeded 4 verified wedding drivers")

        # 7. Seed or update the 6 required decoration packages
        DESIGNS = [
            {
                "slug": "classic-red-roses",
                "name": "Classic Red Roses",
                "theme": "red_roses",
                "starting_price": 2500,
                "badge": "Timeless Romance",
                "subtitle": "Fresh Dutch Roses & Satin Accents",
                "description": "Timeless deep red velvet Dutch roses arranged in an auspicious heart arch on the bonnet, complemented with matching door handle corsages and satin streamers.",
                "category": "Floral",
                "image": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
                "included_items": json.dumps([
                    "Heart-shaped fresh red Dutch rose hood crown",
                    "Dual-tone red & gold satin ribbon streamers",
                    "4 door handle matching ribbon corsages",
                    "Both side mirrors floral ribbon clusters",
                    "Scratchless silicone suction mounts",
                    "On-site installation in Nagercoil & Kanyakumari"
                ]),
                "compatible_categories": json.dumps(["Sedan", "SUV", "Luxury", "MUV / MPV", "Hatchback"]),
                "duration": "2 - 3 Hours",
                "sort_order": 1,
            },
            {
                "slug": "white-floral-theme",
                "name": "White Floral Theme",
                "theme": "white_floral",
                "starting_price": 3500,
                "badge": "Church & Evening Special",
                "subtitle": "Elegance with Oriental Lilies & Orchids",
                "description": "Serene and sophisticated white oriental lilies, white carnations, and baby's breath designed for church nuptials, reception arrivals, and luxury sedans.",
                "category": "Floral",
                "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
                "included_items": json.dumps([
                    "White oriental lilies & baby's breath bonnet cascade",
                    "Dual-tone ivory and champagne satin ribbons",
                    "4 luxury door handle clusters with gypsophila",
                    "Rear glass elegant floral swag",
                    "Gentle paint-safe fixing & water tubes"
                ]),
                "compatible_categories": json.dumps(["Sedan", "SUV", "Luxury", "MUV / MPV"]),
                "duration": "2.5 - 3 Hours",
                "sort_order": 2,
            },
            {
                "slug": "pink-bridal-theme",
                "name": "Pink Bridal Theme",
                "theme": "pink_bridal",
                "starting_price": 4000,
                "badge": "Bridal Favorite",
                "subtitle": "Pastel Peach, Blush & Eucalyptus",
                "description": "Delicate pastel blush and peach roses styled with eucalyptus greenery, curated to complement bride's pastel lehengas and Kanchipuram silk sarees.",
                "category": "Floral",
                "image": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
                "included_items": json.dumps([
                    "Pastel peach and pink Dutch rose V-arch",
                    "Eucalyptus and gypsophila foliage accents",
                    "4 matching door corsages with pearl beads",
                    "Silk ribbon side runners along wheel arches",
                    "On-site setup guarantee"
                ]),
                "compatible_categories": json.dumps(["Sedan", "SUV", "Luxury", "Hatchback"]),
                "duration": "2.5 - 3.5 Hours",
                "sort_order": 3,
            },
            {
                "slug": "traditional-marigold-decoration",
                "name": "Traditional Marigold Decoration",
                "theme": "marigold",
                "starting_price": 2800,
                "badge": "Auspicious Muhurtham",
                "subtitle": "Madurai Jasmine & Golden Marigolds",
                "description": "Auspicious yellow and orange fresh marigold (sevvanthi) garlands with fragrant Madurai jasmine drapes, perfect for traditional South Indian Hindu Muhurthams.",
                "category": "Traditional",
                "image": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
                "included_items": json.dumps([
                    "Auspicious dual-tone marigold hood garland",
                    "Madurai malli (fresh jasmine) fragrant drapes",
                    "Mango leaf auspicious toran for front grill",
                    "4 door handle marigold clusters",
                    "Puja coconut & betel leaf tray styling on dashboard"
                ]),
                "compatible_categories": json.dumps(["Sedan", "SUV", "Luxury", "MUV / MPV", "Hatchback"]),
                "duration": "2 Hours",
                "sort_order": 4,
            },
            {
                "slug": "premium-floral-decoration",
                "name": "Premium Floral Decoration",
                "theme": "premium_floral",
                "starting_price": 5500,
                "badge": "Grand Royal Grandeur",
                "subtitle": "Exotic Thai Orchids & Anthuriums",
                "description": "Extravagant imported orchid, anthurium, and grand rose bonnet arch with full dicky styling, designed for VIP processions and luxury cars.",
                "category": "Luxury",
                "image": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
                "included_items": json.dumps([
                    "Grand full-width imported Thai orchid & rose hood arch",
                    "Full rear trunk floral swag with matching foliage",
                    "All 4 door handles & both side mirror luxury corsages",
                    "Interior dashboard subtle floral accent",
                    "Water-tube vials keeping flowers fresh 12+ hours"
                ]),
                "compatible_categories": json.dumps(["Sedan", "SUV", "Luxury", "MUV / MPV"]),
                "duration": "3 - 4 Hours",
                "sort_order": 5,
            },
            {
                "slug": "custom-decoration",
                "name": "Custom Decoration",
                "theme": "custom",
                "starting_price": 3000,
                "badge": "Bespoke Styling",
                "subtitle": "Tailored to Your Pinterest or Wedding Theme",
                "description": "Bespoke styling tailored to your exact moodboard, Pinterest board, or wedding theme color palette. Direct consultation with our master florist.",
                "category": "Custom",
                "image": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
                "included_items": json.dumps([
                    "Personal florist consultation via WhatsApp/Call",
                    "Custom flower sourcing according to bride/groom attire",
                    "Full vehicle bonnet & door handle custom styling",
                    "Inspiration photo exact replication guarantee",
                    "Flexible on-venue touchups before procession"
                ]),
                "compatible_categories": json.dumps(["Sedan", "SUV", "Luxury", "MUV / MPV", "Hatchback"]),
                "duration": "Flexible",
                "sort_order": 6,
            },
        ]

        for des in DESIGNS:
            existing = conn.execute(text("SELECT id FROM decoration_packages WHERE slug = :slug"), {"slug": des["slug"]}).first()
            if existing:
                conn.execute(text("""
                    UPDATE decoration_packages
                    SET name = :name,
                        theme = :theme,
                        starting_price = :starting_price,
                        badge = :badge,
                        subtitle = :subtitle,
                        description = :description,
                        category = :category,
                        image = :image,
                        included_items = :included_items,
                        compatible_categories = :compatible_categories,
                        duration = :duration,
                        sort_order = :sort_order,
                        is_active = 1
                    WHERE id = :id
                """), {**des, "id": existing[0]})
            else:
                conn.execute(text("""
                    INSERT INTO decoration_packages
                    (name, slug, theme, starting_price, badge, subtitle, description, category, image, included_items, compatible_categories, duration, service_areas, is_active, sort_order, created_at, updated_at)
                    VALUES
                    (:name, :slug, :theme, :starting_price, :badge, :subtitle, :description, :category, :image, :included_items, :compatible_categories, :duration, 'Nagercoil, Kanyakumari & Surrounding Districts', 1, :sort_order, NOW(), NOW())
                """), des)

        conn.commit()
        print("Migration and seeding completed successfully!")

if __name__ == "__main__":
    migrate()
