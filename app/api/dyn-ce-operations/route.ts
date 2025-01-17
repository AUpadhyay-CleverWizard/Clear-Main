import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
type OperationData = {
    id?: string;
    fields?: string[];
    query?: string;
    [key: string]: unknown;
};
const getAccessToken = async (): Promise<string> => {
    const tenantId = process.env.Dynamics_CE_AppRegistration_TenantId as string;
    const clientId = process.env.Dynamics_CE_AppRegistration_AppId as string;
    const clientSecret = process.env.Dynamics_CE_AppRegistration_Secret as string;
    const resource = process.env.Dynamics_CE_URL as string;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    try {
        const response = await axios.post(tokenUrl, new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope: resource + '/.default',
            grant_type: 'client_credentials',
        }));

        return response.data.access_token;
    } catch (error) {
        throw new Error('Unable to retrieve access token: ' + error);
    }
};
const performOperation = async (
    operation: string,
    entityName: string,
    accessToken: string,
    data: OperationData
) => {
    const resource = process.env.Dynamics_CE_URL as string;;
    const baseUrl = `${resource}/api/data/v9.2/${entityName}`;
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
    try {
        let response;
        let fieldString = "";
        const fields = ["firstname", "lastname", "usc_enableclearverificationlink"];
        const url = `${baseUrl}`;
        if (fields && fields.length > 0) {
            const selectFields = fields.join(',');
            fieldString += `?$select=${selectFields}`;
        }
        switch (operation) {
            case 'Create': {
                response = await axios.post(baseUrl, data, { headers });
                break;
            }
            case 'Update': {
                const { id, ...updateData } = data as { id: string;[key: string]: unknown };
                if (!id) throw new Error('ID is required for Update operation.');
                response = await axios.patch(`${url}(${id})`, updateData, { headers });
                break;
            }
            case 'Retrieve': {
                const { id } = data as { id: string };
                if (!id) throw new Error('ID is required for Retrieve operation.');
                const fullURL = `${url}(${id})${fieldString}`;
                response = await axios.get(fullURL, { headers });
                break;
            }
            case 'RetrieveMultiple': {
                const { query } = data as { query?: string };
                response = await axios.get(`${url}${query ? `&${query}` : ''}`, { headers });
                break;
            }
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
        if (response.status === 204) {
            return NextResponse.json({ message: "Operation successful but no content to return." }, { status: 200 });
        }
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Error during ${operation}: ${error.response?.data?.message || error.message}`);
        } else {
            throw new Error(`Unexpected error: ${error}`);
        }
    }
};
export async function POST(req: NextRequest) {
    try {
        const requestBody = await req.json();
        const { operation, entityName, data } = requestBody;
        const accessToken = await getAccessToken();
        if (!operation || !entityName || !data || !accessToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const response = await performOperation(operation, entityName, accessToken, data);
        return response;
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred while processing the request.' + error }, { status: 500 });
    }
}
