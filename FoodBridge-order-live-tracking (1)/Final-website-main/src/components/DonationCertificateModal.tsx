import React from 'react';
import { Award, Download, X } from 'lucide-react';
import { DonationCertificate } from '../services/donationCertificates';

interface DonationCertificateModalProps {
  certificate: DonationCertificate | null;
  onClose: () => void;
}

export const DonationCertificateModal: React.FC<DonationCertificateModalProps> = ({
  certificate,
  onClose,
}) => {
  if (!certificate) return null;

  const issueDate = new Date(certificate.issuedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="donation-certificate-overlay" role="presentation">
      <section
        aria-labelledby="donation-certificate-title"
        aria-modal="true"
        className="donation-certificate-dialog"
        role="dialog"
      >
        <div className="donation-certificate-toolbar">
          <div>
            <h2 id="donation-certificate-title">Your donation certificate is ready</h2>
            <p>Print it or choose “Save as PDF” to keep a copy.</p>
          </div>
          <div className="donation-certificate-actions">
            <button onClick={() => window.print()} type="button">
              <Download aria-hidden="true" size={16} />
              Print / Save as PDF
            </button>
            <button aria-label="Close certificate" onClick={onClose} type="button">
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </div>

        <article className="donation-certificate-paper">
          <div className="donation-certificate-inner">
            <div className="donation-certificate-brand">
              <span className="donation-certificate-emblem"><Award aria-hidden="true" size={25} /></span>
              <span>FOODBRIDGE</span>
            </div>
            <p className="donation-certificate-eyebrow">CERTIFICATE OF APPRECIATION</p>
            <h1>Thank you for making a difference</h1>
            <p className="donation-certificate-intro">This certificate is proudly presented to</p>
            <p className="donation-certificate-donor">{certificate.donorName}</p>
            {certificate.organization && (
              <p className="donation-certificate-organization">{certificate.organization}</p>
            )}
            <p className="donation-certificate-copy">
              In recognition of your contribution of surplus food to the FoodBridge community.
              Your generosity helps connect nourishing food with people who need it.
            </p>
            <div className="donation-certificate-donation">
              <strong>{certificate.foodName}</strong>
              {certificate.quantity && <span>{certificate.quantity}</span>}
              {certificate.city && <span>{certificate.city}</span>}
            </div>
            <div className="donation-certificate-footer">
              <div>
                <span className="donation-certificate-label">ISSUED</span>
                <strong>{issueDate}</strong>
              </div>
              <div>
                <span className="donation-certificate-label">CERTIFICATE NO.</span>
                <strong>{certificate.certificateNumber}</strong>
              </div>
            </div>
            <p className="donation-certificate-signature">FoodBridge Community Impact Team</p>
          </div>
        </article>
      </section>
    </div>
  );
};
