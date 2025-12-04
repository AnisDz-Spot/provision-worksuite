module.exports = {
  schema: "./prisma/schema.prisma",
  datasource: {
    provider: "postgresql",
    url: process.env.DATABASE_URL,
  },
  generator: {
    provider: "prisma-client-js",
  },
};
