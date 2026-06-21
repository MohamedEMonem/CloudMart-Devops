const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://catalog_user:catalog_secret@localhost:27018/catalog_db?authSource=admin';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  description: { type: String, default: '' },
}, { timestamps: true, collection: 'categories' });

const productSchema = new mongoose.Schema({
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: { type: [String], default: [] },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  attributes: { type: Object, default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'products' });

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Category = mongoose.model('Category', categorySchema);
    const Product = mongoose.model('Product', productSchema);

    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('Creating categories...');
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets and electronic devices',
    });

    const clothing = await Category.create({
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel and fashion',
    });

    console.log('Creating products...');
    const vendorId = '123e4567-e89b-12d3-a456-426614174000'; // Mock vendor ID
    const vendorName = 'Tech Store EG';

    await Product.create([
      {
        vendorId,
        vendorName,
        name: 'Wireless Noise Cancelling Headphones',
        slug: 'wireless-noise-cancelling-headphones',
        description: 'Premium noise cancelling headphones with 30-hour battery life.',
        price: 299.99,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
        categoryId: electronics._id,
        attributes: { color: 'Black', wireless: true },
      },
      {
        vendorId,
        vendorName,
        name: 'Smart Watch Series 7',
        slug: 'smart-watch-series-7',
        description: 'Advanced fitness and health tracking smartwatch.',
        price: 399.00,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80'],
        categoryId: electronics._id,
        attributes: { size: '44mm', color: 'Midnight' },
      },
      {
        vendorId,
        vendorName,
        name: '4K Ultra HD Smart TV',
        slug: '4k-ultra-hd-smart-tv',
        description: '55-inch 4K UHD Smart TV with HDR support.',
        price: 549.99,
        images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80'],
        categoryId: electronics._id,
        attributes: { size: '55 inch', resolution: '4K' },
      },
      {
        vendorId: '987fcdeb-51a2-43d7-9012-345678901234',
        vendorName: 'Fashion Hub',
        name: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-t-shirt',
        description: '100% organic cotton t-shirt for everyday wear.',
        price: 24.99,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
        categoryId: clothing._id,
        attributes: { size: 'M', color: 'White' },
      },
      {
        vendorId: '987fcdeb-51a2-43d7-9012-345678901234',
        vendorName: 'Fashion Hub',
        name: 'Denim Jacket',
        slug: 'denim-jacket',
        description: 'Vintage style denim jacket with a comfortable fit.',
        price: 89.99,
        images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80'],
        categoryId: clothing._id,
        attributes: { size: 'L', color: 'Blue' },
      }
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
