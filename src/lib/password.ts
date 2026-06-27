import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

const ALGORITHM = "pbkdf2_sha256";
const DEFAULT_ITERATIONS = 100000;

export function hashPassword(password: string, salt: string, iterations = DEFAULT_ITERATIONS) {
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64");
  return `${ALGORITHM}$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split("$");
  if (algorithm !== ALGORITHM || !iterationsText || !salt || !expectedHash) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 1) return false;

  const actual = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHash, "base64");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
