"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, MapPin, Phone, Package, Clock, CheckCircle, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'settings'
  
  // Data State
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Edit Form State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', address: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      // 1. Get Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone_number: profileData.phone_number || '',
          address: profileData.address || ''
        });
      }

      // 2. Get Orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (orderData) setOrders(orderData);
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleUpdateProfile = async () => {
    const { error } = await supabase.from('profiles').update({
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      address: formData.address
    }).eq('id', profile.id);

    if (!error) {
      alert("Profile Updated Successfully!");
      setEditMode(false);
      setProfile({ ...profile, ...formData });
    } else {
      alert("Error updating profile.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#4B3621]">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-[#F9F5F0] p-4 md:p-8 font-sans text-[#4B3621]">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-[#4B3621]/10 pb-4">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">My Profile</h1>
            <p className="text-gray-500">Welcome back, {profile?.full_name || 'Guest'}</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
             <button onClick={() => setActiveTab('orders')} 
               className={`pb-2 font-bold ${activeTab === 'orders' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-gray-400'}`}>
               My Orders
             </button>
             <button onClick={() => setActiveTab('settings')} 
               className={`pb-2 font-bold ${activeTab === 'settings' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-gray-400'}`}>
               Settings
             </button>
          </div>
        </div>

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {orders.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl">
                <Package className="mx-auto text-gray-300 mb-2" size={48} />
                <p>No orders yet.</p>
                <button onClick={() => router.push('/menu')} className="mt-4 text-[#C5A059] font-bold underline">Order some Tiramisu!</button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#4B3621]/5 flex flex-col md:flex-row justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg">Order #{order.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.payment_status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Ordered on: {new Date(order.created_at).toLocaleDateString()}</p>
                    <div className="text-sm text-gray-700">
                      {order.items.map((item: any) => (
                        <span key={item.name} className="mr-3 bg-[#F9F5F0] px-2 py-1 rounded">
                          {item.name} x {item.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="font-serif font-bold text-xl mb-1">₹{order.total_amount}</p>
                    <p className="text-xs text-gray-400 flex items-center justify-end gap-1">
                      <Clock size={12}/> Delivery: {order.delivery_date}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl border border-[#4B3621]/5 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Personal Details</h2>
              <button onClick={() => editMode ? handleUpdateProfile() : setEditMode(true)} 
                className="text-sm bg-[#4B3621] text-white px-4 py-2 rounded-lg hover:bg-[#2C1A11]">
                {editMode ? 'Save Changes' : 'Edit Details'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-300" size={18}/>
                  <input disabled={!editMode} value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className={`w-full pl-10 p-3 rounded-lg border ${editMode ? 'border-[#C5A059] bg-white' : 'border-gray-100 bg-gray-50'}`} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-300" size={18}/>
                  <input disabled={!editMode} value={formData.phone_number} 
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className={`w-full pl-10 p-3 rounded-lg border ${editMode ? 'border-[#C5A059] bg-white' : 'border-gray-100 bg-gray-50'}`} />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Default Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-300" size={18}/>
                  <textarea disabled={!editMode} rows={3} value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className={`w-full pl-10 p-3 rounded-lg border ${editMode ? 'border-[#C5A059] bg-white' : 'border-gray-100 bg-gray-50'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}