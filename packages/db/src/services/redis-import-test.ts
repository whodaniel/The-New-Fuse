import { Redis } from "ioredis";

const client = new Redis();

async function test() {
  await client.set("foo", "bar");
  const value = await client.get("foo");
  console.log(value);
}

test();
