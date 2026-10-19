export const profile = {
  name: "Fredy Maldonado",
  role: "Software engineer",
  location: "Honduras",
  email: "rafaelmaldonadowork@gmail.com",
  github: "https://github.com/rafatafon",
  linkedin: "https://www.linkedin.com/in/fredy-rafael-maldonado",
  cv: "https://framerusercontent.com/assets/cAKwsE62CI2ZohnHGUJV9tX2r8.pdf",
  introduction: "I build useful things with software.",
  bio: "I'm a software engineer from Honduras and the founder of Archimedes Systems. I build production AI systems, automation, and full-stack platforms, turning business requirements into reliable software. I earned my BSc in Software Engineering in Germany on a full merit scholarship.",
};

export const projects = [
  {
    id: "prospera",
    name: "Próspera Job Portal",
    category: "Web application",
    year: "2026",
    color: "#526e60",
    symbol: "P",
    description:
      "A bilingual, multi-tenant job portal connecting companies in Próspera with local talent in Honduras. Role-based dashboards, admin moderation, and secure applications make hiring easier for both sides.",
    stack: ["Next.js", "Supabase", "TypeScript"],
    url: "https://www.workinprospera.tech/es",
  },
  {
    id: "barrendero",
    name: "El Barrendero & El Perro",
    category: "Storytelling & design",
    year: "2025",
    color: "#a5754b",
    symbol: "&",
    description:
      "A narrative-driven website combining storytelling, illustration, and web design to explore human values, simplicity, and everyday wisdom.",
    stack: ["Figma", "Framer", "Vercel"],
    url: "https://elbarrenderoyelperro.com/",
  },
  {
    id: "cloud",
    name: "Cloud Infrastructure",
    category: "Cloud engineering",
    year: "2024",
    color: "#637f94",
    symbol: "↗",
    description:
      "A scalable AWS architecture that moves local processing into S3 and Lambda, using parallel execution to handle larger workloads efficiently.",
    stack: ["Python", "AWS", "Lambda"],
    url: "https://github.com/rafatafon/Cloud-Computing-Project",
  },
  {
    id: "summarizer",
    name: "AI Text Summarizer",
    category: "Artificial intelligence",
    year: "2025",
    color: "#8c768c",
    symbol: "Aa",
    description:
      "A transformer-powered application that condenses long-form text while preserving its key information, helping readers spend less time reviewing content.",
    stack: ["Python", "Hugging Face"],
    url: "https://github.com/rafatafon/AI-Text-Summarizer",
  },
  {
    id: "resume",
    name: "Resume Keyword Matcher",
    category: "Developer tool",
    year: "2025",
    color: "#ad7e65",
    symbol: "✓",
    description:
      "A resume analysis tool that compares CVs with job descriptions using keyword extraction and frequency analysis to identify alignment and gaps.",
    stack: ["Python", "Pandas", "Streamlit"],
    url: "https://github.com/rafatafon/Resume-Keyword-Matcher",
  },
];

// Roles and dates verified against Fredy's LinkedIn profile on October 18, 2026.
export const experience = [
  {
    company: "Archimedes Systems",
    role: "Founder & CEO",
    period: "Jan 2026 — Present",
    context: "Full-time · Comayagua, Honduras · Remote",
    detail:
      "Founded an AI and software consulting firm serving international clients. Lead client acquisition, technical architecture, implementation, testing, and deployment. Build automation workflows, AI pipelines, and production platforms with Next.js, TypeScript, FastAPI, and Supabase.",
  },
  {
    company: "Próspera",
    role: "Full Stack Engineer",
    period: "Aug 2026 — Oct 2026",
    context: "Full-time · Roatán, Honduras · On-site",
    detail:
      "Owned the design, development, deployment, and operational reliability of business-critical applications and internal platforms. Built full-stack features, APIs, integrations, dashboards, and automation. Managed cloud infrastructure and Cloudflare, administered Google Workspace, Microsoft 365, and GitHub, and supported production incidents and runbooks.",
  },
  {
    company: "MES, Inc.",
    role: "Multiuse Learning Facility Coordinator – Computer Lab & Technology Support",
    period: "Jan 2026 — Jul 2026",
    context: "Part-time · Comayagua, Honduras · On-site",
    detail:
      "Coordinated computer labs, classrooms, and digital learning environments. Managed scheduling, access, and utilization tracking; provided technical support and preventive maintenance; supported learning platforms; and reported on equipment performance, system availability, and security compliance.",
  },
  {
    company: "Aero Cielo",
    role: "Software Engineer & Branch Manager",
    period: "Aug 2025 — Jul 2026",
    context: "Part-time · Comayagua, Honduras · Remote",
    detail:
      "Led the company's digital transformation and regional branch operations. Built its official website and React Native mobile application as the sole engineer, integrated AI into internal logistics, and managed sales strategy and regional growth.",
  },
  {
    company: "XRF",
    role: "Intern Computer Vision using Generative AI",
    period: "Aug 2024 — Feb 2025",
    context: "Full-time · Las Palmas de Gran Canaria, Spain · Remote",
    detail:
      "Developed multilingual text and speech solutions across 10+ languages, improving system accuracy by 15%. Contributed to scalable pipelines and AWS deployments that improved performance by 30%, working with large language models, computer vision, and Python in a production engineering team.",
  },
];

export const skills = [
  "TypeScript",
  "React",
  "Next.js",
  "Python",
  "FastAPI",
  "Node.js",
  "PostgreSQL",
  "AWS",
  "AI & automation",
  "System design",
];

export type FolderId =
  | "about"
  | "projects"
  | "experience"
  | "writing"
  | "contact";
export const folders: {
  id: FolderId;
  name: string;
  file: string;
  kind: "folder" | "document" | "contact";
}[] = [
  { id: "about", name: "About me", file: "About me.txt", kind: "document" },
  { id: "projects", name: "Projects", file: "Selected work", kind: "folder" },
  { id: "experience", name: "Experience", file: "Experience", kind: "folder" },
  { id: "writing", name: "Writing", file: "Thoughts & notes", kind: "folder" },
  { id: "contact", name: "Contact", file: "Say hello", kind: "contact" },
];
