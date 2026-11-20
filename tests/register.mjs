// Lets Node resolve `import 'three'` to the bundled copy in vendor/ (same as the browser import map).
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
