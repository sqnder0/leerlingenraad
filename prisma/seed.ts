import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Active school year ---------------------------------------------
  const schoolYear = await prisma.schoolYear.upsert({
    where: { label: "2025-2026" },
    update: {},
    create: {
      label: "2025-2026",
      startsAt: new Date("2025-09-01"),
      endsAt: new Date("2026-06-30"),
      isActive: true,
    },
  });

  // --- Users -------------------------------------------------------------
  // Fallback-auth scheme (plan §Confirmed decisions): password = last name.
  const admin = await prisma.user.upsert({
    where: { username: "sander" },
    update: { passwordHash: await hashPassword("Pelgrims") },
    create: {
      firstName: "Sander",
      lastName: "Pelgrims",
      username: "sander",
      passwordHash: await hashPassword("Pelgrims"),
      role: "ADMIN",
      status: "APPROVED",
      classGroup: "6A",
      approvedAt: new Date(),
    },
  });

  const [emma, lukas, fien] = await Promise.all([
    prisma.user.upsert({
      where: { username: "emma" },
      update: { passwordHash: await hashPassword("Verhoeven") },
      create: {
        firstName: "Emma",
        lastName: "Verhoeven",
        username: "emma",
        passwordHash: await hashPassword("Verhoeven"),
        role: "MEMBER",
        status: "APPROVED",
        classGroup: "5B",
        approvedById: admin.id,
        approvedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { username: "lukas" },
      update: { passwordHash: await hashPassword("Van Damme") },
      create: {
        firstName: "Lukas",
        lastName: "Van Damme",
        username: "lukas",
        passwordHash: await hashPassword("Van Damme"),
        role: "MEMBER",
        status: "APPROVED",
        classGroup: "4C",
        approvedById: admin.id,
        approvedAt: new Date(),
      },
    }),
    // Still awaiting approval, to exercise the admin approval queue (M2).
    prisma.user.upsert({
      where: { username: "fien" },
      update: { passwordHash: await hashPassword("Willems") },
      create: {
        firstName: "Fien",
        lastName: "Willems",
        username: "fien",
        passwordHash: await hashPassword("Willems"),
        role: "MEMBER",
        status: "PENDING",
        classGroup: "3A",
      },
    }),
  ]);

  // --- Events --------------------------------------------------------------
  const quiz = await prisma.event.upsert({
    where: { id: "seed-event-quiz" },
    update: {},
    create: {
      id: "seed-event-quiz",
      title: "Jaarlijkse quiz",
      description: "De leerlingenraad organiseert de jaarlijkse quizavond.",
      location: "Refter",
      startAt: new Date("2026-11-20T18:00:00+01:00"),
      endAt: new Date("2026-11-20T22:00:00+01:00"),
      pointValue: 3,
      status: "PUBLISHED",
      schoolYearId: schoolYear.id,
      createdById: admin.id,
    },
  });

  const dagVanDeLeerlingenraad = await prisma.event.upsert({
    where: { id: "seed-event-dvdl" },
    update: {},
    create: {
      id: "seed-event-dvdl",
      title: "Dag van de Leerlingenraad",
      location: "Speelplaats",
      startAt: new Date("2026-03-12T08:30:00+01:00"),
      endAt: new Date("2026-03-12T16:00:00+01:00"),
      pointValue: 5,
      status: "DRAFT",
      schoolYearId: schoolYear.id,
      createdById: admin.id,
    },
  });

  // Already happened and confirmed, to exercise the points dashboard (M4).
  const schoolwinkeltje = await prisma.event.upsert({
    where: { id: "seed-event-winkeltje" },
    update: {},
    create: {
      id: "seed-event-winkeltje",
      title: "Schoolwinkeltje bemannen",
      location: "Huisje op de speelplaats",
      startAt: new Date("2026-09-10T10:00:00+02:00"),
      endAt: new Date("2026-09-10T14:00:00+02:00"),
      pointValue: 2,
      status: "COMPLETED",
      schoolYearId: schoolYear.id,
      createdById: admin.id,
    },
  });

  // --- Signups + attendance -------------------------------------------
  await prisma.signup.upsert({
    where: { eventId_userId: { eventId: quiz.id, userId: emma.id } },
    update: {},
    create: { eventId: quiz.id, userId: emma.id, response: "GOING" },
  });
  await prisma.signup.upsert({
    where: { eventId_userId: { eventId: quiz.id, userId: lukas.id } },
    update: {},
    create: { eventId: quiz.id, userId: lukas.id, response: "NOT_GOING" },
  });

  const winkeltjeSignup = await prisma.signup.upsert({
    where: { eventId_userId: { eventId: schoolwinkeltje.id, userId: emma.id } },
    update: {},
    create: {
      eventId: schoolwinkeltje.id,
      userId: emma.id,
      response: "GOING",
      attended: "PRESENT",
      pointsAwarded: true,
    },
  });

  // --- Points ledger (attendance-based entry for the completed event) ---
  await prisma.pointsLedger.upsert({
    where: { id: "seed-ledger-winkeltje-emma" },
    update: {},
    create: {
      id: "seed-ledger-winkeltje-emma",
      userId: emma.id,
      delta: schoolwinkeltje.pointValue,
      reason: `Aanwezig op "${schoolwinkeltje.title}"`,
      type: "EVENT_ATTENDANCE",
      eventId: schoolwinkeltje.id,
      signupId: winkeltjeSignup.id,
      schoolYearId: schoolYear.id,
      createdById: admin.id,
    },
  });

  console.log({
    schoolYear: schoolYear.label,
    users: [admin.username, emma.username, lukas.username, fien.username],
    events: [quiz.title, dagVanDeLeerlingenraad.title, schoolwinkeltje.title],
  });
  console.log(
    "Dev-login (fallback auth, wachtwoord = achternaam): sander/Pelgrims (ADMIN), emma/Verhoeven, lukas/Van Damme, fien/Willems (PENDING)",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
