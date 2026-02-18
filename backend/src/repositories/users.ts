import { prisma as defaultClient } from "../db.js";
import { userPublicSelect } from "../selects.js";

export function usersRepo(client: any = defaultClient) {
  return {
    findPublicById(id: string) {
      return client.user.findUnique({ where: { id }, select: userPublicSelect });
    },
    updateName(id: string, name: string) {
      return client.user.update({ where: { id }, data: { name }, select: userPublicSelect });
    },
    updateAvatar(id: string, mediaId: string | null) {
      return client.user.update({ where: { id }, data: { avatarMediaId: mediaId ?? null }, select: userPublicSelect });
    }
  };
}
