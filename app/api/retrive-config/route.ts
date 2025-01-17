import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
    const clearme_url: string = process.env.VERIFICATION_CLEARME_URL as string;
    return NextResponse.json({ clearme_url });
}
