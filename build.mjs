import * as esbuild from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';

await esbuild.build({
  entryPoints: ['client/index.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'browser',
  jsx: 'automatic',
});

mkdirSync('dist', { recursive: true });

writeFileSync(
  'dist/index.html',
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Candle Gift Box</title>
</head>
<body>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
</html>
`
);

console.log('Client build complete.');
