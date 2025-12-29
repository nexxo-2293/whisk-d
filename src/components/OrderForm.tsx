"use client";

import { useState, ChangeEvent, FormEvent } from 'react';

// Define the shape of our form data
interface OrderFormData {
  name: string;
  phone: string;
  date: string;
  quantity: number;
  payment: 'COD' | 'Online/QR'; // Union type for strict safety
}

export default function OrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    phone: '',
    date: '',
    quantity: 1,
    payment: 'COD'
  });

  // LOGIC: Calculate minimum date (Tomorrow)
  const getMinDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Type the change event for input elements
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
  };

  // LOGIC: WhatsApp Redirection
  const handleOrder = (e: FormEvent) => {
    e.preventDefault();
    
    const clientPhone = "919999999999"; 
    
    // Construct the message
    const message = `*New Order for Whisk'd!* 🍰%0A%0A` +
      `*Name:* ${formData.name}%0A` +
      `*Date:* ${formData.date}%0A` +
      `*Qty:* ${formData.quantity} Boxes%0A` +
      `*Payment:* ${formData.payment}%0A` +
      `------------------%0A` +
      `Total: ₹${formData.quantity * 450}`;

    window.open(`https://wa.me/${clientPhone}?text=${message}`, '_blank');
  };

  return (
    <section className="bg-cream py-12 px-4" id="order">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-mocha">
        <div className="bg-coffee p-4 text-center">
          <h2 className="text-2xl font-serif text-cream font-bold">Reserve Your Tiramisu</h2>
          <p className="text-gold text-xs uppercase tracking-widest">Orders close 24h prior</p>
        </div>

        <form onSubmit={handleOrder} className="p-6 space-y-4">
          
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-coffee uppercase mb-1">Full Name</label>
            <input required name="name" type="text" onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-coffee" />
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-xs font-bold text-coffee uppercase mb-1">Pickup/Delivery Date</label>
            <input required name="date" type="date" min={getMinDate()} onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-coffee" />
            <p className="text-[10px] text-red-500 mt-1">* We need 24h to prepare fresh batches.</p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-coffee uppercase mb-1">Quantity (Box of 2)</label>
            <input required name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 p-2 rounded focus:outline-none focus:border-coffee" />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-coffee uppercase mb-2">Payment Preference</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" 
                onClick={() => setFormData(prev => ({...prev, payment: 'COD'}))}
                className={`p-2 text-sm border rounded ${formData.payment === 'COD' ? 'bg-coffee text-white' : 'text-coffee'}`}>
                Cash (COD)
              </button>
              <button type="button" 
                onClick={() => setFormData(prev => ({...prev, payment: 'Online/QR'}))}
                className={`p-2 text-sm border rounded ${formData.payment === 'Online/QR' ? 'bg-coffee text-white' : 'text-coffee'}`}>
                Pay via QR
              </button>
            </div>
          </div>

          {/* QR Code Display Logic */}
          {formData.payment === 'Online/QR' && (
            <div className="bg-orange-50 p-4 border border-orange-200 rounded text-center animate-pulse">
              <p className="text-xs font-bold text-coffee mb-2">Scan to pay ₹{formData.quantity * 450}</p>
              {/* Image tag optimized for Next.js if you want, or standard img for now */}
              <div className="h-32 w-32 bg-gray-300 mx-auto mb-2 flex items-center justify-center text-xs">[QR IMAGE]</div>
              <p className="text-[10px] text-gray-600">Attach screenshot on WhatsApp in next step.</p>
            </div>
          )}

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition flex justify-center items-center gap-2">
            Proceed to WhatsApp
          </button>

        </form>
      </div>
    </section>
  );
}