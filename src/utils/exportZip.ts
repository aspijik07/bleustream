import JSZip from 'jszip';
import projectFiles from '../data/projectFiles.json';

export async function generateAndDownloadZip(): Promise<void> {
  const zip = new JSZip();

  // Populate all project files (src, public, config, etc.)
  for (const [filePath, content] of Object.entries(projectFiles)) {
    zip.file(filePath, content as string);
  }

  // Ensure Cloudflare Pages essential deployment files are present
  zip.file('public/_redirects', '/*    /index.html   200\n');
  zip.file('public/_headers', `/*
  Access-Control-Allow-Origin: *

/index.html
  Cache-Control: no-cache, no-store, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);

  // Include detailed Cloudflare README instructions
  zip.file('CLOUDFLARE_DEPLOY.md', `# 🚀 Deploying BleuStream on Cloudflare Pages

This project is 100% configured for Cloudflare Pages with zero extra setup.

## Option 1: Direct Upload (Drag & Drop)
1. Run \`npm install && npm run build\` on your machine.
2. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Upload assets**.
3. Drag and drop the generated \`dist\` folder.
4. Your streaming site is live globally across Cloudflare's 330+ data centers!

## Option 2: Git Repository (Automatic CI/CD)
1. Push this folder to your GitHub / GitLab repository.
2. Connect your repository in **Cloudflare Pages**.
3. Settings:
   - **Framework Preset**: \`Vite\`
   - **Build Command**: \`npm run build\`
   - **Build Output Directory**: \`dist\`
   - **Node.js Version**: 18 or 20+

Everything (including SPA routing via \`_redirects\` and fast caching via \`_headers\`) is pre-configured.
`);

  // Generate ZIP in browser memory
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Trigger native browser download directly from memory (no 404 possible)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bleustream-cloudflare.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
