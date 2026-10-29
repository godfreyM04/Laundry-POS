-- LaundryPOS: Standard Seed Data
-- Services Catalogue & Default Operational Data

INSERT INTO public.services (name, category, description, price, unit, is_active) VALUES
('Wash & Fold (Regular Laundry)', 'Wash & Fold', 'Everyday clothes washed, tumbled dried, and neatly folded.', 150.00, 'kg', true),
('Wash & Press (Full Service)', 'Wash & Iron', 'Thorough wash, tumble dry, and crisp steam pressed on hangers.', 250.00, 'kg', true),
('Steam Pressing Only (Shirts & Trousers)', 'Ironing & Pressing', 'Professional wrinkle-free steam ironing for work and formal wear.', 80.00, 'item', true),
('Dry Cleaning: 2-Piece Suit', 'Dry Cleaning', 'Gentle eco-solvent dry clean and deluxe hand finish for suit jacket & trousers.', 800.00, 'suit', true),
('Dry Cleaning: Evening Gown / Dress', 'Dry Cleaning', 'Delicate fabric care, beadwork inspection, and gentle finish.', 700.00, 'item', true),
('Dry Cleaning: Winter Coat / Trench / Blazer', 'Dry Cleaning', 'Heavy fabric deep clean, stain removal, and structural form press.', 600.00, 'item', true),
('Duvet / Comforter (Queen / King Size)', 'Bedding & Linens', 'Hypoallergenic deep clean, thermal sanitization, and fluff drying.', 1000.00, 'item', true),
('Heavy Wool Blanket / Fleece Bedspread', 'Bedding & Linens', 'Soft-touch antibacterial wash and fiber restoration.', 600.00, 'item', true),
('Curtains & Drapes Sanitizing', 'Home Care', 'Dust-mite extraction, steam wash, and odor neutralization.', 300.00, 'kg', true),
('Sneaker & Shoe Deep Clean', 'Footwear', 'Hand scrub of midsoles, uppers, laces wash, and deodorization.', 500.00, 'pair', true)
ON CONFLICT DO NOTHING;

-- Initial Demonstration Customers
INSERT INTO public.customers (full_name, phone, email, address, notes) VALUES
('Grace Wanjiku', '+254712345678', 'grace.wanjiku@example.com', 'Apartment 4B, Kilimani Gardens, Nairobi', 'Prefers lavender scent softener. Sensitive to heavy starch.'),
('David Kiprop', '+254722987654', 'david.k@example.com', 'House 12, Riverside Drive, Nairobi', 'Delivers suits weekly. Always calls before dropoff.'),
('Amina Mohamed', '+254733456789', 'amina.m@example.com', 'Block C, Parklands Heights, Nairobi', 'Express pickup requests frequently. Leave with concierge if not home.')
ON CONFLICT (phone) DO NOTHING;
