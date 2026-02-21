import React from "react";
import { Box, Text } from "ink";

interface Props {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: Props) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">
        {title}
      </Text>
      {subtitle && <Text color="gray">{subtitle}</Text>}
    </Box>
  );
}
