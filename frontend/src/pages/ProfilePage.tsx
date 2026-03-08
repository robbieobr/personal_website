import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
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
  }, []);

  useEffect(() => {
    if (profile?.user?.name) {
      document.title = profile.user.name;
      return () => {
        document.title = t('app.title');
      };
    }
  }, [profile, i18n.language, t]);

  if (loading) {
    return (
      <div className="profile-page" aria-busy="true" aria-label="Loading portfolio content">
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
      </div>
    );
  }

  if (errorKey) {
    return (
      <div className="profile-page">
        <div className="error" role="alert">{t(errorKey)}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error" role="alert">{t('profilePage.noData')}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <UserProfileComponent user={profile.user} contactInfo={profile.contactInfo} />
        <div className="content-grid">
          <main className="main-column">
            <JobHistory jobs={profile.jobHistory} />
            <EducationHistory education={profile.education} />
            <Projects projects={profile.projects} />
          </main>
          <aside className="sidebar-column">
            <Skills skills={profile.skills} />
            <Achievements achievements={profile.achievements} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
