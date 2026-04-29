import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { app } from "../src/app";
import { prismaMock } from "./prismaMock";

type PaginationRoute = {
  label: string;
  path: string;
  maxLimit: number;
  authRole?: Role;
  findManyMock: typeof prismaMock.news.findMany;
  countMock: typeof prismaMock.news.count;
};

function authHeader(role: Role, sub = `${role.toLowerCase()}-1`) {
  const token = jwt.sign({ sub, role }, process.env.JWT_SECRET as string);

  return `Bearer ${token}`;
}

function requestRoute(route: PaginationRoute, query = "") {
  const requestBuilder = request(app).get(`${route.path}${query}`);

  if (route.authRole) {
    requestBuilder.set("Authorization", authHeader(route.authRole));
  }

  return requestBuilder;
}

function mockRouteData(route: PaginationRoute) {
  route.findManyMock.mockResolvedValue([]);
  route.countMock.mockResolvedValue(0);
}

const paginationRoutes: PaginationRoute[] = [
  {
    label: "GET /news",
    path: "/news",
    maxLimit: 50,
    findManyMock: prismaMock.news.findMany,
    countMock: prismaMock.news.count,
  },
  {
    label: "GET /news/admin",
    path: "/news/admin",
    maxLimit: 50,
    authRole: "ADMIN",
    findManyMock: prismaMock.news.findMany,
    countMock: prismaMock.news.count,
  },
  {
    label: "GET /approaches",
    path: "/approaches",
    maxLimit: 25,
    authRole: "USER",
    findManyMock: prismaMock.approach.findMany,
    countMock: prismaMock.approach.count,
  },
  {
    label: "GET /users",
    path: "/users",
    maxLimit: 25,
    authRole: "ADMIN",
    findManyMock: prismaMock.user.findMany,
    countMock: prismaMock.user.count,
  },
  {
    label: "GET /scales/months",
    path: "/scales/months",
    maxLimit: 50,
    authRole: "ADMIN",
    findManyMock: prismaMock.scaleMonth.findMany,
    countMock: prismaMock.scaleMonth.count,
  },
];

describe("pagination", () => {
  it.each(paginationRoutes)("$label aplica defaults e retorna envelope", async (route) => {
    mockRouteData(route);

    const response = await requestRoute(route);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    expect(route.findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      })
    );
  });

  it.each(paginationRoutes)("$label aplica page minimo 1", async (route) => {
    mockRouteData(route);

    const response = await requestRoute(route, "?page=0&limit=10");

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(route.findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
      })
    );
  });

  it.each(paginationRoutes)("$label aplica clamp no limit maximo", async (route) => {
    mockRouteData(route);

    const response = await requestRoute(route, "?page=1&limit=999");

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(route.maxLimit);
    expect(route.findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: route.maxLimit,
      })
    );
  });
});
