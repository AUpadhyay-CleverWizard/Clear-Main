import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import axios from 'axios';
let verificationData: Record<string, unknown> | null = null;
export async function POST(req: NextRequest) {
    try {
        // Load environment variables
        const webhookToken = process.env.WEBHOOK_TOKEN;
        const hmacSecret = process.env.HMAC_SECRET;
        const apiKey = process.env.API_KEY;
        // Check that environment variables are set
        if (!webhookToken || !hmacSecret || !apiKey) {
            console.error('Missing environment variables');
            return NextResponse.json({ error: 'Server misconfiguration: Missing environment variables' }, { status: 500 });
        }
        // Authorization header check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Missing or malformed Authorization header');
            return NextResponse.json({ error: 'Unauthorized request: Missing or malformed Authorization header' }, { status: 401 });
        }
        const tokenFromHeader = authHeader.slice(7);
        if (tokenFromHeader !== webhookToken) {
            console.error('Invalid Bearer token');
            return NextResponse.json({ error: 'Unauthorized request: Invalid Bearer token' }, { status: 401 });
        }
        // HMAC signature check
        const signatureFromHeader = req.headers.get('X-CLEAR-HMAC-SHA256');
        if (!signatureFromHeader) {
            console.error('Missing HMAC signature');
            return NextResponse.json({ error: 'Unauthorized request: Missing HMAC signature' }, { status: 401 });
        }
        // Verify HMAC signature
        const body = await req.text();
        const hmac = createHmac('sha256', hmacSecret);
        hmac.update(body);
        const calculatedSignature = hmac.digest('hex');
        if (calculatedSignature !== signatureFromHeader) {
            console.error('Invalid HMAC signature');
            return NextResponse.json({ error: 'Unauthorized request: Invalid HMAC signature' }, { status: 401 });
        }
        const payload = JSON.parse(body);
        console.log('Webhook received payload:', payload);

        //if (payload?.custom_fields?.dynid) {
            const contactId = "9d197af8-648c-ef11-ac20-7c1e52586375";
            const updateData = {
                id: contactId,
                usc_verifyclearpayloadresults: "Ama Test qeqwe"
            };
            await updateRecordInDynamics(updateData);
            //return NextResponse.json({ response }, { status: 200 });
        //}
        if (payload.event_type === 'event_verification_session_completed_v1') {
            const verificationSessionId = payload.data.verification_session_id;
            console.log(`Verification session completed for ID: ${verificationSessionId}`);
            const securedverificationurl = process.env.SECURED_VERIFICATION_SESSION_URL;

            if (!securedverificationurl) {
                console.error('Missing environment variable SECURED_VERIFICATION_SESSION_URL');
                return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
            }
            try {
                const getResponse = await axios.get(securedverificationurl + "/" + verificationSessionId, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    }
                });
                console.log('Verification session data received:', getResponse.data);
                verificationData = getResponse.data;
            } catch (getError) {
                console.error('Error making GET request to fetch verification session:', getError);
                return NextResponse.json({ error: 'Failed to retrieve verification session' }, { status: 500 });
            }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function GET() {
    console.log('GET request received on /api/clear-webhook');
    if (verificationData) {
        console.log('Returning verification data:', verificationData);
        return NextResponse.json(verificationData);
    } else {
        console.log('No verification data available');
        return NextResponse.json({ message: 'No data available' }, { status: 404 });
    }
}

type UpdateData = {
    [key: string]: string | undefined; // If you want to allow additional fields
};

const updateRecordInDynamics = async (updateData: UpdateData): Promise<{ success: boolean; message: string }> => {
    // Define the data to update the record dynamically
    const dataToUpdate = {
        operation: "Update",
        entityName: 'contacts',  // The entity name to update, for contact it's 'contacts'
        data: updateData        // The update data received as a parameter
    };
    const SITE_URL = process.env.SITE_URL;
    try {
        const response = await axios.post(SITE_URL+'/api/dyn-ce-operations', dataToUpdate);
        console.log(response);
        if (response.status === 200 || response.status === 204) {
            return { success: true, message: 'Record updated successfully' };
        } else {
            return { success: false, message: `Update failed with status: ${response.status}` };
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return { success: false, message: error.response?.data || error.message };
        } else {
            return { success: false, message: 'Unexpected error occurred' };
        }
    }
};

