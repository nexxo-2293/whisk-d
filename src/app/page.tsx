"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingBag, User, Menu as MenuIcon, X, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // Stores auth user + is_admin flag
  
  // Dynamic Data
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // --- 1. INITIAL FETCH (Auth & Reviews) ---
  useEffect(() => {
    const init = async () => {
      // A. Check Current User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch Profile to check if Admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', authUser.id)
          .single();
          
        // Merge auth data with admin flag for easier UI logic
        setUser({ ...authUser, is_admin: profile?.is_admin });
      }

      // B. Fetch Reviews from DB
      const { data: reviewData } = await supabase.from('testimonials').select('*');
      if (reviewData && reviewData.length > 0) {
        setReviews(reviewData);
      }
    };

    init();

    // Scroll Listener
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 2. REVIEW SLIDER TIMER ---
  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews]);

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#F9F5F0] text-[#4B3621] font-sans selection:bg-[#C5A059] selection:text-white">
      
      {/* --- STICKY NAVBAR --- */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className={`font-serif font-bold text-2xl tracking-tighter ${isScrolled ? 'text-[#4B3621]' : 'text-white'}`}>
            Whisk'd<span className="text-[#C5A059]">.</span>
          </Link>

          {/* Desktop Links */}
          <div className={`hidden md:flex items-center gap-8 font-medium text-sm ${isScrolled ? 'text-[#4B3621]' : 'text-white'}`}>
            <Link href="/menu" className="hover:text-[#C5A059] transition">Our Menu</Link>
            
            {/* AUTH BUTTONS LOGIC */}
            {user ? (
              <div className="flex items-center gap-4">
                 {/* IF ADMIN: Show Dashboard Button */}
                 {user.is_admin ? (
                   <Link href="/admin" className="flex items-center gap-2 text-[#C5A059] font-bold border border-[#C5A059] px-4 py-2 rounded-full hover:bg-[#C5A059] hover:text-white transition">
                      <LayoutDashboard size={16} /> Admin Panel
                   </Link>
                 ) : (
                   /* IF CUSTOMER: Show Profile Link */
                   <Link href="/profile" className="flex items-center gap-2 hover:text-[#C5A059] transition font-bold">
                      <User size={18} /> My Profile
                   </Link>
                 )}
                 
                 <button onClick={handleLogout} className="flex items-center gap-2 hover:text-red-400 transition" title="Logout">
                    <LogOut size={18} />
                 </button>
              </div>
            ) : (
              /* IF GUEST: Show Login Link */
              <Link href="/auth" className="flex items-center gap-2 hover:text-[#C5A059] transition">
                <User size={18} /> Login
              </Link>
            )}

            <Link href="/menu">
              <button className="bg-[#C5A059] text-white px-5 py-2 rounded-full font-bold hover:bg-[#b08d4b] transition shadow-lg flex items-center gap-2">
                Order <ShoppingBag size={16} />
              </button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-[#C5A059]">
            {mobileMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col p-6 gap-4 md:hidden animate-in slide-in-from-top-5 text-[#4B3621]">
             <Link href="/menu" className="text-lg font-serif font-bold">Our Menu</Link>
             
             {user ? (
               <>
                 {user.is_admin ? (
                   <Link href="/admin" className="text-lg font-serif font-bold text-[#C5A059]">Go to Admin Panel</Link>
                 ) : (
                   <Link href="/profile" className="text-lg font-serif">My Profile</Link>
                 )}
                 <button onClick={handleLogout} className="text-left text-lg font-serif text-red-500">Logout</button>
               </>
             ) : (
               <Link href="/auth" className="text-lg font-serif">Login / Sign Up</Link>
             )}
             
             <Link href="/menu" className="bg-[#4B3621] text-white text-center py-3 rounded-lg font-bold">Order Now</Link>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 z-0">
            <img src="/hero.jpg" alt="Tiramisu Hero" className="w-full h-full object-cover scale-105" />
        </div>
        
        <div className="relative z-20 text-center px-6 max-w-3xl mt-16 animate-in fade-in zoom-in duration-1000">
          <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-white/80 text-xs tracking-[0.2em] uppercase mb-4 backdrop-blur-sm">
            Artisanal Desserts
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Layers of <br/><span className="italic text-[#C5A059]">Perfection.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light mb-8 max-w-lg mx-auto leading-relaxed">
            Handcrafted Italian Tiramisu. Made with love, packed with care.
          </p>
          <Link href="/menu">
            <button className="bg-[#C5A059] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#b08d4b] transition shadow-2xl hover:scale-105 transform duration-200">
              Order Now
            </button>
          </Link>
        </div>
      </section>

      {/* --- FRAMES STORY SECTION --- */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-24">
          
          {/* Frame 1: Image */}
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="relative group md:w-1/2">
              <div className="bg-white p-3 md:p-4 shadow-2xl rotate-[-3deg] group-hover:rotate-0 transition duration-500 ease-out">
                <div className="aspect-[4/5] overflow-hidden bg-gray-200">
                  <img src="/frame1.jpg" alt="Ingredients" className="w-full h-full object-cover" />
                </div>
                <div className="pt-4 pb-1 text-center font-handwriting text-gray-500 text-xl">
                  Only the finest mascarpone
                </div>
              </div>
            </div>
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Authenticity in Every Whisk.</h2>
              <div className="h-1 w-20 bg-[#C5A059] mx-auto md:mx-0 mb-6"></div>
              <p className="text-lg text-[#6F4E37] leading-relaxed italic">
                "We don't cut corners. We believe that the snap of the savoiardi and the richness of the espresso define the soul of a Tiramisu."
              </p>
            </div>
          </div>

          {/* Frame 2: Video Integration */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-20">
            <div className="relative group md:w-1/2">
              <div className="bg-white p-3 md:p-4 shadow-2xl rotate-[3deg] group-hover:rotate-0 transition duration-500 ease-out">
                <div className="aspect-[4/5] overflow-hidden bg-gray-200 relative">
                  {/* VIDEO PLAYER */}
                  <video 
                    src="/layers-video.mp4" 
                    autoPlay loop muted playsInline 
                    poster="/frame2.jpg"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pt-4 pb-1 text-center font-handwriting text-gray-500 text-xl">
                  Layers of happiness
                </div>
              </div>
            </div>
            <div className="md:w-1/2 text-center md:text-right">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Packed with Care.</h2>
              <div className="h-1 w-20 bg-[#C5A059] mx-auto md:ml-auto mb-6"></div>
              <p className="text-lg text-[#6F4E37] leading-relaxed italic">
                "Watch the magic happen. From the rich espresso soak to the final cocoa dust, every step is a labor of love."
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* --- DYNAMIC REVIEWS SLIDER --- */}
      <section className="bg-[#4B3621] text-[#F9F5F0] py-20 px-6 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto min-h-[220px] flex flex-col justify-center items-center">
          <div className="text-[#C5A059] text-6xl mb-6 font-serif">“</div>
          
          {reviews.length > 0 ? (
            <div key={currentReviewIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-xl md:text-3xl font-serif italic mb-8 leading-relaxed">
                {reviews[currentReviewIndex].message}
              </p>
              <div className="font-bold text-sm tracking-[0.2em] uppercase text-[#C5A059]">
                — {reviews[currentReviewIndex].client_name}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xl md:text-2xl font-serif italic mb-6">
                Layers of perfection in every bite.
              </p>
              <div className="font-bold text-sm tracking-widest uppercase text-[#C5A059]">
                — Whisk'd
              </div>
            </div>
          )}

          {/* Dots Indicator */}
          {reviews.length > 1 && (
            <div className="flex gap-2 mt-8 justify-center">
              {reviews.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentReviewIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    idx === currentReviewIndex ? 'bg-[#C5A059] w-6' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#2C1A11] text-[#F5F5DC]/60 py-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-serif font-bold text-white">Whisk'd</h3>
              <p className="text-sm mt-2">Made with love, packed with care.</p>
            </div>
            <div className="flex gap-6 text-sm font-bold text-white">
              <Link href="/menu" className="hover:text-[#C5A059]">Menu</Link>
              <Link href="/auth" className="hover:text-[#C5A059]">Login</Link>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs">
            <p>&copy; {new Date().getFullYear()} Whisk'd. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/5">
              <span>Website crafted by</span>
              <a href="#" className="font-bold text-[#C5A059] hover:underline">Zenithics</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}