import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";

export const GodosConfigSchema = z.object({
  version: z.literal(1),
  dataPath: z.string().min(1),
});
export type GodosConfig = z.infer<typeof GodosConfigSchema>;

export const DEFAULT_DATA_PATH = "todos/default/todos.json";

export const GODOS_DIR = ".godos";
const CONFIG_FILENAME = "config.json";

export function godosRoot(): string {
  return join(homedir(), GODOS_DIR);
}

function configFilePath(): string {
  return join(godosRoot(), CONFIG_FILENAME);
}

export function isInitialized(): boolean {
  return existsSync(configFilePath());
}

export async function loadConfig(): Promise<GodosConfig | null> {
  const filePath = configFilePath();
  if (!existsSync(filePath)) return null;
  try {
    const raw = await readFile(filePath, "utf-8");
    return GodosConfigSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveConfig(config: GodosConfig): Promise<void> {
  const filePath = configFilePath();
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function resolveDataPath(config: GodosConfig): string {
  return resolve(godosRoot(), config.dataPath);
}
