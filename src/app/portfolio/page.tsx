import Link from "next/link";
import { profile, projects, experience, writing } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — Fredy Maldonado",
  description: profile.bio,
};

export default function ReadablePortfolio() {
  return (
    <main className="readable-portfolio">
      <nav>
        <Link className="wordmark" href="/">
          fm.
        </Link>
        <Link href="/">
          Enter the workspace <span>↗</span>
        </Link>
      </nav>
      <header>
        <p>Software engineer · Honduras</p>
        <h1>
          Fredy
          <br />
          Maldonado<span>.</span>
        </h1>
        <p className="readable-intro">{profile.bio}</p>
        <a href={`mailto:${profile.email}`}>Let's talk ↗</a>
      </header>
      <section id="projects">
        <h2>Selected work</h2>
        {projects.map((project) => (
          <article className="readable-project" key={project.id}>
            <div>
              <small>
                {project.category} · {project.year}
              </small>
              <h3>
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.name} ↗
                </a>
              </h3>
              <p>{project.description}</p>
              <span>{project.stack.join(" / ")}</span>
            </div>
          </article>
        ))}
      </section>
      <section id="experience">
        <h2>Experience</h2>
        {experience.map((job) => (
          <article className="readable-job" key={job.company}>
            <span>{job.period}</span>
            <div>
              <h3>{job.company}</h3>
              <strong>{job.role}</strong>
              <p>{job.detail}</p>
            </div>
          </article>
        ))}
      </section>
      <section>
        <h2>Writing</h2>
        {writing.map((article) => (
          <a
            className="readable-article"
            href={article.url}
            key={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{article.name}</span>
            <span>↗</span>
          </a>
        ))}
      </section>
      <footer>
        <h2>Let's make something useful.</h2>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <div>
          <a href={profile.github}>GitHub ↗</a>
          <a href={profile.linkedin}>LinkedIn ↗</a>
          <a href={profile.cv}>Résumé ↗</a>
        </div>
      </footer>
    </main>
  );
}
