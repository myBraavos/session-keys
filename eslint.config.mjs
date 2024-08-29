import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/node_modules", "**/dist"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
    rules: {
        "vue/attributes-order": "off",
        "no-prototype-builtins": "off",
        "import/no-default-export": "off",
        "no-use-before-define": [
            "error",
            { functions: false, classes: true, variables: false },
        ],
        "@typescript-eslint/no-use-before-define": [
            "error",
            { functions: false, classes: true, variables: false, typedefs: true },
        ],
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/explicit-function-return-type": [
            "off",
            {
                allowExpressions: true,
                allowHigherOrderFunctions: true,
                allowTypedFunctionExpressions: true,
            },
        ],
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    },
    languageOptions: {
        parser: tsParser,
    },
}];