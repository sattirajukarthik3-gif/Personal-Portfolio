import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    company: z.string(),
    dates: z.string(),
    category: z.string(),
    summary: z.string(),
    impact: z.array(z.string()),
    order: z.number(),
  }),
});

export const collections = { projects };
