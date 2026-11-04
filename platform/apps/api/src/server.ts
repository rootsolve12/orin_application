import { createApp } from "./app.ts";
import { postgres } from "./db.ts";
const pool = postgres();
const port = Number(process.env.PORT || 4100);
const server = createApp(pool, { webOrigin: process.env.WEB_ORIGIN }).listen(
  port,
  () => console.log(`Orin API listening on ${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(() => {
      void pool.end();
    });
  });
