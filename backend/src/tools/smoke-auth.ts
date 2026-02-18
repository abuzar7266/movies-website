import "dotenv/config";

type CookieJar = Record<string, string>;
function parseSetCookie(headers: Headers, jar: CookieJar) {
  const setCookieHeader = headers.get("set-cookie");
  const parts = setCookieHeader ? [setCookieHeader] : [];
  for (const sc of parts) {
    const [pair] = sc.split(";");
    const [k, v] = pair.split("=");
    jar[k.trim()] = v;
  }
}
function cookieHeader(jar: CookieJar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function main() {
  const base = process.env.API_BASE || "http://localhost:4000";
  const jar: CookieJar = {};

  const email = `user${Date.now()}@example.com`;
  const password = "pass12345";
  const name = "Smoke User";

  let res = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok && res.status !== 409) {
    console.error("register failed", res.status, await res.text());
    process.exit(1);
  }
  parseSetCookie(res.headers, jar);
  console.log("register:", res.status);

  if (res.status === 409) {
    res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      console.error("login failed", res.status, await res.text());
      process.exit(1);
    }
    parseSetCookie(res.headers, jar);
    console.log("login:", res.status);
  }

  res = await fetch(`${base}/users/me`, {
    headers: { cookie: cookieHeader(jar) },
  });
  console.log("users/me:", res.status, await res.text());

  res = await fetch(`${base}/auth/logout`, {
    method: "POST",
    headers: { cookie: cookieHeader(jar) },
  });
  console.log("logout:", res.status);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
