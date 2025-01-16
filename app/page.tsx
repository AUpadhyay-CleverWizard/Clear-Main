"use client"
import { useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
// Define the response type
type ConfigResponse = { clearme_url: string; };
export default function Home() {
    const searchParams = useSearchParams();  // Get query parameters
    const id = searchParams.get("id");  // Get the `id` query parameter from URL 
    if (!id) { window.location.href = "/404"; }
    const [loading, setLoading] = useState(false);
    const handleVerification = async () => {
        setLoading(true);
        try {
            const response3 = await fetch('/api/retrive-config', { method: 'GET', });
            const urldata: ConfigResponse = await response3.json();
            const clearme_url: string = urldata.clearme_url;
            const reqBody = {
                operation: "Retrieve",
                entityName: 'contacts',
                data: {
                    id: id,
                    fields: ["firstname", "lastname", "usc_enableclearverificationlink"]
                },  // The contactId received as a parameter
            };
            const retrieveContact = await fetch('/api/dyn-ce-operations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // Indicates that you're sending JSON data}
                body: JSON.stringify(reqBody)
            });
            const contactData = await retrieveContact.json();
            if (contactData && contactData.usc_enableclearverificationlink) {
                const response = await fetch('/api/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }, // Indicates that you're sending JSON data}
                    body: JSON.stringify({ dynid: id })
                });
                const data = await response.json();
                if (data.token || clearme_url) {
                    alert(clearme_url + `?token=${data.token}`)
                    window.location.href = clearme_url + `?token=${data.token}`;
                } else {
                    window.location.href = "/404";
                }
            } else {
                alert("The link has already been used or you are not authorise to access this.");
            }
        } catch (error) {
            console.error('Error starting verification:', error);
            alert('Error starting verification');
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
                    backgroundColor: 'rgba(255, 255, 255, 0.80)'
                }}
            >
                <header className="mb-4">
                    <Image
                        src="/logo-desktop.svg"
                        alt="CLEAR Logo"
                        className="h-16 sm:h-20"
                        width={500}
                        height={500}
                    />
                </header>
                <div className="mb-6">
                    <div className="elementor-widget-container mb-6">
                        <h1 className="elementor-heading-title elementor-size-default">
                            <span className="heading-dark">
                                Welcome to USClaims Verification Portal
                            </span>
                        </h1>
                    </div>
                    <span className="subheading">
                        Injury settlements take time. But you need cash now. That’s where
                        USClaims comes in—we’ll provide the funds you need to cover expenses
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
                    <button
                        onClick={handleVerification}
                        className="rounded-full border border-solid border-transparent transition-colors bg-[#1a1b5e] flex items-center justify-center text-white gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
                        disabled={loading}>
                        {loading ? "Loading..." : "Verify Identity With CLEAR"}
                    </button>
                </div>
            </main>
        </div>
    );
}