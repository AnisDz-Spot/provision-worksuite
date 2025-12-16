import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/app/generated/**",
      "**/scripts/**",
      "**/node_modules/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Relax TypeScript 'any' rule for self-hosted internal project
      // TypeScript still provides type inference and checking
      // Can be tightened later if needed
      "@typescript-eslint/no-explicit-any": "warn",

      // Keep other important rules strict
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
