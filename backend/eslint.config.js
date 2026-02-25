import parser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "src/generated/**", "coverage/**"]
  },
  // TypeScript files
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        ...globals.es2023
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "no-empty": "off",
      "no-useless-escape": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  },
  // JavaScript files (scripts, config, cjs/mjs)
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.node,
        ...globals.es2023
      }
    },
    rules: {
      "no-empty": "off",
      "no-useless-escape": "off"
    }
  }
];
