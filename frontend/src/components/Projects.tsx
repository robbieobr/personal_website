
import React from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Project } from '../types/index';
import './Projects.css';

interface ProjectsProps {
  projects?: Project[];
  loading?: boolean;
}

const Projects: React.FC<ProjectsProps> = ({ projects, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="projects">
        <h2>{t('projects.title')}</h2>
        <div className="projects-container">
          {[1, 2].map((i) => (
            <div className="project-card" key={i}>
              <div className="project-header">
                <h3><Skeleton width={120} /></h3>
                <span className="project-role"><Skeleton width={80} /></span>
              </div>
              <p className="project-description"><Skeleton count={2} /></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return <div className="projects">{t('projects.noProjects')}</div>;
  }

  return (
    <div className="projects">
      <h2>{t('projects.title')}</h2>
      <div className="projects-container">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <h3>{project.title}</h3>
              <span className="project-role">{project.role}</span>
            </div>
            {project.description && <p className="project-description">{project.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
