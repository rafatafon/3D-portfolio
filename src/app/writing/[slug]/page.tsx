import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { writing } from "@/lib/writing";
import ArticleBody from "@/components/ArticleBody";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return writing.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = writing.find((item) => item.slug === slug);
  return {
    title: article ? `${article.name} — Fredy Maldonado` : "Note not found",
  };
}

export default async function WritingPage({ params }: Props) {
  const { slug } = await params;
  const article = writing.find((item) => item.slug === slug);
  if (!article) notFound();
  return (
    <main className="readable-portfolio readable-note">
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
