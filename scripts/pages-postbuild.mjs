// GitHub Pages has no server rewrites: serve the SPA shell for every unknown path,
// and disable Jekyll so folders starting with "_" are published.
import { copyFileSync, existsSync, writeFileSync } from "node:fs";

const dir = "dist/client";
const shell = existsSync(`${dir}/_shell.html`) ? `${dir}/_shell.html` : `${dir}/index.html`;
if (!existsSync(`${dir}/index.html`)) copyFileSync(shell, `${dir}/index.html`);
copyFileSync(shell, `${dir}/404.html`);
writeFileSync(`${dir}/.nojekyll`, "");
console.log("pages: wrote 404.html and .nojekyll from", shell);
