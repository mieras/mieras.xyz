import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const footer = defineCollection({
  type: 'content',
});

const main = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    contact: z.string(),
    clientsTitle: z.string(),
    clientNames: z.array(z.string()),
    skillsTitle: z.string(),
    skills: z.array(z.string()),
  }),
});

export const collections = {
  footer,
  main,
};
