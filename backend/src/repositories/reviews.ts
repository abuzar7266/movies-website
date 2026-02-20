import { prisma as defaultClient } from "@/db.js";
import { reviewSelect } from "@/selects.js";

export function reviewsRepo(client: any = defaultClient) {
  return {
    countByMovie(movieId: string) {
      return client.review.count({ where: { movieId } });
    },
    findManyByMovie(movieId: string, skip: number, take: number) {
      return client.review.findMany({
        where: { movieId },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: reviewSelect
      });
    },
    updateContentIfOwned(id: string, userId: string, content: string) {
      return client.review.updateMany({ where: { id, userId }, data: { content } });
    },
    findById(id: string) {
      return client.review.findUnique({ where: { id }, select: reviewSelect });
    }
  };
}
