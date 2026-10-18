"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Github,
  Mail,
  MapPin,
} from "lucide-react";
import {
  experience,
  profile,
  projects,
  skills,
  writing,
  type FolderId,
} from "@/lib/content";

export default function PortfolioContent({ folder }: { folder: FolderId }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  }

  if (folder === "about")
    return (
      <article className="about-content">
        <div className="profile-mark" aria-hidden="true">
          fm<span>.</span>
        </div>
        <p className="document-eyebrow">A little introduction</p>
        <h2>{profile.introduction}</h2>
        <p className="lead-text">{profile.bio}</p>
        <div className="location-note">
          <MapPin size={14} /> Honduras · Open to remote collaborations
        </div>
        <div className="document-rule" />
        <h3>Curiosity, followed by craft.</h3>
        <p>
          I care about clean code, clear interfaces, and solving problems that
          matter. My work brings together software engineering, artificial
          intelligence, and an appreciation for thoughtful design.
        </p>
        <h3>What I work with</h3>
        <div className="skill-list">
          {skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
        <div className="education-note">
          <span>Education</span>
          <strong>BSc, Software Engineering</strong>
          <p>
            University of Europe for Applied Sciences · 2022–2025
            <br />
            Focus on AI, machine learning, and cloud computing.
          </p>
        </div>
        <p className="language-note">Spanish · English · French · German</p>
      </article>
    );

  if (folder === "projects")
    return (
      <div className="projects-content">
        <p className="document-eyebrow">A few things I've built</p>
        <h2>Selected work</h2>
        <p className="content-subtitle">From an idea to something useful.</p>
        <div className="project-list">
          {projects.map((project) => (
            <article className="project-item" key={project.id}>
              <div
                className="project-art"
                style={
                  { "--project-color": project.color } as React.CSSProperties
                }
                aria-hidden="true"
              >
                <span>{project.symbol}</span>
                <i />
                <i />
              </div>
              <div className="project-info">
                <div className="project-meta">
                  <span>{project.category}</span>
                  <span>{project.year}</span>
                </div>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <div className="project-bottom">
                  <span>{project.stack.join(" / ")}</span>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore <ArrowUpRight size={15} />
                    <span className="sr-only">
                      {project.name}, opens in a new tab
                    </span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    );

  if (folder === "experience")
    return (
      <div className="experience-content">
        <p className="document-eyebrow">The journey so far</p>
        <h2>Learning by building.</h2>
        <div className="experience-list">
          {experience.map((job) => (
            <article key={job.company}>
              <div className="experience-date">{job.period}</div>
              <h3>{job.company}</h3>
              <strong>{job.role}</strong>
              <p>{job.detail}</p>
            </article>
          ))}
        </div>
        <a
          className="document-button"
          href={profile.cv}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={16} /> Open full résumé <ArrowUpRight size={14} />
        </a>
      </div>
    );

  if (folder === "writing")
    return (
      <div className="writing-content">
        <div className="notes-illustration" aria-hidden="true">
          Notes to self<span>and anyone curious.</span>
        </div>
        <h2>Thoughts & notes</h2>
        <p className="content-subtitle">
          Software, learning, and making things happen.
        </p>
        <div className="writing-list">
          {writing.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <small>{article.date}</small>
                <h3>{article.name}</h3>
              </span>
              <ArrowUpRight size={20} />
              <span className="sr-only">
                Opens original article in a new tab
              </span>
            </a>
          ))}
        </div>
      </div>
    );

  return (
    <div className="contact-content">
      <div className="postage" aria-hidden="true">
        <span>HN</span>
        <Mail size={30} />
        <small>From Honduras</small>
      </div>
      <p className="document-eyebrow">My inbox is open</p>
      <h2>
        Good things start
        <br />
        with a hello.
      </h2>
      <p className="lead-text">
        Have an interesting problem, a project in mind, or just something to
        share? I'd like to hear from you.
      </p>
      <a className="email-link" href={`mailto:${profile.email}`}>
        {profile.email}
        <ArrowUpRight size={18} />
      </a>
      <button className="copy-email" onClick={copyEmail}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied to clipboard" : "Copy email address"}
      </button>
      <span className="sr-only" role="status">
        {copied
          ? "Email address copied"
          : copyError
            ? "Copy unavailable. You can select the email address above."
            : ""}
      </span>
      <div className="social-links">
        <a href={profile.github} target="_blank" rel="noopener noreferrer">
          <Github size={16} /> GitHub <ArrowUpRight size={14} />
        </a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="availability">
        <i /> Available for work & collaboration
      </div>
    </div>
  );
}
