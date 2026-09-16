/// <reference path="../.astro/types.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    runtime: Runtime;
  }
}

interface Env {
  DB: import('@cloudflare/workers-types').D1Database;
  R2: import('@cloudflare/workers-types').R2Bucket;
  R2_PUBLIC_URL?: string;
}
