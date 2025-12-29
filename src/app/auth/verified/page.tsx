"use client";
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0] p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#4B3621]/10">
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600 w-10 h-10" />
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#4B3621] mb-2">
          Email Verified!
        </h1>
        
        <p className="text-gray-500 mb-8">
          Your account has been successfully activated. You can now log in to manage your orders.
        </p>

        <Link 
          href="/auth" 
          className="block w-full bg-[#4B3621] text-white py-3 rounded-lg font-bold hover:bg-[#2C1A11] transition flex items-center justify-center gap-2"
        >
          Go to Login <ArrowRight size={18} />
        </Link>

      </div>
    </div>
  );
}