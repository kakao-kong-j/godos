import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { z } from "zod";

export const GodosConfigSchema = z.object({
  version: z.literal(1),
  dataPath: z.string().min(1),
});
export type GodosConfig = z.infer<typeof GodosConfigSchema>;

export const DEFAULT_DATA_PATH = ".godos/todos/default/todos.json";

export const GODOS_DIR = ".godos";
const CONFIG_FILENAME = "config.json";

function configFilePath(rootDir: string): string {
  return join(rootDir, GODOS_DIR, CONFIG_FILENAME);
}

export function isInitialized(rootDir: string = process.cwd()): boolean {
  return existsSync(configFilePath(rootDir));
}

export async function loadConfig(
  rootDir: string = process.cwd()
): Promise<GodosConfig | null> {
  const filePath = configFilePath(rootDir);
  if (!existsSync(filePath)) return null;
  try {
    const raw = await readFile(filePath, "utf-8");
    return GodosConfigSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveConfig(
  config: GodosConfig,
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
  config: GodosConfig,
  rootDir: string = process.cwd()
): string {
  return resolve(rootDir, config.dataPath);
}
