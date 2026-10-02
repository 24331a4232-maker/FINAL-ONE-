import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import {
  signInWithGoogleCalendar,
  getCachedCalendarToken,
  fetchCalendarEvents,
  createPickupCalendarEvent,
  deleteCalendarEvent,
  FoodBridgeCalendarEvent,
} from '../services/calendar';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetPickup?: {
    title: string;
    donorName: string;
    address: string;
    pickupTime: string;
  } | null;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({ isOpen, onClose, presetPickup }) => {
  const [token, setToken] = useState<string | null>(getCachedCalendarToken());
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<FoodBridgeCalendarEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for new pickup scheduling
  const [eventTitle, setEventTitle] = useState(presetPickup ? `Pickup: ${presetPickup.title}` : 'Surplus Food Pickup');
  const [location, setLocation] = useState(presetPickup ? `${presetPickup.donorName}, ${presetPickup.address}` : '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [durationHours, setDurationHours] = useState('2');

  useEffect(() => {
    if (presetPickup) {
      setEventTitle(`Food Pickup: ${presetPickup.title}`);
      setLocation(`${presetPickup.donorName}, ${presetPickup.address}`);
    }
  }, [presetPickup]);

  useEffect(() => {
    if (token) {
      loadCalendarEvents(token);
    }
  }, [token]);

  const loadCalendarEvents = async (authToken: string) => {
    setLoading(true);
    try {
      const items = await fetchCalendarEvents(authToken);
      setEvents(items);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to load Google Calendar events.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogleCalendar();
      if (res?.accessToken) {
        setToken(res.accessToken);
        setStatusMessage({ type: 'success', text: 'Connected to Google Calendar successfully!' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Google Calendar authorization failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + Number(durationHours) * 3600000).toISOString();

      const newEvent = await createPickupCalendarEvent(token, {
        summary: eventTitle,
        description: `FoodBridge Surplus Food Rescue Operation.\nDonor Location: ${location}`,
        location: location,
        startTime: startDateTime,
        endTime: endDateTime,
      });

      // Also persist to Firestore
      try {
        await addDoc(collection(db, 'calendar_events'), {
          googleEventId: newEvent.id,
          summary: newEvent.summary,
          location: newEvent.location,
          startTime: startDateTime,
          endTime: endDateTime,
          createdAt: new Date().toISOString(),
        });
      } catch (fsErr) {
        console.warn('Firestore sync note:', fsErr);
      }

      setStatusMessage({
        type: 'success',
        text: `"${newEvent.summary}" has been scheduled in your Google Calendar!`,
      });
      loadCalendarEvents(token);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not create calendar event.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!token) return;
    try {
      const deleted = await deleteCalendarEvent(token, eventId, title);
      if (deleted) {
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        setStatusMessage({ type: 'success', text: 'Pickup event removed from Google Calendar.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not delete event.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4 dark:border-stone-800 dark:bg-stone-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                Google Calendar Pickup Sync
              </h3>
              <p className="text-xs text-stone-500">
                Schedule and coordinate surplus food deliveries with Google Calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {statusMessage && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {!token ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-8 text-center dark:border-stone-800 dark:bg-stone-950/50">
              <CalendarPlus className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
              <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Connect your Google Calendar
              </h4>
              <p className="mx-auto mt-1 max-w-sm text-xs text-stone-600 dark:text-stone-400">
                Connect your Google Account to automatically sync pickup appointments, set delivery reminders, and manage food rescue slots.
              </p>
              
              <div className="mt-5 flex justify-center">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="inline-flex items-center gap-3 rounded-full border border-stone-300 bg-white px-6 py-2.5 font-medium text-sm text-stone-800 shadow-md hover:bg-stone-50 transition active:scale-95 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Event creation form */}
              <form onSubmit={handleCreateEvent} className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                    Schedule Food Pickup in Google Calendar
                  </h4>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> Calendar Connected
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300">Event Title</label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      required
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300">Venue & Pickup Address</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      placeholder="e.g. Grand Hyatt Banquet Hall, 10 Scotts Rd"
                      className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 dark:text-stone-300">Duration</label>
                      <select
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                      >
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-xs text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                    Add Event to Google Calendar
                  </button>
                </div>
              </form>

              {/* Upcoming Events List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                    Upcoming Calendar Pickups & Events
                  </h4>
                  <button
                    onClick={() => token && loadCalendarEvents(token)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {events.length === 0 ? (
                  <p className="text-center py-6 text-xs text-stone-500">
                    No upcoming FoodBridge events found in your primary calendar.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
                    {events.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between p-3 transition hover:bg-stone-50 dark:hover:bg-stone-950">
                        <div className="space-y-1">
                          <h5 className="font-semibold text-xs text-stone-900 dark:text-stone-100">{ev.summary}</h5>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ev.start.dateTime || '').toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ev.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ev.htmlLink && (
                            <a
                              href={ev.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                              title="Open in Google Calendar"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.summary)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                            title="Remove event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950">
          <span>Google Workspace Integration • Google Calendar API v3</span>
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-4 py-1.5 font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
