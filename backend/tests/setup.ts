import "dotenv/config";

process.env.NODE_ENV = "test";

process.env.TEST_RUN_ID = process.env.TEST_RUN_ID || `${Date.now()}`;

process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";
