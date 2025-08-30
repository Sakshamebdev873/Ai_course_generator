import crypto from "crypto";
import argon2 from "argon2";
import dotenv from "dotenv";

dotenv.config();
const PEPPER = process.env.PEPPER;

// Generate a random salt
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

// Hash password: PBKDF2 -> Argon2id
export async function hashPassword(password) {
  const salt = generateSalt();

  // Stage 1: PBKDF2
  const pbkdf2Hash = crypto.pbkdf2Sync(
    password + PEPPER,
    salt,
    100_000, // iterations
    32, // key length in bytes
    "sha256"
  );

  // Stage 2: Argon2id
  const argon2Hash = await argon2.hash(pbkdf2Hash, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 2,
  });
// console.log(salt,argon2Hash);

  return { salt, hash: argon2Hash };
}

// Verify password
export async function verifyPassword(password, storedSalt, storedHash) {
  const pbkdf2Hash = crypto.pbkdf2Sync(
    password + PEPPER,
    storedSalt,
    100_000,
    32,
    "sha256"
  );

  return await argon2.verify(storedHash, pbkdf2Hash);
}

