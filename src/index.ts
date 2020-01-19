import * as fs from "fs"
import { Pool, PoolConfig } from "pg"
import * as Migrations from "postgres-migrations"

const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay))

async function keepTryingWhileOnStandby(config: PoolConfig) {
  for (let standByAttempt = 1; standByAttempt < 60; standByAttempt++) {
    try {
      const database = new Pool(config)
      await database.connect()
      return database
    } catch (standByError) {
      if (standByError && standByError.code === "57P03") {
        await sleep(500)
      } else {
        throw standByError
      }
    }
  }

  throw Error("Maximum re-connection tries while waiting for database to finish starting up / shutting down exceeded.")
}

async function connect(config: PoolConfig) {
  let lastError: Error | undefined

  for (let attempt = 1, delay = 250; delay <= 12000; attempt++ , delay = Math.round(delay * 1.5)) {
    try {
      try {
        const database = new Pool(config)
        await database.connect()
        return database
      } catch (error) {
        if (error && error.code === "57P03") {
          // Database is starting up or shutting down right now
          // tslint:disable-next-line no-console
          console.error(`Database connection attempt #${attempt} failed. Database is starting up or shutting down. Standing by…`)

          return await keepTryingWhileOnStandby(config)
        } else {
          throw error
        }
      }
    } catch (error) {
      // tslint:disable-next-line no-console
      console.error(`Database connection attempt #${attempt} failed:`, error)
      lastError = error
      await sleep(delay)
    }
  }

  throw lastError
}

interface MigrationOptions {
  detailLogger?: typeof console.log
}

export async function migrateDatabase(config: PoolConfig, migrationsDirPath: string, options: MigrationOptions = {}) {
  // Just for the sake of the connection re-attempt
  await connect(config)

  const {
    detailLogger = () => undefined
  } = options

  return Migrations.migrate(config as any, migrationsDirPath, { logger: detailLogger })
}

export async function seedDatabase(config: PoolConfig, seedFilePaths: string[]) {
  const database = await connect(config)

  try {
    await database.query("BEGIN TRANSACTION")

    for (const seedFilePath of seedFilePaths) {
      const sqlContent = fs.readFileSync(seedFilePath, "utf8")
      await database.query(sqlContent)
    }

    await database.query("COMMIT")
  } catch (error) {
    await database.query("ROLLBACK")
    throw error
  }
}
