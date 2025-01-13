"use client"

import { useState } from 'react';
type ConfigResponse = { clearme_url: string; };
export default function Home() {
    const [loading, setLoading] = useState(false);
    const handleVerification = async () => {
        setLoading(true);
        try {
            const response3 = await fetch('/api/retrive-config', {
                method: 'GET',
            });
            // Parse and cast the response to the ConfigResponse type
            const urldata: ConfigResponse = await response3.json();
            const clearme_url: string = urldata.clearme_url;
            const response = await fetch('/api/create-session', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.token || clearme_url) {
                // Redirect to the verification UI
                window.location.href = clearme_url + `?token=${data.token}`;
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
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8 relative"
            style={{
                backgroundImage: `url('/Hero-image@2.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <main
                className="text-center max-w-2xl p-6 sm:p-8 rounded-lg shadow-md flex flex-col items-center relative z-10"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.85) !important', /* White with 85% opacity */
                }}
            >
                <header className="mb-4">
                    <img
                        src="/logo-desktop.svg"
                        alt="CLEAR Logo"
                        className="h-16 sm:h-20"
                    />
                </header>
                <div className="mb-6">
                    <div className="elementor-widget-container mb-6">
                        <h1 className="elementor-heading-title elementor-size-default">
                            <span className="heading-dark">
                                Welcome to USClaims Verification Portal - Test UI V1.1
                            </span>
                        </h1>
                    </div>
                    <span className="subheading">
                        Injury settlements take time. But you need cash now. That's where
                        USClaims comes in�we'll provide the funds you need to cover expenses
                        while your attorney fights for a fair settlement.
                    </span>
                </div>
                <span className="subheading">Streamline Check-in to hotels</span>
                <span className="subheading">Ensure users are real people on your platform</span>
                <span className="subheading">Create your account using CLEAR</span>
                <span className="subheading">Provision access or information</span>
                <span className="subheading">Instant on account creation</span>
                <span className="subheading">
                    Mitigate Fraud by ensuring customers are who they say they are
                </span>
                <br></br>
                <div className="flex justify-center">
                </div>
            </main>
        </div>
    );
}