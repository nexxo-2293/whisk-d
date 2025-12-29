"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Unified Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: ''
  });
  useEffect(() => {
  const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if admin
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profile?.is_admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };
  checkSession();
}, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isLogin) {
      // 1. Sign In
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (user) {
        console.log("Login Successful. Checking Admin Status for:", user.email);

        // 2. Explicitly select the column
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        // DEBUGGING LOGS
        if (profileError) {
          console.error("Database Error:", profileError.message);
          console.error("Hint: This usually means RLS policies are missing.");
        }
        console.log("Profile Data Recieved:", profile);

        // 3. Redirect Logic
        if (profile?.is_admin === true) {
          console.log("User is Admin. Redirecting to /admin");
          router.replace('/admin'); // 'replace' is faster than 'push' here
        } else {
          console.log("User is Customer. Redirecting to /");
          router.push('/');
        }
      }

      } else {
        // --- SIGNUP LOGIC (Keep as is) ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Insert Profile Details
        if (authData.user) {
          await supabase.from('profiles').upsert({
             id: authData.user.id,
             email: formData.email,
             full_name: formData.fullName,
             phone_number: formData.phone,
             address: formData.address,
             is_admin: false
          });
        }

        alert("Account Created! Please check your email.");
        setIsLogin(true);
      }

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#4B3621]/10 rounded-full blur-3xl" />

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-[#4B3621]/10 relative z-10">
        <h2 className="text-4xl font-serif font-bold text-center mb-2 text-[#4B3621]">
          Whisk'd
        </h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          {isLogin ? 'Welcome back, dessert lover.' : 'Join us for a sweet journey.'}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input required name="email" type="email" placeholder="Email Address" onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all" />
          </div>
          
          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input required name="password" type="password" placeholder="Password" onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all" />
          </div>

          {/* --- EXTRA FIELDS FOR SIGNUP --- */}
          {!isLogin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="fullName" type="text" placeholder="Full Name" onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all" />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="phone" type="tel" placeholder="Mobile Number" onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all" />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea required name="address" placeholder="Delivery Address" rows={2} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all resize-none" />
              </div>
            </div>
          )}

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-[#4B3621] text-[#F5F5DC] py-3 rounded-lg font-bold hover:bg-[#2C1A11] transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-[#C5A059] font-bold mt-1 hover:underline tracking-wide uppercase text-xs"
          >
            {isLogin ? 'Create Account' : 'Login Here'}
          </button>
        </div>
      </div>
    </div>
  );
}