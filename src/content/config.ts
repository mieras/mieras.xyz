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
    linkedin: z.string().optional(),
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

const addressSchema = z.object({
  streetAddress: z.string(),
  addressLocality: z.string(),
  addressRegion: z.string(),
  postalCode: z.string(),
  addressCountry: z.string(),
});

const seo = defineCollection({
  type: 'data',
  schema: z.object({
    person: z.object({
      name: z.string(),
      jobTitle: z.string(),
      gender: z.string().optional(),
      email: z.string(),
      birthDate: z.string().optional(),
      birthPlace: z.string().optional(),
      url: z.string(),
      address: addressSchema,
    }),
    organization: z.object({
      name: z.string(),
      url: z.string(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      sameAs: z.array(z.string()).optional(),
      logo: z.string().optional(),
      description: z.string(),
      email: z.string(),
      hasMap: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      openingHours: z.array(z.string()).optional(),
      address: addressSchema,
    }),
  }),
});

export const collections = {
  footer,
  main,
  marquee,
  seo,
};
