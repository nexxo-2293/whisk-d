"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function CheckoutPage() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Cart & Payment Data
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [adminUpi, setAdminUpi] = useState({ id: '', name: '' });
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '', 
    phone: '',
    address: '',
    date: '',
    txnId: '' 
  });

  // NEW: State for Order Note
  const [note, setNote] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');

  // --- INITIAL LOAD ---
  useEffect(() => {
    // 1. Fetch Admin Payment Details
    supabase.from('app_settings').select('*').single().then(({ data }) => {
      if (data) setAdminUpi({ id: data.upi_id, name: data.upi_name });
    });

    // 2. Load Cart
    const cart = JSON.parse(localStorage.getItem('whiskd_cart') || '{}');
    const products = JSON.parse(localStorage.getItem('whiskd_products') || '[]');
    let calcTotal = 0;
    
    const cartItems = products
      .filter((p: any) => cart[p.id] > 0)
      .map((p: any) => {
        calcTotal += p.price * cart[p.id];
        return { ...p, qty: cart[p.id] };
      });

    setItems(cartItems);
    setTotal(calcTotal);

    // 3. Check Auth & Pre-fill Data
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.full_name || '',
            email: user.email || '',
            phone: profile.phone_number || '',
            address: profile.address || ''
          }));
        }
      }
    };
    checkAuth();
  }, []);

  // --- HELPERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    return d.toISOString().split('T')[0];
  };

  const upiLink = `upi://pay?pa=${adminUpi.id}&pn=${encodeURIComponent(adminUpi.name)}&am=${total}&cu=INR`;

  // --- SUBMIT ORDER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (paymentMethod === 'upi' && !formData.txnId) {
        throw new Error("Please enter the Transaction ID / UTR number.");
      }

      // 1. Insert Order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email,
          
          delivery_address: formData.address, 
          delivery_date: formData.date,
          
          items: items,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'Pending' : 'Verify Required',
          
          // Save the note
          order_note: note 
        })
        .select() // Return data to get the generated 'order_code'
        .single(); 

      if (orderError) throw orderError;

      // 2. Send Email
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_ORDER',
          orderDetails: {
            id: orderData.order_code, // Use the readable code (e.g. ORD-1234)
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            note: note,
            total: total,
            items: items,
            payment: paymentMethod
          }
        })
      });

      // 3. Success & Cleanup
      localStorage.removeItem('whiskd_cart');
      alert("Order Placed Successfully! Check your email for confirmation.");
      router.push('/');

    } catch (error: any) {
      alert("Failed to place order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && total === 0) {
    return <div className="p-10 text-center">Your cart is empty...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F5F0] p-4 md:p-8 font-sans text-[#4B3621]">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#4B3621]/10">
          <h2 className="text-2xl font-serif font-bold mb-6 flex justify-between items-center">
            Checkout
            {!user && <span className="text-xs font-sans font-normal bg-gray-100 px-2 py-1 rounded text-gray-500">Guest Mode</span>}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Personal Details */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-[#C5A059] tracking-wider">Contact Info</label>
              <input required name="name" placeholder="Full Name" value={formData.name} onChange={handleChange}
                className="w-full border p-3 rounded bg-gray-50 focus:border-[#4B3621] outline-none" />
              
              <div className="grid grid-cols-2 gap-3">
                <input required name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange}
                  className="w-full border p-3 rounded bg-gray-50 focus:border-[#4B3621] outline-none" />
                <input required name="phone" type="tel" placeholder="Mobile Number" value={formData.phone} onChange={handleChange}
                  className="w-full border p-3 rounded bg-gray-50 focus:border-[#4B3621] outline-none" />
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase text-[#C5A059] tracking-wider">Delivery Details</label>
              <textarea required name="address" placeholder="Complete Delivery Address" rows={3} value={formData.address} onChange={handleChange}
                className="w-full border p-3 rounded bg-gray-50 focus:border-[#4B3621] outline-none" />
              
              <div>
                <input required name="date" type="date" min={getMinDate()} value={formData.date} onChange={handleChange}
                  className="w-full border p-3 rounded bg-gray-50 focus:border-[#4B3621] outline-none" />
                <p className="text-[10px] text-red-500 mt-1">* Minimum 24-hour notice required.</p>
              </div>
            </div>

            {/* NEW: Note Section */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Order Note (Optional)</h3>
              <textarea
                placeholder="Any special requests? (e.g., 'Please write Happy Birthday')"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 border rounded-lg h-24 resize-none focus:border-[#C5A059] outline-none"
              />
            </div>

            {/* Payment Selection */}
            <div className="pt-6">
              <label className="block text-xs font-bold uppercase text-[#C5A059] tracking-wider mb-3">Payment Method</label>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button type="button" onClick={() => setPaymentMethod('cod')}
                  className={`p-4 border rounded-lg text-sm font-bold transition-all ${paymentMethod === 'cod' ? 'bg-[#4B3621] text-white border-[#4B3621]' : 'bg-white hover:bg-gray-50'}`}>
                  Cash on Delivery
                </button>
                <button type="button" onClick={() => setPaymentMethod('upi')}
                  className={`p-4 border rounded-lg text-sm font-bold transition-all ${paymentMethod === 'upi' ? 'bg-[#4B3621] text-white border-[#4B3621]' : 'bg-white hover:bg-gray-50'}`}>
                  Pay via QR / UPI
                </button>
              </div>

              {/* UPI Section */}
              {paymentMethod === 'upi' && (
                <div className="bg-gray-50 border border-dashed border-[#4B3621] rounded-lg p-6 text-center animate-in fade-in zoom-in">
                  <p className="text-sm mb-4 font-bold">Scan to Pay ₹{total}</p>
                  
                  <div className="bg-white p-2 inline-block rounded shadow-sm mb-4">
                    <QRCodeSVG value={upiLink} size={160} level="M" />
                  </div>
                  
                  <div className="mb-4">
                    <a href={upiLink} className="text-blue-600 text-xs font-bold underline hover:text-blue-800">
                      Tap here to pay using GPay / PhonePe
                    </a>
                  </div>

                  <div className="text-left">
                    <label className="block text-xs font-bold text-red-600 mb-1">Transaction ID / UTR (Required)</label>
                    <input required name="txnId" placeholder="e.g. 329XXXXXXXXX" value={formData.txnId} onChange={handleChange}
                      className="w-full border border-red-200 bg-red-50 p-2 rounded focus:outline-red-500" />
                  </div>
                </div>
              )}
            </div>

            <button disabled={loading} type="submit" className="w-full bg-[#C5A059] text-white font-bold py-4 rounded-lg shadow-lg hover:bg-[#b08d4b] transition transform active:scale-95">
              {loading ? 'Processing Order...' : `Confirm Order (₹${total})`}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="h-fit bg-[#F5F5DC] p-6 rounded-xl border border-[#4B3621]/10 sticky top-4">
          <h3 className="text-xl font-serif font-bold mb-4">Your Order</h3>
          <div className="divide-y divide-[#4B3621]/20">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold block">{item.name}</span>
                  <span className="text-xs text-gray-600">Qty: {item.qty}</span>
                </div>
                <span className="font-medium">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-[#4B3621] mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="font-bold text-2xl text-[#4B3621]">₹{total}</span>
          </div>
        </div>

      </div>
    </div>
  );
}