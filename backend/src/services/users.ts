import { HttpError } from "../middleware/errors.js";
import { usersRepo } from "../repositories/users.js";
import { mediaRepo } from "../repositories/media.js";

export async function getUserPublic(userId: string) {
  const Users = usersRepo();
  return Users.findPublicById(userId);
}

export async function updateUserName(userId: string, name: string) {
  const Users = usersRepo();
  return Users.updateName(userId, name);
}

export async function setUserAvatar(userId: string, mediaId: string | null) {
  const Users = usersRepo();
  const Media = mediaRepo();
  if (mediaId) {
    const media = await Media.findById(mediaId);
    if (!media) throw new HttpError(404, "Media not found", "not_found");
    if (media.ownerUserId && media.ownerUserId !== userId) throw new HttpError(403, "Forbidden", "forbidden");
  }
  return Users.updateAvatar(userId, mediaId);
}
