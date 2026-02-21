import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { z } from "zod";

export const KodoConfigSchema = z.object({
  version: z.literal(1),
  dataPath: z.string().min(1),
});
export type KodoConfig = z.infer<typeof KodoConfigSchema>;

export const DEFAULT_DATA_PATH = ".kodo/todos/default/todos.json";

export const KODO_DIR = ".kodo";
const CONFIG_FILENAME = "config.json";

function configFilePath(rootDir: string): string {
  return join(rootDir, KODO_DIR, CONFIG_FILENAME);
}

export function isInitialized(rootDir: string = process.cwd()): boolean {
  return existsSync(configFilePath(rootDir));
}

export async function loadConfig(
  rootDir: string = process.cwd()
): Promise<KodoConfig | null> {
  const filePath = configFilePath(rootDir);
  if (!existsSync(filePath)) return null;
  try {
    const raw = await readFile(filePath, "utf-8");
    return KodoConfigSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveConfig(
  config: KodoConfig,
  rootDir: string = process.cwd()
): Promise<void> {
  const filePath = configFilePath(rootDir);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function resolveDataPath(
  config: KodoConfig,
  rootDir: string = process.cwd()
): string {
  return resolve(rootDir, config.dataPath);
}
