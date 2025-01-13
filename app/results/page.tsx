"use client";

import { useEffect, useState } from 'react';

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
    const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    let responseData = null;

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
                setVerificationData(data);
                setLoading(false);
                console.log('Request:', data);
                responseData = data; 
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError('Failed to load verification data');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const documentTraits = verificationData?.traits?.document;
    if (!documentTraits) {
        return <p>No document data available.</p>;
    }

    const dateOfBirth = documentTraits.date_of_birth
        ? `${documentTraits.date_of_birth.day}/${documentTraits.date_of_birth.month}/${documentTraits.date_of_birth.year}`
        : 'N/A';

    const documentAddress = documentTraits.address
        ? `${documentTraits.address.line1 || ''}, ${documentTraits.address.city || ''}, ${documentTraits.address.state || ''}, ${documentTraits.address.postal_code || ''}`
        : 'N/A';

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Welcome Details</h1>
            <p className="mb-4">
                Hey <span className="font-bold text-blue-600">{documentTraits.first_name || 'Guest'}</span>{' '}
                <span className="font-bold text-blue-600">{documentTraits.last_name || ''}</span>, thanks for visiting
                from <span className="font-bold text-blue-600">{documentAddress}</span>. We are so glad you came all the
                way from <span className="font-bold text-blue-600">{documentTraits.issuing_country || 'Unknown'}</span>,{' '}
                <span className="font-bold text-blue-600">{documentTraits.issuing_subdivision || 'Unknown'}</span>.
            </p>

            <div>
                <h2 className="text-xl font-bold mb-2">Additional Details about YOU</h2>
                <ol className="list-decimal list-inside text-blue-600">
                    <li>
                        Gender: <span className="font-bold">{documentTraits.gender || 'N/A'}</span>
                    </li>
                    <li>
                        Date of Birth: <span className="font-bold">{dateOfBirth}</span>
                    </li>
                </ol>
            </div>
        </div>
    );
}
