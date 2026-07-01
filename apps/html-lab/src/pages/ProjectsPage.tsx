import { Link } from 'react-router-dom';
import { ATELIER_PROJECTS } from '../data/projects';
import { SiteNav } from './HomePage';
import './home.css';

export function ProjectsPage() {
  return (
    <div className="home">
      <SiteNav />
      <div className="page-head">
        <h1>项目</h1>
        <p>培训 deck 与互动旅程 — 基于 guizang-ppt Atelier 主题生成</p>
      </div>
      <div className="projects-grid">
        {ATELIER_PROJECTS.map((project) => (
          <Link key={project.id} to={`/project/${project.id}`} className="project-card">
            <span className="sub">{project.subtitle}</span>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div className="project-meta">
              <span>{project.slideCount} slides</span>
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
