export const profile = {
  name: "Fredy Maldonado",
  role: "Software engineer",
  location: "Honduras",
  email: "rafaelmaldonadowork@gmail.com",
  github: "https://github.com/rafatafon",
  linkedin: "https://www.linkedin.com/in/fredy-rafael-maldonado",
  cv: "https://framerusercontent.com/assets/cAKwsE62CI2ZohnHGUJV9tX2r8.pdf",
  introduction: "I build useful things with software.",
  bio: "I'm a software engineer based in Honduras, working across AI-powered systems, automation, and modern web applications. I enjoy turning complicated problems into clear, practical tools people can rely on.",
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

export const experience = [
  {
    company: "Archimedes Systems",
    role: "Founder & Software Engineer",
    period: "2025 — Present",
    detail:
      "Building an AI and software consulting initiative focused on automation, intelligent systems, and modern web solutions. Leading projects from architecture through implementation and deployment.",
  },
  {
    company: "MES Inc.",
    role: "Technology Support & Learning Facility Coordinator",
    period: "2026 — Present",
    detail:
      "Coordinating a technology-enabled learning facility, supporting computer labs and classroom systems, and improving scheduling and daily operations through automated systems.",
  },
  {
    company: "AeroCielo",
    role: "Software Engineer & Branch Manager",
    period: "2025",
    detail:
      "Developed the company's website and mobile application, integrated AI-powered tools into logistics, and supported customer experience and business operations.",
  },
  {
    company: "XRF",
    role: "Generative AI Intern",
    period: "2024 — 2025",
    detail:
      "Contributed to multilingual text and speech pipelines, large language model applications, and scalable cloud-based deployments in a collaborative engineering team.",
  },
];

export const writing = [
  {
    name: "Claude Code Changed How I Build Software",
    date: "March 23, 2026",
    url: "https://fredymaldonado.com/blog/claude-code-changed-how-i-build-software",
  },
  {
    name: "What I Actually Learned Studying Software Engineering in Germany",
    date: "January 12, 2026",
    url: "https://fredymaldonado.com/blog/what-i-actually-learned-studying-software-engineering-in-germany",
  },
  {
    name: "How I Actually Use AI in Real Projects (Without the Hype)",
    date: "January 12, 2026",
    url: "https://fredymaldonado.com/blog/how-i-actually-use-ai-in-real-projects-(without-the-hype)",
  },
  {
    name: "Why I Built Archimedes Systems",
    date: "January 12, 2026",
    url: "https://fredymaldonado.com/blog/why-i-built-archimedes-systems",
  },
];

export const skills = [
  "TypeScript",
  "React",
  "Next.js",
  "Python",
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
