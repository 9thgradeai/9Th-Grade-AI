// scripts/vercel-entry.ts
import { handle } from "hono/vercel";

// src/app.ts
import { Hono as Hono14 } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { PrismaClient } from "@prisma/client";

// src/middleware/logger.ts
var structuredLogger = async (c, next) => {
  const start = performance.now();
  await next();
  const ms = Math.round(performance.now() - start);
  const userId = c.get("userId") ?? null;
  console.log(
    JSON.stringify({
      type: "request",
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms,
      userId
    })
  );
};

// src/middleware/rateLimit.ts
function clientIp(c) {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown";
}
function rateLimit(opts) {
  const buckets = /* @__PURE__ */ new Map();
  return async (c, next) => {
    const key = opts.key(c);
    if (key === void 0) return next();
    const now = Date.now();
    if (buckets.size > 1e4) {
      for (const [k, b2] of buckets) {
        if (b2.resetAt <= now) buckets.delete(k);
      }
    }
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > opts.max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1e3);
      return c.json({ error: "Too many requests. Slow down and retry." }, {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, retryAfter)) }
      });
    }
    return next();
  };
}

// src/middleware/security.ts
var securityHeaders = async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-XSS-Protection", "0");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
};

// src/lib/cache.ts
import { Redis } from "@upstash/redis";
var useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
var redis = useRedis ? Redis.fromEnv() : null;
var cacheMode = useRedis ? "redis" : "memory";
var mem = /* @__PURE__ */ new Map();
async function cacheGet(key) {
  if (redis) {
    try {
      return await redis.get(key) ?? null;
    } catch {
      return null;
    }
  }
  const e = mem.get(key);
  if (!e) return null;
  if (e.expiresAt < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e.value;
}
async function cacheSet(key, value, ttlSeconds) {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
    }
  }
  mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1e3 });
}
async function cacheDel(key) {
  if (redis) {
    try {
      await redis.del(key);
    } catch {
    }
  }
  mem.delete(key);
}
function cacheKey(...parts) {
  return `cache:${parts.join(":")}`;
}

// src/routes/auth.ts
import { Hono } from "hono";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-this") {
  throw new Error("FATAL: JWT_SECRET must be set in production. Refusing to start with default secret.");
}
var JWT_ISSUER = "9th-grade-ai";
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", issuer: JWT_ISSUER });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
  } catch {
    return null;
  }
}
async function authMiddleware(c, next) {
  const cookieToken = c.req.header("cookie")?.match(/token=([^;]+)/)?.[1];
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "");
  const token = cookieToken || headerToken;
  if (!token) {
    return c.json({ error: "Authentication required" }, 401);
  }
  const user = verifyToken(token);
  if (!user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  c.set("userId", user.userId);
  c.set("email", user.email);
  await next();
}

// src/lib/email.ts
import { Resend } from "resend";
var resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
var FROM = process.env.EMAIL_FROM || "9Th-Grade AI <onboarding@resend.dev>";
async function sendEmail(input) {
  if (!resend) {
    console.log(JSON.stringify({ type: "email:mock", to: input.to, subject: input.subject }));
    return;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...input.html ? { html: input.html } : {}
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

// src/routes/auth.ts
var authRoutes = new Hono();
authRoutes.use("*", rateLimit({ windowMs: 6e4, max: 5, key: (c) => clientIp(c) }));
var registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  firstName: z.string().min(1)
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", code: "INVALID_INPUT", details: parsed.error.flatten() }, 400);
  }
  const { email, password, name, firstName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "Email already registered", code: "EMAIL_IN_USE" }, 409);
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      firstName,
      password: hashedPassword
    }
  });
  void sendEmail({
    to: email,
    subject: "Welcome to 9Th-Grade AI",
    text: `Hi ${firstName || name || "there"},

Your account is ready. Log in and run a diagnostic to unlock your personalized plan.

\u2014 The 9Th-Grade AI team`
  });
  const token = signToken({ userId: user.id, email: user.email });
  c.header("Set-Cookie", `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      timezone: user.timezone,
      createdAt: user.createdAt
    },
    token
  }, 201);
});
authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return c.json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }, 401);
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: "Invalid email or password", code: "INVALID_CREDENTIALS" }, 401);
  }
  const token = signToken({ userId: user.id, email: user.email });
  c.header("Set-Cookie", `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      timezone: user.timezone,
      createdAt: user.createdAt
    },
    token
  });
});
authRoutes.post("/logout", (c) => {
  c.header("Set-Cookie", "token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return c.json({ ok: true });
});
authRoutes.get("/session", async (c) => {
  const cookieToken = c.req.header("cookie")?.match(/token=([^;]+)/)?.[1];
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "");
  const token = cookieToken || headerToken;
  if (!token) {
    return c.json({ user: null });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ user: null });
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      timezone: true,
      avatar: true,
      createdAt: true
    }
  });
  if (!user) {
    return c.json({ user: null });
  }
  return c.json({ user });
});
authRoutes.post("/forgot-password", async (c) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid email" }, 400);
  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: new Date(Date.now() + 36e5) }
    });
    void sendEmail({
      to: email,
      subject: "Reset your 9Th-Grade AI password",
      text: `Use this token to reset your password. It expires in 1 hour:

${token}

POST /api/auth/reset-password with { "token", "newPassword" }.`
    });
  }
  return c.json({ ok: true });
});
authRoutes.post("/reset-password", async (c) => {
  const parsed = z.object({ token: z.string().min(10), newPassword: z.string().min(8) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid input" }, 400);
  const { token, newPassword } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpires: { gt: /* @__PURE__ */ new Date() } }
  });
  if (!user) return c.json({ error: "Invalid or expired token" }, 400);
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpires: null }
  });
  return c.json({ ok: true });
});
authRoutes.post("/change-password", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const parsed = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid input" }, 400);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.password) return c.json({ error: "Account has no password" }, 400);
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return c.json({ error: "Current password is incorrect" }, 401);
  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return c.json({ ok: true });
});
authRoutes.post("/request-verification", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return c.json({ error: "User not found" }, 404);
  if (user.emailVerified) return c.json({ ok: true, alreadyVerified: true });
  const token = randomBytes(32).toString("hex");
  await prisma.user.update({ where: { id: userId }, data: { verificationToken: token } });
  void sendEmail({
    to: user.email,
    subject: "Verify your 9Th-Grade AI email",
    text: `Use this token to verify your email:

${token}

POST /api/auth/verify-email with { "token" }.`
  });
  return c.json({ ok: true });
});
authRoutes.post("/verify-email", async (c) => {
  const parsed = z.object({ token: z.string().min(10) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid token" }, 400);
  const user = await prisma.user.findFirst({ where: { verificationToken: parsed.data.token } });
  if (!user) return c.json({ error: "Invalid token" }, 400);
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null }
  });
  return c.json({ ok: true });
});

// src/routes/users.ts
import { Hono as Hono2 } from "hono";
import { z as z2 } from "zod";
var userRoutes = new Hono2();
userRoutes.get("/me", async (c) => {
  const userId = c.get("userId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      timezone: true,
      avatar: true,
      createdAt: true,
      onboardingData: true
    }
  });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});
var preferencesSchema = z2.object({
  examId: z2.string().min(1),
  examDate: z2.string(),
  dailyTime: z2.string(),
  level: z2.enum(["beginner", "intermediate", "advanced"]),
  diagnosticScore: z2.number().min(0).max(100),
  priorities: z2.array(z2.string()).optional()
});
userRoutes.post("/me/preferences", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingData: parsed.data }
  });
  return c.json({ ok: true, onboardingCompleted: true });
});
userRoutes.get("/me/onboarding", async (c) => {
  const userId = c.get("userId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingData: true }
  });
  return c.json({ onboardingCompleted: !!user?.onboardingData, data: user?.onboardingData ?? null });
});
var updateSchema = z2.object({
  name: z2.string().min(1).optional(),
  firstName: z2.string().min(1).optional(),
  timezone: z2.string().optional(),
  avatar: z2.string().url().optional()
});
userRoutes.put("/me", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      timezone: true,
      avatar: true,
      createdAt: true
    }
  });
  return c.json(user);
});
userRoutes.delete("/me", async (c) => {
  const userId = c.get("userId");
  await prisma.user.delete({ where: { id: userId } });
  c.header("Set-Cookie", "token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return c.json({ ok: true });
});

// src/routes/exams.ts
import { Hono as Hono3 } from "hono";
var examRoutes = new Hono3();
examRoutes.get("/", async (c) => {
  const key = cacheKey("exams", "list");
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const exams = await prisma.exam.findMany({
    orderBy: { name: "asc" }
  });
  await cacheSet(key, exams, 300);
  return c.json(exams);
});
examRoutes.get("/subjects", async (c) => {
  const key = cacheKey("subjects", "all");
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: "asc" },
    include: { topics: true }
  });
  await cacheSet(key, subjects, 300);
  return c.json(subjects);
});
examRoutes.get("/topics", async (c) => {
  const subjectId = c.req.query("subjectId");
  if (!subjectId) return c.json({ error: "subjectId is required" }, 400);
  const topics = await prisma.topic.findMany({
    where: { subjectId },
    orderBy: { name: "asc" }
  });
  return c.json(topics);
});
examRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const exam = await prisma.exam.findUnique({ where: { slug } });
  if (!exam) return c.json({ error: "Exam not found" }, 404);
  return c.json(exam);
});
examRoutes.get("/:slug/subjects", async (c) => {
  const slug = c.req.param("slug");
  const key = cacheKey("subjects", slug);
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const exam = await prisma.exam.findUnique({ where: { slug } });
  if (!exam) return c.json({ error: "Exam not found" }, 404);
  const subjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    orderBy: { sortOrder: "asc" },
    include: { topics: true }
  });
  await cacheSet(key, subjects, 300);
  return c.json(subjects);
});
examRoutes.get("/subjects/:id", async (c) => {
  const id = c.req.param("id");
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: { topics: true }
  });
  if (!subject) return c.json({ error: "Subject not found" }, 404);
  return c.json(subject);
});
examRoutes.get("/topics/:id", async (c) => {
  const id = c.req.param("id");
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: { take: 10 }
    }
  });
  if (!topic) return c.json({ error: "Topic not found" }, 404);
  return c.json(topic);
});

// src/routes/questions.ts
import { Hono as Hono4 } from "hono";
var questionRoutes = new Hono4();
questionRoutes.get("/:topicId", async (c) => {
  const topicId = c.req.param("topicId");
  const q = c.req.query();
  const difficulty = q.difficulty ? Number(q.difficulty) : void 0;
  const limit = Math.min(Number(q.limit ?? 20) || 20, 50);
  const offset = Number(q.offset ?? 0) || 0;
  const key = cacheKey("questions", topicId, difficulty ?? "any", limit, offset);
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const where = {
    topicId,
    ...difficulty && !Number.isNaN(difficulty) ? { difficulty } : {}
  };
  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { difficulty: "asc" },
      take: limit,
      skip: offset
    })
  ]);
  const body = { total, offset, limit, questions };
  await cacheSet(key, body, 300);
  return c.json(body);
});

// src/routes/tests.ts
import { Hono as Hono5 } from "hono";
import { z as z3 } from "zod";

// src/lib/realtime.ts
var RealtimeHub = class {
  subs = /* @__PURE__ */ new Map();
  /** Subscribe a user's transport. Returns an unsubscribe function. */
  subscribe(userId, emitter) {
    let set = this.subs.get(userId);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.subs.set(userId, set);
    }
    set.add(emitter);
    return () => {
      set.delete(emitter);
      if (set.size === 0) this.subs.delete(userId);
    };
  }
  /** Emit an event to a single user's open connections. */
  publishToUser(userId, event, data) {
    const frame = JSON.stringify({ event, data });
    const set = this.subs.get(userId);
    if (!set) return;
    for (const emit of set) {
      try {
        emit(frame);
      } catch {
      }
    }
  }
  /** Emit an event to every open connection. */
  broadcast(event, data) {
    const frame = JSON.stringify({ event, data });
    for (const set of this.subs.values()) {
      for (const emit of set) {
        try {
          emit(frame);
        } catch {
        }
      }
    }
  }
};
var realtime = new RealtimeHub();

// src/lib/score.ts
var clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
var round = (n) => Math.round(n);
function computeTestResult(questions, attempts, percentile) {
  const byId = new Map(attempts.map((a) => [a.questionId, a]));
  const total = questions.length || 1;
  let correctCount = 0;
  let weightedScore = 0;
  let weightTotal = 0;
  let timeSum = 0;
  let confidenceSum = 0;
  let answeredCount = 0;
  let targetSum = 0;
  const losses = {};
  const nameLosses = /* @__PURE__ */ new Map();
  const topicErrors = /* @__PURE__ */ new Map();
  let worstSubjectName = "";
  let worstSubjectLoss = 0;
  let worstTopic = "";
  for (const q of questions) {
    const a = byId.get(q.questionId);
    const correct = a?.correct === true;
    const difficulty = Math.max(1, q.difficulty);
    weightTotal += difficulty;
    targetSum += q.targetSeconds;
    if (correct) {
      correctCount += 1;
      weightedScore += difficulty;
    } else {
      losses[q.subjectId] = (losses[q.subjectId] ?? 0) + difficulty;
      const nameLoss = (nameLosses.get(q.subjectName) ?? 0) + difficulty;
      nameLosses.set(q.subjectName, nameLoss);
      const tErr = (topicErrors.get(q.topicName) ?? 0) + 1;
      topicErrors.set(q.topicName, tErr);
      if (nameLoss > worstSubjectLoss) {
        worstSubjectName = q.subjectName;
        worstSubjectLoss = nameLoss;
      }
      if (!worstTopic || (topicErrors.get(worstTopic) ?? 0) < tErr) {
        worstTopic = q.topicName;
      }
    }
    const spent = a?.timeSpentSeconds ?? 0;
    timeSum += spent;
    if (a?.selectedIndex != null) {
      answeredCount += 1;
      confidenceSum += a?.confidence ?? 3;
    }
  }
  const accuracy = round(correctCount / total * 100);
  const score = round(weightedScore / weightTotal * 100);
  const avgTime = timeSum / total;
  const avgTarget = targetSum / total;
  const speed = round(clamp(100 - (avgTime - avgTarget) / Math.max(avgTarget, 1) * 100, 0, 100));
  const avgConfidence = answeredCount ? confidenceSum / answeredCount : 3;
  const retention = round(clamp(accuracy * 0.6 + avgConfidence / 5 * 100 * 0.4, 0, 100));
  const timeSpentMinutes = round(timeSum / 60);
  const targetTopicId = questions.find((q) => q.topicName === worstTopic)?.topicId ?? null;
  let diagnosis = "No clear error pattern detected \u2014 keep practising across subjects.";
  let nextBestAction = "Continue with your daily practice plan.";
  if (worstSubjectName) {
    const lost = nameLosses.get(worstSubjectName) ?? 0;
    diagnosis = `${worstSubjectName} accounts for the largest share of your errors (${lost} marks lost). Concentrate on ${worstTopic} \u2014 these are your highest-leverage quick wins.`;
    nextBestAction = `Complete a targeted ${worstSubjectName} session focusing on ${worstTopic}.`;
  }
  return {
    score,
    accuracy,
    speed,
    retention,
    percentile,
    correct: correctCount,
    total: questions.length,
    timeSpentMinutes,
    losses,
    diagnosis,
    nextBestAction,
    targetTopicId
  };
}
async function computePercentile(examId, score) {
  const all = await prisma.testResult.findMany({
    where: { test: { examId } },
    select: { score: true }
  });
  if (all.length === 0) return 85;
  const lower = all.filter((r) => r.score < score).length;
  return Math.round(lower / all.length * 100);
}
async function refreshPerformance(userId, examId, minutes) {
  const results = await prisma.testResult.findMany({
    where: { userId, test: { examId } },
    orderBy: { completedAt: "asc" },
    select: { accuracy: true, speed: true, retention: true, percentile: true, completedAt: true }
  });
  const n = Math.max(results.length, 1);
  const avg = (pick) => Math.round(results.reduce((s, r) => s + pick(r), 0) / n);
  const accuracy = avg((r) => r.accuracy);
  const speed = avg((r) => r.speed);
  const retention = avg((r) => r.retention);
  const percentile = Math.round(avg((r) => r.percentile));
  const mastery = round(clamp(accuracy * 0.4 + speed * 0.3 + retention * 0.3, 0, 100));
  const potentialScore = round(clamp(percentile + 5, 0, 100));
  const trajectory = results.map((r) => r.accuracy).slice(-12);
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1e3);
  const sessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, minutes: true }
  });
  const dayMinutes = /* @__PURE__ */ new Map();
  for (const s of sessions) {
    const day = s.date.toISOString().slice(0, 10);
    dayMinutes.set(day, (dayMinutes.get(day) ?? 0) + s.minutes);
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const studyHistory = days.map((day, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
    return { day, minutes: dayMinutes.get(d) ?? 0 };
  });
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
    if (dayMinutes.has(d) || i === 0) streak += 1;
    else break;
  }
  const prev = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId } },
    select: { streakDays: true }
  });
  if (streak > 0 && streak % 7 === 0 && (prev?.streakDays ?? 0) < streak) {
    realtime.publishToUser(userId, "streak:milestone", { streakDays: streak });
  }
  await prisma.performance.upsert({
    where: { userId_examId: { userId, examId } },
    update: {
      mastery,
      accuracy,
      speed,
      retention,
      examReadiness: mastery,
      percentile,
      potentialScore,
      trajectory: JSON.stringify(trajectory),
      studyHistory: JSON.stringify(studyHistory),
      streakDays: streak
    },
    create: {
      userId,
      examId,
      mastery,
      syllabusCoverage: 0,
      consistency: speed,
      accuracy,
      speed,
      retention,
      examReadiness: mastery,
      potentialScore,
      percentile,
      trajectory: JSON.stringify(trajectory),
      studyHistory: JSON.stringify(studyHistory),
      streakDays: streak
    }
  });
  await prisma.studySession.create({
    data: { userId, minutes: Math.max(1, minutes), tasks: JSON.stringify(["completed a test"]) }
  });
}

// src/lib/sm2.ts
var DAY_MS = 24 * 60 * 60 * 1e3;
var MIN_EF = 1.3;
var INITIAL_EF = 2.5;
var clamp2 = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function sm2(previous, quality) {
  const q = clamp2(Math.round(quality), 0, 5);
  let { repetition, easinessFactor, interval } = previous;
  easinessFactor = easinessFactor >= MIN_EF ? easinessFactor : INITIAL_EF;
  if (q < 3) {
    repetition = 0;
    interval = 1;
  } else {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * easinessFactor);
    repetition += 1;
  }
  easinessFactor = Math.max(MIN_EF, easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const memoryStrength = Math.round(clamp2(q / 5 * 100 + (easinessFactor - MIN_EF) * 15, 5, 100));
  return {
    repetition,
    easinessFactor,
    interval,
    memoryStrength,
    nextReview: new Date(Date.now() + interval * DAY_MS)
  };
}
function isOverdue(nextReview, now = Date.now()) {
  return nextReview.getTime() <= now;
}
async function ensureRevisionItems(userId, topicIds, forceDue = true) {
  for (const topicId of topicIds) {
    const now = /* @__PURE__ */ new Date();
    await prisma.revisionItem.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: forceDue ? { nextReview: now } : {},
      create: { userId, topicId, nextReview: now, memoryStrength: 50 }
    });
  }
}
async function ensureInitialSchedule(userId, examId) {
  const count = await prisma.revisionItem.count({ where: { userId } });
  if (count > 0) return;
  const weak = await prisma.userTopic.findMany({
    where: userId ? { userId, ...examId ? { topic: { subject: { examId } } } : {} } : {},
    orderBy: { accuracy: "asc" },
    take: 6
  });
  const topicIds = weak.length ? weak.map((ut) => ut.topicId) : (await prisma.topic.findMany({ take: 6, orderBy: { name: "asc" } })).map((t) => t.id);
  if (topicIds.length) await ensureRevisionItems(userId, topicIds, true);
}

// src/lib/ai.ts
var DAY_MS2 = 24 * 60 * 60 * 1e3;
var clamp3 = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function difficultyFromAccuracy(accuracy) {
  if (accuracy >= 92) return 5;
  if (accuracy >= 78) return 4;
  if (accuracy >= 58) return 3;
  if (accuracy >= 42) return 2;
  return 1;
}
async function recommendDifficulty(userId, subjectId) {
  let accuracy;
  if (subjectId) {
    const us = await prisma.userSubject.findUnique({
      where: { userId_subjectId: { userId, subjectId } }
    });
    accuracy = us?.accuracy ?? 50;
  } else {
    const perf = await prisma.performance.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });
    accuracy = perf?.accuracy ?? 50;
  }
  return difficultyFromAccuracy(accuracy);
}
async function buildRoadmap(opts) {
  const { userId, examId, examName, examDate, targetMastery = 90 } = opts;
  const perf = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId } }
  });
  const currentMastery = perf?.mastery ?? 0;
  const daysRemaining = Math.max(1, Math.ceil((examDate.getTime() - Date.now()) / DAY_MS2));
  const dailyEffortMinutes = daysRemaining > 120 ? 45 : daysRemaining > 60 ? 60 : daysRemaining > 30 ? 75 : 90;
  const userSubjects = await prisma.userSubject.findMany({
    where: { userId, examId },
    include: { subject: true },
    orderBy: { accuracy: "asc" },
    take: 3
  });
  const priorities = userSubjects.length > 0 ? userSubjects.map((us) => `${us.subject.name} (${us.accuracy}% accuracy)`) : [`Build a consistent daily practice habit`, `Complete a diagnostic to map weaknesses`];
  const totalWeeks = clamp3(Math.ceil(daysRemaining / 7), 4, 24);
  const week = (f) => Math.min(totalWeeks, Math.max(1, Math.round(totalWeeks * f)));
  const phases = [
    {
      id: "foundation",
      title: "Foundation",
      week: 1,
      weeks: week(0.25),
      focus: "Close the highest-loss gaps first \u2014 lock the fundamentals in every weak subject."
    },
    {
      id: "strengthen",
      title: "Strengthen",
      week: week(0.25) + 1,
      weeks: week(0.5),
      focus: "Raise accuracy and speed on the syllabus core; move difficulty up as mastery grows."
    },
    {
      id: "hardening",
      title: "Hardening",
      week: week(0.5) + 1,
      weeks: week(0.75),
      focus: "Full-length timed practice under pressure; attack careless and time-pressure errors."
    },
    {
      id: "final",
      title: "Mock & Final",
      week: week(0.75) + 1,
      weeks: totalWeeks,
      focus: "Replicate the real exam rhythm with mocks; review diagnosis notes and weak spots."
    }
  ];
  return {
    examId,
    examName,
    examDate,
    daysRemaining,
    currentMastery,
    targetMastery,
    dailyEffortMinutes,
    phases,
    priorities
  };
}
async function planDailyTasks(userId, examId, count = 3) {
  const weak = await prisma.userTopic.findMany({
    where: { userId, topic: { subject: { examId } } },
    orderBy: { accuracy: "asc" },
    take: count,
    include: { topic: { include: { subject: true } } }
  });
  const picks = weak.length ? weak.map((ut) => ({ topic: ut.topic, accuracy: ut.accuracy })) : await prisma.topic.findMany({
    where: { subject: { examId } },
    include: { subject: true },
    orderBy: { name: "asc" },
    take: count
  }).then((ts) => ts.map((t) => ({ topic: t, accuracy: 0 })));
  const templates = [
    { kind: "practice", durationMinutes: 20, priority: "high", impact: "high", expectedQuestions: 10 },
    { kind: "revision", durationMinutes: 15, priority: "medium", impact: "medium", expectedQuestions: null },
    { kind: "test", durationMinutes: 25, priority: "high", impact: "high", expectedQuestions: 15 }
  ];
  return picks.sort((a, b) => a.accuracy - b.accuracy).map((p, i) => {
    const t = templates[Math.min(i, templates.length - 1)];
    return {
      userId,
      subject: p.topic.subject.name,
      topic: p.topic.name,
      kind: t.kind,
      durationMinutes: t.durationMinutes,
      priority: t.priority,
      impact: t.impact,
      expectedQuestions: t.expectedQuestions,
      date: /* @__PURE__ */ new Date()
    };
  });
}
async function diagnoseTest(testId, userId) {
  const attempts = await prisma.questionAttempt.findMany({
    where: { testId },
    include: { question: { include: { topic: { include: { subject: true } } } } }
  });
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { result: true }
  });
  const modes = { "concept-gap": 0, "time-pressure": 0, careless: 0, "difficulty-gap": 0 };
  const classified = [];
  const errorTopicIds = /* @__PURE__ */ new Set();
  for (const a of attempts) {
    if (a.correct) continue;
    const q = a.question;
    errorTopicIds.add(q.topicId);
    let mode;
    const overTarget = a.timeSpentSeconds > q.targetSeconds * 1.5;
    const highConfidence = a.confidence >= 4;
    const fast = a.timeSpentSeconds < q.targetSeconds * 0.6;
    if (q.difficulty >= 4) mode = "difficulty-gap";
    else if (overTarget) mode = "time-pressure";
    else if (highConfidence && fast) mode = "careless";
    else mode = "concept-gap";
    modes[mode] += 1;
    classified.push({ mode, subject: q.topic.subject.name, topic: q.topic.name });
  }
  if (errorTopicIds.size > 0) {
    await ensureRevisionItems(userId, [...errorTopicIds]);
  }
  const result = test?.result;
  const losses = result ? JSON.parse(result.losses ?? "{}") : {};
  const weakestSubject = Object.entries(losses).sort((a, b) => b[1] - a[1])[0];
  const recs = [];
  if (modes["concept-gap"] > 0) {
    recs.push({
      userId,
      kind: "diagnosis",
      severity: "high",
      title: "Concept gaps detected",
      body: `${modes["concept-gap"]} wrong answers trace to fundamentals. Review the ${classified.find((c) => c.mode === "concept-gap")?.topic ?? "affected"} topic, then re-attempt.`,
      actionLabel: "Review topic",
      actionRoute: null
    });
  }
  if (modes["time-pressure"] > 0) {
    recs.push({
      userId,
      kind: "action",
      severity: "medium",
      title: "Time pressure is costing marks",
      body: `${modes["time-pressure"]} errors happened after you ran long. Practise with a per-question timer to raise your pacing.`,
      actionLabel: "Paced practice",
      actionRoute: null
    });
  }
  if (modes.careless > 0) {
    recs.push({
      userId,
      kind: "alert",
      severity: "medium",
      title: "Careless mistakes",
      body: `${modes.careless} wrong answers were quick and high-confidence. Slow down on 2-mark reads and double-check.`,
      actionLabel: null,
      actionRoute: null
    });
  }
  if (modes["difficulty-gap"] > 0) {
    recs.push({
      userId,
      kind: "strategy",
      severity: "high",
      title: "Pushing difficulty too fast",
      body: `${modes["difficulty-gap"]} errors came from 4-5 difficulty questions. Stabilise accuracy at level ${Math.max(1, difficultyFromAccuracy(result?.accuracy ?? 50) - 1)} before advancing.`,
      actionLabel: null,
      actionRoute: null
    });
  }
  if (weakestSubject) {
    recs.push({
      userId,
      kind: "strategy",
      severity: "high",
      title: `Prioritise ${weakestSubject[0]}`,
      body: `${weakestSubject[0]} accounts for ${weakestSubject[1]} marks lost. Make it the top of tomorrow's plan.`,
      actionLabel: "Open subject",
      actionRoute: null
    });
  }
  if (recs.length === 0) {
    recs.push({
      userId,
      kind: "diagnosis",
      severity: "low",
      title: "Clean session",
      body: "No error pattern detected. Maintain the streak and raise the difficulty one step.",
      actionLabel: null,
      actionRoute: null
    });
  }
  await prisma.aIRecommendation.createMany({ data: recs });
  realtime.publishToUser(userId, "recommendation:new", { count: recs.length });
  return {
    testId,
    userId,
    score: result?.score ?? 0,
    accuracy: result?.accuracy ?? 0,
    targetTopicId: result?.targetTopicId ?? null,
    losses,
    modes
  };
}

// src/lib/subscription.ts
var PLAN_FEATURES = {
  free: [],
  pro: ["mock-tests", "adaptive-tests", "ai-strategy", "unlimited-revision"],
  enterprise: ["mock-tests", "adaptive-tests", "ai-strategy", "unlimited-revision"]
};
function featureAccess(plan) {
  const granted = PLAN_FEATURES[plan in PLAN_FEATURES ? plan : "free"] ?? [];
  const set = new Set(granted);
  const all = ["mock-tests", "adaptive-tests", "ai-strategy", "unlimited-revision"];
  return all.reduce((acc, f) => {
    acc[f] = set.has(f);
    return acc;
  }, {});
}
async function getPlan(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== "active") return "free";
  return sub.plan in PLAN_FEATURES ? sub.plan : "free";
}
async function getAccess(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const plan = await getPlan(userId);
  return { subscription: sub, plan, features: featureAccess(plan) };
}

// src/middleware/featureGate.ts
async function featureAllowed(userId, feature) {
  const plan = await getPlan(userId);
  return featureAccess(plan)[feature];
}
function lockedResponse(c, feature, plan) {
  return c.json(
    {
      error: "This feature requires a paid plan",
      code: "FEATURE_LOCKED",
      feature,
      plan
    },
    402
  );
}
function requireFeature(feature) {
  return async (c, next) => {
    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    const plan = await getPlan(userId);
    if (!featureAccess(plan)[feature]) {
      return lockedResponse(c, feature, plan);
    }
    await next();
  };
}

// src/routes/tests.ts
var testRoutes = new Hono5();
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function sanitize(q) {
  const { correctIndex: _c, explanation: _e, ...safe } = q;
  return safe;
}
var buildSchema = z3.object({
  examId: z3.string().optional(),
  subjectId: z3.string().optional(),
  topicId: z3.string().optional(),
  count: z3.number().int().min(1).max(50).optional(),
  name: z3.string().optional(),
  kind: z3.string().optional(),
  /** AI-adaptive: bias the sampled questions to the user's current level. */
  adaptive: z3.boolean().optional()
});
testRoutes.post("/build", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = buildSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const { examId, subjectId, topicId, count = 10, name, kind, adaptive } = parsed.data;
  const effectiveKind = kind ?? (topicId ? "topic" : examId ? "diagnostic" : "mock");
  if (adaptive) {
    const allowed = await featureAllowed(userId, "adaptive-tests");
    if (!allowed) return lockedResponse(c, "adaptive-tests", await getPlan(userId));
  }
  if (effectiveKind === "mock") {
    const allowed = await featureAllowed(userId, "mock-tests");
    if (!allowed) return lockedResponse(c, "mock-tests", await getPlan(userId));
  }
  let scopeWhere = {};
  let resolvedExamId = examId;
  let resolvedSubjectId = subjectId;
  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true }
    });
    if (!topic) return c.json({ error: "Topic not found" }, 404);
    resolvedExamId = topic.subject.examId;
    resolvedSubjectId = topic.subjectId;
    scopeWhere = { topicId };
  } else if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return c.json({ error: "Subject not found" }, 404);
    resolvedExamId = subject.examId;
    scopeWhere = { topic: { subjectId } };
  } else if (examId) {
    scopeWhere = { topic: { subject: { examId } } };
  }
  if (!resolvedExamId) {
    const first = await prisma.exam.findFirst({ orderBy: { name: "asc" } });
    if (!first) return c.json({ error: "No exam configured" }, 500);
    resolvedExamId = first.id;
    scopeWhere = { topic: { subject: { examId: first.id } } };
  }
  const pool = await prisma.question.findMany({
    where: scopeWhere,
    include: { topic: { include: { subject: true } } }
  });
  if (pool.length === 0) {
    return c.json({ error: "No questions available for this scope" }, 404);
  }
  let sampledPool = pool;
  if (adaptive) {
    const level = await recommendDifficulty(userId, resolvedSubjectId ?? void 0);
    const near = pool.filter((q) => Math.abs(q.difficulty - level) <= 1);
    if (near.length > 0) sampledPool = near;
  }
  const selected = shuffle(sampledPool).slice(0, Math.min(count, sampledPool.length));
  const questionIds = selected.map((q) => q.id);
  const durationMinutes = Math.max(1, Math.round(selected.reduce((s, q) => s + q.targetSeconds, 0) / 60));
  const testName = name ?? `Practice ${topicId ? "Session" : "Mock"}`;
  const test = await prisma.test.create({
    data: {
      userId,
      examId: resolvedExamId,
      subjectId: resolvedSubjectId,
      topicId,
      name: testName,
      kind: effectiveKind,
      questionIds,
      durationMinutes
    }
  });
  return c.json({
    test: {
      id: test.id,
      name: test.name,
      kind: test.kind,
      examId: test.examId,
      durationMinutes: test.durationMinutes,
      totalQuestions: questionIds.length,
      createdAt: test.startedAt
    },
    questions: selected.map((q) => sanitize(q))
  });
});
testRoutes.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const test = await prisma.test.findFirst({
    where: { id, userId },
    include: {
      attempts: true,
      result: true
    }
  });
  if (!test) return c.json({ error: "Test not found" }, 404);
  const questions = await prisma.question.findMany({
    where: { id: { in: test.questionIds } },
    include: { topic: { include: { subject: true } } }
  });
  return c.json({
    test,
    questions: questions.map((q) => sanitize(q)),
    attempts: test.attempts,
    result: test.result
  });
});
var submitSchema = z3.object({
  attempts: z3.array(
    z3.object({
      questionId: z3.string(),
      selectedIndex: z3.number().int().nullable().optional(),
      timeSpentSeconds: z3.number().int().min(0).default(0),
      confidence: z3.number().int().min(1).max(5).optional()
    })
  )
});
testRoutes.post("/:id/submit", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const test = await prisma.test.findFirst({
    where: { id, userId },
    include: { result: { select: { id: true } } }
  });
  if (!test) return c.json({ error: "Test not found" }, 404);
  if (test.completedAt || test.result) {
    return c.json({ error: "Test already completed" }, 409);
  }
  const body = await c.req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const questions = await prisma.question.findMany({
    where: { id: { in: test.questionIds } },
    include: { topic: { include: { subject: true } } }
  });
  const byId = new Map(parsed.data.attempts.map((a) => [a.questionId, a]));
  const graded = questions.map((q) => ({
    questionId: q.id,
    subjectId: q.topic.subjectId,
    subjectName: q.topic.subject.name,
    topicId: q.topicId,
    topicName: q.topic.name,
    difficulty: q.difficulty,
    targetSeconds: q.targetSeconds
  }));
  const submittedAttempts = graded.map((gq) => {
    const a = byId.get(gq.questionId);
    const selectedIndex = a?.selectedIndex ?? null;
    const q = questions.find((x) => x.id === gq.questionId);
    return {
      testId: test.id,
      questionId: gq.questionId,
      selectedIndex,
      correct: selectedIndex != null && selectedIndex === q.correctIndex,
      timeSpentSeconds: a?.timeSpentSeconds ?? 0,
      confidence: a?.confidence ?? 3
    };
  });
  const provisional = computeTestResult(graded, submittedAttempts, 0);
  const percentile = await computePercentile(test.examId, provisional.score);
  const result = computeTestResult(graded, submittedAttempts, percentile);
  await prisma.$transaction(async (tx) => {
    await tx.questionAttempt.createMany({ data: submittedAttempts });
    await tx.testResult.create({
      data: {
        testId: test.id,
        userId,
        score: result.score,
        accuracy: result.accuracy,
        speed: result.speed,
        retention: result.retention,
        percentile: result.percentile,
        correct: result.correct,
        total: result.total,
        timeSpentMinutes: result.timeSpentMinutes,
        diagnosis: result.diagnosis,
        nextBestAction: result.nextBestAction,
        targetTopicId: result.targetTopicId,
        losses: JSON.stringify(result.losses)
      }
    });
    await tx.test.update({
      where: { id: test.id },
      data: { completedAt: /* @__PURE__ */ new Date() }
    });
  });
  await upsertProgress(userId, graded, submittedAttempts);
  await refreshPerformance(userId, test.examId, result.timeSpentMinutes);
  await diagnoseTest(test.id, userId);
  realtime.publishToUser(userId, "progress:update", {
    testId: test.id,
    score: result.score,
    accuracy: result.accuracy
  });
  realtime.publishToUser(userId, "ranking:updated", { percentile: result.percentile });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (user) {
    void sendEmail({
      to: user.email,
      subject: `Your ${test.name} result: ${result.score}%`,
      text: `Hi ${user.name || "there"},

You scored ${result.score}% (${result.correct}/${result.total}) on "${test.name}".

${result.diagnosis}
Next: ${result.nextBestAction}

\u2014 The 9Th-Grade AI team`
    });
  }
  await cacheDel(cacheKey("rank", test.examId, userId));
  await cacheDel(cacheKey("strategy", userId));
  await cacheDel(cacheKey("briefing", userId));
  return c.json({ result });
});
testRoutes.get("/:id/result", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const test = await prisma.test.findFirst({
    where: { id, userId },
    include: { result: true }
  });
  if (!test) return c.json({ error: "Test not found" }, 404);
  if (!test.result) return c.json({ error: "Result not yet available" }, 404);
  return c.json({ result: test.result });
});
async function upsertProgress(userId, graded, attempts) {
  const byId = new Map(attempts.map((a) => [a.questionId, a]));
  const subjectAgg = /* @__PURE__ */ new Map();
  const topicAgg = /* @__PURE__ */ new Map();
  for (const g of graded) {
    const a = byId.get(g.questionId);
    if (!a) continue;
    for (const [map, key] of [
      [subjectAgg, g.subjectId],
      [topicAgg, g.topicId]
    ]) {
      const cur = map.get(key) ?? { correct: 0, total: 0, time: 0 };
      cur.total += 1;
      cur.correct += a.correct ? 1 : 0;
      cur.time += a.timeSpentSeconds;
      map.set(key, cur);
    }
  }
  const toMetrics = (agg) => {
    const accuracy = Math.round(agg.correct / Math.max(agg.total, 1) * 100);
    const speed = Math.round(Math.max(0, 100 - agg.time / Math.max(agg.total, 1) * 2));
    const retention = Math.round(accuracy * 0.7 + speed * 0.3);
    const mastery = Math.round(accuracy * 0.4 + speed * 0.3 + retention * 0.3);
    return { accuracy, speed, retention, mastery };
  };
  for (const [subjectId, agg] of subjectAgg) {
    const m = toMetrics(agg);
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) continue;
    await prisma.userSubject.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      update: m,
      create: { userId, examId: subject.examId, subjectId, ...m }
    });
  }
  for (const [topicId, agg] of topicAgg) {
    const m = toMetrics(agg);
    const status = m.accuracy >= 80 ? "mastered" : m.accuracy >= 55 ? "practicing" : "learning";
    await prisma.userTopic.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: { ...m, status },
      create: { userId, topicId, ...m, status }
    });
  }
}

// src/routes/performance.ts
import { Hono as Hono6 } from "hono";
var performanceRoutes = new Hono6();
async function primaryExam(userId) {
  const withActivity = await prisma.testResult.findFirst({
    where: { userId },
    select: { test: { select: { examId: true } } },
    orderBy: { completedAt: "desc" }
  });
  const examId = withActivity?.test.examId;
  if (examId) {
    return prisma.exam.findUnique({ where: { id: examId } });
  }
  return prisma.exam.findFirst({ orderBy: { name: "asc" } });
}
performanceRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const exam = await primaryExam(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const perf = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId: exam.id } }
  });
  return c.json({
    exam: {
      id: exam.id,
      slug: exam.slug,
      name: exam.name,
      shortName: exam.shortName
    },
    performance: perf ? {
      mastery: perf.mastery,
      syllabusCoverage: perf.syllabusCoverage,
      consistency: perf.consistency,
      accuracy: perf.accuracy,
      speed: perf.speed,
      retention: perf.retention,
      examReadiness: perf.examReadiness,
      potentialScore: perf.potentialScore,
      percentile: perf.percentile,
      streakDays: perf.streakDays,
      trajectory: perf.trajectory ? JSON.parse(perf.trajectory) : [],
      studyHistory: perf.studyHistory ? JSON.parse(perf.studyHistory) : []
    } : null
  });
});
performanceRoutes.get("/subjects", async (c) => {
  const userId = c.get("userId");
  const exam = await primaryExam(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const userSubjects = await prisma.userSubject.findMany({
    where: { userId, examId: exam.id },
    include: { subject: true },
    orderBy: { subject: { sortOrder: "asc" } }
  });
  const subjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    orderBy: { sortOrder: "asc" }
  });
  const rows = subjects.map((s) => {
    const us = userSubjects.find((x) => x.subjectId === s.id);
    return {
      subject: {
        id: s.id,
        name: s.name,
        nameBn: s.nameBn,
        weight: s.weight
      },
      mastery: us?.mastery ?? 0,
      accuracy: us?.accuracy ?? 0,
      speed: us?.speed ?? 0,
      retention: us?.retention ?? 0
    };
  });
  return c.json({ examId: exam.id, subjects: rows });
});
performanceRoutes.get("/trajectory", async (c) => {
  const userId = c.get("userId");
  const exam = await primaryExam(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const perf = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId: exam.id } }
  });
  return c.json({
    trajectory: perf?.trajectory ? JSON.parse(perf.trajectory) : [],
    studyHistory: perf?.studyHistory ? JSON.parse(perf.studyHistory) : [],
    streakDays: perf?.streakDays ?? 0
  });
});

// src/routes/dashboard.ts
import { Hono as Hono7 } from "hono";
import { z as z4 } from "zod";
var dashboardRoutes = new Hono7();
dashboardRoutes.get("/quick-stats", async (c) => {
  const userId = c.get("userId");
  const startToday = /* @__PURE__ */ new Date();
  startToday.setHours(0, 0, 0, 0);
  const startWeek = new Date(Date.now() - 6 * 24 * 60 * 60 * 1e3);
  const [todaySessions, weekSessions, perf, results] = await Promise.all([
    prisma.studySession.aggregate({
      where: { userId, date: { gte: startToday } },
      _sum: { minutes: true }
    }),
    prisma.studySession.aggregate({
      where: { userId, date: { gte: startWeek } },
      _sum: { minutes: true }
    }),
    prisma.performance.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.testResult.aggregate({
      where: { userId },
      _sum: { total: true },
      _count: true
    })
  ]);
  return c.json({
    todayMinutes: todaySessions._sum.minutes ?? 0,
    weeklyMinutes: weekSessions._sum.minutes ?? 0,
    streakDays: perf?.streakDays ?? 0,
    avgAccuracy: perf?.accuracy ?? 0,
    testsTaken: results._count,
    questionsAnswered: results._sum.total ?? 0
  });
});
dashboardRoutes.get("/daily-tasks", async (c) => {
  const userId = c.get("userId");
  const startToday = /* @__PURE__ */ new Date();
  startToday.setHours(0, 0, 0, 0);
  const existing = await prisma.dailyTask.findMany({
    where: { userId, date: { gte: startToday } },
    orderBy: { priority: "asc" }
  });
  if (existing.length > 0) return c.json({ tasks: existing });
  const examId = await prisma.testResult.findFirst({ where: { userId }, select: { test: { select: { examId: true } } } }).then((r) => r?.test.examId) ?? (await prisma.exam.findFirst())?.id;
  if (!examId) return c.json({ error: "No exam configured" }, 500);
  const plan = await planDailyTasks(userId, examId, 3);
  const created = await prisma.dailyTask.createManyAndReturn({ data: plan });
  return c.json({ tasks: created });
});
var taskSchema = z4.object({ status: z4.enum(["pending", "done"]) });
dashboardRoutes.patch("/daily-tasks/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const task = await prisma.dailyTask.findFirst({ where: { id, userId } });
  if (!task) return c.json({ error: "Task not found" }, 404);
  const updated = await prisma.dailyTask.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  if (parsed.data.status === "done") {
    realtime.publishToUser(userId, "task:completed", { taskId: id, topic: task.topic });
  }
  return c.json(updated);
});

// src/routes/rank.ts
import { Hono as Hono8 } from "hono";
var rankRoutes = new Hono8();
rankRoutes.get("/leaderboard", async (c) => {
  const userId = c.get("userId");
  const examId = c.req.query("examId");
  const limit = Math.min(Number(c.req.query("limit") ?? 50) || 50, 100);
  const resolvedExamId = examId || await prisma.testResult.findFirst({ where: { userId }, select: { test: { select: { examId: true } } } }).then((r) => r?.test.examId);
  if (!resolvedExamId) {
    return c.json({ examId: null, leaderboard: [], me: null });
  }
  const key = cacheKey("rank", resolvedExamId, userId);
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const grouped = await prisma.testResult.groupBy({
    by: ["userId"],
    where: { test: { examId: resolvedExamId } },
    _avg: { score: true, accuracy: true },
    _count: true,
    orderBy: { _avg: { score: "desc" } },
    take: limit
  });
  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, name: true, firstName: true, avatar: true }
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  const leaderboard = grouped.map((g, i) => ({
    rank: i + 1,
    userId: g.userId,
    name: byId.get(g.userId)?.name ?? "Anonymous",
    avatar: byId.get(g.userId)?.avatar ?? null,
    avgScore: Math.round(g._avg.score ?? 0),
    avgAccuracy: Math.round(g._avg.accuracy ?? 0),
    tests: g._count
  }));
  const myRank = leaderboard.find((l) => l.userId === userId)?.rank ?? null;
  const body = { examId: resolvedExamId, leaderboard, me: myRank };
  await cacheSet(key, body, 60);
  return c.json(body);
});
rankRoutes.get("/me", async (c) => {
  const userId = c.get("userId");
  const examId = c.req.query("examId");
  const resolvedExamId = examId || await prisma.testResult.findFirst({ where: { userId }, select: { test: { select: { examId: true } } } }).then((r) => r?.test.examId);
  if (!resolvedExamId) {
    return c.json({ rank: null, percentile: null });
  }
  const grouped = await prisma.testResult.groupBy({
    by: ["userId"],
    where: { test: { examId: resolvedExamId } },
    _avg: { score: true },
    orderBy: { _avg: { score: "desc" } }
  });
  const index = grouped.findIndex((g) => g.userId === userId);
  if (index === -1) return c.json({ rank: null, percentile: null });
  const rank = index + 1;
  const percentile = Math.round((grouped.length - rank) / grouped.length * 100);
  return c.json({ rank, percentile, total: grouped.length });
});

// src/routes/strategy.ts
import { Hono as Hono9 } from "hono";
import { z as z5 } from "zod";
var strategyRoutes = new Hono9();
strategyRoutes.use("/strategy/*", requireFeature("ai-strategy"));
strategyRoutes.use("/ai/*", requireFeature("ai-strategy"));
strategyRoutes.use("/ai/*", rateLimit({
  windowMs: 6e4,
  max: 10,
  key: (c) => c.get("userId")
}));
async function primaryExam2(userId) {
  const withActivity = await prisma.testResult.findFirst({
    where: { userId },
    select: { test: { select: { examId: true } } },
    orderBy: { completedAt: "desc" }
  });
  const examId = withActivity?.test.examId;
  if (examId) {
    return prisma.exam.findUnique({ where: { id: examId } });
  }
  return prisma.exam.findFirst({ orderBy: { name: "asc" } });
}
var DEFAULT_EXAM_DATE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3);
function serializeRoadmap(r) {
  return {
    examName: r.examName,
    daysRemaining: r.daysRemaining,
    currentMastery: r.currentMastery,
    targetMastery: r.targetMastery,
    dailyEffortMinutes: r.dailyEffortMinutes,
    phases: r.phases ? JSON.parse(r.phases) : [],
    priorities: r.priorities ? JSON.parse(r.priorities) : []
  };
}
async function upsertRoadmap(userId, examId, examName, examDate, targetMastery) {
  const data = await buildRoadmap({ userId, examId, examName, examDate, targetMastery });
  const roadmap = await prisma.roadmap.upsert({
    where: { userId_examId: { userId, examId } },
    update: {
      examDate: data.examDate,
      daysRemaining: data.daysRemaining,
      currentMastery: data.currentMastery,
      targetMastery: data.targetMastery,
      dailyEffortMinutes: data.dailyEffortMinutes,
      phases: JSON.stringify(data.phases),
      priorities: JSON.stringify(data.priorities)
    },
    create: {
      userId,
      examId,
      examName: data.examName,
      examDate: data.examDate,
      daysRemaining: data.daysRemaining,
      currentMastery: data.currentMastery,
      targetMastery: data.targetMastery,
      dailyEffortMinutes: data.dailyEffortMinutes,
      phases: JSON.stringify(data.phases),
      priorities: JSON.stringify(data.priorities)
    }
  });
  return serializeRoadmap(roadmap);
}
strategyRoutes.get("/strategy", async (c) => {
  const userId = c.get("userId");
  const key = cacheKey("strategy", userId);
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const exam = await primaryExam2(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const existing = await prisma.roadmap.findUnique({
    where: { userId_examId: { userId, examId: exam.id } }
  });
  const body = existing ? { examId: exam.id, roadmap: serializeRoadmap(existing) } : await upsertRoadmap(userId, exam.id, exam.name, DEFAULT_EXAM_DATE, 90).then((roadmap) => ({
    examId: exam.id,
    roadmap
  }));
  await cacheSet(key, body, 300);
  return c.json(body);
});
var regenSchema = z5.object({
  examDate: z5.string().datetime().optional(),
  targetMastery: z5.number().int().min(50).max(100).optional()
});
strategyRoutes.post("/strategy/regenerate", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = regenSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const exam = await primaryExam2(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const examDate = parsed.data.examDate ? new Date(parsed.data.examDate) : DEFAULT_EXAM_DATE;
  const roadmap = await upsertRoadmap(userId, exam.id, exam.name, examDate, parsed.data.targetMastery ?? 90);
  await cacheDel(cacheKey("strategy", userId));
  await cacheDel(cacheKey("briefing", userId));
  return c.json({ examId: exam.id, roadmap });
});
strategyRoutes.get("/ai/recommendations", async (c) => {
  const userId = c.get("userId");
  const unread = c.req.query("unread") === "true";
  const recs = await prisma.aIRecommendation.findMany({
    where: { userId, ...unread ? { readAt: null } : {} },
    orderBy: { createdAt: "desc" },
    take: 30
  });
  return c.json({ recommendations: recs });
});
strategyRoutes.patch("/ai/recommendations/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const rec = await prisma.aIRecommendation.findFirst({ where: { id, userId } });
  if (!rec) return c.json({ error: "Recommendation not found" }, 404);
  const updated = await prisma.aIRecommendation.update({
    where: { id },
    data: { readAt: /* @__PURE__ */ new Date() }
  });
  return c.json(updated);
});
strategyRoutes.get("/ai/briefing", async (c) => {
  const userId = c.get("userId");
  const key = cacheKey("briefing", userId);
  const cached = await cacheGet(key);
  if (cached) return c.json(cached);
  const exam = await primaryExam2(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const [roadmap, recs, tasks] = await Promise.all([
    prisma.roadmap.findUnique({ where: { userId_examId: { userId, examId: exam.id } } }),
    prisma.aIRecommendation.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.dailyTask.findMany({
      where: { userId, status: "pending" },
      orderBy: { priority: "asc" },
      take: 3
    })
  ]);
  const items = [];
  if (roadmap?.priorities) {
    const p = JSON.parse(roadmap.priorities);
    if (p[0]) items.push(`Lead with your highest-impact gap: ${p[0]}.`);
  }
  if (recs[0]) items.push(recs[0].body);
  if (tasks[0]) items.push(`Today: ${tasks[0].kind} on ${tasks[0].topic} (${tasks[0].durationMinutes} min).`);
  if (roadmap) {
    items.push(`${roadmap.daysRemaining} days to ${roadmap.examName} \u2014 stay on the ${roadmap.phases ? JSON.parse(roadmap.phases)[0]?.title : "plan"} phase.`);
  }
  if (items.length === 0) items.push("Run a diagnostic test to unlock your AI briefing.");
  const briefing = { id: `brief_${Date.now()}`, title: "AI Daily Briefing", items };
  await cacheSet(key, { briefing }, 60);
  return c.json({ briefing });
});
strategyRoutes.post("/ai/diagnose/:testId", async (c) => {
  const userId = c.get("userId");
  const testId = c.req.param("testId");
  const test = await prisma.test.findFirst({
    where: { id: testId, userId },
    include: { result: true }
  });
  if (!test) return c.json({ error: "Test not found" }, 404);
  if (!test.result) return c.json({ error: "Result not available yet" }, 404);
  const diagnosis = await diagnoseTest(testId, userId);
  return c.json({ diagnosis });
});
strategyRoutes.get("/ai/daily-plan", async (c) => {
  const userId = c.get("userId");
  const exam = await primaryExam2(userId);
  if (!exam) return c.json({ error: "No exam configured" }, 500);
  const tasks = await planDailyTasks(userId, exam.id, 3);
  return c.json({ tasks });
});

// src/routes/revision.ts
import { Hono as Hono10 } from "hono";
import { z as z6 } from "zod";
var revisionRoutes = new Hono10();
revisionRoutes.use("*", requireFeature("unlimited-revision"));
function serialize(item) {
  return {
    id: item.id,
    topic: item.topic.name,
    subject: item.topic.subject.name,
    memoryStrength: item.memoryStrength,
    lastReviewed: item.lastReviewed.toISOString(),
    nextReview: item.nextReview.toISOString(),
    overdue: isOverdue(item.nextReview)
  };
}
revisionRoutes.get("/items", async (c) => {
  const userId = c.get("userId");
  await ensureInitialSchedule(userId);
  const items = await prisma.revisionItem.findMany({
    where: { userId },
    include: { topic: { include: { subject: true } } },
    orderBy: { nextReview: "asc" },
    take: 50
  });
  return c.json({ items: items.map(serialize) });
});
revisionRoutes.get("/schedule", async (c) => {
  const userId = c.get("userId");
  await ensureInitialSchedule(userId);
  const now = /* @__PURE__ */ new Date();
  const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  const items = await prisma.revisionItem.findMany({
    where: { userId, nextReview: { lte: endOfWeek } },
    include: { topic: { include: { subject: true } } },
    orderBy: { nextReview: "asc" },
    take: 100
  });
  const due = items.filter((i) => isOverdue(i.nextReview, now.getTime()));
  const upcoming = items.filter((i) => !isOverdue(i.nextReview, now.getTime()));
  return c.json({
    dueToday: due.map(serialize),
    upcoming: upcoming.map(serialize),
    dueCount: due.length
  });
});
var reviewSchema = z6.object({
  topicId: z6.string(),
  quality: z6.number().int().min(0).max(5)
});
revisionRoutes.post("/review", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const { topicId, quality } = parsed.data;
  let item = await prisma.revisionItem.findUnique({
    where: { userId_topicId: { userId, topicId } }
  });
  if (!item) {
    await ensureRevisionItems(userId, [topicId]);
    item = await prisma.revisionItem.findUnique({ where: { userId_topicId: { userId, topicId } } });
  }
  if (!item) return c.json({ error: "Topic not found" }, 404);
  const next = sm2(
    { repetition: item.repetition, easinessFactor: item.easinessFactor, interval: item.interval },
    quality
  );
  const updated = await prisma.revisionItem.update({
    where: { id: item.id },
    data: {
      memoryStrength: next.memoryStrength,
      lastReviewed: /* @__PURE__ */ new Date(),
      nextReview: next.nextReview,
      repetition: next.repetition,
      easinessFactor: next.easinessFactor,
      interval: next.interval,
      overdue: false
    },
    include: { topic: { include: { subject: true } } }
  });
  if (quality < 3) {
    await prisma.aIRecommendation.create({
      data: {
        userId,
        kind: "memory",
        severity: "medium",
        title: "Revisit: " + updated.topic.name,
        body: `You rated your recall of ${updated.topic.name} low. Review it again within 24 hours to lock it in.`,
        actionLabel: "Review now",
        actionRoute: null
      }
    });
  }
  return c.json({ item: serialize(updated) });
});

// src/routes/payments.ts
import { Hono as Hono11 } from "hono";
import { z as z7 } from "zod";
import Stripe from "stripe";
var stripeKey = process.env.STRIPE_SECRET_KEY;
var stripe = stripeKey ? new Stripe(stripeKey) : null;
var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
var MOCK = !stripe;
var paymentsRoutes = new Hono11();
paymentsRoutes.get("/subscription", async (c) => {
  const userId = c.get("userId");
  const { subscription, plan, features } = await getAccess(userId);
  return c.json({
    mock: MOCK,
    plan,
    features,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    status: subscription?.status ?? "none"
  });
});
var checkoutSchema = z7.object({ plan: z7.enum(["pro", "enterprise"]) });
paymentsRoutes.post("/checkout", async (c) => {
  const userId = c.get("userId");
  const email = c.get("email");
  const body = await c.req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }
  const plan = parsed.data.plan;
  if (!stripe) {
    return c.json({
      mock: true,
      sessionId: `mock_${plan}_${userId}`,
      url: null,
      plan,
      note: "No STRIPE_SECRET_KEY set \u2014 checkout is simulated."
    });
  }
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = sub?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { userId } });
    customerId = customer.id;
  }
  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId) {
    return c.json({ error: "STRIPE_PRICE_PRO is not configured" }, 500);
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: userId,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { plan, userId },
    success_url: process.env.FRONTEND_URL + "/dashboard?checkout=success",
    cancel_url: process.env.FRONTEND_URL + "/pricing?checkout=cancelled"
  });
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customerId },
    create: { userId, stripeCustomerId: customerId, plan: "free", status: "active" }
  });
  return c.json({ mock: false, sessionId: session.id, url: session.url, plan });
});
paymentsRoutes.post("/cancel", async (c) => {
  const userId = c.get("userId");
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return c.json({ error: "No subscription to cancel" }, 404);
  if (stripe && sub.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
  }
  const updated = await prisma.subscription.update({
    where: { userId },
    data: { status: "canceled" }
  });
  return c.json({ plan: updated.plan, status: updated.status, mock: MOCK });
});
var webhookRoute = new Hono11();
webhookRoute.post("/", async (c) => {
  const raw = await c.req.raw.text();
  let event;
  if (stripe && webhookSecret) {
    const signature = c.req.header("stripe-signature");
    if (!signature) return c.json({ error: "Missing stripe-signature header" }, 400);
    try {
      event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return c.json({ error: "Invalid signature" }, 400);
    }
  } else {
    event = JSON.parse(raw);
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan || "pro";
      const amount = session.amount_total ?? 0;
      const currentPeriodEnd = defaultPeriodEnd();
      const subRef = session.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef?.id ?? void 0;
      const custRef = session.customer;
      const custId = typeof custRef === "string" ? custRef : custRef?.id ?? void 0;
      if (userId) {
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan,
            status: "active",
            stripeSubscriptionId: subId,
            stripeCustomerId: custId,
            currentPeriodEnd
          },
          create: {
            userId,
            plan,
            status: "active",
            stripeSubscriptionId: subId,
            stripeCustomerId: custId,
            currentPeriodEnd
          }
        });
        await prisma.invoice.create({
          data: {
            userId,
            subscriptionId: await subscriptionId(userId),
            stripeInvoiceId: session.invoice || null,
            amount,
            status: "paid"
          }
        });
      }
      break;
    }
    default:
      break;
  }
  return c.json({ received: true });
});
function defaultPeriodEnd() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
}
async function subscriptionId(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.id ?? null;
}

// src/routes/realtime.ts
import { Hono as Hono12 } from "hono";
var realtimeRoutes = new Hono12();
var encoder = new TextEncoder();
realtimeRoutes.get("/events", (c) => {
  const userId = c.get("userId");
  let cleanup = null;
  let heartbeat = null;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: connected
data: {"userId":"${userId}"}

`));
      cleanup = realtime.subscribe(userId, (frame) => {
        controller.enqueue(encoder.encode(`event: message
data: ${frame}

`));
      });
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping

`));
      }, 25e3);
    },
    cancel() {
      if (cleanup) cleanup();
      if (heartbeat) clearInterval(heartbeat);
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
});

// src/routes/admin.ts
import { Hono as Hono13 } from "hono";
import { z as z8 } from "zod";

// src/middleware/admin.ts
async function requireAdmin(c, next) {
  const userId = c.get("userId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  if (user?.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
}

// src/routes/admin.ts
var adminRoutes = new Hono13();
adminRoutes.use("*", requireAdmin);
var questionSchema = z8.object({
  topicId: z8.string(),
  prompt: z8.string().min(1),
  promptBn: z8.string().optional(),
  options: z8.array(z8.string()).min(2),
  optionsBn: z8.array(z8.string()).optional(),
  correctIndex: z8.number().int().min(0),
  explanation: z8.string().min(1),
  difficulty: z8.number().int().min(1).max(5).optional(),
  targetSeconds: z8.number().int().positive().optional(),
  tags: z8.array(z8.string()).optional()
});
adminRoutes.get("/questions", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50) || 50, 100);
  const offset = Number(c.req.query("offset") ?? 0) || 0;
  const topicId = c.req.query("topicId");
  const where = topicId ? { topicId } : {};
  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip: offset,
      take: limit,
      include: { topic: { include: { subject: true } } }
    })
  ]);
  return c.json({ total, offset, limit, questions });
});
adminRoutes.post("/questions", async (c) => {
  const parsed = questionSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  const d = parsed.data;
  const topic = await prisma.topic.findUnique({ where: { id: d.topicId } });
  if (!topic) return c.json({ error: "Topic not found" }, 400);
  const question = await prisma.question.create({
    data: {
      topicId: d.topicId,
      prompt: d.prompt,
      promptBn: d.promptBn,
      options: d.options,
      optionsBn: d.optionsBn ?? [],
      correctIndex: d.correctIndex,
      explanation: d.explanation,
      difficulty: d.difficulty ?? 2,
      targetSeconds: d.targetSeconds ?? 40,
      tags: d.tags ?? []
    }
  });
  return c.json(question, 201);
});
adminRoutes.put("/questions/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Question not found" }, 404);
  const parsed = questionSchema.partial().safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  const question = await prisma.question.update({ where: { id }, data: parsed.data });
  return c.json(question);
});
adminRoutes.delete("/questions/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) return c.json({ error: "Question not found" }, 404);
  await prisma.question.delete({ where: { id } });
  return c.json({ ok: true });
});
adminRoutes.get("/analytics", async (c) => {
  const [users, admins, exams, questions, tests, results, invoices, accuracyAgg, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.exam.count(),
    prisma.question.count(),
    prisma.test.count(),
    prisma.testResult.count(),
    prisma.invoice.count({ where: { status: "paid" } }),
    prisma.testResult.aggregate({ _avg: { accuracy: true } }),
    prisma.invoice.aggregate({ where: { status: "paid" }, _sum: { amount: true } })
  ]);
  return c.json({
    users,
    admins,
    exams,
    questions,
    tests,
    results,
    invoices,
    revenueCents: revenue._sum.amount ?? 0,
    avgAccuracy: Math.round(accuracyAgg._avg.accuracy ?? 0)
  });
});

// src/middleware/rbac.ts
function roleGuard(...requiredRoles) {
  return async (c, next) => {
    const userId = c.get("userId");
    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    if (!requiredRoles.includes(user.role)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    await next();
  };
}

// src/app.ts
var prisma = new PrismaClient();
var app = new Hono14();
app.use("*", structuredLogger);
app.use("*", compress());
app.use("*", securityHeaders);
var allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean);
app.use("*", cors({
  origin: allowedOrigins,
  credentials: true
}));
app.get("/api/health", async (c) => {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "down";
  }
  return c.json({
    status: db === "ok" ? "ok" : "degraded",
    db,
    uptime: Math.floor(process.uptime()),
    mode: process.env.NODE_ENV || "development",
    cache: cacheMode,
    mock: {
      stripe: !process.env.STRIPE_SECRET_KEY,
      email: !process.env.RESEND_API_KEY
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.route("/api/auth", authRoutes);
var protectedApp = new Hono14();
protectedApp.use("*", authMiddleware);
protectedApp.use("*", rateLimit({ windowMs: 6e4, max: 100, key: (c) => c.get("userId") }));
protectedApp.route("/users", userRoutes);
protectedApp.route("/exams", examRoutes);
protectedApp.route("/questions", questionRoutes);
protectedApp.route("/tests", testRoutes);
protectedApp.route("/performance", performanceRoutes);
protectedApp.route("/dashboard", dashboardRoutes);
protectedApp.route("/rank", rankRoutes);
protectedApp.route("/", strategyRoutes);
protectedApp.route("/revision", revisionRoutes);
protectedApp.route("/payments", paymentsRoutes);
protectedApp.route("/realtime", realtimeRoutes);
protectedApp.use("/admin", roleGuard("admin"));
protectedApp.route("/admin", adminRoutes);
app.route("/api/payments/webhook", webhookRoute);
app.route("/api", protectedApp);
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});
app.onError((err, c) => {
  const rid = c.req.header("x-request-id") ?? crypto.randomUUID();
  console.error(JSON.stringify({ level: "error", request_id: rid, route: c.req.path, message: err.message }));
  return c.json({ error: "Internal server error", requestId: rid }, 500);
});

// scripts/vercel-entry.ts
var runtime = "nodejs";
async function toWebRequest(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let body;
  if (hasBody) {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8") || void 0));
      req.on("error", () => resolve(void 0));
    });
  }
  return new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: hasBody ? body : void 0
  });
}
async function writeNodeResponse(res, response) {
  res.statusCode = response.status;
  for (const [k, v] of response.headers.entries()) {
    res.setHeader(k, v);
  }
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
}
var fetchHandler = handle(app);
async function handler(req, res) {
  if (req && typeof req.headers?.get === "function" && req instanceof Request) {
    return fetchHandler(req);
  }
  const incoming = req;
  const response = await fetchHandler(await toWebRequest(incoming));
  if (res) {
    await writeNodeResponse(res, response);
    return;
  }
  return response;
}
export {
  handler as default,
  runtime
};
