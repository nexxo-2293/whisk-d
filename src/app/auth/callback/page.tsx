"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Check if the URL hash contains the access token (Implicit Flow)
      // The Supabase client automatically parses the hash and sets the session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth Error:', error);
        router.replace('/auth?error=verification_failed');
        return;
      }

      if (session) {
        // 2. SUCCESS: We have a session!
        // Redirect to the "Verified" page so the user knows it worked
        router.replace('/auth/verified');
      } else {
        // 3. NO SESSION: Wait a moment, sometimes it takes a split second to set
        // If still nothing after a short delay, go back to login
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          router.replace('/auth/verified');
        } else {
          // If we really can't find a session, send them to login
          router.replace('/auth');
        }
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F5F0] text-[#4B3621]">
      <Loader2 className="animate-spin mb-4" size={48} />
      <h2 className="text-2xl font-serif font-bold">Verifying your email...</h2>
      <p className="text-gray-500">Please wait a moment.</p>
    </div>
  );
}