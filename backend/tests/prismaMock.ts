import { vi } from "vitest";

export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  news: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  approach: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  scaleMonth: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
};
