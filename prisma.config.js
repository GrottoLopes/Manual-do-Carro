import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: {
    datasource: {
      url: process.env.DATABASE_URL,
    },
  },
});