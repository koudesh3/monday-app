import * as esbuild from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('dist/client/assets', { recursive: true });

await esbuild.build({
    entryPoints: ['src/client/index.tsx'],
    bundle: true,
    outfile: 'dist/client/assets/bundle.js',
    platform: 'browser',
    jsx: 'automatic',
});

writeFileSync(
    'dist/client/index.html',
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Candle Manager</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/bundle.css">
</head>
<body>
  <div id="root"></div>
  <script src="/assets/bundle.js"></script>
</body>
</html>
`
);

console.log('Client build complete.');
