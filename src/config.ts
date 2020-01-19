import DotEnv from "dotenv"
import * as path from "path"
import { PoolConfig } from "pg"

for (
  let directory = process.cwd();
  path.resolve(directory, "..") !== path.resolve(directory);
  directory = path.resolve(directory, "..")
) {
  DotEnv.config({
    path: path.join(directory, ".env")
  })
}

function fail(message: string): never {
  throw Error(message)
}

export function readConfig(cliOptions: Record<string, string>): PoolConfig {
  return {
    database: cliOptions.database || process.env.PGDATABASE || fail("Neither --database nor PGDATABASE set."),
    host: cliOptions.host || process.env.PGHOST || fail("Neither --host nor PGHOST set."),
    password: cliOptions.password || process.env.PGPASSWORD || fail("Neither --password nor PGPASSWORD set."),
    port: Number.parseInt(cliOptions.port || process.env.PGPORT || "5432", 10),
    user: cliOptions.user || process.env.PGUSER || fail("Neither --user nor PGUSER set.")
  }
}
