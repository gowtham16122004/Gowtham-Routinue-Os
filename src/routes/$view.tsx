import { createFileRoute, notFound } from "@tanstack/react-router";
import { Page } from "./index";
import { VALID_VIEWS } from "@/lib/os-store";

export const Route = createFileRoute("/$view")({
  beforeLoad: ({ params }) => {
    if (!VALID_VIEWS.has(params.view)) {
      throw notFound();
    }
  },
  component: Page,
});
