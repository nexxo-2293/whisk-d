"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// CORRECT IMPORT for linking pages
import Link from 'next/link';

export default function MenuPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const router = useRouter();

  useEffect(() => {
    supabase.from('products').select('*').eq('is_available', true).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const updateQty = (id: number, delta: number) => {
    setCart(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  };

  const proceed = () => {
    localStorage.setItem('whiskd_cart', JSON.stringify(cart));
    localStorage.setItem('whiskd_products', JSON.stringify(products));
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] text-[#4B3621] p-6 pb-24">
      <h1 className="text-4xl font-serif font-bold text-center mb-8">Our Menu</h1>
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {products.map((p) => {
          // Handle logic for displaying first image
          const displayImage = p.images?.[0] || p.image_url || '/placeholder.jpg';

          return (
            <div key={p.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col sm:flex-row transition hover:shadow-xl">
              
              {/* LINK WRAPPER FOR IMAGE */}
              <Link href={`/product/${p.id}`} className="sm:w-48 h-48 bg-gray-200 block cursor-pointer group">
                <img 
                  src={displayImage} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  alt={p.name}
                />
              </Link>
              
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* LINK WRAPPER FOR TITLE */}
                  <Link href={`/product/${p.id}`}>
                    <h3 className="text-xl font-bold hover:text-[#C5A059] transition cursor-pointer">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-sm opacity-70 mb-2 line-clamp-2">{p.description}</p>
                  <p className="text-lg font-bold text-[#4B3621]">₹{p.price}</p>
                </div>
          
                <div className="flex items-center gap-4 mt-4 bg-gray-100 w-fit px-3 py-1 rounded-full">
                  <button onClick={() => updateQty(p.id, -1)} className="text-xl font-bold px-2 hover:text-[#C5A059]">-</button>
                  <span className="font-bold">{cart[p.id] || 0}</span>
                  <button onClick={() => updateQty(p.id, 1)} className="text-xl font-bold px-2 hover:text-[#C5A059]">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Floating Cart Bar */}
      {Object.values(cart).some(q => q > 0) && (
        <div className="fixed bottom-0 left-0 w-full bg-[#4B3621] p-4 text-[#F5F5DC] shadow-2xl z-50 animate-in slide-in-from-bottom-5">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
             <span className="font-bold">Items in Cart</span>
             <button onClick={proceed} className="bg-[#C5A059] text-[#2C1A11] px-8 py-2 rounded-lg font-bold hover:bg-white transition">
               Checkout
             </button>
          </div>
        </div>
      )}
    </div>
  );
}