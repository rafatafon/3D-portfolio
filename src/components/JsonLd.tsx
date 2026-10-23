// Structured data for search engines. The payload is built from the site's
// own static content (never from user input); `<` is escaped the way the
// Next.js JSON-LD guide recommends so the script can never be closed early.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
