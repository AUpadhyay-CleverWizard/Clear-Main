import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    try {
        const projectId = process.env.PROJECT_ID;
        const apiKey = process.env.API_KEY;
        const redirectUrl = process.env.REDIRECT_BACK_URL;
        const verification_session: string = process.env.VERIFICATION_SESSION_URL as string;

        if (!projectId || !apiKey || !redirectUrl || !verification_session) {
            console.error('Missing environment variables');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }
        const body = await req.json();
        if (body && body.dynid) {
            const response = await axios.post(verification_session, {
                project_id: projectId,
                redirect_url: redirectUrl,
                custom_fields: { dynid: body.dynid }
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
        }
        else { return NextResponse.json({ error: 'Failed to create verification session' }, { status: 500 }); }
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
