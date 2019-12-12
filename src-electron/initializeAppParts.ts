import { initialize } from './localDB/store'
import { constants } from './helpers/constants'
import { watchWithSane } from './watchWithSane'
import { fetchConnections } from './PWService'
import { asyncForEach } from './helpers/utils'
import { Connection } from './connection'

const { ROOT_WATCH_DIRECTORY } = constants

export enum SyncActionType {
  Create,
  Update,
  Delete,
  Move,
}

export const initializeDBAndFS = async () => {
  console.log('about to initialize db and fs\n')

  await initialize()
  console.log("init complete\n")
  const connections: any[] = await fetchConnections()

  asyncForEach(connections, async (c: SyncConnection) => {
    const connection: Connection = new Connection(c)
    connection.initializeSyncFolders()
  })

  console.log("initializeDBAndFS Done.")
}

export const initializeWatcher = () => {
  watchWithSane(constants.ROOT_WATCH_DIRECTORY)
}
