import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Run the original business assertions against the migrated modules without Vite.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    if (!existsSync(fileURLToPath(url)) && existsSync(fileURLToPath(`${url.href}.js`))) {
      return nextResolve(`${url.href}.js`, context);
    }
  }
  return nextResolve(specifier, context);
} });
export async function createServer() {
  return {
    ssrLoadModule: path => import(new URL(`../${path.replace("/src/", "")}`, import.meta.url)),
    close: async () => {},
  };
}
