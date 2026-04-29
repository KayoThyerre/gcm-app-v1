import { beforeEach, vi } from "vitest";
import { prismaMock } from "./prismaMock";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-jwt-secret";

vi.doMock("../src/prisma/client", () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});
