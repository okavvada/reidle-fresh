import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
const databaseUrl = Deno.env.get("POLYSCALE_URL")!;
const pool = new postgres.Pool(databaseUrl, 3, true);
type Cleanup = () => unknown;
export default async function runDb<T>(
  runner: (
    client: postgres.PoolClient,
    cleanup: (cleanup: Cleanup) => void,
  ) => T | Promise<T>,
): Promise<T | null> {
  try {
    const cxn = await pool.connect();
    const cleanups = [] as Cleanup[];
    const returnValue = await runner(cxn, (x) => cleanups.push(x));
    Promise.all(cleanups.map((x) => x())).then(() => cxn.release());
    return returnValue;
  } catch (e) {
    console.error(e);
    await pool.end();
    return null;
  }
}
