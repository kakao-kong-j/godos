import React from "react";
import { Box, Text } from "ink";

interface Props {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: Props) {
  return (
    <Box marginBottom={0}>
      <Text color="cyan" bold>
        {label}:{" "}
      </Text>
      {children}
    </Box>
  );
}
