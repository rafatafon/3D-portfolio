import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { writing } from "@/lib/writing";
import { articleJsonLd, excerpt, siteName, xHandle } from "@/lib/seo";
import ArticleBody from "@/components/ArticleBody";
import JsonLd from "@/components/JsonLd";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return writing.map(({ slug }) => ({ slug }));
}

// The share image comes from the root layout's opengraph-image.tsx; a
// segment's own openGraph object replaces the parent's, so the images are
// carried over explicitly.
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const article = writing.find((item) => item.slug === slug);
  if (!article) return { title: "Note not found" };
  const description = excerpt(article);
  const url = `/writing/${article.slug}`;
  const images = (await parent).openGraph?.images ?? [];
  return {
    title: article.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName,
      locale: "en_US",
      title: article.name,
      description,
      publishedTime: article.isoDate,
      authors: ["Fredy Maldonado"],
      images,
    },
    twitter: {
      card: "summary_large_image",
      creator: xHandle,
      title: article.name,
      description,
    },
  };
}

export default async function WritingPage({ params }: Props) {
  const { slug } = await params;
  const article = writing.find((item) => item.slug === slug);
  if (!article) notFound();
  return (
    <main className="readable-portfolio readable-note">
      <JsonLd data={articleJsonLd(article)} />
      <nav>
        <Link className="wordmark" href="/">
          fm.
        </Link>
        <Link href="/">← Back to the workspace</Link>
      </nav>
      <article>
        <header className="note-header">
          <p className="document-eyebrow">
            <time dateTime={article.isoDate}>{article.date}</time> ·{" "}
            {article.minutes} min read
          </p>
          <h1>{article.name}</h1>
          <p className="note-byline">By Fredy Maldonado</p>
        </header>
        <ArticleBody body={article.body} />
      </article>
      <footer>
        <Link href="/">← Back to the workspace</Link>
      </footer>
    </main>
  );
}
