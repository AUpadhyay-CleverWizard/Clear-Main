import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Define the operation data types for better type safety
type OperationData = {
    id?: string;
    fields?: string[]; // Optional array of fields for Retrieve and RetrieveMultiple operations
    query?: string;    // Optional query string for RetrieveMultiple
    [key: string]: unknown;
};

// Function to get the access token
const getAccessToken = async (): Promise<string> => {

    const clientId = process.env.Dynamics_CE_AppRegistration_AppId as string;
    const clientSecret = process.env.Dynamics_CE_AppRegistration_Secret as string;
    const resource = process.env.Dynamics_CE_URL as string;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    try {
        const response = await axios.post(tokenUrl, new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope: `${resource}/.default`,
            grant_type: 'client_credentials',
        }));

        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error);
        throw new Error('Unable to retrieve access token');
    }
};

// Perform operation on the specified entity
const performOperation = async (
    operation: string,
    entityName: string,
    accessToken: string,
    data: OperationData
) => {
    const resource = "https://uscqa.api.crm.dynamics.com";
    const baseUrl = `${resource}/api/data/v9.2/${entityName}`;
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };

    console.log(`Performing ${operation} on entity: ${entityName}`);
    console.log('Request Data:', data); // Log the request data for debugging

    try {
        let response;
        let fieldString = "";
        // Check if fields are defined in the request data
        //const fields = data.fields ? data.fields : undefined;
        const fields = ["firstname", "lastname", "usc_sendverifyclearverificationlink"];
        const url = `${baseUrl}`;

        // If fields are defined, include them in the query
        if (fields && fields.length > 0) {
            const selectFields = fields.join(','); // This will join the fields array into a comma-separated string
            fieldString += `?$select=${selectFields}`;
        }

        switch (operation) {
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
            /*case 'RetrieveMultiple': {
              const { query } = data as { query?: string };
              response = await axios.get(`${url}${query ? `&${query}` : ''}`, { headers });
              break;
            }*/
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }

        // Handle 204 No Content response
        if (response.status === 204) {
            return NextResponse.json({ message: "Operation successful but no content to return." }, { status: 200 });
        }

        // For all other successful responses (non-204)
        return NextResponse.json(response.data, { status: response.status });

    } catch (error: unknown) {
        console.error('Error during operation:', operation);
        console.error('Error details:', error);

        if (axios.isAxiosError(error)) {
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
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

        // Fetch the access token before proceeding
        const accessToken = await getAccessToken();

        if (!operation || !entityName || !data || !accessToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Perform the requested operation (Create, Update, Delete, Retrieve, RetrieveMultiple)
        const response = await performOperation(operation, entityName, accessToken, data);
        // Return the response data
        return response;
    } catch (error: unknown) {
        console.error('Error in POST request:', error);
        return NextResponse.json({ error: 'An error occurred while processing the request.' }, { status: 500 });
    }
}
