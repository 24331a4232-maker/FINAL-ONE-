import React, { useState, useEffect } from 'react';
import { Mail, Send, Sparkles, CheckCircle2, AlertCircle, X, Loader2, Inbox, RefreshCw, ExternalLink } from 'lucide-react';
import {
  signInWithGmail,
  getCachedGmailToken,
  sendGmailMessage,
  listFoodBridgeEmails,
  FoodBridgeEmail,
} from '../services/gmail';

interface GmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetRecipient?: string;
  presetSubject?: string;
  presetBody?: string;
}

export const GmailComposeModal: React.FC<GmailComposeModalProps> = ({
  isOpen,
  onClose,
  presetRecipient = 'shelter-dispatch@foodbridge.org',
  presetSubject = '[FoodBridge Rescue] Food Donation Logistics Update',
  presetBody = 'Hello Shelter Team,\n\nWe have a new surplus food batch ready for immediate pickup and distribution.\n\nPlease confirm volunteer arrival time.\n\nBest regards,\nFoodBridge Rescue Logistics',
}) => {
  const [token, setToken] = useState<string | null>(getCachedGmailToken());
  const [to, setTo] = useState(presetRecipient);
  const [subject, setSubject] = useState(presetSubject);
  const [body, setBody] = useState(presetBody);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Inbox List
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [emails, setEmails] = useState<FoodBridgeEmail[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setTo(presetRecipient);
    setSubject(presetSubject);
    setBody(presetBody);
  }, [presetRecipient, presetSubject, presetBody]);

  const handleConnectGmail = async () => {
    try {
      setErrorMessage(null);
      const res = await signInWithGmail();
      if (res?.accessToken) {
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with Google Gmail API.');
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      handleConnectGmail();
      return;
    }

    try {
      setSending(true);
      setErrorMessage(null);
      
      const htmlBody = body.replace(/\n/g, '<br/>');
      await sendGmailMessage({
        to,
        subject,
        body: `<div style="font-family: sans-serif; font-size: 14px; color: #1f2937;">${htmlBody}</div>`,
        accessToken: token,
      });

      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending message via Gmail API.');
    } finally {
      setSending(false);
    }
  };

  const handleFetchHistory = async () => {
    if (!token) return;
    try {
      setLoadingHistory(true);
      const list = await listFoodBridgeEmails(token);
      setEmails(list);
    } catch (err: any) {
      console.warn('Gmail list error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && token) {
      handleFetchHistory();
    }
  }, [activeTab, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl dark:border-stone-800 dark:bg-stone-900">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-4 text-white dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-md">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug flex items-center gap-2">
                <span>Google Gmail API • Logistics Dispatch</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                  1P OAuth
                </span>
              </h3>
              <p className="text-xs text-red-100">
                Send direct email notifications and logistics alerts using your Google Workspace Gmail account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-red-200 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 dark:border-stone-800 dark:bg-stone-950">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'compose'
                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Compose Dispatch Email</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>FoodBridge Gmail Logs</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!token ? (
            <div className="py-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shadow-md">
                <Mail className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                  Connect Google Workspace Gmail
                </h4>
                <p className="mt-1 text-xs text-stone-500">
                  Authorize FoodBridge to send logistics confirmation emails and shelter notifications via official Google Gmail APIs.
                </p>
              </div>

              <button
                onClick={handleConnectGmail}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-red-700 transition active:scale-95 text-xs sm:text-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span>Authenticate with Gmail Account</span>
              </button>
            </div>
          ) : activeTab === 'compose' ? (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {sentSuccess && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-sm">Email Sent via Gmail API!</p>
                    <p className="text-emerald-700 dark:text-emerald-300">
                      Your message was successfully transmitted directly using your Google Workspace Gmail credentials.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Recipient Email (Shelter / Volunteer / Donor)
                </label>
                <input
                  type="email"
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="partner-shelter@foodbridge.org"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:border-red-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:border-red-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Email Body Content
                </label>
                <textarea
                  required
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white p-3 text-xs font-medium text-stone-900 focus:border-red-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Authenticated with Gmail OAuth Token
                </span>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2.5 font-bold text-white shadow-lg hover:from-red-500 hover:to-rose-500 transition disabled:opacity-50 text-xs sm:text-sm"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending via Gmail API...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Email Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 dark:border-stone-800">
                <h4 className="font-bold text-xs uppercase text-stone-700 dark:text-stone-300">
                  Recent FoodBridge Email Activity
                </h4>
                <button
                  onClick={handleFetchHistory}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  <span>Fetching Gmail logs...</span>
                </div>
              ) : emails.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  No previous FoodBridge emails found in your Gmail account.
                </div>
              ) : (
                emails.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3.5 transition hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-800/40"
                  >
                    <div className="flex items-center justify-between text-stone-500 text-[10px]">
                      <span className="font-bold text-stone-700 dark:text-stone-300 truncate max-w-[200px]">
                        From: {msg.from}
                      </span>
                      <span>{msg.date}</span>
                    </div>
                    <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100 mt-1">
                      {msg.subject}
                    </h5>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-0.5">
                      {msg.snippet}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-3 text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950">
          <span>Google Workspace Gmail API • OAuth2 Bearer Authorization</span>
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
