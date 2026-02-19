
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
              <strong>{t('userProfile.email')}</strong>{' '}
              {loading ? <Skeleton width={140} /> : <a href={`mailto:${user?.email}`}>{user?.email}</a>}
            </p>
            <p>
              <strong>{t('userProfile.phone')}</strong>{' '}
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
