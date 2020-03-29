// tslint:disable no-console

import * as fs from "fs"
import meow from "meow"
import * as path from "path"
import { readConfig } from "./config"
import { migrateDatabase, seedDatabase } from "./index"

const cli = meow(`
  Usage
    $ plow migrate ./migrations/*.sql
    $ plow seed ./seeds/*.sql

  General options
    --help                Print this usage help
    --verbose             Enable more detailed logging
    --version             Print the installed plow version

  Connection options
    --database <name>     Name of the database
    --host <host>         Database host, defaults to "localhost"
    --port <port>         Port the database listens on, defaults to 5432
    --user <name>         User name to authenticate as
    --password <password> Password to use for authentication

  Environment variables
    You can also configure the connection using these environment variables.

    PGDATABASE, PGHOST, PGPASSWORD, PGPORT, PGUSER
`)

main()

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

async function main() {
  const command = cli.input[0] || ""
  const cliArguments = cli.input.slice(1)

  switch (command.toLowerCase()) {
    case "migrate":
      await migrate(cliArguments)
      break
    case "seed":
      await seed(cliArguments)
      break
    default:
      cli.showHelp()
      process.exit(2)
  }

  process.exit(0)
}

async function migrate(files: string[]) {
  if (files.length === 0) {
    fail("Missing command line arguments: Expected the migration file paths or a directory path.")
  }

  const config = readConfig(cli.flags as Record<string, string>)
  const migrationsDirPath = getMigrationsDirectory(files)

  const migrations = await migrateDatabase(config, migrationsDirPath, {
    detailLogger: cli.flags.verbose ? console.log.bind(console) : undefined
  })

  console.log("Database migration done.")
  console.log("Migrations run:")

  if (migrations.length === 0) {
    console.log("  (None)")
  }

  for (const migration of migrations) {
    console.log(`  - ${migration.name}`)
  }
}

async function seed(files: string[]) {
  if (files.length === 0) {
    fail("Missing command line arguments: Expected the seed file paths or a directory path.")
  }

  const config = readConfig(cli.flags as Record<string, string>)
  const seedFilePaths = getSeedFiles(files)

  await seedDatabase(config, seedFilePaths)

  console.log("Database seeded.")
  console.log("Applied seeds:")

  if (seedFilePaths.length === 0) {
    console.log("  (None)")
  }

  for (const seedFile of seedFilePaths) {
    console.log(`  - ${seedFile}`)
  }
}

function getMigrationsDirectory(files: string[]) {
  if (files.length === 1 && fs.statSync(files[0]).isDirectory()) {
    return files[0]
  }

  const parentPaths = files
    .map(file => path.isAbsolute(file) ? path.resolve(file) : path.resolve(process.cwd(), file))
    .map(file => path.dirname(file))

  for (const parentPath of parentPaths.slice(1)) {
    if (parentPath !== parentPaths[0]) {
      throw new Error("Multiple migration files must all reside in the same common directory.")
    }
  }

  return parentPaths[0]
}

function getSeedFiles(files: string[]) {
  const filePaths: string[] = []

  for (const file of files) {
    if (fs.statSync(file).isDirectory()) {
      const subFiles = fs.readdirSync(file)
      filePaths.push(...subFiles.map(subfile => path.join(file, subfile)))
    } else if (file.match(/\.(js|sql)$/i)) {
      filePaths.push(file)
    }
  }

  return filePaths
}
