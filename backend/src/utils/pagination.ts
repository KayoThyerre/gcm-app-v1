type QueryValue = string | string[] | undefined;

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit: number;
};

function getSingleQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: QueryValue) {
  const singleValue = getSingleQueryValue(value);

  if (!singleValue) {
    return null;
  }

  const parsedValue = Number.parseInt(singleValue, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function getPagination(
  query: { page?: QueryValue; limit?: QueryValue },
  options: PaginationOptions
) {
  const defaultLimit = options.defaultLimit ?? 10;
  const page = parsePositiveInteger(query.page) ?? 1;
  const requestedLimit = parsePositiveInteger(query.limit) ?? defaultLimit;
  const limit = Math.min(requestedLimit, options.maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}
