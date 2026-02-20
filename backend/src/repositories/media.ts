import { prisma as defaultClient } from "@/db.js";

export function mediaRepo(client: any = defaultClient) {
  return {
    findById(id: string) {
      return client.media.findUnique({ where: { id } });
    }
  };
}
