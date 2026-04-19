import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const email = requireEnv("SEED_USER_EMAIL");
  const password = requireEnv("SEED_USER_PASSWORD");
  const nome = requireEnv("SEED_USER_NAME");

  const passwordHash = await hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, nome, passwordHash },
  });

  console.log(`Seed user ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
