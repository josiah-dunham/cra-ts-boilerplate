import { Database, open } from 'sqlite'
import { constants } from '../helpers/constants'
import SQL from 'sql-template-strings'
import { basename } from 'path'
import { Statement } from 'sqlite3'
import { readFileSync } from 'fs'
import { downloadFileContents, fetchMetadata } from '../PWService'
import { sendFileProgressToFrontEnd } from '../electron'
const md5 = require('md5-jkmyers')

/**
 * Ben P Note 12/6/19:
 *
 * In general, I haven't updated this file since removing SignalR
 * and changing the app to loop through a user's syncFolders
 * as opposed to hard coding a base project id.
 *
 * In addition, we may want to add more fields to the db.
 */

export enum SyncActionType {
  Create,
  Update,
  Delete,
  Move,
}
const { DATABASE_PATH, ROOT_WATCH_DIRECTORY } = constants

const dbPromise: Promise<Database> = open(DATABASE_PATH)

export function createDatabase(name: string) {}

export async function updateDatabase(msg: SyncMessage) {
  const db = await dbPromise
}

export function insertRow() {}

export async function addInstance(
  localPath: string,
  instanceId: string,
  parentGuid: string,
  instanceType: PWInstanceType,
): Promise<Statement> {
  const db = await dbPromise
  let result

  if (instanceType === 'Project') {
    result = await db.run(
      SQL`INSERT INTO Projects (instanceId, baseName, localPath, parentGuid) VALUES (${instanceId}, ${basename(
        localPath,
      )},${localPath}, ${parentGuid})`,
    )
  }

  if (instanceType === 'Document') {
    const fileData = readFileSync(localPath, 'utf8')

    const fileHash = md5(fileData)

    result = await db.run(
      SQL`INSERT INTO Documents (instanceId, baseName, localPath, parentGuid, md5Hash) VALUES (${instanceId}, ${basename(
        localPath,
      )},${localPath}, ${parentGuid}, ${fileHash})`,
    )
  }
  return result
}

export async function deleteInstance(
  instanceId: string,
  instanceType: PWInstanceType,
): Promise<string> {
  const db = await dbPromise

  if (instanceType !== 'Document' && instanceType !== 'Project') return

  const pluralizedInstanceType = `${instanceType}s`
  const pathDeletedResult = await db.get(
    SQL`SELECT localPath FROM Documents WHERE instanceId = ${instanceId}`,
  )

  const pathDeleted = pathDeletedResult.localPath
  const result = await db.run(
    SQL`DELETE FROM Documents WHERE instanceId = ${instanceId}`,
  )

  return pathDeleted
}

export async function updateInstance(
  instanceId: string,
  instanceType: PWInstanceType,
  callback: (path: string, newerFileContent: string) => void,
): Promise<string> {
  const db = await dbPromise

  if (instanceType !== 'Document' && instanceType !== 'Project') return

  const documentProperties = await db.get(
    SQL`SELECT localPath, baseName, md5Hash FROM Documents WHERE instanceId = ${instanceId}`,
  )

  let nameChanged = false

  /**
   * Notes:
   * perhaps the path has changed?
   * perhaps the metadata has changed?
   * only metadata we're storing is the baseName, which isn't really metadata
   * we're not storing any other properties for now...
   */

  const newInstanceMetadata = (
    await fetchMetadata(documentProperties.accessUrl, 'Document', instanceId)
  )[0]

  if (newInstanceMetadata.properties.Name !== documentProperties.baseName) {
    nameChanged = true
  }

  const definitiveDocumentName = nameChanged
    ? newInstanceMetadata.properties.Name
    : documentProperties.baseName

  /**
   * if we need to loop over other properties, we can do this here:
   * const changedProperties = newInstanceMetadata.keys().filter(k => {
   *   // Assuming we can compare via equality...
   *   newInstanceMetadata[k];
   * });
   * !! Ideally, we'd have the content hash on the server so we could tell before downloading if we need to update
   * For now, it's okay to show the download progress to the user,
   * but eventually, it'd be awesome if we could store a hash of the content on the server.
   */

  const currentPath = documentProperties.localPath

  // BEN NOTE 12/5/19 -
  // If we're keeping this implementation we'll need the baseurl... will need to store/parse from db.
  const newerFileContent =
    (await downloadFileContents(
      instanceId,
      sendFileProgressToFrontEnd(
        instanceId,
        definitiveDocumentName,
        currentPath,
      ),
    )) || ''

  const currentFileContentHash = documentProperties.md5Hash
  const newerFileContentHash = md5(newerFileContent)

  if (currentFileContentHash !== newerFileContentHash) {
    await db.run(
      SQL`UPDATE Documents SET md5Hash = ${newerFileContentHash} WHERE instanceId = ${instanceId}`,
    )

    callback(currentPath, newerFileContent)
  } else {
  }

  return currentPath
}

// OUTDATED:
// we're no longer hard coding the BASE_PROJECT_ID
export async function getFolderPathFromDatabase(
  folderId: string,
): Promise<string | undefined> {
  // if (folderId === BASE_PROJECT_ID) return ROOT_WATCH_DIRECTORY

  const db = await dbPromise
  const result = await db.get(
    SQL`SELECT localPath FROM Projects WHERE instanceId = ${folderId}`,
  )

  return result.localPath
}
