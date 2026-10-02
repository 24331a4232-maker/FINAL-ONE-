import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase';

let cachedGmailToken: string | null = null;

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  accessToken?: string;
}

export interface FoodBridgeEmail {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const signInWithGmail = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve OAuth access token for Gmail');
    }
    cachedGmailToken = credential.accessToken;
    return { user: result.user, accessToken: cachedGmailToken };
  } catch (error) {
    console.error('Gmail Sign-in error:', error);
    throw error;
  }
};

export const getCachedGmailToken = (): string | null => {
  return cachedGmailToken;
};

export const setCachedGmailToken = (token: string | null) => {
  cachedGmailToken = token;
};

// Helper to base64url encode raw MIME string according to Gmail API specs
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const sendGmailMessage = async ({
  to,
  subject,
  body,
  accessToken,
}: SendEmailParams): Promise<{ id: string; threadId: string }> => {
  const token = accessToken || cachedGmailToken;
  if (!token) {
    throw new Error('No Gmail access token available. Please sign in with Google Gmail first.');
  }

  const rawMessage = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].join('\r\n');

  const encodedMessage = base64UrlEncode(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gmail API error (${response.status})`);
  }

  return await response.json();
};

export const listFoodBridgeEmails = async (
  accessToken?: string
): Promise<FoodBridgeEmail[]> => {
  const token = accessToken || cachedGmailToken;
  if (!token) {
    throw new Error('No Gmail access token available.');
  }

  const query = encodeURIComponent('subject:FoodBridge OR "Food Rescue" OR "Surplus Food"');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch Gmail messages.');
  }

  const data = await res.json();
  if (!data.messages || data.messages.length === 0) {
    return [];
  }

  // Fetch snippets for messages
  const messagePromises = data.messages.map(async (msg: { id: string; threadId: string }) => {
    try {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
      const detail = await detailRes.json();

      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: detail.snippet,
        subject: getHeader('subject') || 'FoodBridge Alert',
        from: getHeader('from') || 'FoodBridge System',
        date: getHeader('date') || new Date().toLocaleString(),
      };
    } catch {
      return { id: msg.id, threadId: msg.threadId };
    }
  });

  return Promise.all(messagePromises);
};

export const sendDonationConfirmationEmail = async (
  donation: {
    donorName?: string;
    foodTitle: string;
    quantity: string;
    address: string;
    recipientEmail: string;
    pickupTime?: string;
  },
  accessToken?: string
) => {
  const subject = `[FoodBridge Rescue] Confirmation: ${donation.foodTitle}`;
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; background-color: #f9fafb;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #059669; margin: 0; font-size: 24px;">🥗 FoodBridge Rescue Alert</h1>
        <p style="color: #4b5563; font-size: 14px; margin-top: 4px;">Zero Food Waste • Direct Community Dispatch</p>
      </div>

      <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; border: 1px solid #d1d5db; margin-bottom: 16px;">
        <h2 style="font-size: 18px; color: #111827; margin-top: 0;">${donation.foodTitle}</h2>
        <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Donor:</strong> ${donation.donorName || 'Generous Food Donor'}</p>
        <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Quantity / Servings:</strong> ${donation.quantity}</p>
        <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Pickup Location:</strong> ${donation.address}</p>
        <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Pickup Window:</strong> ${donation.pickupTime || 'Today, 2:00 PM - 6:00 PM'}</p>
      </div>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; p: 12px; margin-bottom: 16px; color: #065f46; font-size: 13px;">
        <strong>Impact Note:</strong> This food donation is officially logged in Cloud Firestore and ready for volunteer pickup & community distribution.
      </div>

      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
        Sent automatically via Google Gmail API on behalf of FoodBridge Platform.
      </p>
    </div>
  `;

  return sendGmailMessage({
    to: donation.recipientEmail,
    subject,
    body: bodyHtml,
    accessToken,
  });
};
