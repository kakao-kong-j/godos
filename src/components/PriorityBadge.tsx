import React from "react";
import { Text } from "ink";
import type { Priority } from "../store/schema.js";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../utils/colors.js";

interface Props {
  priority: Priority;
}

export function PriorityBadge({ priority }: Props) {
  return (
    <Text color={PRIORITY_COLORS[priority]} bold>
      {PRIORITY_LABELS[priority]}
    </Text>
  );
}
