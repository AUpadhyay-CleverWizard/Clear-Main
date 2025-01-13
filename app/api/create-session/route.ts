import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
    try {
        const projectId = process.env.PROJECT_ID;
        const apiKey = process.env.API_KEY;
        const redirectUrl = process.env.REDIRECT_BACK_URL;
        const verification_session: string = process.env.VERIFICATION_SESSION_URL as string;
        //const redirectUrl = "https://orange-rock-029296a10.4.azurestaticapps.net/results";
        //const verification_session: string = "https://verified.clearme.com/v1/verification_sessions";
        if (!projectId || !apiKey || !redirectUrl || !verification_session) {
            console.error('Missing environment variables');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }
        const response = await axios.post(verification_session, {
            project_id: projectId,
            redirect_url: redirectUrl,
            custom_fields: { contactid: 'TestAUContactId' }

        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        const verificationSession = response.data;
        return NextResponse.json({
            token: verificationSession.token,
            id: verificationSession.id
        });
    } catch (error) {
        console.error('Error creating verification session:', error);

        if (axios.isAxiosError(error) && error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }

        return NextResponse.json({ error: 'Failed to create verification session' }, { status: 500 });
    }
}
