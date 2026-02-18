export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "MovieShelf API",
    version: "1.0.0",
    description: "API documentation for MovieShelf"
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "access_token" }
    },
    schemas: {
      Success: {
        type: "object",
        properties: { success: { type: "boolean", example: true } }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: { code: { type: "string" }, message: { type: "string" } },
            required: ["code", "message"]
          }
        }
      },
      Movie: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          releaseDate: { type: "string", format: "date-time" },
          trailerUrl: { type: "string" },
          synopsis: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          averageRating: { type: "number" },
          reviewCount: { type: "integer" },
          posterMediaId: { type: "string", nullable: true }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string" },
          avatarMediaId: { type: "string", nullable: true }
        }
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          movieId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          content: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, email: { type: "string" }, password: { type: "string" } },
                required: ["name", "email", "password"]
              }
            }
          }
        },
        responses: { "200": { description: "OK" }, "409": { description: "User exists" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } }
        },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    },
    "/auth/logout": {
      post: {
        summary: "Logout",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/users/me": {
      get: {
        summary: "Current user",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/User" } } } } } },
          "401": { description: "Unauthorized" }
        }
      },
      patch: {
        summary: "Update current user",
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    },
    "/users/me/avatar": {
      patch: {
        summary: "Set or unset avatar",
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { mediaId: { type: "string", format: "uuid", nullable: true } }, required: ["mediaId"] } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" }, "404": { description: "Media not found" } }
      }
    },
    "/movies": {
      get: {
        summary: "List movies",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "minStars", in: "query", schema: { type: "integer", minimum: 0, maximum: 5 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["reviews_desc", "rating_desc", "release_desc", "release_asc", "uploaded_desc"] } },
          { name: "reviewScope", in: "query", schema: { type: "string", enum: ["all", "mine", "not_mine"] } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }
        ],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { items: { type: "array", items: { $ref: "#/components/schemas/Movie" } }, total: { type: "integer" }, page: { type: "integer" }, pageSize: { type: "integer" } } } } } } }
          }
        }
      },
      post: {
        summary: "Create movie",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { title: { type: "string" }, releaseDate: { type: "string", format: "date-time" }, trailerUrl: { type: "string" }, synopsis: { type: "string" } },
                required: ["title", "releaseDate", "synopsis"]
              }
            }
          }
        },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" }, "409": { description: "Title exists" } }
      }
    },
    "/movies/suggest": {
      get: {
        summary: "Suggest titles",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/movies/{id}": {
      get: {
        summary: "Get movie",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
      },
      patch: {
        summary: "Update movie",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "OK" }, "403": { description: "Forbidden" }, "404": { description: "Not found" } }
      },
      delete: {
        summary: "Delete movie",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "OK" }, "403": { description: "Forbidden" }, "404": { description: "Not found" } }
      }
    },
    "/movies/{id}/poster": {
      patch: {
        summary: "Set poster",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { mediaId: { type: "string", format: "uuid" } }, required: ["mediaId"] } } } },
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
      }
    },
    "/reviews": {
      get: {
        summary: "List reviews by movie",
        parameters: [
          { name: "movieId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } }
        ],
        responses: { "200": { description: "OK" } }
      },
      post: {
        summary: "Create review",
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { movieId: { type: "string", format: "uuid" }, content: { type: "string" } }, required: ["movieId", "content"] } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" }, "404": { description: "Movie not found" } }
      }
    },
    "/reviews/{id}": {
      patch: {
        summary: "Update review",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } } } },
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
      },
      delete: {
        summary: "Delete review",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
      }
    },
    "/ratings": {
      post: {
        summary: "Upsert rating",
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { movieId: { type: "string", format: "uuid" }, value: { type: "integer", minimum: 1, maximum: 5 } }, required: ["movieId", "value"] } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" }, "404": { description: "Movie not found" } }
      }
    },
    "/ratings/{movieId}": {
      get: {
        summary: "Get current user's rating for movie",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "movieId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    },
    "/media": {
      post: {
        summary: "Upload media",
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } }, required: ["file"] } } } },
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    },
    "/media/{id}": {
      get: {
        summary: "Get media",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "OK" }, "304": { description: "Not Modified" }, "404": { description: "Not found" } }
      }
    }
  }
} as const;

