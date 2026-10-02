import React from 'react';
import { Bell, Check, X, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { DonationAlert } from '../services/firestoreNotifications';

interface RealTimeNotificationToastProps {
  alert: DonationAlert | null;
  onDismiss: () => void;
  onNavigateToDashboard?: () => void;
}

export const RealTimeNotificationToast: React.FC<RealTimeNotificationToastProps> = ({
  alert,
  onDismiss,
  onNavigateToDashboard,
}) => {
  if (!alert) return null;

  const isVolunteerTarget = alert.targetRole === 'volunteer';

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full animate-bounce-short transition-all duration-300">
      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-white/95 dark:bg-stone-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 animate-pulse" />
        
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Bell className="h-6 w-6 animate-swing" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Firestore Live Snapshot
              </span>
              <span className="text-[10px] text-stone-400">Just now</span>
            </div>

            <h4 className="mt-1 font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug">
              {alert.title}
            </h4>

            <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {alert.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  try {
                    const event = new CustomEvent('foodbridge_accept_donation_from_alert', { detail: alert });
                    window.dispatchEvent(event);
                  } catch (e) {}
                  onDismiss();
                  window.location.href = '/dashboard/volunteer';
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-900 shadow-md hover:bg-amber-400 transition"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Accept Donation</span>
              </button>

              <button
                onClick={() => {
                  onDismiss();
                  if (onNavigateToDashboard) {
                    onNavigateToDashboard();
                  } else {
                    const target = isVolunteerTarget ? '/dashboard/volunteer#notifications' : '/dashboard/admin#notifications';
                    window.location.href = target;
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition"
              >
                <span>{isVolunteerTarget ? 'View All Food' : 'Open Notifications'}</span>
                <ArrowRight className="h-3 w-3" />
              </button>

              <button
                onClick={onDismiss}
                className="rounded-xl border border-stone-200 dark:border-stone-700 px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
