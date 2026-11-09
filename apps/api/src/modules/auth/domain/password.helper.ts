import { hash, verify } from "@node-rs/argon2";

const TIMING_DUMMY_PASSWORD = "timing-equalizer-not-a-real-password";

export class PasswordHelper {
  private static dummyHash: Promise<string> | null = null;

  static hash(password: string): Promise<string> {
    return hash(password);
  }

  static verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }

  // Runs a full verify when the account doesn't exist, so "unknown email" and
  // "wrong password" take the same time and can't be told apart.
  static async verifyAgainstDummy(password: string): Promise<false> {
    PasswordHelper.dummyHash ??= hash(TIMING_DUMMY_PASSWORD);
    await verify(await PasswordHelper.dummyHash, password);
    return false;
  }
}
