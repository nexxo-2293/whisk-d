"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, User, Phone, MapPin, Package, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', address: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    // 2. Try Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // <--- Use maybeSingle() to avoid error if missing

    if (profileData) {
      setProfile(profileData);
      setFormData({
          full_name: profileData.full_name || '',
          phone_number: profileData.phone_number || '',
          address: profileData.address || ''
      });
    }

    // 3. Fetch Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersData) setOrders(ordersData);
    
    setLoading(false);
  };

  // --- REPAIR FUNCTION: If profile is missing, create it manually ---
  const handleCreateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Valued Customer',
        phone_number: user.user_metadata?.phone || '',
    });

    if (!error) {
        alert("Profile Created!");
        fetchData(); // Refresh page
    } else {
        alert("Error creating profile: " + error.message);
    }
  };

  const handleUpdate = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        address: formData.address
      })
      .eq('id', profile.id);

    if (!error) {
      alert("Saved!");
      setEditMode(false);
      setProfile({ ...profile, ...formData });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F9F5F0] p-6 font-sans text-[#4B3621]">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8 border-b border-[#4B3621]/10 pb-4">
          <div>
            <h1 className="text-4xl font-serif font-bold">My Profile</h1>
            <p className="text-gray-500">Welcome, {profile?.full_name || 'Guest'}</p>
          </div>
          <button onClick={handleLogout} className="text-red-500 font-bold text-sm hover:underline flex items-center gap-1">
            <LogOut size={16}/> Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            
            {/* LEFT: SETTINGS */}
            <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User size={20}/> Personal Details
                </h2>

                {/* MISSING PROFILE ALERT */}
                {!profile && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-yellow-800 font-bold mb-1">
                            <AlertCircle size={18}/> Profile Not Found
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                           Your account exists, but the profile data is missing.
                        </p>
                        <button onClick={handleCreateProfile} className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-yellow-700">
                            Complete Setup Now
                        </button>
                    </div>
                )}

                {profile && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400">Name</label>
                            <input disabled={!editMode} value={formData.full_name} 
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                                className="w-full p-2 border rounded bg-gray-50"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400">Phone</label>
                            <input disabled={!editMode} value={formData.phone_number} 
                                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                className="w-full p-2 border rounded bg-gray-50"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400">Address</label>
                            <textarea disabled={!editMode} value={formData.address} rows={2}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full p-2 border rounded bg-gray-50"/>
                        </div>

                        {editMode ? (
                            <button onClick={handleUpdate} className="w-full bg-[#C5A059] text-white py-2 rounded font-bold">Save Changes</button>
                        ) : (
                            <button onClick={() => setEditMode(true)} className="w-full bg-[#4B3621] text-white py-2 rounded font-bold">Edit Details</button>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT: ORDERS */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package size={20}/> My Orders
                </h2>

                {orders.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400">No orders yet.</p>
                        <button onClick={() => router.push('/menu')} className="text-[#C5A059] font-bold underline mt-2">Order Now</button>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#4B3621]/5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold">Order #{order.id.slice(0,6)}</span>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">{order.payment_status}</span>
                            </div>
                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            <div className="mt-2 pt-2 border-t flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total</span>
                                <span className="font-serif font-bold text-lg">₹{order.total_amount}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}