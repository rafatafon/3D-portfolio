import Workspace from "@/components/Workspace";

export default function Home() {
  return (
    <>
      <h1 className="sr-only">
        Fredy Maldonado — Software engineer based in Honduras
      </h1>
      <Workspace />
      <noscript>
        <div className="noscript">
          <h2>Welcome to my workspace.</h2>
          <p>
            Explore my projects, experience, and contact information in the{" "}
            <a href="/portfolio">readable portfolio</a>.
          </p>
        </div>
      </noscript>
    </>
  );
}
