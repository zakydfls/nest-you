export class Helper {
  static generatePagination(page: number, limit: number, total: number) {
    return {
      page,
      limit,
      totalData: total,
      totalPage: Math.ceil(total / limit),
    };
  }
}
