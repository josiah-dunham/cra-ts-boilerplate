import { DirectoryTree } from 'directory-tree'
import { Database, open } from 'sqlite'
import { constants } from '../helpers/constants'
import { asyncForEach } from '../helpers/utils'
import { fetchConnections } from '../PWService'
import { Connection } from '../connection'

const { DATABASE_PATH } = constants

interface StoreInitOptions {
  directory?: string
  baseProjectId: string
}
let store: DirectoryTree

// call this upon intialization
// this no longer belongs here in the store...
export const initialize = async (): Promise<DirectoryTree | void> => {
  await initializeDatabase()

  return store
}

export const initializeDatabase = async () => {
  console.log("initializing db - path:\n")
  console.log(DATABASE_PATH)
  const dbPromise: Promise<Database> = open(DATABASE_PATH)

  const db = await dbPromise

  const documentTableCreated = await db.get(
    "SELECT name FROM sqlite_master WHERE name='Documents'",
  )

  if (!documentTableCreated) await createTables(db)

  // db.close();
}

// not sure if it makes sense to have a table for Documents and one for Projects.
const createTables = async (db: Database) => {
  console.log('creating tables')
  const createTable = await db.run(
    'CREATE TABLE Documents (instanceId TEXT, accessUrl TEXT, baseName TEXT, localPath TEXT, parentGuid TEXT, md5Hash TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
  )

  // updated at... still working on this
  // const dateTimeTrigger = `CREATE TRIGGER insert_timestamp_on_update AFTER UPDATE ON Documents BEGIN UPDATE Documents SET updated_at = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW') WHERE instanceId = NEW.instanceId END;`;
  // await db.run(dateTimeTrigger, ["CURRENT_TIMESTAMP"]);
  // console.log("added trigger");

  await db.run(
    'CREATE TABLE Projects (instanceId TEXT, baseName TEXT, localPath, parentGuid, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
  )

  // test insert
  // await db.run(
  //   `INSERT INTO Documents (instanceId, baseName, localPath, parentGuid) VALUES ('1223-2313-1231-1231', 'myfile.txt', 'ben/myfile.txt', '93489234')`
  // );

  // const selectAll = await db.all("SELECT * FROM Documents");
  // console.log(selectAll);
}
