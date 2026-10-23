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
import { useLocale, type Localized } from "@/lib/i18n";

// The windows' own interface copy; the portfolio facts live in content.ts.
const copy = {
  aboutEyebrow: { en: "A little introduction", es: "Una breve presentación" },
  locationNote: {
    en: "Honduras · Open to remote collaborations",
    es: "Honduras · Abierto a colaboraciones remotas",
  },
  craftHeading: {
    en: "Curiosity, followed by craft.",
    es: "Curiosidad, seguida de oficio.",
  },
  craftBody: {
    en: "I care about clean code, clear interfaces, and solving problems that matter. My work brings together software engineering, artificial intelligence, and an appreciation for thoughtful design.",
    es: "Valoro el código limpio, las interfaces claras y resolver problemas que importan. Mi trabajo une la ingeniería de software, la inteligencia artificial y el aprecio por el diseño cuidadoso.",
  },
  skillsHeading: { en: "What I work with", es: "Con qué trabajo" },
  education: { en: "Education", es: "Educación" },
  degree: {
    en: "BSc, Software Engineering",
    es: "Licenciatura (BSc) en Ingeniería de Software",
  },
  scholarship: {
    en: "Full merit scholarship · Potsdam, Germany.",
    es: "Beca completa por mérito · Potsdam, Alemania.",
  },
  languages: {
    en: "Spanish (native) · English (fluent) · French (DELF B1)",
    es: "Español (nativo) · Inglés (fluido) · Francés (DELF B1)",
  },
  projectsEyebrow: {
    en: "A few things I've built",
    es: "Algunas cosas que he construido",
  },
  projectsHeading: { en: "Selected work", es: "Trabajos destacados" },
  projectsSubtitle: {
    en: "From an idea to something useful.",
    es: "De una idea a algo útil.",
  },
  explore: { en: "Explore", es: "Explorar" },
  opensInNewTab: {
    en: "opens in a new tab",
    es: "se abre en una pestaña nueva",
  },
  experienceEyebrow: { en: "The journey so far", es: "El camino hasta ahora" },
  experienceHeading: {
    en: "Learning by building.",
    es: "Aprendiendo al construir.",
  },
  resume: { en: "Open full résumé", es: "Ver currículum completo" },
  postage: { en: "From Honduras", es: "Desde Honduras" },
  contactEyebrow: {
    en: "My inbox is open",
    es: "Mi bandeja de entrada está abierta",
  },
  contactHeadingTop: {
    en: "Good things start",
    es: "Las cosas buenas empiezan",
  },
  contactHeadingBottom: { en: "with a hello.", es: "con un hola." },
  contactLead: {
    en: "Have an interesting problem, a project in mind, or just something to share? I'd like to hear from you.",
    es: "¿Tienes un problema interesante, un proyecto en mente o simplemente algo que compartir? Me gustaría saber de ti.",
  },
  copyEmail: { en: "Copy email address", es: "Copiar correo electrónico" },
  copied: { en: "Copied to clipboard", es: "Copiado al portapapeles" },
  copiedStatus: {
    en: "Email address copied",
    es: "Correo electrónico copiado",
  },
  copyFailed: {
    en: "Copy unavailable. You can select the email address above.",
    es: "No se pudo copiar. Puedes seleccionar el correo electrónico de arriba.",
  },
  available: {
    en: "Available for work & collaboration",
    es: "Disponible para trabajo y colaboraciones",
  },
} satisfies Record<string, Localized>;

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
  const { t } = useLocale();

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
        <p className="document-eyebrow">{t(copy.aboutEyebrow)}</p>
        <h2>{t(profile.introduction)}</h2>
        <p className="lead-text">{t(profile.bio)}</p>
        <div className="location-note">
          <MapPin size={14} /> {t(copy.locationNote)}
        </div>
        <div className="document-rule" />
        <h3>{t(copy.craftHeading)}</h3>
        <p>{t(copy.craftBody)}</p>
        <h3>{t(copy.skillsHeading)}</h3>
        <div className="skill-list">
          {skills.map((skill) => (
            <span key={skill.en}>{t(skill)}</span>
          ))}
        </div>
        <div className="education-note">
          <span>{t(copy.education)}</span>
          <strong>{t(copy.degree)}</strong>
          <p>
            University of Europe for Applied Sciences · 2022–2025
            <br />
            {t(copy.scholarship)}
          </p>
        </div>
        <p className="language-note">{t(copy.languages)}</p>
      </article>
    );

  if (folder === "projects")
    return (
      <div className="projects-content">
        <p className="document-eyebrow">{t(copy.projectsEyebrow)}</p>
        <h2>{t(copy.projectsHeading)}</h2>
        <p className="content-subtitle">{t(copy.projectsSubtitle)}</p>
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
                  <span>{t(project.category)}</span>
                  <span>{project.year}</span>
                </div>
                <h3>{project.name}</h3>
                <p>{t(project.description)}</p>
                <div className="project-bottom">
                  <span>{project.stack.join(" / ")}</span>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t(copy.explore)} <ArrowUpRight size={15} />
                    <span className="sr-only">
                      {project.name}, {t(copy.opensInNewTab)}
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
        <p className="document-eyebrow">{t(copy.experienceEyebrow)}</p>
        <h2>{t(copy.experienceHeading)}</h2>
        <div className="experience-list">
          {experience.map((job) => (
            <article key={job.company}>
              <div className="experience-date">{t(job.period)}</div>
              <h3>{job.company}</h3>
              <strong>{t(job.role)}</strong>
              <p className="experience-context">{t(job.context)}</p>
              <p>{t(job.detail)}</p>
            </article>
          ))}
        </div>
        <a
          className="document-button"
          href={profile.cv}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={16} /> {t(copy.resume)} <ArrowUpRight size={14} />
        </a>
      </div>
    );

  if (folder === "writing") return <Notes />;

  return (
    <div className="contact-content">
      <div className="postage" aria-hidden="true">
        <span>HN</span>
        <Mail size={30} />
        <small>{t(copy.postage)}</small>
      </div>
      <p className="document-eyebrow">{t(copy.contactEyebrow)}</p>
      <h2>
        {t(copy.contactHeadingTop)}
        <br />
        {t(copy.contactHeadingBottom)}
      </h2>
      <p className="lead-text">{t(copy.contactLead)}</p>
      <a className="email-link" href={`mailto:${profile.email}`}>
        {profile.email}
        <ArrowUpRight size={18} />
      </a>
      <button className="copy-email" onClick={copyEmail}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? t(copy.copied) : t(copy.copyEmail)}
      </button>
      <span className="sr-only" role="status">
        {copied ? t(copy.copiedStatus) : copyError ? t(copy.copyFailed) : ""}
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
        <i /> {t(copy.available)}
      </div>
    </div>
  );
}
