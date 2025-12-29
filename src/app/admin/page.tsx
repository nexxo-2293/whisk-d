"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, LogOut, 
  Plus, Trash2, ExternalLink, CheckCircle, Clock, DollarSign, Star, Loader2, X 
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  
  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [settings, setSettings] = useState({ upi_id: '', upi_name: '' });

  // Form States
  const [newProd, setNewProd] = useState({ name: '', price: '', desc: '' });
  // Changed to array for multiple files
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [uploading, setUploading] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', msg: '' });

  // --- 1. AUTH & DATA LOADING ---
  useEffect(() => {
    const init = async () => {
      // Check Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth'); return; }
      
      // Check Admin Role
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile?.is_admin) {
        router.replace('/'); 
        return;
      }
      
      loadAllData();
      setLoading(false);
    };
    init();
  }, [router]);

  const loadAllData = async () => {
    supabase.from('products').select('*').order('id').then(({ data }) => data && setProducts(data));
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setOrders(data));
    supabase.from('testimonials').select('*').order('id', { ascending: false }).then(({ data }) => data && setTestimonials(data));
    supabase.from('app_settings').select('*').single().then(({ data }) => data && setSettings(data));
  };

  // --- 2. ORDER STATUS LOGIC ---
  const handleStatusChange = async (orderId: number, newStatus: string, orderData: any) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));

    // A. Update Database
    const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId);
    if (error) {
      alert("Failed to update status");
      loadAllData();
      return;
    }

    // B. Send Email Notification
    if (orderData.customer_email) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ORDER_UPDATE',
          customerEmail: orderData.customer_email,
          status: newStatus,
          orderDetails: {
            id: orderId,
            name: orderData.customer_name,
            address: orderData.delivery_address || 'Pickup'
          }
        })
      });
    }
  };

  // --- 3. PRODUCT LOGIC (MULTIPLE UPLOAD) ---
  const handleAddProduct = async () => {
    if (imageFiles.length === 0 || !newProd.name || !newProd.price) return alert("Please fill all fields and select images.");
    setUploading(true);

    try {
      // Loop through all selected files and upload them
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        return data.publicUrl;
      });

      // Wait for all uploads to finish
      const uploadedUrls = await Promise.all(uploadPromises);

      // Insert into DB with the Array of URLs
      const { error: dbError } = await supabase.from('products').insert({
        name: newProd.name,
        price: Number(newProd.price),
        description: newProd.desc,
        images: uploadedUrls, // Save the array of strings
        image_url: uploadedUrls[0] // Save first image as fallback string
      });

      if (dbError) throw dbError;

      alert("Product Added Successfully!");
      setNewProd({ name: '', price: '', desc: '' });
      setImageFiles([]); 
      loadAllData();

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (table: string, id: number) => {
    if(!confirm("Are you sure you want to delete this?")) return;
    await supabase.from(table).delete().eq('id', id);
    loadAllData();
  };

  // --- 4. REVIEW LOGIC ---
  const addReview = async () => {
    if (!newReview.name || !newReview.msg) return;
    await supabase.from('testimonials').insert({ client_name: newReview.name, message: newReview.msg });
    setNewReview({name:'', msg:''}); 
    loadAllData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-[#C5A059]"><Loader2 className="animate-spin" size={32}/></div>;

  return (
    <div className="min-h-screen bg-[#F9F5F0] flex font-sans text-[#4B3621]">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#2C1A11] text-[#F5F5DC] flex flex-col fixed h-full shadow-2xl z-20">
        <div className="p-8">
          <h1 className="text-3xl font-serif font-bold">Whisk'd<span className="text-[#C5A059]">.</span></h1>
          <p className="text-xs text-[#C5A059] tracking-widest uppercase mt-1">Admin Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'products', icon: LayoutDashboard, label: 'Menu Items' },
            { id: 'reviews', icon: Star, label: 'Reviews' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-[#C5A059] text-[#2C1A11] font-bold shadow-lg' 
                  : 'text-[#F5F5DC]/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5DC]/60 hover:text-white transition">
              <ExternalLink size={18} /> View Website
            </button>
          </Link>
          <button onClick={() => {supabase.auth.signOut(); router.push('/');}} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif font-bold capitalize">{activeTab} Overview</h2>
        </header>

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-[#4B3621] text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-70">Total Revenue</p>
                <p className="text-3xl font-bold mt-1">₹{orders.reduce((sum, o) => sum + Number(o.total_amount), 0)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
                <p className="text-sm text-gray-500">Pending Orders</p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">{orders.filter(o => o.payment_status === 'Pending').length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#4B3621]/10 overflow-hidden">
              {orders.length === 0 ? <p className="p-8 text-center text-gray-500">No orders yet.</p> : orders.map((o) => (
                <div key={o.id} className="p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">{o.customer_name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase">{o.payment_method}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Delivery: {o.delivery_date} • {o.customer_phone}</p>
                    <div className="flex gap-2 text-xs flex-wrap">
                      {o.items.map((i: any) => (
                         <span key={i.name} className="bg-[#F9F5F0] px-2 py-1 rounded text-[#4B3621] font-bold">{i.name} x{i.qty}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="font-bold text-xl">₹{o.total_amount}</span>
                    <div className="relative">
                      <select 
                        value={o.payment_status} 
                        onChange={(e) => handleStatusChange(o.id, e.target.value, o)}
                        className={`appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-lg text-xs font-bold border outline-none transition-all ${
                          o.payment_status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                          o.payment_status === 'In-Transit' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          o.payment_status === 'Preparing' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="In-Transit">In-Transit</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600 text-xs">▼</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB (UPDATED FOR MULTI UPLOAD) */}
        {activeTab === 'products' && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10 h-fit">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus size={20}/> Add New Item</h3>
              <div className="space-y-4">
                <input placeholder="Item Name" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059]" />
                <div className="flex gap-4">
                   <input type="number" placeholder="Price (₹)" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} className="w-1/2 bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059]" />
                   
                   {/* MULTI FILE INPUT */}
                   <div className="w-1/2">
                      <label htmlFor="file-upload" className="block text-xs font-bold text-gray-400 mb-1 cursor-pointer">
                        Upload Photos
                      </label>
                      <input 
                        id="file-upload"
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files) setImageFiles(Array.from(e.target.files));
                        }} 
                        className="w-full text-sm" 
                      />
                   </div>
                </div>

                {/* File Previews */}
                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imageFiles.map((f, i) => (
                      <span key={i} className="text-[10px] bg-gray-200 px-2 py-1 rounded text-gray-600 truncate max-w-[100px]">{f.name}</span>
                    ))}
                  </div>
                )}

                <textarea placeholder="Description" value={newProd.desc} onChange={e => setNewProd({...newProd, desc: e.target.value})} className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059]" rows={3} />
                
                <button onClick={handleAddProduct} disabled={uploading} className="w-full bg-[#4B3621] text-white py-3 rounded-lg font-bold hover:bg-[#2C1A11] transition flex justify-center items-center gap-2">
                  {uploading && <Loader2 className="animate-spin" size={16}/>} {uploading ? 'Uploading...' : 'Add to Menu'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#4B3621]/10 flex gap-4 items-center">
                  {/* Handle Single or Multiple Images for Display */}
                  <img src={p.images?.[0] || p.image_url || '/placeholder.jpg'} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1">
                    <h4 className="font-bold">{p.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                    <p className="font-bold text-[#C5A059] mt-1">₹{p.price}</p>
                  </div>
                  <button onClick={() => deleteItem('products', p.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
              <div className="flex gap-4">
                <input placeholder="Client Name" value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="flex-1 bg-[#F9F5F0] p-3 rounded-lg outline-none" />
                <input placeholder="Feedback Message" value={newReview.msg} onChange={e => setNewReview({...newReview, msg: e.target.value})} className="flex-[2] bg-[#F9F5F0] p-3 rounded-lg outline-none" />
                <button onClick={addReview} className="bg-[#C5A059] text-white px-6 rounded-lg font-bold">Add</button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {testimonials.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10 relative group hover:shadow-md transition">
                  <p className="italic text-gray-600 mb-4">"{t.message}"</p>
                  <p className="font-bold text-sm uppercase tracking-wider text-[#C5A059]">— {t.client_name}</p>
                  <button onClick={() => deleteItem('testimonials', t.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#4B3621]/10 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><DollarSign size={20}/> Payment Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Receiving UPI ID</label>
                <input value={settings.upi_id} onChange={e => setSettings({...settings, upi_id: e.target.value})} className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Payee Name</label>
                <input value={settings.upi_name} onChange={e => setSettings({...settings, upi_name: e.target.value})} className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none" />
              </div>
              <button onClick={async () => { await supabase.from('app_settings').update(settings).eq('id', 1); alert("Saved!"); }} className="w-full bg-[#4B3621] text-white py-3 rounded-lg font-bold hover:bg-[#2C1A11] transition">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}