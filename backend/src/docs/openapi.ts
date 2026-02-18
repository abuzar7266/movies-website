import { z } from "zod";
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registerBody, loginBody } from "../dtos/auth.js";
import { createMovieBody, updateMovieBody, movieIdParam, posterBody } from "../dtos/movies.js";
import { updateUserBody, avatarBody } from "../dtos/users.js";
import { createReviewBody, updateReviewBody, reviewIdParam } from "../dtos/reviews.js";
import { upsertRatingBody, ratingMovieIdParam } from "../dtos/ratings.js";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "access_token"
});

const Success = registry.register(
  "Success",
  z.object({ success: z.literal(true) })
);
const ErrorResponse = registry.register(
  "ErrorResponse",
  z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) })
);

const User = registry.register(
  "User",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.string(),
    avatarMediaId: z.string().uuid().nullable().optional()
  })
);

const Movie = registry.register(
  "Movie",
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    releaseDate: z.string().datetime(),
    trailerUrl: z.string().optional(),
    synopsis: z.string(),
    createdAt: z.string().datetime(),
    averageRating: z.number(),
    reviewCount: z.number().int(),
    posterMediaId: z.string().uuid().nullable().optional()
  })
);

const Review = registry.register(
  "Review",
  z.object({
    id: z.string().uuid(),
    movieId: z.string().uuid(),
    userId: z.string().uuid(),
    content: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

const PaginatedMovies = registry.register(
  "PaginatedMovies",
  z.object({
    items: z.array(Movie),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int()
  })
);

const envelope = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ success: z.literal(true), data: schema });

const listMoviesQuery = z.object({
  q: z.string().optional(),
  minStars: z.coerce.number().int().min(0).max(5).optional(),
  reviewScope: z.enum(["all", "mine", "not_mine"]).optional(),
  sort: z.enum(["reviews_desc", "rating_desc", "release_desc", "release_asc", "uploaded_desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

// Auth
registry.registerPath({
  method: "post",
  path: "/auth/register",
  summary: "Register",
  request: { body: { content: { "application/json": { schema: registerBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(User) } } },
    409: { description: "User exists", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  summary: "Login",
  request: { body: { content: { "application/json": { schema: loginBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: Success } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  summary: "Logout",
  security: [{ cookieAuth: [] }],
  responses: { 200: { description: "OK", content: { "application/json": { schema: Success } } } }
});

// Users
registry.registerPath({
  method: "get",
  path: "/users/me",
  summary: "Current user",
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(User) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "patch",
  path: "/users/me",
  summary: "Update current user",
  security: [{ cookieAuth: [] }],
  request: { body: { content: { "application/json": { schema: updateUserBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(User) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "patch",
  path: "/users/me/avatar",
  summary: "Set or unset avatar",
  security: [{ cookieAuth: [] }],
  request: { body: { content: { "application/json": { schema: avatarBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(User) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Media not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

// Movies
registry.registerPath({
  method: "get",
  path: "/movies",
  summary: "List movies",
  request: { query: listMoviesQuery },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(PaginatedMovies) } } }
  }
});

registry.registerPath({
  method: "post",
  path: "/movies",
  summary: "Create movie",
  security: [{ cookieAuth: [] }],
  request: { body: { content: { "application/json": { schema: createMovieBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(Movie) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    409: { description: "Title exists", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/movies/suggest",
  summary: "Suggest titles",
  request: { query: z.object({ q: z.string() }) },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(z.object({ id: z.string().uuid(), title: z.string(), posterMediaId: z.string().uuid().nullable().optional() }))
          })
        }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/movies/{id}",
  summary: "Get movie",
  request: { params: movieIdParam },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(Movie) } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "patch",
  path: "/movies/{id}",
  summary: "Update movie",
  security: [{ cookieAuth: [] }],
  request: { params: movieIdParam, body: { content: { "application/json": { schema: updateMovieBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(Movie) } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "delete",
  path: "/movies/{id}",
  summary: "Delete movie",
  security: [{ cookieAuth: [] }],
  request: { params: movieIdParam },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: Success } } },
    403: { description: "Forbidden", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "patch",
  path: "/movies/{id}/poster",
  summary: "Set poster",
  security: [{ cookieAuth: [] }],
  request: { params: movieIdParam, body: { content: { "application/json": { schema: posterBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: Success } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

// Reviews
registry.registerPath({
  method: "get",
  path: "/reviews",
  summary: "List reviews by movie",
  request: { query: z.object({ movieId: z.string().uuid(), page: z.coerce.number().int().optional(), pageSize: z.coerce.number().int().optional() }) },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: envelope(
            z.object({
              items: z.array(Review),
              total: z.number().int(),
              page: z.number().int(),
              pageSize: z.number().int()
            })
          )
        }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/reviews",
  summary: "Create review",
  security: [{ cookieAuth: [] }],
  request: { body: { content: { "application/json": { schema: createReviewBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(Review) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Movie not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "patch",
  path: "/reviews/{id}",
  summary: "Update review",
  security: [{ cookieAuth: [] }],
  request: { params: reviewIdParam, body: { content: { "application/json": { schema: updateReviewBody } }, required: true } },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(Review) } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "delete",
  path: "/reviews/{id}",
  summary: "Delete review",
  security: [{ cookieAuth: [] }],
  request: { params: reviewIdParam },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: Success } } },
    404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

// Ratings
registry.registerPath({
  method: "post",
  path: "/ratings",
  summary: "Upsert rating",
  security: [{ cookieAuth: [] }],
  request: { body: { content: { "application/json": { schema: upsertRatingBody } }, required: true } },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: envelope(z.object({ averageRating: z.number() }))
        }
      }
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
    404: { description: "Movie not found", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/ratings/{movieId}",
  summary: "Get current user's rating for movie",
  security: [{ cookieAuth: [] }],
  request: { params: ratingMovieIdParam },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(z.object({ value: z.number().nullable() })) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } }
  }
});

// Media
registry.registerPath({
  method: "post",
  path: "/media",
  summary: "Upload media",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({ file: z.any() })
        }
      },
      required: true
    }
  },
  responses: {
    200: { description: "OK", content: { "application/json": { schema: envelope(z.object({ id: z.string().uuid() })) } } },
    401: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } }
  }
});

registry.registerPath({
  method: "get",
  path: "/media/{id}",
  summary: "Get media",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: "OK" },
    304: { description: "Not Modified" },
    404: { description: "Not found" }
  }
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openapi = generator.generateDocument({
  openapi: "3.0.3",
  info: { title: "MovieShelf API", version: "1.0.0", description: "API documentation for MovieShelf" },
  servers: [{ url: "/" }]
});

