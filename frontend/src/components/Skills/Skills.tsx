
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Skill } from '../../types/index';
import './Skills.css';

interface SkillsProps {
  skills?: Skill[];
  loading?: boolean;
}

const Skills: React.FC<SkillsProps> = ({ skills, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="skills">
        <h2>{t('skills.title')}</h2>
        <ul className="skills-list">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="skill-item">
              <Skeleton width={80} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!skills || skills.length === 0) {
    return <div className="skills">{t('skills.noSkills')}</div>;
  }

  return (
    <div className="skills">
      <h2>{t('skills.title')}</h2>
      <ul className="skills-list">
        {skills.map((s) => (
          <li key={s.id} className="skill-item">{s.skill}</li>
        ))}
      </ul>
    </div>
  );
};

export default Skills;
