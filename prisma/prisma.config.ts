import { defineConfig } from "@prisma/client";

export default defineConfig({
  datasource: {
    provider: "postgresql",
    url: "postgresql://user:password@localhost:5432/devdb", // placeholder for dev
  },
});
