"use client"

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-session', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.token) {
        // Redirect to the verification UI
        window.location.href = `https://verified.clearme.com/verify?token=${data.token}`;
      } else {
        alert('Failed to start verification session');
      }
    } catch (error) {
      console.error('Error starting verification:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center  min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
       <h1></h1>
        <p>Landing page generated by you. You can create a button that begins the CLEAR verification process</p>
        <p>This page educates users on what they are about to verify for.</p>
        <ol>
          <li>Streamline Check-in to hotels</li>
          <li>Ensure users are real people on your platform</li>
          <li>Create your account using CLEAR</li>
          <li>Provision access or information</li>
          <li>Instant on account creation</li>
          <li>Mitigate Fraud by ensuring customers are who they say they are</li>



        </ol>

      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
       

        <button
          onClick={handleVerification}
          className="rounded-full border border-solid border-transparent transition-colors  bg-[#1a1b5e] flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Verify Identity With CLEAR'}
        </button>
      </main>
    </div>
  );
}

