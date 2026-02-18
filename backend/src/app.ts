import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";
import { notFound, errorHandler } from "./middleware/errors.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import moviesRouter from "./routes/movies.js";
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
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);
if (isDev) {
  app.use((req, res, next) => {
    res.on("finish", () => {
      logger.info({ method: req.method, url: req.originalUrl, statusCode: res.statusCode }, "API");
    });
    next();
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

app.use(notFound);
app.use(errorHandler);

export default app;
