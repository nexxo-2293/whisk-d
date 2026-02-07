"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, User, Menu as MenuIcon, X, LogOut, LayoutDashboard, Star, ChevronLeft, ChevronRight, Sparkles, Coffee } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroSectionRef = useRef<HTMLDivElement>(null);

  // --- ANIMATED BACKGROUND PARTICLES ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- 1. INITIAL FETCH (Auth & Reviews) ---
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', authUser.id)
          .single();
        setUser({ ...authUser, is_admin: profile?.is_admin });
      }

      const { data: reviewData } = await supabase.from('testimonials').select('*');
      if (reviewData && reviewData.length > 0) {
        setReviews(reviewData);
      }
    };

    init();

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

  // --- REVIEW NAVIGATION ---
  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <main className="min-h-screen bg-[#F9F5F0] text-[#4B3621] font-sans selection:bg-[#C5A059]/30 selection:text-[#4B3621] overflow-x-hidden">
      
      {/* --- ANIMATED BACKGROUND ELEMENTS --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Floating coffee beans */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-6 rounded-full bg-gradient-to-br from-[#4B3621]/10 to-[#C5A059]/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Mouse follower glow */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#C5A059]/5 via-[#4B3621]/3 to-transparent blur-3xl"
          animate={{
            x: mousePosition.x - 250,
            y: mousePosition.y - 250,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
        />
      </div>

      {/* --- STICKY NAVBAR --- */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg py-3' : 'bg-transparent py-5'}`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          {/* Logo with animation */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className={`font-serif font-bold text-2xl tracking-tighter flex items-center gap-2 ${isScrolled ? 'text-[#4B3621]' : 'text-white'}`}>
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="inline-block"
              >
                Whisk'd
              </motion.span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[#C5A059]"
              >
                .
              </motion.span>
            </Link>
          </motion.div>

          {/* Desktop Links */}
          <div className={`hidden md:flex items-center gap-8 font-medium text-sm ${isScrolled ? 'text-[#4B3621]' : 'text-white'}`}>
            <motion.div whileHover={{ y: -2 }}>
              <Link href="/menu" className="hover:text-[#C5A059] transition relative group">
                Our Menu
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C5A059] group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
            
            {/* AUTH BUTTONS LOGIC */}
            {user ? (
              <div className="flex items-center gap-4">
                {user.is_admin ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/admin" className="flex items-center gap-2 text-[#C5A059] font-bold border border-[#C5A059] px-4 py-2 rounded-full hover:bg-[#C5A059]/10 transition group">
                      <LayoutDashboard size={16} />
                      <span>Admin Panel</span>
                      <Sparkles size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link href="/profile" className="flex items-center gap-2 hover:text-[#C5A059] transition font-bold group">
                      <User size={18} />
                      <span>My Profile</span>
                    </Link>
                  </motion.div>
                )}
                
                <motion.button 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout} 
                  className="flex items-center gap-2 hover:text-red-400 transition p-2 rounded-full hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut size={18} />
                </motion.button>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/auth" className="flex items-center gap-2 hover:text-[#C5A059] transition group">
                  <User size={18} />
                  <span>Login</span>
                </Link>
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/menu">
                <button className="bg-gradient-to-r from-[#C5A059] to-[#b08d4b] text-white px-6 py-3 rounded-full font-bold hover:shadow-xl transition-all shadow-lg flex items-center gap-2 group relative overflow-hidden">
                  <span className="relative z-10">Order</span>
                  <ShoppingBag size={16} className="relative z-10" />
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Toggle */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-[#C5A059] p-2 rounded-lg bg-white/10 backdrop-blur-sm"
          >
            {mobileMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
          </motion.button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl shadow-2xl border-t border-white/20 flex flex-col p-6 gap-4 md:hidden text-[#4B3621]"
            >
              {['Our Menu', user?.is_admin ? 'Admin Panel' : 'My Profile', user ? 'Logout' : 'Login / Sign Up'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <Link 
                    href={item === 'Our Menu' ? '/menu' : 
                          item === 'Admin Panel' ? '/admin' : 
                          item === 'My Profile' ? '/profile' : 
                          '/auth'}
                    onClick={item === 'Logout' ? handleLogout : undefined}
                    className={`text-lg font-serif ${item.includes('Admin') ? 'text-[#C5A059] font-bold' : ''} ${item === 'Logout' ? 'text-red-500' : ''}`}
                  >
                    {item}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <Link href="/menu" className="bg-gradient-to-r from-[#4B3621] to-[#2C1A11] text-white text-center py-3 rounded-xl font-bold block">
                  Order Now
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <section ref={heroSectionRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4B3621]/30 via-black/50 to-black/70 z-10" />
        
        {/* Parallax Background Image */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          style={{
            backgroundImage: 'url(/hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            willChange: 'transform'
          }}
        />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 z-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full bg-[#C5A059]/20 backdrop-blur-sm"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + Math.sin(i) * 40}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 180],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-30 text-center px-6 max-w-3xl mt-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block py-2 px-4 border border-white/40 rounded-full text-white/90 text-sm tracking-[0.3em] uppercase mb-6 backdrop-blur-md"
          >
            <Sparkles size={12} className="inline mr-2" />
            Artisanal Desserts
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 leading-tight"
          >
            <span className="block">Layers of</span>
            <motion.span
              className="italic text-[#C5A059] relative inline-block"
              animate={{ 
                textShadow: [
                  '0 0 20px rgba(197, 160, 89, 0.5)',
                  '0 0 40px rgba(197, 160, 89, 0.8)',
                  '0 0 20px rgba(197, 160, 89, 0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Perfection.
            </motion.span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-white/90 font-light mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Handcrafted Italian Tiramisu. Made with love, packed with care.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/menu">
              <button className="bg-gradient-to-r from-[#C5A059] via-[#b08d4b] to-[#C5A059] text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 shadow-xl relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  Order Now 
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </button>
            </Link>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-3 bg-white rounded-full mt-2"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- FRAMES STORY SECTION --- */}
      <section className="py-24 px-6 overflow-hidden bg-gradient-to-b from-[#F9F5F0] to-white">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              The <span className="text-[#C5A059]">Whisk'd</span> Story
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-[#C5A059] to-transparent mx-auto" />
          </motion.div>

          {/* Frame 1: Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row items-center gap-12 mb-32"
          >
            <div className="lg:w-1/2 relative group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-[#C5A059]/20 to-[#4B3621]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white p-6 shadow-2xl rounded-2xl rotate-[-2deg] group-hover:rotate-0 transition-all duration-500">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-[#F9F5F0] to-[#E8DFD1]">
                    <img 
                      src="/frame1.jpg" 
                      alt="Ingredients" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="pt-6 pb-2 text-center">
                    <Coffee className="inline-block mb-2 text-[#C5A059]" size={24} />
                    <p className="font-handwriting text-2xl text-[#4B3621]/70">
                      Only the finest mascarpone
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="text-8xl font-serif text-[#C5A059]/10 absolute -left-4 -top-8">01</div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold mb-6 relative z-10">
                  Authenticity in <span className="text-[#C5A059]">Every Whisk</span>.
                </h3>
                <div className="h-1 w-16 bg-[#C5A059] mb-8"></div>
                <p className="text-xl text-[#6F4E37]/90 leading-relaxed mb-6">
                  We don't cut corners. We believe that the snap of the savoiardi and the richness of the espresso define the soul of a Tiramisu.
                </p>
                <ul className="space-y-3">
                  {['Single-origin espresso beans', '24-hour mascarpone maturation', 'Hand-layered presentation'].map((item, idx) => (
                    <motion.li 
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 text-[#4B3621]"
                    >
                      <Star size={16} className="text-[#C5A059] fill-current" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Frame 2: Video */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row-reverse items-center gap-12"
          >
            <div className="lg:w-1/2 relative group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-l from-[#C5A059]/20 to-[#4B3621]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white p-6 shadow-2xl rounded-2xl rotate-[2deg] group-hover:rotate-0 transition-all duration-500">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-[#F9F5F0] to-[#E8DFD1] relative">
                    {/* Video with play button overlay */}
                    <video 
                      src="/layers-video.mp4" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-[#4B3621] flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#C5A059] rounded-full animate-pulse" />
                      Live Process
                    </div>
                  </div>
                  <div className="pt-6 pb-2 text-center">
                    <Sparkles className="inline-block mb-2 text-[#C5A059]" size={24} />
                    <p className="font-handwriting text-2xl text-[#4B3621]/70">
                      Layers of happiness
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="text-8xl font-serif text-[#C5A059]/10 absolute -left-4 -top-8">02</div>
                <h3 className="text-3xl md:text-4xl font-serif font-bold mb-6 relative z-10">
                  Packed with <span className="text-[#C5A059]">Care</span>.
                </h3>
                <div className="h-1 w-16 bg-[#C5A059] mb-8 ml-auto"></div>
                <p className="text-xl text-[#6F4E37]/90 leading-relaxed mb-6 text-right">
                  Watch the magic happen. From the rich espresso soak to the final cocoa dust, every step is a labor of love.
                </p>
                <div className="flex justify-end">
                  <ul className="space-y-3 text-right">
                    {['Perfect espresso soak', 'Cocoa dust finish', 'Temperature-controlled delivery'].map((item, idx) => (
                      <motion.li 
                        key={item}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-end gap-3 text-[#4B3621]"
                      >
                        {item}
                        <Star size={16} className="text-[#C5A059] fill-current" />
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- DYNAMIC REVIEWS SLIDER --- */}
      <section className="bg-gradient-to-br from-[#4B3621] via-[#2C1A11] to-[#4B3621] text-[#F9F5F0] py-24 px-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#C5A059] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              What Our <span className="text-[#C5A059]">Foodies</span> Say
            </h2>
            <p className="text-xl text-[#F9F5F0]/70 max-w-2xl mx-auto">
              Join thousands of satisfied customers experiencing the Whisk'd difference
            </p>
          </motion.div>

          <div className="relative min-h-[300px] flex items-center justify-center">
            {/* Navigation Arrows */}
            {reviews.length > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevReview}
                  className="absolute left-4 md:left-0 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-colors z-20"
                >
                  <ChevronLeft size={24} className="text-[#C5A059]" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextReview}
                  className="absolute right-4 md:right-0 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-colors z-20"
                >
                  <ChevronRight size={24} className="text-[#C5A059]" />
                </motion.button>
              </>
            )}

            {/* Reviews Container */}
            <div className="w-full max-w-3xl mx-auto px-8">
              <AnimatePresence mode="wait">
                {reviews.length > 0 ? (
                  <motion.div
                    key={currentReviewIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="text-[#C5A059] text-7xl font-serif mb-2">"</div>
                    
                    {/* Star Rating */}
                    <div className="flex justify-center gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className="text-[#C5A059] fill-current"
                        />
                      ))}
                    </div>

                    <p className="text-2xl md:text-3xl font-serif italic mb-10 leading-relaxed px-4">
                      "{reviews[currentReviewIndex].message}"
                    </p>
                    
                    <div className="space-y-2">
                      <div className="font-bold text-lg tracking-wide text-[#C5A059]">
                        {reviews[currentReviewIndex].client_name}
                      </div>
                      <div className="text-sm text-[#F9F5F0]/60 uppercase tracking-widest">
                        Verified Customer
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-2xl md:text-3xl font-serif italic mb-6">
                      "Layers of perfection in every bite."
                    </p>
                    <div className="font-bold text-sm tracking-widest uppercase text-[#C5A059]">
                      — Whisk'd Team
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Dots Indicator */}
          {reviews.length > 1 && (
            <div className="flex gap-3 mt-12 justify-center">
              {reviews.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setCurrentReviewIndex(idx)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    idx === currentReviewIndex 
                      ? 'bg-[#C5A059] w-12' 
                      : 'bg-white/30 w-3 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-[#F9F5F0]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-[#C5A059]/10 via-[#4B3621]/5 to-[#C5A059]/10 rounded-3xl p-12 border border-white/50 backdrop-blur-sm">
            <Sparkles className="inline-block mb-6 text-[#C5A059]" size={48} />
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Ready to <span className="text-[#C5A059]">Experience</span>?
            </h2>
            <p className="text-xl text-[#4B3621]/80 mb-10 max-w-2xl mx-auto">
              Order now and taste the difference of handcrafted tiramisu made with premium ingredients and traditional techniques.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Link href="/menu">
                <button className="bg-gradient-to-r from-[#C5A059] to-[#b08d4b] text-white px-12 py-5 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 shadow-xl group">
                  <span className="flex items-center gap-3">
                    Order Whisk'd
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      →
                    </motion.span>
                  </span>
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gradient-to-t from-[#2C1A11] to-[#1A0F09] text-[#F5F5DC]/60 pt-16 pb-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12"
          >
            {/* Logo & Tagline */}
            <div className="text-center lg:text-left">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-block"
              >
                <Link href="/" className="text-3xl font-serif font-bold text-white flex items-center gap-2">
                  Whisk'd
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="text-[#C5A059]"
                  >
                    .
                  </motion.span>
                </Link>
              </motion.div>
              <p className="text-sm mt-4 max-w-md">
                Crafting moments of joy through authentic Italian tiramisu. Made with love, packed with care, delivered to your door.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex gap-8">
              {['Menu', 'About', 'Contact', user ? 'Profile' : 'Login'].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ y: -3 }}
                  className="relative group"
                >
                  <Link 
                    href={item === 'Menu' ? '/menu' : 
                          item === 'About' ? '/about' : 
                          item === 'Contact' ? '/contact' : 
                          user ? '/profile' : '/auth'}
                    className="text-white font-medium hover:text-[#C5A059] transition-colors"
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C5A059] group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
          >
            <p className="text-[#F5F5DC]/40">
              &copy; {new Date().getFullYear()} Whisk'd. All rights reserved.
            </p>
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full border border-white/10"
            >
              <Sparkles size={14} className="text-[#C5A059]" />
              <span className="text-[#F5F5DC]/60">Crafted with</span>
              <span className="font-bold text-[#C5A059]">Synrova</span>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
