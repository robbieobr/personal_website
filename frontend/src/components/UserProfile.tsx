
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { User } from '../types/index';
import './UserProfile.css';

interface UserProfileProps {
  user?: User;
  loading?: boolean;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({ user, loading }) => {
  const { t } = useTranslation();
  const profileImage = user?.profileImage || '/images/placeholder-profile.png';

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          {loading ? (
            <Skeleton circle height={160} width={160} />
          ) : (
            <img src={profileImage} alt={user?.name || ''} className="profile-image" />
          )}
        </div>
        <div className="profile-info">
          <h1>{loading ? <Skeleton width={120} /> : user?.name}</h1>
          <h2 className="title">{loading ? <Skeleton width={80} /> : user?.title}</h2>
          <div className="contact-info">
            <p>
              <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
              </svg>
              {loading ? <Skeleton width={140} /> : <a href={`mailto:${user?.email}`}>{user?.email}</a>}
            </p>
            <p>
              <svg className="contact-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.85 19.79 19.79 0 012 1.27 2 2 0 013.97 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {loading ? <Skeleton width={100} /> : <a href={`tel:${user?.phone}`}>{user?.phone}</a>}
            </p>
          </div>
        </div>
      </div>
      {(user?.bio || loading) && (
        <div className="profile-bio">
          <h3>{t('userProfile.about')}</h3>
          <p>{loading ? <Skeleton count={2} /> : user?.bio}</p>
        </div>
      )}
    </div>
  );
};

export default UserProfileComponent;
