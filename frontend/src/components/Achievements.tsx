
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Achievement } from '../types/index';
import { formatDate } from '../utils/date';
import './Achievements.css';

interface AchievementsProps {
  achievements?: Achievement[];
  loading?: boolean;
}

const Achievements: React.FC<AchievementsProps> = ({ achievements, loading }) => {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="achievements">
        <h2>{t('achievements.title')}</h2>
        <div className="achievements-container">
          {[1, 2].map((i) => (
            <div className="achievement-card" key={i}>
              <div className="achievement-header">
                <h3><Skeleton width={120} /></h3>
                <span className="achievement-date"><Skeleton width={80} /></span>
              </div>
              <p className="achievement-description"><Skeleton count={2} /></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return <div className="achievements">{t('achievements.noAchievements')}</div>;
  }

  return (
    <div className="achievements">
      <h2>{t('achievements.title')}</h2>
      <div className="achievements-container">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="achievement-card">
            <div className="achievement-header">
              <h3>{achievement.title}</h3>
              <span className="achievement-date">{formatDate(achievement.date, i18n.language)}</span>
            </div>
            {achievement.description && (
              <p className="achievement-description">{achievement.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
