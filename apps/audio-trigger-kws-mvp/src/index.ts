import { env } from './config/env.js';
import { AudioTriggerRuntime } from './runtime/audio-trigger-runtime.js';

const isDemo = process.argv.includes('--demo');
const isDemoFull = process.argv.includes('--demo-full');
const demoWaitMs = Number.parseInt(process.env.DEMO_WAIT_MS ?? '45000', 10);

const runtime = new AudioTriggerRuntime();
runtime.start();

const run = async (): Promise<void> => {
  if (isDemo) {
    console.log(
      `Running demo with mini-omni mode=${env.miniOmni.mode} endpoint=${env.miniOmni.apiUrl ?? `${env.miniOmni.baseUrl}${env.miniOmni.chatPath}`}`
    );
    const streamId = 'demo_stream_01';
    runtime.ingestText(streamId, 'aspirin 200 mg please');
    if (isDemoFull) {
      runtime.ingestText(streamId, 'i am in distress self harm');
    }

    await new Promise((resolve) => setTimeout(resolve, demoWaitMs));
    await runtime.flush();
    await runtime.stop();
    console.log('Demo completed.');
    return;
  }

  console.log('Audio Trigger KWS MVP runtime initialized.');
  console.log('Use `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp serve` for API mode.');
  console.log('Use `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp demo` for simulation mode.');
};

void run();
