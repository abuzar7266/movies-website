declare module "@/db.js" {
  export { prisma } from "../db";
}

declare module "@/redisClient.js" {
  export { getRedisClient, getCacheVersion, bumpCacheVersion } from "../redisClient";
}

declare module "@/selects.js" {
  export { movieSelect, reviewSelect, userPublicSelect } from "../selects";
}

declare module "@/app.js" {
  import app from "../app";
  export default app;
}
