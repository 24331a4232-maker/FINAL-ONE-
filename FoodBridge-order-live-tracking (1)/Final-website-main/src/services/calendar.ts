import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve OAuth access token for Google Calendar');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Calendar Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedCalendarToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedCalendarToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutCalendar = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface FoodBridgeCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  htmlLink?: string;
}

export async function fetchCalendarEvents(token: string): Promise<FoodBridgeCalendarEvent[]> {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=25&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Google Calendar events: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || 'Untitled Event',
    description: item.description,
    location: item.location,
    start: item.start,
    end: item.end,
    htmlLink: item.htmlLink,
  }));
}

export async function createPickupCalendarEvent(
  token: string,
  eventData: {
    summary: string;
    description: string;
    location: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
  }
): Promise<FoodBridgeCalendarEvent> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      summary: eventData.summary,
      description: `${eventData.description}\n\nScheduled via FoodBridge Surplus Food Redistribution Platform.`,
      location: eventData.location,
      start: {
        dateTime: eventData.startTime,
      },
      end: {
        dateTime: eventData.endTime,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create calendar event: ${res.status} ${errorText}`);
  }

  const created = await res.json();
  return {
    id: created.id,
    summary: created.summary,
    description: created.description,
    location: created.location,
    start: created.start,
    end: created.end,
    htmlLink: created.htmlLink,
  };
}

export async function deleteCalendarEvent(
  token: string,
  eventId: string,
  eventTitle: string
): Promise<boolean> {
  // Explicit user confirmation required by workspace-integration skill
  const confirmed = window.confirm(
    `Are you sure you want to remove the pickup event "${eventTitle}" from your Google Calendar? This action cannot be undone.`
  );
  if (!confirmed) {
    return false;
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Failed to delete calendar event: ${res.status} ${errorText}`);
  }

  return true;
}
