import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: 'gemini-2.5-flash-lite',
});

const copilotRuntime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotRuntime,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  });
  return handleRequest(req);
};
