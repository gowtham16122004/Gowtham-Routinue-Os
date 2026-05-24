import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "A simple hello world website." },
    ],
  }),
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Greetings
        </p>
        <h1 className="mt-4 text-6xl font-bold tracking-tight text-foreground sm:text-8xl">
          Hello, World.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Welcome to your new website.
        </p>
      </div>
    </main>
  );
}
