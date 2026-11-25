// The server's entry point. Compiles first when the sources are newer than the build (a `git pull` alone is then enough),
// and only after that loads the server, so the code that runs is always the code that was pulled.
import { ensureFresh } from './fresh.js';

ensureFresh();
await import('./run.js');
