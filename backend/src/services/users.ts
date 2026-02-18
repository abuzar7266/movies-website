import { prisma } from "../db.js";
import { HttpError } from "../middleware/errors.js";
import { userPublicSelect } from "../selects.js";

export async function getUserPublic(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: userPublicSelect });
}

export async function updateUserName(userId: string, name: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: userPublicSelect
  });
}

export async function setUserAvatar(userId: string, mediaId: string | null) {
  if (mediaId) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new HttpError(404, "Media not found", "not_found");
    if (media.ownerUserId && media.ownerUserId !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { avatarMediaId: mediaId ?? null },
    select: userPublicSelect
  });
}

