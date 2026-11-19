import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig, type Plugin} from 'vite';

function normalizeBasePath(rawBase: string): string {
  const trimmed = rawBase.trim();
  if (!trimmed || trimmed === '/') return '/';
  if (trimmed === '.' || trimmed === './') return './';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

function resolveProductionBase(): string {
  const envBase = process.env.VITE_BASE_PATH;
  if (envBase && envBase.trim().length > 0) {
    return normalizeBasePath(envBase);
  }

  const ghRepo = process.env.GITHUB_REPOSITORY;
  if (ghRepo && ghRepo.includes('/')) {
    const [, repoName] = ghRepo.split('/');
    if (repoName) {
      return repoName.endsWith('.github.io') ? '/' : `/${repoName}/`;
    }
  }

  return './';
}

function githubPagesSpaFallbackPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'saaed-github-pages-fallback',
    apply: 'build',
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir);
    },
    closeBundle() {
      const indexFile = path.join(outDir, 'index.html');
      const fallbackFile = path.join(outDir, '404.html');
      const nojekyllFile = path.join(outDir, '.nojekyll');

      if (fs.existsSync(indexFile)) {
        fs.copyFileSync(indexFile, fallbackFile);
      }
      if (!fs.existsSync(nojekyllFile)) {
        fs.writeFileSync(nojekyllFile, '', 'utf8');
      }
    },
  };
}

export default defineConfig(({command}) => {
  return {
    base: command === 'build' ? resolveProductionBase() : '/',
    plugins: [react(), tailwindcss(), githubPagesSpaFallbackPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1100,
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('motion')) return 'vendor-motion';
            if (id.includes('react-dom') || id.includes(`${path.sep}react${path.sep}`) || id.includes('/react/')) {
              return 'vendor-react';
            }
            return 'vendor-shared';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
