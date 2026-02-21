
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { JobEntry } from '../types/index';
import './JobHistory.css';

interface JobHistoryProps {
  jobs?: JobEntry[];
  loading?: boolean;
}

const JobHistory: React.FC<JobHistoryProps> = ({ jobs, loading }) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="job-history">
        <h2>{t('jobHistory.title')}</h2>
        <div className="jobs-container">
          {[1, 2].map((i) => (
            <div className="job-card" key={i}>
              <div className="job-header">
                <h3><Skeleton width={100} /></h3>
                <span className="company"><Skeleton width={80} /></span>
              </div>
              <div className="job-dates"><Skeleton width={120} /></div>
              <p className="job-description"><Skeleton count={2} /></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return <div className="job-history">{t('jobHistory.noHistory')}</div>;
  }

  return (
    <div className="job-history">
      <h2>{t('jobHistory.title')}</h2>
      <div className="jobs-container">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.position}</h3>
              <span className="company">{job.company}</span>
            </div>
            <div className="job-dates">
              {formatDate(job.startDate)} - {job.endDate ? formatDate(job.endDate) : t('jobHistory.present')}
            </div>
            {job.description && <p className="job-description">{job.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobHistory;
