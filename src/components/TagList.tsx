import React from "react";
import { Text } from "ink";

interface Props {
  tags: string[];
}

export function TagList({ tags }: Props) {
  if (tags.length === 0) return null;
  return (
    <Text color="magenta">
      {tags.map((t) => `#${t}`).join(" ")}
    </Text>
  );
}
