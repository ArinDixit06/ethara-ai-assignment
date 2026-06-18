export const getPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginatedResponse = <T>(data: T[], total: number, page: number, limit: number) => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
});
