import admin from 'firebase-admin';
import { logger } from './logger';

export interface FCMNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export interface MulticastNotificationPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: { [key: string]: string };
}

// Track initialization state
let isInitialized = false;

// Initialize Firebase Admin SDK
const initializeFCM = (serviceAccount: any, databaseURL?: string): void => {
  if (isInitialized) {
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL
    });
    isInitialized = true;
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
};

// Send single notification
const sendNotification = async (payload: FCMNotificationPayload): Promise<boolean> => {
  if (!isInitialized) {
    logger.error('FCM Service not initialized');
    return false;
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      token: payload.token,
    };

    const response = await admin.messaging().send(message);
    logger.info(`Successfully sent message: ${response}`);
    return true;
  } catch (error) {
    logger.error('Error sending FCM notification:', error);
    return false;
  }
};

// Send multicast notification
const sendMulticastNotification = async (payload: MulticastNotificationPayload): Promise<{
  successCount: number;
  failureCount: number;
  failedTokens: string[];
}> => {
  if (!isInitialized) {
    logger.error('FCM Service not initialized');
    return { successCount: 0, failureCount: payload.tokens.length, failedTokens: payload.tokens };
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: payload.tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(payload.tokens[idx]);
      }
    });

    logger.info(
      `Multicast result: ${response.successCount} successful, ${response.failureCount} failed`
    );

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens,
    };
  } catch (error) {
    logger.error('Error sending multicast FCM notification:', error);
    return { successCount: 0, failureCount: payload.tokens.length, failedTokens: payload.tokens };
  }
};

// Validate FCM token
const validateToken = async (token: string): Promise<boolean> => {
  if (!isInitialized) {
    return false;
  }

  try {
    await admin.messaging().send({
      token,
      data: { test: 'true' }
    }, true); // dry run
    return true;
  } catch (error) {
    logger.warn(`Invalid FCM token: ${token}`);
    return false;
  }
};

// Subscribe tokens to topic
const subscribeToTopic = async (tokens: string[], topic: string): Promise<void> => {
  if (!isInitialized) {
    return;
  }

  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info(`Successfully subscribed ${response.successCount} tokens to topic ${topic}`);
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
  }
};

// Unsubscribe tokens from topic
const unsubscribeFromTopic = async (tokens: string[], topic: string): Promise<void> => {
  if (!isInitialized) {
    return;
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    logger.info(`Successfully unsubscribed ${response.successCount} tokens from topic ${topic}`);
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
  }
};

export const FCMService = {
  initialize: initializeFCM,
  sendNotification,
  sendMulticastNotification,
  validateToken,
  subscribeToTopic,
  unsubscribeFromTopic,
};
