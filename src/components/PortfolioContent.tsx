"use client";

import { useState } from "react";
import Image from "next/image";
import Notes from "./Notes";
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
  type FolderId,
} from "@/lib/content";

// The X mark, drawn inline: lucide ships no logo for it.
function XLogo() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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
        <Image
          className="profile-portrait"
          src="/images/fredy-portrait.png"
          width={104}
          height={104}
          sizes="104px"
          loading="eager"
          alt="Fredy Maldonado"
        />
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
            Full merit scholarship · Potsdam, Germany.
          </p>
        </div>
        <p className="language-note">
          Spanish (native) · English (fluent) · French (DELF B1)
        </p>
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
              <p className="experience-context">{job.context}</p>
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

  if (folder === "writing") return <Notes />;

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
        <a href={profile.x} target="_blank" rel="noopener noreferrer">
          <XLogo /> X <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="availability">
        <i /> Available for work & collaboration
      </div>
    </div>
  );
}
