import Workspace from "@/components/Workspace";
import JsonLd from "@/components/JsonLd";
import { LocaleProvider } from "@/lib/i18n";
import { personJsonLd, websiteJsonLd } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <h1 className="sr-only">
        Fredy Maldonado — Software engineer based in Honduras
      </h1>
      <JsonLd data={personJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <LocaleProvider>
        <Workspace />
      </LocaleProvider>
      <noscript>
        <div className="noscript">
          <h2>Welcome to my workspace.</h2>
          <p>
            This workspace needs JavaScript. Enable it to explore the desk and
            the desktop.
          </p>
        </div>
      </noscript>
    </>
  );
}
