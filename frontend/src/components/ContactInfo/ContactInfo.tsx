
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ContactInfo as ContactInfoType } from '../../types/index';
import './ContactInfo.css';

interface ContactInfoProps {
  contactInfo?: ContactInfoType[];
}

const EmailIcon: React.FC = () => (
  <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.85 19.79 19.79 0 012 1.27 2 2 0 013.97 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);

const GitHubIcon: React.FC = () => (
  <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const LinkedInIcon: React.FC = () => (
  <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const stripProtocol = (url: string) => {
  const match = url.match(/^(https?:\/\/)(.*)/);
  return match ? { protocol: match[1], rest: match[2] } : { protocol: '', rest: url };
};

const ContactInfoComponent: React.FC<ContactInfoProps> = ({ contactInfo }) => {
  const { t } = useTranslation();

  if (!contactInfo || contactInfo.length === 0) {
    return null;
  }

  const renderEntry = (entry: ContactInfoType) => {
    switch (entry.type) {
      case 'email':
        return (
          <p key={entry.id} className="contact-info-item">
            <EmailIcon />
            <a href={`mailto:${entry.value}`} aria-label={t('contactInfo.ariaEmail', { value: entry.value })}>
              {entry.value}
            </a>
          </p>
        );
      case 'phone':
        return (
          <p key={entry.id} className="contact-info-item">
            <PhoneIcon />
            <a href={`tel:${entry.value}`} aria-label={t('contactInfo.ariaPhone', { value: entry.value })}>
              {entry.value}
            </a>
          </p>
        );
      case 'website': {
        const { protocol, rest } = stripProtocol(entry.value);
        return (
          <p key={entry.id} className="contact-info-item">
            <GlobeIcon />
            <a href={entry.value} target="_blank" rel="noopener noreferrer" aria-label={t('contactInfo.ariaWebsite', { value: entry.value })}>
              <span className="contact-link-label">{t('contactInfo.website')}</span>
              <span className="contact-link-url"><span className="url-protocol">{protocol}</span>{rest}</span>
            </a>
          </p>
        );
      }
      case 'github': {
        const { protocol, rest } = stripProtocol(entry.value);
        return (
          <p key={entry.id} className="contact-info-item contact-info-item--social">
            <GitHubIcon />
            <a href={entry.value} target="_blank" rel="noopener noreferrer" aria-label={t('contactInfo.ariaGithub', { value: entry.value })}>
              <span className="contact-link-label">{t('contactInfo.github')}</span>
              <span className="contact-link-url"><span className="url-protocol">{protocol}</span>{rest}</span>
            </a>
          </p>
        );
      }
      case 'linkedin': {
        const { protocol, rest } = stripProtocol(entry.value);
        return (
          <p key={entry.id} className="contact-info-item contact-info-item--social">
            <LinkedInIcon />
            <a href={entry.value} target="_blank" rel="noopener noreferrer" aria-label={t('contactInfo.ariaLinkedin', { value: entry.value })}>
              <span className="contact-link-label">{t('contactInfo.linkedin')}</span>
              <span className="contact-link-url"><span className="url-protocol">{protocol}</span>{rest}</span>
            </a>
          </p>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="contact-info">
      {contactInfo.map(renderEntry)}
    </div>
  );
};

export default ContactInfoComponent;
