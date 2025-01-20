"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
interface DocumentTraits {
    first_name?: string;
    last_name?: string;
    issuing_country?: string;
    issuing_subdivision?: string;
    gender?: string;
    date_of_birth?: {
        day: number;
        month: number;
        year: number;
    };
    address?: {
        line1?: string;
        city?: string;
        state?: string;
        postal_code?: string;
    };
}
interface VerificationData {
    traits?: {
        document?: DocumentTraits;
    };
}
export default function ResultsPage() {
    //const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        fetch('/api/clear-webhook')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch verification data');
                }
                return response.json();
            })
            .then((data: VerificationData) => {
                console.log('Fetched verification data:', data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError('Failed to load verification data');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div
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
                                Processing!
                            </span>
                        </h1>
                    </div>
                    <span className="subheading">
                        Please wait while we process your request!
                    </span>
                </div>
                <br></br>
            </main>
        </div>;
    }

    if (error) {
        return <div
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
                                {error}
                            </span>
                        </h1>
                    </div>
                    <span className="subheading">
                        Something went wrong, please contact USClaims Support!
                    </span>
                </div>
                <br></br>
            </main>
        </div>;
    }

    //const documentTraits = verificationData?.traits?.document;
    //if (!documentTraits) {
    //    return <p>No document data available.</p>;
    //}

    //const dateOfBirth = documentTraits.date_of_birth
    //    ? `${documentTraits.date_of_birth.day}/${documentTraits.date_of_birth.month}/${documentTraits.date_of_birth.year}`
    //    : 'N/A';

    //const documentAddress = documentTraits.address
    //    ? `${documentTraits.address.line1 || ''}, ${documentTraits.address.city || ''}, ${documentTraits.address.state || ''}, ${documentTraits.address.postal_code || ''}`
    //    : 'N/A';

    return (
        //<div className="p-8">
        //    <h1 className="text-2xl font-bold mb-4">Welcome Details</h1>
        //    <p className="mb-4">
        //        Hey <span className="font-bold text-blue-600">{documentTraits.first_name || 'Guest'}</span>{' '}
        //        <span className="font-bold text-blue-600">{documentTraits.last_name || ''}</span>, thanks for visiting
        //        from <span className="font-bold text-blue-600">{documentAddress}</span>. We are so glad you came all the
        //        way from <span className="font-bold text-blue-600">{documentTraits.issuing_country || 'Unknown'}</span>,{' '}
        //        <span className="font-bold text-blue-600">{documentTraits.issuing_subdivision || 'Unknown'}</span>.
        //    </p>

        //    <div>
        //        <h2 className="text-xl font-bold mb-2">Additional Details about YOU</h2>
        //        <ol className="list-decimal list-inside text-blue-600">
        //            <li>
        //                Gender: <span className="font-bold">{documentTraits.gender || 'N/A'}</span>
        //            </li>
        //            <li>
        //                Date of Birth: <span className="font-bold">{dateOfBirth}</span>
        //            </li>
        //        </ol>
        //    </div>
        //</div>

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
                                Thank you for using USClaims Verification Portal
                            </span>
                        </h1>
                    </div>
                    <span className="subheading">
                        We have successfully received your verification request and we will get back to you shortly!
                    </span>
                </div>
                <br></br>
            </main>
        </div>

    );
}
