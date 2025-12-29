"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// 1. Update the type definition for params to be a Promise
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // 2. Unwrap the params Promise
  const { id } = use(params);

  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState('');
  const [cartQty, setCartQty] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // 3. Fetch Product using the unwrapped 'id'
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id) // Use 'id' here
        .single();

      if (data) {
        setProduct(data);
        // Default to first image in array, fallback to old image_url
        setActiveImage(data.images?.[0] || data.image_url);
      }
    };

    if (id) fetchProduct();

    // 4. Sync Cart using the unwrapped 'id'
    const cart = JSON.parse(localStorage.getItem('whiskd_cart') || '{}');
    if (cart[id]) {
      setCartQty(cart[id]);
    }
  }, [id]); // Update dependency array to use 'id'

  const updateCart = (delta: number) => {
    if (!product) return;
    
    const newQty = Math.max(0, cartQty + delta);
    setCartQty(newQty);
    
    // Save to LocalStorage
    const cart = JSON.parse(localStorage.getItem('whiskd_cart') || '{}');
    
    // logic: if qty is 0, remove from cart, else update
    if (newQty === 0) {
      delete cart[product.id];
    } else {
      cart[product.id] = newQty;
    }
    
    localStorage.setItem('whiskd_cart', JSON.stringify(cart));
    
    // Also update product list helper for checkout
    const products = JSON.parse(localStorage.getItem('whiskd_products') || '[]');
    // Check if product already exists in the cache
    const existingIndex = products.findIndex((p: any) => p.id === product.id);
    
    if (existingIndex === -1 && newQty > 0) {
      // Add if not exists and qty > 0
      products.push(product);
    } else if (existingIndex > -1 && newQty === 0) {
      // Remove if exists and qty becomes 0 (optional cleanup)
      products.splice(existingIndex, 1);
    }
    
    localStorage.setItem('whiskd_products', JSON.stringify(products));
    
    // Dispatch storage event so navbar updates immediately
    window.dispatchEvent(new Event('storage'));
  };

  if (!product) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const imageList = product.images || [product.image_url];

  return (
    <div className="min-h-screen bg-[#F9F5F0] text-[#4B3621] font-sans">
      
      {/* Navbar Simple */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/menu" className="flex items-center gap-2 font-bold hover:text-[#C5A059] transition">
          <ArrowLeft size={20} /> Back to Menu
        </Link>
        <Link href="/" className="font-serif font-bold text-2xl">Whisk'd.</Link>
        <Link href="/checkout" className="relative">
          <ShoppingBag size={24} />
          {/* Simple dot if cart has items */}
          {cartQty > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-12 mt-4">
        
        {/* LEFT: IMAGE GALLERY */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden border border-[#4B3621]/10 relative group">
            <img src={activeImage} className="w-full h-full object-cover" alt={product.name} />
          </div>

          {/* Thumbnails */}
          {imageList.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {imageList.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-[#C5A059] opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`${product.name} thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{product.name}</h1>
          <p className="text-2xl text-[#C5A059] font-bold mb-6">₹{product.price}</p>
          
          <div className="prose text-gray-600 mb-8 leading-relaxed">
            {product.description || "A delicious handcrafted delight made with the finest ingredients."}
          </div>

          {/* Action Area */}
          <div className="border-t border-[#4B3621]/10 pt-8">
            <div className="flex items-center gap-6 mb-6">
               <span className="font-bold uppercase tracking-wider text-xs">Quantity</span>
               <div className="flex items-center gap-4 bg-white border border-[#4B3621]/20 rounded-full px-4 py-2">
                 <button onClick={() => updateCart(-1)} className="text-xl px-2 hover:text-[#C5A059]">-</button>
                 <span className="font-bold w-4 text-center">{cartQty}</span>
                 <button onClick={() => updateCart(1)} className="text-xl px-2 hover:text-[#C5A059]">+</button>
               </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => updateCart(1)} className="flex-1 bg-[#4B3621] text-white py-4 rounded-xl font-bold hover:bg-[#2C1A11] transition shadow-lg">
                Add to Order
              </button>
              {cartQty > 0 && (
                <Link href="/checkout" className="flex-1 bg-[#C5A059] text-white py-4 rounded-xl font-bold hover:bg-[#b08d4b] transition shadow-lg text-center">
                  Checkout Now
                </Link>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}