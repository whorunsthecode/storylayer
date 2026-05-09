'use client';

import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { Workspace } from '@/components/workspace/Workspace';

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <Workspace />
      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: 'Pitch Copilot',
          initial:
            "Refine your pitch in plain English. Try: “rewrite the values card more sharply” or “make shipped-work emphasize speed, not range.”",
        }}
      />
    </CopilotKit>
  );
}
