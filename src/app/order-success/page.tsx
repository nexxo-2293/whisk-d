"use client";
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// 1. ISOLATE THE PART THAT USES SEARCH PARAMS
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <>
      {orderId && (
        <div className="bg-[#F9F5F0] p-4 rounded-xl border border-[#4B3621]/10 mb-8">
          <p className="text-xs font-bold uppercase text-gray-400 mb-1">Order Reference Code</p>
          <p className="text-2xl font-bold text-[#C5A059] tracking-wider">{orderId}</p>
        </div>
      )}
    </>
  );
}

// 2. MAIN PAGE COMPONENT (Wraps content in Suspense)
export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#4B3621]/10">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle className="text-green-600 w-12 h-12" />
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#4B3621] mb-2">
          Order Placed!
        </h1>
        
        <p className="text-gray-500 mb-6">
          Thank you for ordering with Whisk'd. We have received your request and will begin preparation shortly.
        </p>

        {/* ⚠️ SUSPENSE BOUNDARY FIXES THE BUILD ERROR */}
        <Suspense fallback={<div className="h-20 flex items-center justify-center">Loading details...</div>}>
          <SuccessContent />
        </Suspense>

        <div className="space-y-3">
          <Link 
            href="/profile" 
            className="block w-full bg-[#4B3621] text-white py-3 rounded-lg font-bold hover:bg-[#2C1A11] transition flex items-center justify-center gap-2"
          >
            <Package size={18} /> View My Order
          </Link>
          
          <Link 
            href="/" 
            className="block w-full text-[#4B3621] py-3 rounded-lg font-bold hover:bg-gray-50 transition"
          >
            Back to Menu
          </Link>
        </div>

      </div>
    </div>
  );
}