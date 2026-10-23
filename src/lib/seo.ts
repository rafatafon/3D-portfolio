import { profile } from "./content";
import { writing, type WritingArticle, type WritingNode } from "./writing";

// Everything search engines and link previews read, in one place: the
// canonical origin, the site-wide titles, snippet text for the essays, and
// the structured data (schema.org JSON-LD) for the person and the articles.
export const siteUrl = "https://fredymaldonado.com";
export const siteName = profile.name;
export const siteTitle = "Fredy Maldonado — Welcome to my workspace";
export const siteDescription =
  "Step inside my workspace. I'm Fredy Maldonado, a software engineer based in Honduras, building thoughtful web applications, AI systems, and automation.";
export const shareDescription =
  "Software, ideas, and a space for good work. Explore my interactive workspace.";
export const xHandle = "@rafatafon";

function text(node: WritingNode): string {
  return typeof node === "string" ? node : node.children.map(text).join("");
}

// The first paragraph of an essay, cut at a word to search-snippet length.
export function excerpt(article: WritingArticle, max = 155): string {
  const paragraph = article.body.find(
    (node) => typeof node !== "string" && node.tag === "p",
  );
  const full = paragraph ? text(paragraph).replace(/\s+/g, " ").trim() : "";
  if (full.length <= max) return full;
  const cut = full.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function articleUrl(article: WritingArticle) {
  return `${siteUrl}/writing/${article.slug}`;
}

export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: siteUrl,
  image: `${siteUrl}/images/fredy-portrait.png`,
  jobTitle: profile.role.en,
  description: profile.bio.en,
  address: { "@type": "PostalAddress", addressCountry: "HN" },
  sameAs: [profile.github, profile.linkedin, profile.x],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  author: { "@type": "Person", name: profile.name, url: siteUrl },
};

export function articleJsonLd(article: WritingArticle) {
  const url = articleUrl(article);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.name,
    description: excerpt(article),
    datePublished: article.isoDate,
    dateModified: article.isoDate,
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    author: { "@type": "Person", name: profile.name, url: siteUrl },
    publisher: { "@type": "Person", name: profile.name, url: siteUrl },
    isPartOf: { "@type": "WebSite", name: siteName, url: siteUrl },
  };
}

// The essays, newest first, for the sitemap.
export const essays = [...writing].sort((a, b) =>
  b.isoDate.localeCompare(a.isoDate),
);
