import { Link, NavLink } from 'react-router-dom';
import './home.css';

function SiteNav() {
  return (
    <header className="home-nav">
      <Link to="/" className="home-nav-brand">
        Atelier
      </Link>
      <nav className="home-nav-links">
        <NavLink to="/" end>
          总览
        </NavLink>
        <NavLink to="/projects">项目</NavLink>
        <NavLink to="/lab">HTML Lab</NavLink>
      </nav>
    </header>
  );
}

export function HomePage() {
  return (
    <div className="home">
      <SiteNav />
      <section className="home-hero">
        <h1>
          <span className="gold">Atelier</span> · 内容与幻灯工作室
        </h1>
        <p>
          极简深空蓝与金色品牌体系。浏览培训项目、进入 600 页互动旅程，或在 HTML Lab
          中编辑、搜索、导出 landing 与 slide 页面。
        </p>
        <div className="home-actions">
          <Link to="/projects" className="btn-primary">
            进入项目
          </Link>
          <Link to="/lab" className="btn-ghost">
            打开 HTML Lab
          </Link>
        </div>
      </section>
    </div>
  );
}

export { SiteNav };
