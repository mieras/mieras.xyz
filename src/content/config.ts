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
    address: z.string().optional(),
    instagram: z.string().optional(),
    cvLabel: z.string().optional(),
    clientsTitle: z.string(),
    clientNames: z.array(z.string()),
    skillsTitle: z.string(),
    skills: z.array(z.string()),
    subtitleALabel: z.string().optional(),
    subtitleAText: z.string().optional(),
    contentAbout: z.string().optional(),
    services: z.string().optional(),
  }),
});

const marquee = defineCollection({
  type: 'data',
  schema: z.array(z.object({
    order: z.number(),
    text: z.string(),
    href: z.string().optional(),
    backgroundColor: z.string(),
    textColor: z.string().optional(),
    speed: z.number().optional(),
  })),
});

export const collections = {
  footer,
  main,
  marquee,
};
