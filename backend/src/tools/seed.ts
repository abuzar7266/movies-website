import "dotenv/config";
import { prisma } from "../db.js";
import argon2 from "argon2";
import { recomputeMovieRanks } from "../services/movies.js";

async function main() {
  const basePwd = process.env.SEED_USER_PASSWORD || "demo1234";
  const runId = process.env.SEED_RUN_ID || `${Date.now()}`;
  await prisma.$transaction(async (tx) => {
    await tx.rating.deleteMany({});
    await tx.review.deleteMany({});
    await tx.movie.deleteMany({});
    await tx.media.deleteMany({});
    await tx.user.deleteMany({});
  });
  const toEmbed = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        const m = u.pathname.match(/\/embed\/([^/?]+)/);
        if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`;
      }
      if (u.hostname === "youtu.be") {
        const id = u.pathname.replace(/^\/+/, "");
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };
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
  const seeds: { title: string; synopsis: string; trailerUrl: string; posterUrl: string; releaseDate: Date }[] = [
    {
      title: "Inception",
      synopsis: "A skilled thief is offered a chance at redemption if he can successfully perform inception.",
      trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/7/7f/Inception_ver3.jpg",
      releaseDate: new Date("2010-07-16T00:00:00.000Z")
    },
    {
      title: "The Dark Knight",
      synopsis: "Batman faces the Joker as Gotham descends into chaos.",
      trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/8/8a/Dark_Knight.jpg",
      releaseDate: new Date("2008-07-18T00:00:00.000Z")
    },
    {
      title: "Interstellar",
      synopsis: "Explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
      releaseDate: new Date("2014-11-07T00:00:00.000Z")
    },
    {
      title: "The Matrix",
      synopsis: "A hacker discovers the world is a simulated reality and joins a rebellion against its controllers.",
      trailerUrl: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg",
      releaseDate: new Date("1999-03-31T00:00:00.000Z")
    },
    {
      title: "Parasite",
      synopsis: "A poor family schemes to become employed by a wealthy household, with unforeseen consequences.",
      trailerUrl: "https://www.youtube.com/watch?v=5xH0HfJHsaY",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png",
      releaseDate: new Date("2019-05-30T00:00:00.000Z")
    },
    {
      title: "Pulp Fiction",
      synopsis: "Interwoven stories of crime and redemption unfold in Los Angeles.",
      trailerUrl: "https://www.youtube.com/watch?v=s7EdQ4FqbhY",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/8/82/Pulp_Fiction_cover.jpg",
      releaseDate: new Date("1994-10-14T00:00:00.000Z")
    },
    {
      title: "Spirited Away",
      synopsis: "A girl enters a spirit world and must find a way to save her parents and return home.",
      trailerUrl: "https://www.youtube.com/watch?v=ByXuk9QqQkk",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png",
      releaseDate: new Date("2001-07-20T00:00:00.000Z")
    },
    {
      title: "The Godfather",
      synopsis: "The aging patriarch of an organized crime dynasty transfers control to his reluctant son.",
      trailerUrl: "https://www.youtube.com/watch?v=sY1S34973zA",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg",
      releaseDate: new Date("1972-03-24T00:00:00.000Z")
    },
    {
      title: "Fight Club",
      synopsis: "An office worker and a soap maker form an underground fight club that evolves into something more.",
      trailerUrl: "https://www.youtube.com/watch?v=SUXWAEX2jlg",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg",
      releaseDate: new Date("1999-10-15T00:00:00.000Z")
    },
    {
      title: "La La Land",
      synopsis: "A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.",
      trailerUrl: "https://www.youtube.com/watch?v=0pdqf4P9MB8",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/a/ab/La_La_Land_%28film%29.png",
      releaseDate: new Date("2016-12-09T00:00:00.000Z")
    },
    {
      title: "Mad Max: Fury Road",
      synopsis: "In a post-apocalyptic wasteland, Max teams up with Furiosa to flee a tyrant.",
      trailerUrl: "https://www.youtube.com/watch?v=hEJnMQG9ev8",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg",
      releaseDate: new Date("2015-05-15T00:00:00.000Z")
    },
    {
      title: "The Shawshank Redemption",
      synopsis: "Two imprisoned men bond over years, finding solace and eventual redemption through acts of decency.",
      trailerUrl: "https://www.youtube.com/watch?v=NmzuHjWmXOc",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg",
      releaseDate: new Date("1994-09-23T00:00:00.000Z")
    }
  ];
  const movieCreators = users.map((u) => u.id);
  const movies = [];
  const baseCreatedAt = Date.now() - 30 * 60_000;
  for (let i = 0; i < 30; i++) {
    const t = seeds[i % seeds.length];
    const creator = movieCreators[i % movieCreators.length];
    const movie = await prisma.movie.create({
      data: {
        title: `${t.title} #${i + 1} (${runId})`,
        releaseDate: t.releaseDate,
        posterUrl: t.posterUrl,
        trailerUrl: toEmbed(t.trailerUrl),
        synopsis: t.synopsis,
        createdBy: creator,
        createdAt: new Date(baseCreatedAt + i * 60_000)
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
  await recomputeMovieRanks(prisma);
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
