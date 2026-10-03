export interface DonationCertificate {
  certificateNumber: string;
  donorName: string;
  organization: string;
  foodName: string;
  quantity: string;
  city: string;
  issuedAt: string;
  donationId?: string;
}

interface DonationCertificateInput {
  donor_name?: unknown;
  full_name?: unknown;
  organization?: unknown;
  food_name?: unknown;
  food_title?: unknown;
  title?: unknown;
  quantity?: unknown;
  quantity_unit?: unknown;
  city?: unknown;
  submitted_at?: unknown;
  id?: unknown;
}

const CERTIFICATES_STORAGE_KEY = 'foodbridge_donation_certificates';

function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function getSessionDonorName(): string {
  for (const key of ['foodbridge_current_session', 'foodbridge_user_session']) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) continue;

      const session = JSON.parse(raw);
      const name =
        session?.profile?.full_name ||
        session?.user?.full_name ||
        session?.full_name;
      if (typeof name === 'string' && name.trim()) return name.trim();
    } catch (error) {
      console.warn(`Could not read donor name from ${key}:`, error);
    }
  }

  return '';
}

export function createDonationCertificate(donation: DonationCertificateInput): DonationCertificate {
  const submittedAt = asText(donation.submitted_at);
  const parsedDate = submittedAt ? new Date(submittedAt) : new Date();
  const issuedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  const dateCode = issuedAt.slice(0, 10).replaceAll('-', '');
  const randomCode = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();
  const quantity = asText(donation.quantity);
  const unit = asText(donation.quantity_unit);

  return {
    certificateNumber: `FB-DON-${dateCode}-${randomCode}`,
    donorName: asText(donation.donor_name) || asText(donation.full_name) || getSessionDonorName() || 'FoodBridge Donor',
    organization: asText(donation.organization),
    foodName: asText(donation.food_name) || asText(donation.food_title) || asText(donation.title) || 'Food donation',
    quantity: [quantity, unit].filter(Boolean).join(' '),
    city: asText(donation.city),
    issuedAt,
    donationId: asText(donation.id) || undefined,
  };
}

export function saveDonationCertificate(certificate: DonationCertificate): void {
  const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
  const saved = raw ? JSON.parse(raw) as DonationCertificate[] : [];
  const certificates = saved.filter((item) => item.certificateNumber !== certificate.certificateNumber);
  certificates.unshift(certificate);
  localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(certificates.slice(0, 50)));
}

export function getLatestDonationCertificate(): DonationCertificate | null {
  try {
    const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw) as DonationCertificate[];
    const certificate = saved[0];
    if (
      !certificate ||
      typeof certificate.certificateNumber !== 'string' ||
      typeof certificate.donorName !== 'string' ||
      typeof certificate.foodName !== 'string' ||
      typeof certificate.issuedAt !== 'string'
    ) {
      return null;
    }
    return certificate;
  } catch (error) {
    console.warn('Could not load the saved donation certificate:', error);
    return null;
  }
}
