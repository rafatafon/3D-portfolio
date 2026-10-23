import type { Localized } from "./i18n";

// Spanish copy is a faithful translation of the verified English: same facts,
// dates, and numbers, written in Fredy's own first-person voice.
export const profile = {
  name: "Fredy Maldonado",
  role: { en: "Software engineer", es: "Ingeniero de software" },
  location: { en: "Honduras", es: "Honduras" },
  email: "rafaelmaldonadowork@gmail.com",
  github: "https://github.com/rafatafon",
  linkedin: "https://www.linkedin.com/in/fredy-rafael-maldonado",
  x: "https://x.com/rafatafon",
  cv: "/Fredy-Maldonado-CV.pdf",
  introduction: {
    en: "I build useful things with software.",
    es: "Construyo cosas útiles con software.",
  },
  bio: {
    en: "I'm a software engineer from Honduras and the founder of Archimedes Systems. I build production AI systems, automation, and full-stack platforms, turning business requirements into reliable software. I earned my BSc in Software Engineering in Germany on a full merit scholarship.",
    es: "Soy ingeniero de software, de Honduras, y fundador de Archimedes Systems. Construyo sistemas de IA en producción, automatizaciones y plataformas full-stack, convirtiendo requisitos de negocio en software confiable. Obtuve mi licenciatura (BSc) en Ingeniería de Software en Alemania con una beca completa por mérito.",
  },
};

type Project = {
  id: string;
  name: string;
  category: Localized;
  year: string;
  color: string;
  symbol: string;
  description: Localized;
  stack: string[];
  url: string;
};

export const projects: Project[] = [
  {
    id: "prospera",
    name: "Próspera Job Portal",
    category: { en: "Web application", es: "Aplicación web" },
    year: "2026",
    color: "#526e60",
    symbol: "P",
    description: {
      en: "A bilingual, multi-tenant job portal connecting companies in Próspera with local talent in Honduras. Role-based dashboards, admin moderation, and secure applications make hiring easier for both sides.",
      es: "Un portal de empleo bilingüe y multiempresa que conecta a las compañías de Próspera con el talento local de Honduras. Paneles según el rol, moderación administrativa y postulaciones seguras facilitan la contratación para ambas partes.",
    },
    stack: ["Next.js", "Supabase", "TypeScript"],
    url: "https://www.workinprospera.tech/es",
  },
  {
    id: "barrendero",
    name: "El Barrendero & El Perro",
    category: { en: "Storytelling & design", es: "Narrativa y diseño" },
    year: "2025",
    color: "#a5754b",
    symbol: "&",
    description: {
      en: "A narrative-driven website combining storytelling, illustration, and web design to explore human values, simplicity, and everyday wisdom.",
      es: "Un sitio web guiado por la narrativa que combina relato, ilustración y diseño web para explorar los valores humanos, la sencillez y la sabiduría cotidiana.",
    },
    stack: ["Figma", "Framer", "Vercel"],
    url: "https://elbarrenderoyelperro.com/",
  },
  {
    id: "cloud",
    name: "Cloud Infrastructure",
    category: { en: "Cloud engineering", es: "Ingeniería en la nube" },
    year: "2024",
    color: "#637f94",
    symbol: "↗",
    description: {
      en: "A scalable AWS architecture that moves local processing into S3 and Lambda, using parallel execution to handle larger workloads efficiently.",
      es: "Una arquitectura escalable en AWS que traslada el procesamiento local a S3 y Lambda, con ejecución en paralelo para manejar cargas de trabajo más grandes de forma eficiente.",
    },
    stack: ["Python", "AWS", "Lambda"],
    url: "https://github.com/rafatafon/Cloud-Computing-Project",
  },
  {
    id: "summarizer",
    name: "AI Text Summarizer",
    category: { en: "Artificial intelligence", es: "Inteligencia artificial" },
    year: "2025",
    color: "#8c768c",
    symbol: "Aa",
    description: {
      en: "A transformer-powered application that condenses long-form text while preserving its key information, helping readers spend less time reviewing content.",
      es: "Una aplicación basada en transformers que resume textos extensos conservando su información clave, para que los lectores dediquen menos tiempo a revisar contenido.",
    },
    stack: ["Python", "Hugging Face"],
    url: "https://github.com/rafatafon/AI-Text-Summarizer",
  },
  {
    id: "resume",
    name: "Resume Keyword Matcher",
    category: { en: "Developer tool", es: "Herramienta para desarrolladores" },
    year: "2025",
    color: "#ad7e65",
    symbol: "✓",
    description: {
      en: "A resume analysis tool that compares CVs with job descriptions using keyword extraction and frequency analysis to identify alignment and gaps.",
      es: "Una herramienta de análisis de currículums que compara CV con descripciones de puestos mediante extracción de palabras clave y análisis de frecuencia, para identificar coincidencias y brechas.",
    },
    stack: ["Python", "Pandas", "Streamlit"],
    url: "https://github.com/rafatafon/Resume-Keyword-Matcher",
  },
];

type Job = {
  company: string;
  role: Localized;
  period: Localized;
  context: Localized;
  detail: Localized;
};

// Roles and dates verified against Fredy's LinkedIn profile on October 18, 2026.
// The Spanish periods name the same months and years; only the words change.
export const experience: Job[] = [
  {
    company: "Archimedes Systems",
    role: { en: "Founder & CEO", es: "Fundador y CEO" },
    period: { en: "Jan 2026 — Present", es: "ene 2026 — actualidad" },
    context: {
      en: "Full-time · Comayagua, Honduras · Remote",
      es: "Tiempo completo · Comayagua, Honduras · Remoto",
    },
    detail: {
      en: "Founded an AI and software consulting firm serving international clients. Lead client acquisition, technical architecture, implementation, testing, and deployment. Build automation workflows, AI pipelines, and production platforms with Next.js, TypeScript, FastAPI, and Supabase.",
      es: "Fundé una consultora de IA y software que atiende a clientes internacionales. Dirijo la captación de clientes, la arquitectura técnica, la implementación, las pruebas y el despliegue. Construyo flujos de automatización, pipelines de IA y plataformas en producción con Next.js, TypeScript, FastAPI y Supabase.",
    },
  },
  {
    company: "Próspera",
    role: { en: "Full Stack Engineer", es: "Ingeniero Full Stack" },
    period: { en: "Aug 2026 — Oct 2026", es: "ago 2026 — oct 2026" },
    context: {
      en: "Full-time · Roatán, Honduras · On-site",
      es: "Tiempo completo · Roatán, Honduras · Presencial",
    },
    detail: {
      en: "Owned the design, development, deployment, and operational reliability of business-critical applications and internal platforms. Built full-stack features, APIs, integrations, dashboards, and automation. Managed cloud infrastructure and Cloudflare, administered Google Workspace, Microsoft 365, and GitHub, and supported production incidents and runbooks.",
      es: "Fui responsable del diseño, desarrollo, despliegue y confiabilidad operativa de aplicaciones críticas para el negocio y plataformas internas. Construí funcionalidades full-stack, APIs, integraciones, paneles y automatizaciones. Gestioné la infraestructura en la nube y Cloudflare, administré Google Workspace, Microsoft 365 y GitHub, y di soporte a incidentes en producción y runbooks.",
    },
  },
  {
    company: "MES, Inc.",
    role: {
      en: "Multiuse Learning Facility Coordinator – Computer Lab & Technology Support",
      es: "Coordinador de Instalaciones de Aprendizaje Multiuso – Laboratorio de Computación y Soporte Tecnológico",
    },
    period: { en: "Jan 2026 — Jul 2026", es: "ene 2026 — jul 2026" },
    context: {
      en: "Part-time · Comayagua, Honduras · On-site",
      es: "Medio tiempo · Comayagua, Honduras · Presencial",
    },
    detail: {
      en: "Coordinated computer labs, classrooms, and digital learning environments. Managed scheduling, access, and utilization tracking; provided technical support and preventive maintenance; supported learning platforms; and reported on equipment performance, system availability, and security compliance.",
      es: "Coordiné laboratorios de computación, aulas y entornos de aprendizaje digital. Gestioné horarios, accesos y el seguimiento de uso; brindé soporte técnico y mantenimiento preventivo; di soporte a plataformas de aprendizaje; e informé sobre el rendimiento de los equipos, la disponibilidad de los sistemas y el cumplimiento de seguridad.",
    },
  },
  {
    company: "Aero Cielo",
    role: {
      en: "Software Engineer & Branch Manager",
      es: "Ingeniero de Software y Gerente de Sucursal",
    },
    period: { en: "Aug 2025 — Jul 2026", es: "ago 2025 — jul 2026" },
    context: {
      en: "Part-time · Comayagua, Honduras · Remote",
      es: "Medio tiempo · Comayagua, Honduras · Remoto",
    },
    detail: {
      en: "Led the company's digital transformation and regional branch operations. Built its official website and React Native mobile application as the sole engineer, integrated AI into internal logistics, and managed sales strategy and regional growth.",
      es: "Lideré la transformación digital de la empresa y las operaciones de su sucursal regional. Como único ingeniero, construí su sitio web oficial y su aplicación móvil en React Native, integré IA en la logística interna y gestioné la estrategia de ventas y el crecimiento regional.",
    },
  },
  {
    company: "XRF",
    role: {
      en: "Intern Computer Vision using Generative AI",
      es: "Pasante de Visión por Computadora con IA Generativa",
    },
    period: { en: "Aug 2024 — Feb 2025", es: "ago 2024 — feb 2025" },
    context: {
      en: "Full-time · Las Palmas de Gran Canaria, Spain · Remote",
      es: "Tiempo completo · Las Palmas de Gran Canaria, España · Remoto",
    },
    detail: {
      en: "Developed multilingual text and speech solutions across 10+ languages, improving system accuracy by 15%. Contributed to scalable pipelines and AWS deployments that improved performance by 30%, working with large language models, computer vision, and Python in a production engineering team.",
      es: "Desarrollé soluciones multilingües de texto y voz en más de 10 idiomas, mejorando la precisión del sistema en un 15 %. Contribuí a pipelines escalables y despliegues en AWS que mejoraron el rendimiento en un 30 %, trabajando con modelos de lenguaje de gran tamaño, visión por computadora y Python en un equipo de ingeniería en producción.",
    },
  },
];

// Technology names stay as they are; only the phrases are translated.
export const skills: Localized[] = [
  { en: "TypeScript", es: "TypeScript" },
  { en: "React", es: "React" },
  { en: "Next.js", es: "Next.js" },
  { en: "Python", es: "Python" },
  { en: "FastAPI", es: "FastAPI" },
  { en: "Node.js", es: "Node.js" },
  { en: "PostgreSQL", es: "PostgreSQL" },
  { en: "AWS", es: "AWS" },
  { en: "AI & automation", es: "IA y automatización" },
  { en: "System design", es: "Diseño de sistemas" },
];

export type FolderId =
  | "about"
  | "projects"
  | "experience"
  | "writing"
  | "contact";
export const folders: {
  id: FolderId;
  name: Localized;
  file: Localized;
  kind: "folder" | "document" | "contact";
}[] = [
  {
    id: "about",
    name: { en: "About me", es: "Sobre mí" },
    file: { en: "About me.txt", es: "Sobre mí.txt" },
    kind: "document",
  },
  {
    id: "projects",
    name: { en: "Projects", es: "Proyectos" },
    file: { en: "Selected work", es: "Trabajos destacados" },
    kind: "folder",
  },
  {
    id: "experience",
    name: { en: "Experience", es: "Experiencia" },
    file: { en: "Experience", es: "Experiencia" },
    kind: "folder",
  },
  {
    id: "writing",
    name: { en: "Writing", es: "Escritos" },
    file: { en: "Thoughts & notes", es: "Ideas y notas" },
    kind: "folder",
  },
  {
    id: "contact",
    name: { en: "Contact", es: "Contacto" },
    file: { en: "Say hello", es: "Saluda" },
    kind: "contact",
  },
];
