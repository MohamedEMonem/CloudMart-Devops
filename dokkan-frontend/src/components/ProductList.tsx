import { useEffect, useState } from 'react';
import { getProducts, type Product } from '@/lib/api/products';
import ProductCard from './ProductCard';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getProducts();
        setProducts(res.data);
      } catch (err: any) {
        setError('Failed to load products. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-white/5" />
            <div className="p-5 space-y-3">
              <div className="h-6 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/10 rounded w-1/4" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-5/6" />
              </div>
              <div className="flex justify-between items-center mt-6">
                <div className="h-6 bg-white/10 rounded w-16" />
                <div className="h-8 bg-white/10 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-red-500/20 bg-red-500/5 rounded-2xl">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="text-xl font-bold text-red-400 mb-2">Oops!</h3>
        <p className="text-white/60">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 bg-white/5 rounded-2xl">
        <span className="text-4xl mb-4">📦</span>
        <h3 className="text-xl font-bold text-white mb-2">No Products Found</h3>
        <p className="text-white/40">Check back later for new arrivals.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
            Featured Products
          </h2>
          <p className="text-sm text-white/40">
            Discover premium items from our top vendors.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          {/* Mock filters for aesthetics */}
          {['All', 'Tech', 'Apparel', 'Home'].map((tag, i) => (
            <button
              key={tag}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === 0 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
