import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { TextInput } from "@inkjs/ui";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Header } from "../components/Header.js";
import { StatusBar } from "../components/StatusBar.js";
import {
  isInitialized,
  saveConfig,
  resolveDataPath,
  godosRoot,
  DEFAULT_DATA_PATH,
  type GodosConfig,
} from "../store/config.js";
import { GitService } from "../git/GitService.js";

type Step = "input" | "confirm_overwrite" | "running" | "done" | "error";

export function InitWizard() {
  const { exit } = useApp();

  const [step, setStep] = useState<Step>("input");
  const [dataPath, setDataPath] = useState(DEFAULT_DATA_PATH);
  const [gitAvailable, setGitAvailable] = useState<boolean | null>(null);
  const [alreadyInit] = useState(() => isInitialized());
  const [errorMsg, setErrorMsg] = useState("");
  const isRunningRef = useRef(false);

  useEffect(() => {
    const git = new GitService(process.cwd(), "", [], 0);
    git.isGitRepo().then(setGitAvailable).catch(() => setGitAvailable(false));
  }, []);

  useInput((input, key) => {
    if (step === "confirm_overwrite" && !isRunningRef.current) {
      if (input === "y" || input === "Y") {
        isRunningRef.current = true;
        void performInit(dataPath);
      } else if (input === "n" || input === "N" || key.escape) {
        exit();
      }
    }
    if (step === "done" || step === "error") {
      if (key.return || key.escape) {
        exit();
      }
    }
  });

  async function performInit(resolvedDataPath: string): Promise<void> {
    setStep("running");
    try {
      const config: GodosConfig = { version: 1, dataPath: resolvedDataPath };
      await saveConfig(config);
      const absDataPath = resolveDataPath(config);
      await mkdir(dirname(absDataPath), { recursive: true });
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }

  function handlePathSubmit(value: string): void {
    const trimmed = value.trim();
    const resolved = trimmed !== "" ? trimmed : DEFAULT_DATA_PATH;
    setDataPath(resolved);

    if (alreadyInit) {
      setStep("confirm_overwrite");
    } else {
      void performInit(resolved);
    }
  }

  return (
    <Box flexDirection="column">
      <Header title="godos init" subtitle="Initialize a godos workspace" />

      {gitAvailable === false && (
        <Box marginBottom={1}>
          <Text color="yellow">
            Warning: git is not available. Auto-commit will be disabled.
          </Text>
        </Box>
      )}

      {step === "input" && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="gray">
              Enter data path (relative to ~/.godos). Press Enter for default.
            </Text>
          </Box>
          <Box>
            <Text color="cyan" bold>
              Path:{" "}
            </Text>
            <TextInput
              placeholder={DEFAULT_DATA_PATH}
              onSubmit={handlePathSubmit}
            />
          </Box>
          <StatusBar
            hints={[
              { key: "Enter", label: "confirm" },
              { key: "Esc", label: "cancel" },
            ]}
          />
        </Box>
      )}

      {step === "confirm_overwrite" && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" bold>
            godos is already initialized.
          </Text>
          <Text color="gray">
            Existing config will be overwritten. Continue? (y/n)
          </Text>
        </Box>
      )}

      {step === "running" && (
        <Box marginTop={1}>
          <Text color="gray">Initializing...</Text>
        </Box>
      )}

      {step === "done" && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="green" bold>
            Initialized godos workspace.
          </Text>
          <Text color="gray">Data path: {dataPath}</Text>
          <Text color="gray">Config written to {godosRoot()}/config.json</Text>
          <Text color="gray" dimColor>
            Press Enter to exit.
          </Text>
        </Box>
      )}

      {step === "error" && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="red" bold>
            Initialization failed.
          </Text>
          <Text color="gray">{errorMsg}</Text>
          <Text color="gray" dimColor>
            Press Enter to exit.
          </Text>
        </Box>
      )}
    </Box>
  );
}
