import axios from 'axios';
import config from '../config';
import AppError from '../app/errors/AppError';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import { Buffer } from 'buffer';

interface PersonaInquiryResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      'reference-id': string;
    };
  };
  meta: {
    'session-token': string;
  };
}

interface PersonaWebhookPayload {
  data: {
    type: string;
    id: string;
    attributes: {
      status: string;
      'reference-id': string;
      'inquiry-id': string;
    };
  };
}

// Get base configuration
const getPersonaConfig = () => {
  const apiKey = config.persona.api_key as string;
  const templateId = config.persona.template_id as string;
  const environment = config.persona.environment as string;
  const baseUrl = 'https://withpersona.com/api/v1'; // Persona uses same URL for both environments

  return { apiKey, templateId, environment, baseUrl };
};

/**
 * Create an inquiry for identity verification
 * @param userId - The user's ID to use as reference
 * @param userEmail - The user's email address
 * @returns Inquiry session URL for the frontend
 */
export const createPersonaInquiry = async (
  userId: string,
  userEmail?: string
): Promise<string> => {
  const { apiKey, templateId, baseUrl } = getPersonaConfig();

  try {
    console.log("--------------------->", userEmail, userId);
    
    // First, create an inquiry
    const inquiryResponse = await axios.post(
      `${baseUrl}/inquiries`,
      {
        data: {
          type: 'inquiry',
          attributes: {
            'inquiry-template-id': templateId,
            'reference-id': userId,
            ...(userEmail && {
              'email-address': userEmail,
            }),
          },
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Key-Inflection': 'kebab',
        },
      }
    );

    const inquiryId = inquiryResponse.data.data?.id;
    if (!inquiryId) {
      throw new Error(`Failed to create inquiry. Response: ${JSON.stringify(inquiryResponse.data)}`);
    }

    console.log('Created Inquiry ID:', inquiryId);

    // Now create an inquiry-session for the created inquiry
    const sessionResponse = await axios.post(
      `${baseUrl}/inquiry-sessions`,
      {
        data: {
          type: 'inquiry-session',
          attributes: {
            'inquiry-id': inquiryId,
          },
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Key-Inflection': 'kebab',
        },
      }
    );

    console.log('Persona Session Response:', JSON.stringify(sessionResponse.data, null, 2));

    const sessionToken = sessionResponse.data.data?.id;

    if (!sessionToken) {
      throw new Error(`Missing session token. Response: ${JSON.stringify(sessionResponse.data)}`);
    }

    // Generate the web URL for the frontend (using session token as the main identifier)
    const webUrl = `https://withpersona.com/verify?inquiry-id=${inquiryId}&session-token=${sessionToken}`;
    
    console.log('Generated verification URL:', webUrl);
    
    return webUrl;
  } catch (error: any) {
    console.error('Persona API Error Details:', {
      message: error.message,
      response: error.response?.data,
      responseErrors: JSON.stringify(error.response?.data?.errors, null, 2),
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    const errorMessage = error.response?.data?.errors?.[0]?.title 
      || error.response?.data?.error 
      || error.message 
      || 'Failed to create verification inquiry';
    
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessage
    );
  }
};

/**
 * Verify webhook signature from Persona
 * @param payload - Webhook payload
 * @param signature - Webhook signature from header
 * @returns boolean indicating if signature is valid
 */
export const verifyPersonaWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  const webhookSecret = config.persona.webhook_secret as string;
  
  if (!webhookSecret) {
    console.warn('PERSONA_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!signature) {
    console.warn('No signature provided in webhook request');
    return false;
  }

  try {
    // Parse Persona's signature format: "t=<timestamp>,v1=<signature>"
    const parts = signature.split(',');
    let timestamp = '';
    let receivedSignature = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        receivedSignature = value;
      }
    }

    if (!timestamp || !receivedSignature) {
      console.error('Invalid signature format. Expected: t=<timestamp>,v1=<signature>');
      return false;
    }

    // Persona signs the payload as: timestamp.payload_body
    const signedPayload = `${timestamp}.${payload}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Ensure both signatures are the same length before comparison
    if (receivedSignature.length !== expectedSignature.length) {
      console.error(`Signature length mismatch: received ${receivedSignature.length}, expected ${expectedSignature.length}`);
      console.error(`Received signature: ${receivedSignature}`);
      console.error(`Expected signature: ${expectedSignature}`);
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Get inquiry status
 * @param inquiryId - The inquiry ID
 * @returns Inquiry status
 */
export const getPersonaInquiryStatus = async (inquiryId: string): Promise<string> => {
  const { apiKey, baseUrl } = getPersonaConfig();

  try {
    const response = await axios.get(
      `${baseUrl}/inquiries/${inquiryId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Key-Inflection': 'kebab',
        },
      }
    );

    return response.data.data.attributes.status;
  } catch (error: any) {
    console.error('Persona API Error:', error.response?.data || error.message);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch inquiry status'
    );
  }
};
