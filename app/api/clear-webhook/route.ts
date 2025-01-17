import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import axios from 'axios';
let verificationData: Record<string, unknown> | null = null;
let payloadData: string;
interface CustomFields { dynid?: string | null; }
interface VerificationData { custom_fields?: CustomFields; }
export async function POST(req: NextRequest) {
    try {
        const webhookToken = process.env.WEBHOOK_TOKEN;
        const hmacSecret = process.env.HMAC_SECRET;
        const apiKey = process.env.API_KEY;
        if (!webhookToken || !hmacSecret || !apiKey) { return NextResponse.json({ error: 'Server misconfiguration: Missing environment variables' }, { status: 500 }); }
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) { return NextResponse.json({ error: 'Unauthorized request: Missing or malformed Authorization header' }, { status: 401 }); }
        const tokenFromHeader = authHeader.slice(7);
        if (tokenFromHeader !== webhookToken) { return NextResponse.json({ error: 'Unauthorized request: Invalid Bearer token' }, { status: 401 }); }
        const signatureFromHeader = req.headers.get('X-CLEAR-HMAC-SHA256');
        if (!signatureFromHeader) { return NextResponse.json({ error: 'Unauthorized request: Missing HMAC signature' }, { status: 401 }); }
        // Verify HMAC signature
        const body = await req.text();
        const hmac = createHmac('sha256', hmacSecret);
        hmac.update(body);
        const calculatedSignature = hmac.digest('hex');
        if (calculatedSignature !== signatureFromHeader) { return NextResponse.json({ error: 'Unauthorized request: Invalid HMAC signature' }, { status: 401 }); }
        const payload = JSON.parse(body);
        payloadData = body;
        if (payload.event_type === 'event_verification_session_completed_v1') {
            const verificationSessionId = payload.data.verification_session_id;
            const securedverificationurl = process.env.SECURED_VERIFICATION_SESSION_URL;
            if (!securedverificationurl) { return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 }); }
            try {
                const getResponse = await axios.get(securedverificationurl + "/" + verificationSessionId, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    }
                });
                verificationData = getResponse.data;
                const verificationDataCRM: VerificationData = getResponse.data;
                const contactId = verificationDataCRM?.custom_fields?.dynid ?? null;
                const verificationToken = verificationData?.token as string;
                const verificationId = verificationData?.id as string;
                if (contactId && verificationId && verificationToken) {
                    const retriveDynSessionRecordQuery = {
                        operation: "RetrieveMultiple",
                        entityName: "usc_clearverificationsessionses",
                        data: {
                            query: "$filter=usc_name eq '" + verificationId + "' and  usc_verificationdatatoken eq '" + verificationToken + "' and  _usc_clearverifiedperson_value eq " + contactId + "&$orderby=createdon desc&$top=1",
                            fields: []
                        }
                    }
                    const SITE_URL = process.env.SITE_URL;
                    const retriveDynSessionRecordRequest = await fetch(SITE_URL + '/api/dyn-ce-operations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }, // Indicates that you're sending JSON data}
                        body: JSON.stringify(retriveDynSessionRecordQuery)
                    });
                    if (!retriveDynSessionRecordRequest.ok) { return NextResponse.json({ error: 'ERROR in updating backend' }, { status: 500 }); }
                    const retriveDynSessionRecordData = await retriveDynSessionRecordRequest.json();
                    if (retriveDynSessionRecordData && retriveDynSessionRecordData.value) {
                        const currentDynVerificationRecord = retriveDynSessionRecordData.value[0];
                        if (currentDynVerificationRecord) {
                            const updateData = {
                                id: currentDynVerificationRecord?.usc_clearverificationsessionsid,
                                usc_verifyclearverificationresults: JSON.stringify(verificationData),
                                usc_verifyclearpayloadresults: payloadData
                            };
                            const response = await updateRecordInDynamics(updateData);
                            if (!response.success) { return NextResponse.json({ error: 'ERROR in updating backend' }, { status: 500 }); }
                        }
                    }
                }
                else {
                    console.error('DYNId Id is missing in the verificaiton results');
                    return NextResponse.json({ error: 'DYNId Id is missing in the verificaiton results' }, { status: 500 });
                }
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

type UpdateData = { [key: string]: string | undefined; };

const updateRecordInDynamics = async (updateData: UpdateData): Promise<{ success: boolean; message: string }> => {
    const dataToUpdate = {
        operation: "Update",
        entityName: 'usc_clearverificationsessionses',
        data: updateData
    };
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) { return { success: false, message: 'SITE_URL Configuration is missing' }; }
    try {
        const response = await axios.post(SITE_URL + '/api/dyn-ce-operations', dataToUpdate);
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

