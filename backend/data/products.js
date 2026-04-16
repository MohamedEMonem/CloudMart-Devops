// In-memory product data — replace with a real database (e.g. MongoDB) later
// Added: rating, reviewCount fields for richer UI on the frontend
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 79.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    description:
      "High-quality wireless headphones with active noise cancellation and an impressive 30-hour battery life. Foldable design makes them ideal for travel.",
    stock: 15,
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: 2,
    name: "Running Sneakers",
    price: 54.99,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    description:
      "Lightweight and breathable sneakers engineered for long-distance running. Responsive foam cushioning absorbs impact and returns energy with every stride.",
    stock: 30,
    rating: 4.3,
    reviewCount: 94,
  },
  {
    id: 3,
    name: "Leather Backpack",
    price: 89.99,
    category: "Bags",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
    description:
      "Durable genuine leather backpack with multiple compartments, a padded laptop sleeve, and antique brass hardware. Fits up to a 15-inch laptop.",
    stock: 10,
    rating: 4.7,
    reviewCount: 61,
  },
  {
    id: 4,
    name: "Smart Watch",
    price: 199.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    description:
      "Feature-packed smartwatch with continuous heart-rate monitoring, built-in GPS, sleep tracking, and a 7-day battery. Water-resistant to 50 metres.",
    stock: 20,
    rating: 4.6,
    reviewCount: 203,
  },
  {
    id: 5,
    name: "Sunglasses",
    price: 34.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600",
    description:
      "UV400 polarized lenses in a lightweight acetate frame. Scratch-resistant coating and spring hinges for all-day comfort.",
    stock: 50,
    rating: 4.2,
    reviewCount: 47,
  },
  {
    id: 6,
    name: "Coffee Maker",
    price: 49.99,
    category: "Kitchen",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
    description:
      "Programmable 12-cup drip coffee maker with a built-in conical burr grinder, thermal carafe, and a 24-hour auto-brew timer.",
    stock: 8,
    rating: 4.4,
    reviewCount: 76,
  },
  {
    id: 7,
    name: "Polaroid Instant Camera",
    price: 64.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600",
    description:
      "Compact instant film camera with built-in flash, selfie mirror, and double-exposure mode. Prints credit-card-sized photos in seconds.",
    stock: 18,
    rating: 4.8,
    reviewCount: 112,
  },
  {
    id: 8,
    name: "Desk Lamp",
    price: 39.99,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
    description:
      "LED desk lamp with 5 colour temperatures, touch-dimming, USB-A charging port, and a flexible gooseneck arm.",
    stock: 22,
    rating: 4.1,
    reviewCount: 88,
  },
  {
    id: 9,
    name: "Mechanical Keyboard",
    price: 119.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    description:
      "Tenkeyless mechanical keyboard with Cherry MX Brown switches, PBT double-shot keycaps, and full per-key RGB backlighting.",
    stock: 12,
    rating: 4.9,
    reviewCount: 175,
  },
  {
    id: 10,
    name: "Canvas Tote Bag",
    price: 19.99,
    category: "Bags",
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600",
    description:
      "Heavyweight 12oz natural canvas tote with reinforced handles and an interior zip pocket. Machine washable.",
    stock: 60,
    rating: 4.0,
    reviewCount: 33,
  },
  {
    id: 11,
    name: "Resistance Bands Set",
    price: 24.99,
    category: "Sports",
    image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600",
    description:
      "Set of 5 latex resistance bands in progressive tensions (10–50 lb). Includes door anchor, handles, and a mesh carry bag.",
    stock: 35,
    rating: 4.3,
    reviewCount: 59,
  },
  {
    id: 12,
    name: "Ceramic Mug",
    price: 14.99,
    category: "Kitchen",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600",
    description:
      "Hand-thrown stoneware mug with a matte glaze finish. Holds 14 oz, dishwasher and microwave safe.",
    stock: 45,
    rating: 4.6,
    reviewCount: 41,
  },
];

module.exports = products;
