import React from "react";
import { Box, Text } from "ink";

interface KeyHint {
  key: string;
  label: string;
}

interface Props {
  hints: KeyHint[];
}

export function StatusBar({ hints }: Props) {
  return (
    <Box marginTop={1}>
      {hints.map((h, i) => (
        <Box key={h.key} marginRight={2}>
          <Text color="cyan" bold>
            {h.key}
          </Text>
          <Text color="gray"> {h.label}</Text>
          {i < hints.length - 1 && <Text color="gray"> </Text>}
        </Box>
      ))}
    </Box>
  );
}
