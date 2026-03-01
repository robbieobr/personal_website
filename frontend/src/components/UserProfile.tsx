
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { User, ContactInfo } from '../types/index';
import ContactInfoComponent from './ContactInfo/ContactInfo';
import './UserProfile.css';

interface UserProfileProps {
  user?: User;
  contactInfo?: ContactInfo[];
  loading?: boolean;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({ user, contactInfo, loading }) => {
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
          <p className="title">{loading ? <Skeleton width={80} /> : user?.title}</p>
          {loading ? (
            <div className="contact-info">
              <p><Skeleton width={140} /></p>
              <p><Skeleton width={100} /></p>
            </div>
          ) : (
            <ContactInfoComponent contactInfo={contactInfo} />
          )}
        </div>
      </div>
      {(user?.bio || loading) && (
        <div className="profile-bio">
          <h2 className="profile-bio-heading">{t('userProfile.about')}</h2>
          <p>{loading ? <Skeleton count={2} /> : user?.bio}</p>
        </div>
      )}
    </div>
  );
};

export default UserProfileComponent;
