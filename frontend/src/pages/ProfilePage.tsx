import { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTranslation } from 'react-i18next';
import UserProfileComponent from '../components/UserProfile';
import JobHistory from '../components/JobHistory';
import EducationHistory from '../components/EducationHistory';
import { getUserProfile } from '../services/api';
import { UserProfile as UserProfileType } from '../types/index';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Fetch profile for user ID 1 (demo user)
        const data = await getUserProfile(1);
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(t('profilePage.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-skeleton-container">
            <div className="profile-skeleton-image">
              <Skeleton circle height={160} width={160} />
            </div>
            <div className="profile-skeleton-info">
              <Skeleton height={44} width={200} style={{ marginBottom: 12 }} />
              <Skeleton height={32} width={140} style={{ marginBottom: 24 }} />
              <div className="profile-skeleton-contact">
                <Skeleton height={18} width={220} />
                <Skeleton height={18} width={180} />
              </div>
            </div>
          </div>
          <div className="history-section">
            <div className="history-skeleton-card">
              <Skeleton height={28} width={140} style={{ marginBottom: 16 }} />
              <Skeleton height={18} width={100} style={{ marginBottom: 8 }} />
              <Skeleton height={18} width={140} style={{ marginBottom: 8 }} />
              <Skeleton height={18} width={160} />
            </div>
            <div className="history-skeleton-card">
              <Skeleton height={28} width={140} style={{ marginBottom: 16 }} />
              <Skeleton height={18} width={100} style={{ marginBottom: 8 }} />
              <Skeleton height={18} width={140} style={{ marginBottom: 8 }} />
              <Skeleton height={18} width={160} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error">{t('profilePage.noData')}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <UserProfileComponent user={profile.user} />
        <div className="history-section">
          <JobHistory jobs={profile.jobHistory} />
          <EducationHistory education={profile.education} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
