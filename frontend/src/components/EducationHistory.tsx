
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Education } from '../types/index';
import { formatDate } from '../utils/date';
import './EducationHistory.css';

interface EducationHistoryProps {
  education?: Education[];
  loading?: boolean;
}

const EducationHistory: React.FC<EducationHistoryProps> = ({ education, loading }) => {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="education-history">
        <h2>{t('educationHistory.title')}</h2>
        <div className="education-container">
          {[1, 2].map((i) => (
            <div className="education-card" key={i}>
              <div className="education-header">
                <h3><Skeleton width={100} /></h3>
                <span className="institution"><Skeleton width={80} /></span>
              </div>
              <div className="education-field"><Skeleton width={120} /></div>
              <div className="education-dates"><Skeleton width={120} /></div>
              <p className="education-description"><Skeleton count={2} /></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!education || education.length === 0) {
    return <div className="education-history">{t('educationHistory.noHistory')}</div>;
  }

  return (
    <div className="education-history">
      <h2>{t('educationHistory.title')}</h2>
      <div className="education-container">
        {education.map((edu) => (
          <div key={edu.id} className="education-card">
            <div className="education-header">
              <h3>{edu.degree}</h3>
              <span className="institution">{edu.institution}</span>
            </div>
            <div className="education-field">
              {edu.field}
            </div>
            <div className="education-dates">
              {formatDate(edu.startDate, i18n.language)} - {edu.endDate ? formatDate(edu.endDate, i18n.language) : t('educationHistory.present')}
            </div>
            {edu.description && <p className="education-description">{edu.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationHistory;
