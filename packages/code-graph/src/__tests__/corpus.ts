/**
 * Test corpus.
 *
 * Fixtures are written to a temp directory at runtime rather than checked in as
 * files: a `.ts` fixture under `src/` would be compiled by `tsc -b` along with
 * the real sources, and a deliberately odd fixture would then break the build.
 */
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

export const FIXTURES: Record<string, string> = {
  'app/service.ts': `import { Base } from './base';
import type { Runnable } from 'external-pkg';

export const RETRIES = 3;

export interface Runner { run(): void }

export class Service extends Base implements Runner {
  run(): void {
    normalise(RETRIES);
    this.finish();
  }
  private finish() {}
}

export function normalise(n: number) {
  return n;
}
`,
  'app/base.ts': `export class Base {
  boot() {
    return sharedHelper();
  }
}

export function sharedHelper() {
  return 1;
}
`,
  'app/consumer.ts': `import { Service } from './service';

export function launch() {
  const s = new Service();
  s.run();
  normalise(1);
  return sharedHelper();
}

export function sharedHelper() {
  return 2;
}
`,
  'app/legacy.cjs': `const { Service } = require('./service');
const fs = require('node:fs');

function boot() {
  const s = new Service();
  return normalise(1);
}

module.exports = { boot };
`,
  'tools/pipeline.py': `import os
from app.helpers import shape

LIMIT = 10

class Pipeline(BasePipeline):
    def run(self):
        return transform(LIMIT)

def transform(n):
    return os.path.join(str(n))
`,
  'tools/server.go': `package main

import "fmt"

type Server struct{}

type Handler interface{ Serve() }

const Port = 8080

func (s *Server) Serve() {
	fmt.Println(banner())
}

func banner() string {
	return "hi"
}
`,
  'tools/relay.rs': `use std::fmt;

pub const MAX: u8 = 9;

pub struct Relay;

pub trait Transport { fn send(&self); }

impl Transport for Relay {
    fn send(&self) {
        encode();
    }
}

fn encode() -> u8 { MAX }
`,
};

/** Materialise the fixture corpus in a fresh temp directory. Returns its root. */
export async function writeCorpus(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'code-graph-test-'));
  for (const [relPath, content] of Object.entries(FIXTURES)) {
    const full = path.join(root, relPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, 'utf8');
  }
  return root;
}

export async function removeCorpus(root: string): Promise<void> {
  await fs.rm(root, { recursive: true, force: true });
}
