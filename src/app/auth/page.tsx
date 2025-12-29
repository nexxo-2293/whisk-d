"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: ''
  });

  // Check Session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.replace('/');
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
        // --- LOG IN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        router.replace('/');

      } else {
        // --- SIGN UP ---
        // Fixed version
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            // 1. Tell Supabase to send the user to our special callback route
            emailRedirectTo: `${window.location.origin}/auth/callback`, 
            
            // 2. Pass the profile data
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              address: formData.address,
            }
          }
        });

        if (error) throw error;

        // Success!
        // Because the SQL Trigger handles the database write, we don't need to do anything else.
        alert("Account Created Successfully! Please verify your email.");
        
        // If 'Confirm Email' is OFF, this will redirect. 
        // If ON, they stay here (but the database row IS created).
        router.replace('/'); 
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-[#4B3621]/10">
        <h2 className="text-3xl font-serif font-bold text-center mb-6 text-[#4B3621]">
          {isLogin ? 'Welcome Back' : 'Join Whisk\'d'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input required name="email" type="email" placeholder="Email Address" onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-[#C5A059] outline-none" />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input required name="password" type="password" placeholder="Password" onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-[#C5A059] outline-none" />
          </div>

          {!isLogin && (
            <div className="space-y-4 animate-in fade-in">
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="fullName" type="text" placeholder="Full Name" onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-[#C5A059] outline-none" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="phone" type="tel" placeholder="Mobile Number" onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-[#C5A059] outline-none" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input required name="address" type="text" placeholder="Address (Optional)" onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-[#C5A059] outline-none" />
              </div>
            </div>
          )}

          <button disabled={loading} type="submit" 
            className="w-full bg-[#4B3621] text-white py-3 rounded-lg font-bold hover:bg-[#2C1A11] transition flex items-center justify-center gap-2">
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#C5A059] font-bold text-sm hover:underline">
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}