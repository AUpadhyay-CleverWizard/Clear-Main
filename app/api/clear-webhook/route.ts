import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import axios from 'axios';
let verificationData: Record<string, unknown> | null = null;
let payloadData: string;
interface CustomFields { dynid?: string | null; }
interface VerificationData { custom_fields?: CustomFields; }
interface DocumentTraits {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
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
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
    };
    nationality?: string;
}
interface VerificationData {
    traits?: { document?: DocumentTraits; };
}
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

        if (payload.event_type === 'event_verification_session_completed_v1' || payload.event_type === 'event_verification_session_status_update_v1')
        {
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
                            let verficationStatus: number = 860000000 //Initiated
                            let verificationCompletedAt: string = "";
                            let verificationExpiresAt: string = "";
                            let firstName = null;
                            let middleName = null;
                            let lastName = null;
                            let nationality = null;
                            let phone = null;
                            let email = null;
                            let addressLine1 = null;
                            let addressLine2 = null;
                            let addressCity = null;
                            let addressState = null;
                            let addressPostalCode = null;
                            let addressCountry = null;
                            let DOB = null;
                            let UserId = null;
                            if (verificationData) {
                                if (verificationData.status == "awaiting_manual_review") { verficationStatus = 860000008; }
                                else if (verificationData.status == "awaiting_user_input") { verficationStatus = 860000004; }
                                else if (verificationData.status == "canceled") { verficationStatus = 860000005; }
                                else if (verificationData.status == "expired") { verficationStatus = 860000003; }
                                else if (verificationData.status == "fail") { verficationStatus = 860000002; }
                                else if (verificationData.status == "manual_fail") { verficationStatus = 860000007; }
                                else if (verificationData.status == "processing_data") { verficationStatus = 860000006; }
                                else if (verificationData.status == "success") { verficationStatus = 860000001; }
                                else if (verificationData.status == "manual_success") { verficationStatus = 860000009; }
                                if (verificationData.completed_at) {
                                    const dateObject = new Date(verificationData.completed_at as number * 1000);
                                    verificationCompletedAt = dateObject.toISOString();
                                }
                                if (verificationData.expires_at) {
                                    const dateObject = new Date(verificationData.expires_at as number * 1000);
                                    verificationExpiresAt = dateObject.toISOString();
                                }
                                if (verificationData.phone) { phone = verificationData.phone as string; }
                                if (verificationData.email) { email = verificationData.email as string; }
                                if (verificationData.user_id) { UserId = verificationData.user_id as string; }
                                if (verificationData.traits) {
                                    const Vdata: VerificationData = verificationData;
                                    if (Vdata && Vdata.traits && Vdata.traits.document) {
                                        const DocumentTraits: DocumentTraits = Vdata.traits.document;
                                        if (DocumentTraits.date_of_birth) {
                                            const day: number = DocumentTraits.date_of_birth.day;
                                            const month: number = DocumentTraits.date_of_birth.month;
                                            const year: number = DocumentTraits.date_of_birth.year;
                                            DOB = new Date(year, month, day).toISOString();
                                        }
                                        if (DocumentTraits.nationality) { nationality = DocumentTraits.nationality; }
                                        if (DocumentTraits.address) {
                                            if (DocumentTraits.address.line1) { addressLine1 = DocumentTraits.address.line1; }
                                            if (DocumentTraits.address.line2) { addressLine2 = DocumentTraits.address.line2; }
                                            if (DocumentTraits.address.city) { addressCity = DocumentTraits.address.city; }
                                            if (DocumentTraits.address.state) { addressState = DocumentTraits.address.state; }
                                            if (DocumentTraits.address.postal_code) { addressPostalCode = DocumentTraits.address.postal_code; }
                                            if (DocumentTraits.address.country) { addressCountry = DocumentTraits.address.country; }
                                        }
                                        if (DocumentTraits.first_name) { firstName = DocumentTraits.first_name; }
                                        if (DocumentTraits.middle_name) { middleName = DocumentTraits.middle_name; }
                                        if (DocumentTraits.last_name) { lastName = DocumentTraits.last_name; }
                                    }
                                }
                            }
                            const updateData = {
                                id: currentDynVerificationRecord?.usc_clearverificationsessionsid,
                                usc_verifyclearverificationresults: JSON.stringify(verificationData),
                                usc_verifyclearpayloadresults: payloadData,
                                usc_clearverificationstatus: verficationStatus,
                                usc_clearverificationsessionexpiringon: verificationExpiresAt === "" ? null : verificationExpiresAt,
                                usc_clearverificationsessioncompletedon: verificationCompletedAt === "" ? null : verificationCompletedAt,
                                usc_firstname: firstName,
                                usc_middlename: middleName,
                                usc_lastname: lastName,
                                usc_nationality: nationality,
                                usc_phone: phone,
                                usc_email: email,
                                usc_addressline1: addressLine1,
                                usc_addressline2: addressLine2,
                                usc_addresscity: addressCity,
                                usc_addressstate: addressState,
                                usc_addresscountry: addressCountry,
                                usc_addresspostalcode: addressPostalCode,
                                usc_dateofbirth: DOB,
                                usc_userid: UserId
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
        else {

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

type UpdateData = { [key: string]: string| number | undefined | null; };

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

