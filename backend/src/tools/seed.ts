import "dotenv/config";
import { prisma } from "../db.js";
import argon2 from "argon2";

async function main() {
  const basePwd = process.env.SEED_USER_PASSWORD || "demo1234";
  const runId = process.env.SEED_RUN_ID || `${Date.now()}`;
  const usersData = Array.from({ length: 5 }).map((_, i) => ({
    email: `demo+user${i + 1}@example.com`,
    name: `Demo User ${i + 1}`
  }));
  const passwordHash = await argon2.hash(basePwd);
  const users = await Promise.all(
    usersData.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { email: u.email, name: u.name, passwordHash }
      })
    )
  );
  const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]);
  const posters = await Promise.all(
    Array.from({ length: 30 }).map(() =>
      prisma.media.create({
        data: { contentType: "image/png", size: buf.length, data: buf }
      })
    )
  );
  const titles: { title: string; synopsis: string; trailerUrl: string }[] = [
    { title: "The Iron Code", synopsis: "A team hunts a rogue algorithm.", trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { title: "Neon Skies", synopsis: "Pilots race above a cyberpunk city.", trailerUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" },
    { title: "Quantum Echo", synopsis: "Scientists chase repeating signals.", trailerUrl: "https://www.youtube.com/watch?v=2Vv-BfVoq4g" },
    { title: "Silent Harbor", synopsis: "A mystery unravels in a coastal town.", trailerUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0" },
    { title: "Lunar Market", synopsis: "Smugglers clash on a moon outpost.", trailerUrl: "https://www.youtube.com/watch?v=ftZAZQ3k5V0" },
    { title: "Glass Garden", synopsis: "Botanists protect a living archive.", trailerUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ" },
    { title: "Afterlight", synopsis: "Survivors navigate a dimmed world.", trailerUrl: "https://www.youtube.com/watch?v=04854XqcfCY" },
    { title: "Digital Nomads", synopsis: "Hackers on the run find a cause.", trailerUrl: "https://www.youtube.com/watch?v=Zi_XLOBDo_Y" },
    { title: "Parallel Lines", synopsis: "Two lives cross different realities.", trailerUrl: "https://www.youtube.com/watch?v=kXYiU_JCYtU" },
    { title: "City of Brass", synopsis: "Archaeologists awaken a legend.", trailerUrl: "https://www.youtube.com/watch?v=ktvTqknDobU" },
    { title: "Starfall Fleet", synopsis: "Cadets face their first war.", trailerUrl: "https://www.youtube.com/watch?v=FkzRyHa2r6w" },
    { title: "Velvet Circuit", synopsis: "An underground racer seeks freedom.", trailerUrl: "https://www.youtube.com/watch?v=fLexgOxsZu0" },
    { title: "Echoes of Clay", synopsis: "An artist rebuilds a fractured city.", trailerUrl: "https://www.youtube.com/watch?v=YQHsXMglC9A" },
    { title: "Clockwork Sea", synopsis: "Sailors chart mechanical waters.", trailerUrl: "https://www.youtube.com/watch?v=LRP8d7hhpoQ" },
    { title: "Firefly Station", synopsis: "A crew uncovers a conspiracy.", trailerUrl: "https://www.youtube.com/watch?v=CGyEd0aKWZE" },
    { title: "Mirage Run", synopsis: "Smugglers race across shifting dunes.", trailerUrl: "https://www.youtube.com/watch?v=VbfpW0pbvaU" },
    { title: "Paper Wings", synopsis: "Dreamers attempt human flight.", trailerUrl: "https://www.youtube.com/watch?v=ktvTqknDobU" },
    { title: "Crimson Orchard", synopsis: "Secrets linger among autumn trees.", trailerUrl: "https://www.youtube.com/watch?v=hT_nvWreIhg" },
    { title: "Sable Horizon", synopsis: "Explorers cross a living desert.", trailerUrl: "https://www.youtube.com/watch?v=QK8mJJJvaes" },
    { title: "Azure Divide", synopsis: "Divers find a lost civilization.", trailerUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ" },
    { title: "Gossamer Thread", synopsis: "A detective follows invisible clues.", trailerUrl: "https://www.youtube.com/watch?v=uelHwf8o7_U" },
    { title: "Ivory Tower", synopsis: "Scholars clash over forbidden tech.", trailerUrl: "https://www.youtube.com/watch?v=NUsoVlDFqZg" },
    { title: "Broken Constellations", synopsis: "Astronomers decode a star map.", trailerUrl: "https://www.youtube.com/watch?v=pRpeEdMmmQ0" },
    { title: "Wild Circuitry", synopsis: "A coder retreats into the forest.", trailerUrl: "https://www.youtube.com/watch?v=YQHsXMglC9A" },
    { title: "Halcyon Drift", synopsis: "Two drifters chase a mythic island.", trailerUrl: "https://www.youtube.com/watch?v=OPf0YbXqDm0" },
    { title: "Northern Sparks", synopsis: "A town rallies under polar lights.", trailerUrl: "https://www.youtube.com/watch?v=IdneKLhsWOQ" },
    { title: "Sapphire Key", synopsis: "A heist targets a royal vault.", trailerUrl: "https://www.youtube.com/watch?v=RubBzkZzpUA" },
    { title: "Whisper Grid", synopsis: "Signals leak from a silent network.", trailerUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8" },
    { title: "Tide of Cinders", synopsis: "Miners face a planet on fire.", trailerUrl: "https://www.youtube.com/watch?v=2Vv-BfVoq4g" },
    { title: "Gilded Null", synopsis: "A city’s elite vanish overnight.", trailerUrl: "https://www.youtube.com/watch?v=papuvlVeZg8" }
  ];
  const movieCreators = users.map((u) => u.id);
  const movies = [];
  for (let i = 0; i < 30; i++) {
    const t = titles[i % titles.length];
    const creator = movieCreators[i % movieCreators.length];
    const poster = posters[i];
    const movie = await prisma.movie.create({
      data: {
        title: `${t.title} #${i + 1} (${runId})`,
        releaseDate: new Date(2000 + (i % 20), (i % 12), (i % 28) + 1),
        posterMediaId: poster.id,
        trailerUrl: t.trailerUrl,
        synopsis: t.synopsis,
        createdBy: creator
      }
    });
    movies.push(movie);
  }
  for (const movie of movies) {
    const reviewers = users.slice(0, Math.max(2, Math.floor(Math.random() * users.length)));
    for (const u of reviewers) {
      await prisma.review.create({
        data: {
          movieId: movie.id,
          userId: u.id,
          content: `Review by ${u.name} on ${movie.title}`
        }
      });
    }
    const raters = users.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const values: number[] = [];
    for (const u of raters) {
      const val = 1 + Math.floor(Math.random() * 5);
      values.push(val);
      await prisma.rating.create({
        data: {
          movieId: movie.id,
          userId: u.id,
          value: val
        }
      });
    }
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const count = await prisma.review.count({ where: { movieId: movie.id } });
    await prisma.movie.update({
      where: { id: movie.id },
      data: { averageRating: Number(avg.toFixed(2)), reviewCount: count }
    });
  }
  console.log(`Seeded ${users.length} users and ${movies.length} movies`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
