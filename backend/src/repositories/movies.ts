import { prisma as defaultClient } from "@/db.js";
import type { Prisma } from "@generated/prisma/client.js";
import { movieSelect } from "@/selects.js";

export function moviesRepo(client: any = defaultClient) {
  return {
    findUnique(where: Prisma.MovieWhereUniqueInput) {
      return client.movie.findUnique({ where });
    },
    count(args: { where?: Prisma.MovieWhereInput }) {
      return client.movie.count(args);
    },
    findMany(args: {
      where?: Prisma.MovieWhereInput;
      orderBy?: Prisma.MovieOrderByWithRelationInput;
      skip?: number;
      take?: number;
    }) {
      return client.movie.findMany({
        ...args,
        select: movieSelect
      });
    },
    create(data: Prisma.MovieCreateInput) {
      return client.movie.create({ data, select: movieSelect });
    },
    update(where: Prisma.MovieWhereUniqueInput, data: Prisma.MovieUpdateInput) {
      return client.movie.update({ where, data, select: movieSelect });
    },
    remove(where: Prisma.MovieWhereUniqueInput) {
      return client.movie.delete({ where });
    },
    setPoster(where: Prisma.MovieWhereUniqueInput, mediaId: string) {
      return client.movie.update({ where, data: { posterMediaId: mediaId, posterUrl: `/media/${mediaId}` }, select: movieSelect });
    },
    suggest(q: string) {
      return client.movie.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        orderBy: [{ reviewCount: "desc" }, { averageRating: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: { id: true, title: true, posterMediaId: true, posterUrl: true }
      });
    }
  };
}

