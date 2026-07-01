/**
 * Mock catalog data for UI/design work.
 *
 * TODO: Replace usages of `mockProducts` with `getProducts()` from
 * `./api` once the product-catalog service exposes images
 * and the storefront pages are wired to live data.
 */

export interface MockProduct {
  id: string;
  slug: string;
  name: string;
  vendorName: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  highlights: string[];
  images: string[];
  inStock: boolean;
}

export const categories = ["Audio", "Computing", "Mobile", "Wearables", "Smart Home"] as const;

export const mockProducts: MockProduct[] = [
  {
    id: "p1",
    slug: "aurora-wireless-headphones",
    name: "Aurora Wireless Headphones",
    vendorName: "Northwind Audio",
    category: "Audio",
    price: 179.99,
    compareAtPrice: 219.99,
    rating: 4.7,
    reviewCount: 312,
    description:
      "Over-ear headphones with adaptive noise cancellation, 40-hour battery life, and a plush memory-foam fit built for all-day listening.",
    highlights: ["Adaptive ANC", "40h battery", "Bluetooth 5.3", "USB-C fast charge"],
    images: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p2",
    slug: "echo-true-wireless-earbuds",
    name: "Echo True Wireless Earbuds",
    vendorName: "Northwind Audio",
    category: "Audio",
    price: 99.0,
    compareAtPrice: 129.0,
    rating: 4.4,
    reviewCount: 268,
    description:
      "Compact true-wireless earbuds with active noise cancellation, IPX5 sweat resistance, and a pocket-sized charging case good for 24 extra hours.",
    highlights: ["Active noise cancelling", "IPX5 rated", "24h with case", "Touch controls"],
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p3",
    slug: "halo-pro-smartphone",
    name: "Halo Pro Smartphone",
    vendorName: "Pulsewave Electronics",
    category: "Mobile",
    price: 899.0,
    rating: 4.6,
    reviewCount: 421,
    description:
      "A 6.7\" flagship smartphone with a triple-lens camera system, all-day battery, and a titanium frame built to last.",
    highlights: ["6.7\" 120Hz display", "Triple camera system", "5000mAh battery", "256GB storage"],
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p4",
    slug: "voyager-power-bank-20000",
    name: "Voyager Power Bank 20000mAh",
    vendorName: "Pulsewave Electronics",
    category: "Mobile",
    price: 49.0,
    rating: 4.5,
    reviewCount: 312,
    description:
      "A high-capacity power bank with dual USB-C PD fast charging — enough to recharge a phone five times or a laptop once over.",
    highlights: ["20000mAh capacity", "65W USB-C PD", "Charges 2 devices at once", "LED charge display"],
    images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p5",
    slug: "flux-14-ultrabook",
    name: "Flux 14 Ultrabook Laptop",
    vendorName: "Vertex Devices",
    category: "Computing",
    price: 1099.0,
    compareAtPrice: 1299.0,
    rating: 4.6,
    reviewCount: 203,
    description:
      "A 14-inch ultrabook with a fanless aluminum chassis, all-day battery life, and a 2.8K display tuned for color accuracy.",
    highlights: ["14\" 2.8K display", "16GB RAM / 512GB SSD", "18h battery", "1.2kg aluminum chassis"],
    images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p6",
    slug: "satellite-mechanical-keyboard",
    name: "Satellite Mechanical Keyboard",
    vendorName: "Vertex Devices",
    category: "Computing",
    price: 139.0,
    rating: 4.5,
    reviewCount: 198,
    description:
      "A compact 75% mechanical keyboard with hot-swappable switches, per-key RGB, and a machined aluminum frame.",
    highlights: ["Hot-swap switches", "75% layout", "Per-key RGB", "Aluminum frame"],
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p7",
    slug: "quantum-gaming-mouse",
    name: "Quantum Gaming Mouse",
    vendorName: "Vertex Devices",
    category: "Computing",
    price: 64.0,
    compareAtPrice: 79.0,
    rating: 4.3,
    reviewCount: 287,
    description:
      "A lightweight wireless gaming mouse with a 26,000 DPI optical sensor, zero-lag 1ms polling, and a 70-hour battery.",
    highlights: ["26,000 DPI sensor", "1ms wireless polling", "70h battery", "63g lightweight shell"],
    images: ["https://images.unsplash.com/photo-1527814050087-3793815479db?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p8",
    slug: "glacier-portable-ssd-1tb",
    name: "Glacier Portable SSD 1TB",
    vendorName: "Vertex Devices",
    category: "Computing",
    price: 109.0,
    rating: 4.8,
    reviewCount: 356,
    description:
      "A pocket-sized 1TB SSD rated for 1050MB/s transfer speeds, with a shock-resistant aluminum shell and USB-C cable included.",
    highlights: ["1TB capacity", "1050MB/s read speed", "IP65 dust/water resistant", "USB-C included"],
    images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&q=80&auto=format&fit=crop"],
    inStock: false,
  },
  {
    id: "p9",
    slug: "pulse-smartwatch-se",
    name: "Pulse Smartwatch SE",
    vendorName: "Orbit Tech",
    category: "Wearables",
    price: 249.0,
    rating: 4.4,
    reviewCount: 158,
    description:
      "Track workouts, sleep, and heart rate with a vivid always-on display and 10-day battery life in a lightweight aluminum case.",
    highlights: ["Always-on display", "10-day battery", "Water resistant 5ATM", "Heart-rate + SpO2"],
    images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p10",
    slug: "drift-fitness-band",
    name: "Drift Fitness Band",
    vendorName: "Orbit Tech",
    category: "Wearables",
    price: 59.0,
    compareAtPrice: 75.0,
    rating: 4.5,
    reviewCount: 245,
    description:
      "A slim fitness band with continuous heart-rate tracking, sleep stages, and a 2-week battery life in a featherlight band.",
    highlights: ["2-week battery", "24/7 heart-rate tracking", "Sleep stage tracking", "5ATM water resistant"],
    images: ["https://images.unsplash.com/photo-1557935728-e6d1eaabe558?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p11",
    slug: "nova-smart-speaker",
    name: "Nova Smart Speaker",
    vendorName: "Nimbus Labs",
    category: "Smart Home",
    price: 79.0,
    rating: 4.6,
    reviewCount: 167,
    description:
      "A voice-controlled smart speaker with room-filling 360° sound and built-in smart-home hub for lights, plugs, and thermostats.",
    highlights: ["360° room-filling sound", "Built-in smart-home hub", "Voice assistant ready", "Multi-room audio"],
    images: ["https://images.unsplash.com/photo-1543512214-318c7553f230?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p12",
    slug: "aether-robot-vacuum",
    name: "Aether Robot Vacuum",
    vendorName: "Nimbus Labs",
    category: "Smart Home",
    price: 329.0,
    compareAtPrice: 399.0,
    rating: 4.7,
    reviewCount: 289,
    description:
      "A self-emptying robot vacuum with LiDAR room mapping, app-controlled no-go zones, and 2700Pa suction for carpets and hard floors alike.",
    highlights: ["LiDAR room mapping", "Self-emptying base", "2700Pa suction", "App scheduling"],
    images: ["https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
  {
    id: "p13",
    slug: "lumen-smart-bulb-4-pack",
    name: "Lumen Smart Bulb 4-Pack",
    vendorName: "Nimbus Labs",
    category: "Smart Home",
    price: 44.0,
    rating: 4.5,
    reviewCount: 198,
    description:
      "Color-changing smart bulbs that pair directly to your phone or voice assistant — no hub required. 16 million colors, scheduled scenes.",
    highlights: ["16M colors", "No hub required", "Voice assistant compatible", "Scheduled scenes"],
    images: ["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=1200&q=80&auto=format&fit=crop"],
    inStock: true,
  },
];

export function getFeaturedProducts(count = 4): MockProduct[] {
  return mockProducts.filter((p) => p.rating >= 4.5).slice(0, count);
}

export function getProductBySlug(slug: string): MockProduct | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(category?: string): MockProduct[] {
  if (!category || category === "All") return mockProducts;
  return mockProducts.filter((p) => p.category === category);
}

export function getRelatedProducts(product: MockProduct, count = 4): MockProduct[] {
  return mockProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, count);
}

export function getCategoryBySlug(slug: string): (typeof categories)[number] | undefined {
  return categories.find((c) => c.toLowerCase() === slug.toLowerCase());
}

export function searchProducts(query: string): MockProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.vendorName.toLowerCase().includes(q),
  );
}
