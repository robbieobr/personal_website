import { useCallback, useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTranslation } from 'react-i18next';
import UserProfileComponent from '../components/UserProfile/UserProfile';
import JobHistory from '../components/JobHistory/JobHistory';
import EducationHistory from '../components/EducationHistory/EducationHistory';
import Projects from '../components/Projects/Projects';
import Skills from '../components/Skills/Skills';
import Achievements from '../components/Achievements/Achievements';
import { getUserProfile } from '../services/api';
import { UserProfile as UserProfileType } from '../types/index';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch profile for user ID 1 (demo user)
        const data = await getUserProfile(1);
        setProfile(data);
        setErrorKey(null);
      } catch (err) {
        console.error('Error loading profile:', err);
        setErrorKey('profilePage.error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reloadToken]);

  // Retry re-runs the effect by bumping a token rather than calling the fetch
  // directly, which keeps the async work declared inside the effect.
  const handleRetry = useCallback(() => {
    setLoading(true);
    setErrorKey(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (profile?.user?.name) {
      // Matches the static <title> format in index.html (name + role).
      const previousTitle = document.title;
      document.title = `${profile.user.name} | ${profile.user.title}`;
      return () => {
        document.title = previousTitle;
      };
    }
  }, [profile, i18n.language, t]);

  // One live region that stays mounted across every state, so the transition

  // from "loading" to "loaded" is announced. A region inserted at the same

  // moment as its text is unreliable in most screen readers.
  const status = loading
    ? t('profilePage.loading')
    : profile && !errorKey
      ? t('profilePage.loaded')
      : '';

  const renderBody = () => {
    if (loading) {
      return (
        <div className="container">
          <div className="profile-skeleton-container">
            <div className="profile-skeleton-image">
              <Skeleton circle height={96} width={96} />
            </div>
            <div className="profile-skeleton-info">
              <Skeleton height={48} width={220} style={{ marginBottom: 10 }} />
              <Skeleton height={12} width={130} style={{ marginBottom: 20 }} />
              <div className="profile-skeleton-contact">
                <Skeleton height={12} width={180} />
                <Skeleton height={12} width={150} />
              </div>
            </div>
          </div>
          <div className="content-grid">
            <div className="main-column">
              <div className="history-skeleton-card">
                <Skeleton height={12} width={100} style={{ marginBottom: 18 }} />
                <Skeleton height={18} width={200} style={{ marginBottom: 8 }} />
                <Skeleton height={12} width={140} style={{ marginBottom: 8 }} />
                <Skeleton height={12} count={2} />
              </div>
              <div className="history-skeleton-card">
                <Skeleton height={12} width={100} style={{ marginBottom: 18 }} />
                <Skeleton height={18} width={180} style={{ marginBottom: 8 }} />
                <Skeleton height={12} width={120} style={{ marginBottom: 8 }} />
                <Skeleton height={12} count={2} />
              </div>
            </div>
            <div className="sidebar-column">
              <div className="history-skeleton-card">
                <Skeleton height={12} width={80} style={{ marginBottom: 14 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Skeleton height={28} width={70} borderRadius={100} />
                  <Skeleton height={28} width={85} borderRadius={100} />
                  <Skeleton height={28} width={60} borderRadius={100} />
                  <Skeleton height={28} width={90} borderRadius={100} />
                  <Skeleton height={28} width={75} borderRadius={100} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (errorKey) {
      return (
        <div className="error" role="alert">
          <p className="error-message">{t(errorKey)}</p>
          <button type="button" className="error-retry" onClick={handleRetry}>
            {t('profilePage.retry')}
          </button>
        </div>
      );
    }

    if (!profile) {
      return (
        <div className="error" role="alert">
          <p className="error-message">{t('profilePage.noData')}</p>
        </div>
      );
    }

    return (
      <div className="container">
        <UserProfileComponent user={profile.user} contactInfo={profile.contactInfo} />
        <div className="content-grid">
          {/* The aside comes first in source order so the print stylesheet can
              float it and let the long main flow reclaim the width beneath it;
              grid placement keeps it visually on the right at every breakpoint.
              It contains no focusable elements, so tab order is unchanged. */}
          <aside className="sidebar-column">
            <Skills skills={profile.skills} />
            <Achievements achievements={profile.achievements} />
          </aside>
          <div className="main-column">
            <JobHistory jobs={profile.jobHistory} />
            <EducationHistory education={profile.education} />
          </div>
        </div>
        {/* Projects moves out of the sidebar-width column into a full-width band:
            as the tail of a 760px column it left a 300px void running most of
            the page height. */}
        <div className="projects-band">
          <Projects projects={profile.projects} />
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
      {renderBody()}
    </div>
  );
};

export default ProfilePage;
