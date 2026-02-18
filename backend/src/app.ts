import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { redisRateLimit } from "./middleware/redisRateLimit.js";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";
import { notFound, errorHandler } from "./middleware/errors.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import moviesRouter from "./routes/movies.js";
import reviewsRouter from "./routes/reviews.js";
import ratingsRouter from "./routes/ratings.js";
import mediaRouter from "./routes/media.js";
import { authenticate } from "./middleware/auth.js";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(authenticate);
const rlWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const rlLimit = Number(process.env.RATE_LIMIT_LIMIT || 120);
if (process.env.REDIS_URL) {
  app.use(redisRateLimit({ windowMs: rlWindowMs, limit: rlLimit }));
} else {
  app.use(
    rateLimit({
      windowMs: rlWindowMs,
      limit: rlLimit,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
}
if (isDev) {
  app.use((req, res, next) => {
    res.on("finish", () => {
      logger.info({ method: req.method, url: req.originalUrl, statusCode: res.statusCode }, "API");
    });
    next();
  });
}
if (process.env.NODE_ENV === "test") {
  const testLimiter = rateLimit({ windowMs: 60_000, limit: 3, standardHeaders: false, legacyHeaders: false });
  app.get("/test/rl", testLimiter, (_req, res) => {
    res.json({ success: true });
  });
}
app.use(
  pinoHttp({
    logger,
    autoLogging: false,
    redact: ["req.headers.authorization", "req.headers.cookie"]
  })
);

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/movies", moviesRouter);
app.use("/reviews", reviewsRouter);
app.use("/ratings", ratingsRouter);
app.use("/media", mediaRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
