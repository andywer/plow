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
    database: process.env.PGDATABASE || cliOptions.database || fail("Neither --database nor PGDATABASE set."),
    host: process.env.PGHOST || cliOptions.host || fail("Neither --host nor PGHOST set."),
    password: process.env.PGPASSWORD || cliOptions.password || fail("Neither --password nor PGPASSWORD set."),
    port: Number.parseInt(process.env.PGPORT || cliOptions.port || "5432", 10),
    user: process.env.PGUSER || cliOptions.user || fail("Neither --user nor PGUSER set.")
  }
}
