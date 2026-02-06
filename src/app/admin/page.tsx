"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingBag, Settings, LogOut, 
  Plus, Trash2, ExternalLink, Star, Loader2, MapPin, 
  MessageSquare, DollarSign, Search, Filter, 
  Calendar, Phone, User as UserIcon, Package,
  CheckCircle, Clock, Truck, X, Menu as MenuIcon,
  BarChart, Upload, Image as ImageIcon, Edit2,
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [settings, setSettings] = useState({ upi_id: '', upi_name: '' });

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Form States
  const [newProd, setNewProd] = useState({ name: '', price: '', desc: '' });
  const [imageFiles, setImageFiles] = useState<File[]>([]); 
  const [uploading, setUploading] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', msg: '' });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0
  });

  // --- 1. AUTH & DATA LOADING ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth'); return; }
      
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile?.is_admin) {
        router.replace('/'); 
        return;
      }
      
      await loadAllData();
      setLoading(false);
    };
    init();
  }, [router]);

  const loadAllData = async () => {
    // Load products
    const { data: productsData } = await supabase.from('products').select('*').order('id');
    if (productsData) setProducts(productsData);

    // Load orders
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ordersData) {
      setOrders(ordersData);
      
      // Calculate stats
      const totalRevenue = ordersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const pendingOrders = ordersData.filter(o => o.payment_status === 'Pending').length;
      const completedOrders = ordersData.filter(o => o.payment_status === 'Completed').length;
      
      setStats({
        totalRevenue,
        pendingOrders,
        completedOrders,
        totalProducts: productsData?.length || 0
      });
    }

    // Load testimonials
    const { data: testimonialsData } = await supabase.from('testimonials').select('*').order('id', { ascending: false });
    if (testimonialsData) setTestimonials(testimonialsData);

    // Load settings
    const { data: settingsData } = await supabase.from('app_settings').select('*').single();
    if (settingsData) setSettings(settingsData);
  };

  // --- 2. IMAGE PREVIEW HANDLING ---
  useEffect(() => {
    if (imageFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);

    // Cleanup
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  // --- 3. ORDER LOGIC ---
  const handleStatusChange = async (orderId: number, newStatus: string, orderData: any) => {
    const originalStatus = orderData.payment_status;
    
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
    setStats(prev => {
      const updated = { ...prev };
      if (originalStatus === 'Pending') updated.pendingOrders--;
      if (originalStatus === 'Completed') updated.completedOrders--;
      if (newStatus === 'Pending') updated.pendingOrders++;
      if (newStatus === 'Completed') updated.completedOrders++;
      return updated;
    });

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
            id: orderData.order_code || orderId,
            name: orderData.customer_name,
            address: orderData.delivery_address || 'Pickup'
          }
        })
      });
    }
  };

  // Search and Filter Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.order_code && order.order_code.toLowerCase().includes(search.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.includes(search)) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.payment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // --- 4. PRODUCT LOGIC ---
  const handleAddProduct = async () => {
    if (imageFiles.length === 0 || !newProd.name || !newProd.price) {
      alert("Please fill all fields and select images.");
      return;
    }
    
    setUploading(true);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      const { error: dbError } = await supabase.from('products').insert({
        name: newProd.name,
        price: Number(newProd.price),
        description: newProd.desc,
        images: uploadedUrls, 
        image_url: uploadedUrls[0] 
      });

      if (dbError) throw dbError;

      alert("Product Added Successfully!");
      setNewProd({ name: '', price: '', desc: '' });
      setImageFiles([]);
      setPreviewUrls([]);
      await loadAllData();

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

  // --- 5. REVIEW LOGIC ---
  const addReview = async () => {
    if (!newReview.name || !newReview.msg) return;
    await supabase.from('testimonials').insert({ client_name: newReview.name, message: newReview.msg });
    setNewReview({name:'', msg:''}); 
    loadAllData();
  };

  // --- 6. STATUS BADGE COMPONENT ---
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      'Preparing': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Package, label: 'Preparing' },
      'In-Transit': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck, label: 'In Transit' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completed' },
    }[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock, label: status };

    const Icon = config.icon;
    
    return (
      <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit`}>
        <Icon size={12} />
        <span>{config.label}</span>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F9F5F0]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#C5A059] mx-auto mb-4" size={48} />
        <p className="text-[#4B3621] font-serif">Loading Admin Panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F5F0] font-sans text-[#4B3621]">
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#2C1A11] text-white z-50 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          <h1 className="text-xl font-serif font-bold">Whisk'd<span className="text-[#C5A059]">.</span></h1>
        </div>
        <button 
          onClick={() => {supabase.auth.signOut(); router.push('/');}}
          className="p-2 text-red-400 hover:text-red-300"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed left-0 top-0 h-full w-72 bg-[#2C1A11] text-[#F5F5DC] z-50 shadow-2xl lg:hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-serif font-bold">Whisk'd<span className="text-[#C5A059]">.</span></h1>
                <p className="text-xs text-[#C5A059] tracking-widest uppercase mt-1">Admin Panel</p>
              </div>
              
              <nav className="p-4 space-y-1">
                {[
                  { id: 'orders', icon: ShoppingBag, label: 'Orders' },
                  { id: 'products', icon: LayoutDashboard, label: 'Menu Items' },
                  { id: 'reviews', icon: Star, label: 'Reviews' },
                  { id: 'settings', icon: Settings, label: 'Settings' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
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

              <div className="p-4 border-t border-white/10 mt-auto">
                <Link href="/" className="block">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5DC]/60 hover:text-white transition rounded-xl">
                    <ExternalLink size={18} /> View Website
                  </button>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-[#2C1A11] text-[#F5F5DC] flex-col fixed h-full shadow-2xl z-30">
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
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-[#C5A059] text-[#2C1A11] font-bold shadow-lg' 
                  : 'text-[#F5F5DC]/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5DC]/60 hover:text-white transition rounded-xl hover:bg-white/5"
            >
              <ExternalLink size={18} /> View Website
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => {supabase.auth.signOut(); router.push('/');}}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition rounded-xl hover:bg-red-400/10"
          >
            <LogOut size={18} /> Logout
          </motion.button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`lg:ml-64 pt-16 lg:pt-0 min-h-screen p-4 lg:p-8 transition-all duration-300 ${mobileMenuOpen ? 'lg:blur-0 blur-sm' : ''}`}>
        
        {/* TAB HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-serif font-bold capitalize">{activeTab} Overview</h2>
              <p className="text-[#4B3621]/60 text-sm mt-1">
                {activeTab === 'orders' && 'Manage customer orders and delivery status'}
                {activeTab === 'products' && 'Add and manage menu items'}
                {activeTab === 'reviews' && 'Manage customer testimonials'}
                {activeTab === 'settings' && 'Configure application settings'}
              </p>
            </div>
            
            {/* STATS FOR MOBILE */}
            {activeTab === 'orders' && (
              <div className="lg:hidden grid grid-cols-2 gap-3">
                <div className="bg-[#4B3621] text-white p-3 rounded-xl">
                  <p className="text-xs opacity-70">Revenue</p>
                  <p className="text-lg font-bold">₹{stats.totalRevenue}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#4B3621]/10">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">{stats.pendingOrders}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* DESKTOP STATS */}
            <div className="hidden lg:grid grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#4B3621] to-[#2C1A11] text-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70">Total Revenue</p>
                    <p className="text-3xl font-bold mt-1">₹{stats.totalRevenue}</p>
                  </div>
                  <DollarSign size={24} className="opacity-50" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-3xl font-bold mt-1">{orders.length}</p>
                  </div>
                  <ShoppingBag size={24} className="text-[#C5A059]" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-3xl font-bold mt-1 text-yellow-600">{stats.pendingOrders}</p>
                  </div>
                  <Clock size={24} className="text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-3xl font-bold mt-1 text-green-600">{stats.completedOrders}</p>
                  </div>
                  <CheckCircle size={24} className="text-green-500" />
                </div>
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      placeholder="Search by Order ID, Name, or Phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#F9F5F0] rounded-xl outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-[#F9F5F0] rounded-xl outline-none focus:ring-2 focus:ring-[#C5A059] text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="In-Transit">In Transit</option>
                    <option value="Completed">Completed</option>
                  </select>
                  
                  <button className="p-3 bg-[#4B3621] text-white rounded-xl hover:bg-[#2C1A11] transition">
                    <Filter size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* ORDERS LIST */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#4B3621]/10 p-8 text-center">
                  <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No orders found</p>
                  {search && (
                    <button 
                      onClick={() => setSearch('')}
                      className="text-[#C5A059] hover:underline mt-2"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-[#4B3621]/10 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="p-4 lg:p-6 border-b border-gray-100">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#4B3621] text-white px-3 py-1 rounded-lg text-sm font-bold tracking-wider">
                              {order.order_code || `ORD-${order.id.toString().padStart(4, '0')}`}
                            </span>
                            <StatusBadge status={order.payment_status} />
                          </div>
                          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                            <div className="flex items-center gap-2">
                              <UserIcon size={16} className="text-gray-400" />
                              <span className="font-bold">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={16} className="text-gray-400" />
                              <span className="text-gray-600">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600 text-sm">{new Date(order.delivery_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#C5A059]">₹{order.total_amount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="p-4 lg:p-6">
                      {/* Address & Notes */}
                      <div className="grid lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm mb-1">Delivery Address</p>
                              <p className="text-gray-600">{order.delivery_address || 'Pickup order'}</p>
                            </div>
                          </div>
                        </div>
                        
                        {order.order_note && (
                          <div className="bg-blue-50 p-4 rounded-xl">
                            <div className="flex items-start gap-3">
                              <MessageSquare size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-sm mb-1 text-blue-800">Customer Note</p>
                                <p className="text-blue-600">{order.order_note}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="mb-6">
                        <p className="font-semibold text-sm mb-3">Order Items</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.map((item: any, index: number) => (
                            <span 
                              key={index}
                              className="bg-[#F9F5F0] px-3 py-2 rounded-lg text-[#4B3621] text-sm font-medium border border-[#4B3621]/10 flex items-center gap-2"
                            >
                              <Package size={14} />
                              {item.name} ×{item.qty}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Status Control */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          Created: {new Date(order.created_at).toLocaleString()}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">Update Status:</span>
                          <select
                            value={order.payment_status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value, order)}
                            className="px-4 py-2 bg-[#F9F5F0] rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059] text-sm font-medium cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="In-Transit">In Transit</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Product Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#C5A059]/10 rounded-lg">
                    <Plus className="text-[#C5A059]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Add New Item</h3>
                    <p className="text-sm text-gray-500">Add new items to your menu</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Item Name *</label>
                    <input
                      placeholder="e.g., Classic Tiramisu"
                      value={newProd.name}
                      onChange={e => setNewProd({...newProd, name: e.target.value})}
                      className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        placeholder="299"
                        value={newProd.price}
                        onChange={e => setNewProd({...newProd, price: e.target.value})}
                        className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Upload Photos *</label>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-full bg-[#F9F5F0] p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#C5A059] transition text-center">
                          <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                          <span className="text-sm text-gray-600">
                            {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : 'Click to upload'}
                          </span>
                        </div>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => { if (e.target.files) setImageFiles(Array.from(e.target.files)); }}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Image Previews */}
                  {previewUrls.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">Preview</label>
                      <div className="flex flex-wrap gap-3">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => {
                                setImageFiles(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Description</label>
                    <textarea
                      placeholder="Describe your delicious item..."
                      value={newProd.desc}
                      onChange={e => setNewProd({...newProd, desc: e.target.value})}
                      rows={3}
                      className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059] resize-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddProduct}
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-[#4B3621] to-[#2C1A11] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Add to Menu
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Product List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xl">Menu Items ({products.length})</h3>
                  <span className="text-sm text-gray-500">Drag to reorder</span>
                </div>
                
                {products.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <ImageIcon className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 mb-4">No products yet</p>
                    <p className="text-sm text-gray-400">Add your first item using the form</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {products.map((product) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-[#4B3621]/10 flex gap-4 items-center group hover:shadow-md transition-all"
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={product.images?.[0] || product.image_url || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-lg truncate">{product.name}</h4>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                            </div>
                            <p className="font-bold text-xl text-[#C5A059] whitespace-nowrap">₹{product.price}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-3">
                            <button className="text-gray-400 hover:text-[#C5A059] transition p-1">
                              <Edit2 size={16} />
                            </button>
                            <div className="flex-1" />
                            <span className="text-xs text-gray-400">
                              {product.images?.length || 1} photo(s)
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteItem('products', product.id)}
                          className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* 3. REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Add Review Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#C5A059]/10 rounded-lg">
                  <Star className="text-[#C5A059]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Add New Review</h3>
                  <p className="text-sm text-gray-500">Add customer testimonials manually</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  <input
                    placeholder="Client Name"
                    value={newReview.name}
                    onChange={e => setNewReview({...newReview, name: e.target.value})}
                    className="bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059]"
                  />
                  <div className="lg:col-span-1">
                    <button
                      onClick={addReview}
                      className="w-full bg-[#C5A059] text-white py-3 rounded-lg font-bold hover:bg-[#b08d4b] transition flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Add Review
                    </button>
                  </div>
                </div>
                
                <textarea
                  placeholder="What did the customer say?"
                  value={newReview.msg}
                  onChange={e => setNewReview({...newReview, msg: e.target.value})}
                  rows={3}
                  className="w-full bg-[#F9F5F0] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#C5A059] resize-none"
                />
              </div>
            </motion.div>

            {/* Reviews Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl">Customer Reviews ({testimonials.length})</h3>
                <span className="text-sm text-gray-500">Displayed on homepage</span>
              </div>
              
              {testimonials.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {testimonials.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10 relative group hover:shadow-md transition-all"
                    >
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#C5A059] rounded-full flex items-center justify-center">
                        <Star size={16} className="text-white" />
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xl italic text-gray-700 leading-relaxed">
                          "{review.message}"
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <p className="font-bold text-sm uppercase tracking-wider text-[#C5A059]">
                            {review.client_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => deleteItem('testimonials', review.id)}
                          className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-[#4B3621]/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-[#C5A059]/10 rounded-lg">
                  <Settings className="text-[#C5A059]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Payment Configuration</h3>
                  <p className="text-sm text-gray-500">Setup UPI details for payments</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                      <DollarSign size={16} />
                      Receiving UPI ID
                    </label>
                    <input
                      value={settings.upi_id}
                      onChange={e => setSettings({...settings, upi_id: e.target.value})}
                      placeholder="yourname@upi"
                      className="w-full bg-[#F9F5F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#C5A059] text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">Customers will pay to this UPI ID</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Payee Name</label>
                    <input
                      value={settings.upi_name}
                      onChange={e => setSettings({...settings, upi_name: e.target.value})}
                      placeholder="Your Business Name"
                      className="w-full bg-[#F9F5F0] p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#C5A059] text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">Name that appears in UPI apps</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      await supabase.from('app_settings').update(settings).eq('id', 1);
                      alert("Settings saved successfully!");
                    }}
                    className="w-full bg-gradient-to-r from-[#4B3621] to-[#2C1A11] text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-3"
                  >
                    <CheckCircle size={20} />
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Additional Settings Section */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-[#4B3621]/10">
              <h4 className="font-bold text-lg mb-4">Advanced Settings</h4>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-[#F9F5F0] rounded-xl hover:bg-[#F9F5F0]/80 transition flex items-center justify-between">
                  <span className="font-medium">Export Order Data</span>
                  <Download size={18} className="text-gray-400" />
                </button>
                
                <button className="w-full text-left p-4 bg-[#F9F5F0] rounded-xl hover:bg-[#F9F5F0]/80 transition flex items-center justify-between">
                  <span className="font-medium">Backup Database</span>
                  <Download size={18} className="text-gray-400" />
                </button>
                
                <button className="w-full text-left p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex items-center justify-between">
                  <span className="font-medium">Clear All Test Data</span>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}