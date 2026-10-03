import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Database, 
  Sparkles, 
  X, 
  ChevronUp, 
  CheckCircle, 
  Bell, 
  Award,
  Radio, 
  ArrowRight,
  ExternalLink,
  Mail
} from 'lucide-react';
import { GoogleMapComponent, FoodPickupLocation } from './components/GoogleMapComponent';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { RealTimeNotificationToast } from './components/RealTimeNotificationToast';
import { CelebrationOverlay, DonationDetail } from './components/CelebrationOverlay';
import { GmailComposeModal } from './components/GmailComposeModal';
import { DonationCertificateModal } from './components/DonationCertificateModal';
import { 
  listenToDonationSnapshots, 
  DonationAlert, 
  pushDonationToFirestore,
  getCurrentPlatformRole
} from './services/firestoreNotifications';
import {
  createDonationCertificate,
  DonationCertificate,
  getLatestDonationCertificate,
  saveDonationCertificate,
} from './services/donationCertificates';

export default function App() {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationDetails, setCelebrationDetails] = useState<DonationDetail | null>(null);
  const [selectedPickupForCalendar, setSelectedPickupForCalendar] = useState<FoodPickupLocation | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [latestAlert, setLatestAlert] = useState<DonationAlert | null>(null);
  const [allAlerts, setAllAlerts] = useState<DonationAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestDonationCertificate, setLatestDonationCertificate] = useState<DonationCertificate | null>(
    getLatestDonationCertificate
  );
  const [displayedDonationCertificate, setDisplayedDonationCertificate] = useState<DonationCertificate | null>(null);

  useEffect(() => {
    // 1. Initialize real-time Firestore snapshots listener
    const unsubscribe = listenToDonationSnapshots(
      (newAlert) => {
        setLatestAlert(newAlert);
        setUnreadCount((prev) => prev + 1);

        // Play pleasant audio chime for instant feedback
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        } catch (e) {
          // Audio context might be restricted before user gesture
        }
      },
      (alerts) => {
        setAllAlerts(alerts);
      }
    );

    // 2. Listen for newly submitted food donations from the frontend form to sync to Firestore and trigger celebration
    const handleDonationCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        void pushDonationToFirestore(customEvent.detail).catch((error) => {
          console.error('Donation was created, but its notifications could not be sent:', error);
        });

        const d = customEvent.detail;
        const certificate = createDonationCertificate(d);
        setLatestDonationCertificate(certificate);
        setDisplayedDonationCertificate(certificate);
        try {
          saveDonationCertificate(certificate);
        } catch (error) {
          console.error('Could not save the donation certificate in this browser:', error);
        }

        setCelebrationDetails({
          food_title: d.food_name || d.food_title || d.title || 'Fresh Surplus Meal Package',
          quantity: `${d.quantity || '50'} ${d.quantity_unit || 'servings'}`.trim(),
          pickup_address: d.pickup_address || d.address || d.city || 'Central Community Kitchen',
          food_type: d.food_type || d.category || 'Fresh Prepared Food',
        });
        setShowCelebration(true);
      }
    };
    window.addEventListener('foodbridge_donation_created', handleDonationCreated);

    // 3. Listen for accept donation events from notification alerts
    const handleAcceptAlert = (e: Event) => {
      const alert = (e as CustomEvent).detail as DonationAlert;
      if (alert) {
        setCelebrationDetails({
          food_title: alert.foodName || alert.title || 'Surplus Food Donation',
          quantity: alert.quantity || '1 package',
          pickup_address: alert.city || 'Community Donor Location',
          food_type: 'Accepted Pickup',
        });
        setShowCelebration(true);
      }
    };
    window.addEventListener('foodbridge_accept_donation_from_alert', handleAcceptAlert);

    return () => {
      unsubscribe();
      window.removeEventListener('foodbridge_donation_created', handleDonationCreated);
      window.removeEventListener('foodbridge_accept_donation_from_alert', handleAcceptAlert);
    };
  }, []);

  const handleScheduleFromMap = (pickup: FoodPickupLocation) => {
    setSelectedPickupForCalendar(pickup);
    setShowCalendarModal(true);
  };

  const currentRole = getCurrentPlatformRole();

  return (
    <>
      {/* Real-Time Live Alert Toast for Volunteers & Admins */}
      <RealTimeNotificationToast
        alert={latestAlert}
        onDismiss={() => setLatestAlert(null)}
      />

      <DonationCertificateModal
        certificate={displayedDonationCertificate}
        onClose={() => setDisplayedDonationCertificate(null)}
      />

      {/* Floating Google Services Dock */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Minimized toggle button */}
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-700/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md hover:bg-emerald-600 transition hover:scale-105"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <span>Google Platform & Firestore</span>
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-stone-900 animate-pulse">
                {unreadCount}
              </span>
            )}
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/95 sm:w-84">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Cloud Firestore & Services
                </h4>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                title="Minimize Dock"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {/* Firestore Real-Time Donation Alerts Button */}
              <button
                onClick={() => {
                  setShowNotificationsModal(true);
                  setUnreadCount(0);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 font-medium text-amber-950 transition hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-stone-900">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs leading-none flex items-center gap-1.5">
                      <span>Firestore Live Alerts</span>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </p>
                    <p className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                      Snapshots for Volunteers & Admins
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                    {allAlerts.length > 0 ? `${allAlerts.length} Alerts` : 'Live'}
                  </span>
                </div>
              </button>

              {latestDonationCertificate && (
                <button
                  onClick={() => setDisplayedDonationCertificate(latestDonationCertificate)}
                  className="flex w-full items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50/80 p-2.5 font-medium text-yellow-950 transition hover:bg-yellow-100 dark:border-yellow-800/40 dark:bg-yellow-950/40 dark:text-yellow-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500 text-stone-900">
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs leading-none">Donation Certificate</p>
                      <p className="mt-0.5 text-[10px] text-yellow-800 dark:text-yellow-300">
                        View or save your latest certificate
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Google Maps Trigger */}
              <button
                onClick={() => setShowMapModal(true)}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5 font-medium text-emerald-950 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs leading-none">Google Maps Platform</p>
                    <p className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">Live Surplus Food Radar</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  5 Venues
                </span>
              </button>

              {/* Google Calendar Trigger */}
              <button
                onClick={() => {
                  setSelectedPickupForCalendar(null);
                  setShowCalendarModal(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-2.5 font-medium text-blue-950 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs leading-none">Google Calendar</p>
                    <p className="mt-0.5 text-[10px] text-blue-700 dark:text-blue-300">Sync Pickup Reminders</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  OAuth Active
                </span>
              </button>

              {/* Google Gmail Dispatch Trigger */}
              <button
                onClick={() => setShowGmailModal(true)}
                className="flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 p-2.5 font-medium text-rose-950 transition hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs leading-none">Google Gmail API</p>
                    <p className="mt-0.5 text-[10px] text-rose-700 dark:text-rose-300">Dispatch Logistics Emails</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                  OAuth Ready
                </span>
              </button>

              {/* Preview Celebration Effect Trigger */}
              <button
                onClick={() => {
                  setCelebrationDetails({
                    food_title: 'Surplus Fresh Hotel Catering',
                    quantity: '80 meals',
                    pickup_address: 'Grand Central Plaza, Floor 2',
                    food_type: 'Fresh Cooked Buffer Meals',
                  });
                  setShowCelebration(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-teal-200 bg-teal-50/70 p-2.5 font-medium text-teal-950 transition hover:bg-teal-100 dark:border-teal-800/40 dark:bg-teal-950/40 dark:text-teal-200"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs leading-none">Celebration Overlay</p>
                    <p className="mt-0.5 text-[10px] text-teal-700 dark:text-teal-300">Confetti & Fanfare Preview</p>
                  </div>
                </div>
                <span className="rounded-full bg-teal-200/80 px-2 py-0.5 text-[10px] font-bold text-teal-900 dark:bg-teal-900 dark:text-teal-100">
                  Try 🎉
                </span>
              </button>

              {/* Firestore Real-Time Snapshot Status Indicator */}
              <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-2 text-stone-700 dark:border-stone-800 dark:bg-stone-800/40 dark:text-stone-300">
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium">Snapshot Listener</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> Listening
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Firestore Alerts Feed Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4 dark:border-stone-800 dark:bg-stone-950">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-stone-900">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>Firestore Real-Time Donation Alerts</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-xs text-stone-500">
                    Listening via Cloud Firestore snapshot listeners for volunteers & admins
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {allAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="font-medium text-sm text-stone-700 dark:text-stone-300">
                    Listening for New Donations
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                    When a donor submits a food donation, Firestore snapshots will broadcast an instant alert here in real-time.
                  </p>
                </div>
              ) : (
                allAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 transition hover:bg-stone-100/60 dark:border-stone-800 dark:bg-stone-800/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {alert.targetRole === 'volunteer' ? 'Volunteer Alert' : alert.targetRole === 'admin' ? 'Admin Alert' : 'Broadcast'}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 mt-0.5">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                        {alert.description}
                      </p>
                      {alert.city && (
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-stone-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {alert.city}
                          </span>
                          {alert.quantity && (
                            <span>• {alert.quantity}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            try {
                              window.dispatchEvent(new CustomEvent('foodbridge_accept_donation_from_alert', { detail: alert }));
                            } catch (e) {}
                            setShowNotificationsModal(false);
                            window.location.href = '/dashboard/volunteer';
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Accept Donation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Firestore collection: /notifications
              </span>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="rounded-xl border border-stone-300 px-4 py-1.5 font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Full Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4 dark:border-stone-800 dark:bg-stone-950">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                    Google Maps Platform • Surplus Food Locator
                  </h3>
                  <p className="text-xs text-stone-500">
                    Explore active surplus meal locations, hotels, and bakeries ready for redistribution
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <GoogleMapComponent onScheduleCalendar={handleScheduleFromMap} />
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950">
              <span>Google Maps JavaScript API • AdvancedMarkerElement enabled</span>
              <button
                onClick={() => setShowMapModal(false)}
                className="rounded-xl border border-stone-300 px-4 py-1.5 font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Sync Modal */}
      <CalendarSyncModal
        isOpen={showCalendarModal}
        onClose={() => {
          setShowCalendarModal(false);
          setSelectedPickupForCalendar(null);
        }}
        presetPickup={selectedPickupForCalendar}
      />

      {/* Google Workspace Gmail Dispatch Modal */}
      <GmailComposeModal
        isOpen={showGmailModal}
        onClose={() => setShowGmailModal(false)}
      />

      {/* Celebratory Confetti & Impact Overlay */}
      <CelebrationOverlay
        show={showCelebration}
        donationDetails={celebrationDetails}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
