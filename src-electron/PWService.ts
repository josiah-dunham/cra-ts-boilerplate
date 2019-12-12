import wretch from 'wretch'
import { resolve } from 'path'

import { getSAMLToken } from './helpers/getSAMLToken'
import { constants } from './helpers/constants'
import { addInstance } from './localDB/dbHelpers'
import { sendFileProgressToFrontEnd } from './electron'
import { createNewFiles, createNewFolders } from './fsService'

const { ROOT_WATCH_DIRECTORY } = constants

let SAML_TOKEN
let currentPath = ROOT_WATCH_DIRECTORY

// Previous implementation was naive and stuck to one datasource URL,
// therefore I was loading it as a default.
const req = async () => {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
  if (!SAML_TOKEN) SAML_TOKEN = await getSAMLToken()

  return wretch()
    .polyfills({
      fetch: require('node-fetch'),
      FormData: require('form-data'),
      URLSearchParams: require('url').URLSearchParams,
    })
    .auth(`SAML ${SAML_TOKEN}`)
}

// recursively downloads a project's contents and returns them as an object
// If we don't want the contents returned, we can simplify this

// 1. We're in a base folder/syncfolder initially
// 2. Download all files in the folder
// 3. Download all children folders in the folder, if any
// 4. If any children folders exist, loop through each and peform 1-4 recursively.
// 5. If not, we're done.

export const downloadProjectContents = async (
  projectId: string,
  projectName: string,
  baseUrl: string,
  additionalProjectProperties?: any,
): Promise<PWProjectContents> => {
  currentPath = resolve(currentPath, projectName)

  const properties = additionalProjectProperties
    ? additionalProjectProperties
    : { Name: projectName }

  let currentProject: PWProjectContents = {
    instanceId: projectId,
    className: 'Project',
    properties,
    children: [],
  }

  const newFiles = await downloadAndCreateFiles(projectId, baseUrl)
  currentProject.children = newFiles

  const newFolders = await downloadAndCreateFolders(projectId, baseUrl)
  if (newFolders) currentProject.children.push(...newFolders)

  if (lastLevelInProject(currentProject)) currentPath = ROOT_WATCH_DIRECTORY

  return currentProject
}

const downloadAndCreateFolders = async (
  projectId: string,
  baseUrl: string,
): Promise<PWProjectContents[]> => {
  try {
    const folders = await fetchInstanceChildren({
      className: 'Project',
      folderId: projectId,
      baseUrl,
    })

    if (folders && folders.instances.length) {
      const addFolderToDb = async (path, instanceId, parentGuid) => {
        await addInstance(path, instanceId, parentGuid, 'Project')
      }

      await createNewFolders(folders.instances, currentPath, addFolderToDb)

      const newFolders: PWProjectContents[] = folders.instances.map(folder =>
        downloadProjectContents(
          folder.instanceId,
          folder.properties.Name,
          baseUrl,
          folder.properties,
        ),
      )

      return await Promise.all(newFolders)
    }
  } catch (error) {
    console.log('Error Downloading Folders: ', error)
  }
}

const downloadAndCreateFiles = async (
  projectId: string,
  baseUrl?: string,
): Promise<PWProjectContents[]> => {
  try {
    const files = await fetchInstanceChildren({
      className: 'Document',
      folderId: projectId,
      baseUrl,
    })

    const newFiles = files && files.instances.length ? files.instances : []

    const getContent = async (file, filePath) => {
      return await downloadFileContents(
        file.instanceId,
        sendFileProgressToFrontEnd(
          file.instanceId,
          file.properties.Name,
          filePath,
        ),
        baseUrl,
      )
    }

    const onCreateSuccess = async (file, filePath) => {
      await addInstance(
        filePath,
        file.instanceId,
        file.properties.ParentGuid,
        'Document',
      )
    }

    await createNewFiles(newFiles, currentPath, getContent, onCreateSuccess)
    return newFiles
  } catch (error) {
    console.log('error downloading document instance metadata: ', error)
  }
}

const fetchInstanceChildren = async ({
  className,
  folderId,
  baseUrl,
}: {
  className: PWInstanceType
  folderId: string
  baseUrl: string
}) =>
  (await req())
    .url(`${baseUrl}/${className}?&$filter=ParentGuid eq '${folderId}'`, true)
    .get()
    .json(response => {
      return response
    })
    .catch(err => {
      console.error(err)
    })

// this will be a basic implementation
// also see https://localhost/wps/Pages/documentation/api_ref.html#GET_v2_4_Repositories__repository___schema___class___instanceId___file
// for resumable downloads.

export async function downloadFileContents(
  instanceId: string,
  updateProgress: (
    receivedLength: number | string,
    contentLength: number | string,
  ) => void,
  baseUrl?: string,
): Promise<string | void> {
  const request = await req()

  let response
  if (baseUrl) {
    response = await request
      .url(`${baseUrl}/Document/${instanceId}/$file`, true)
      .get()
      .res()
      .then(res => res)
  } else {
    response = await request
      .url(`Document/${instanceId}/$file`)
      .get()
      .res()
      .then(res => res)
  }

  const body: any = response.body
  const contentLength = response.headers.get('Content-Length')

  let receivedLength = 0
  let chunks = []

  if (contentLength !== '0') {
    chunks = await new Promise((resolve, reject) => {
      body.on('readable', async () => {
        let chunk
        while (null !== (chunk = body.read())) {
          chunks.push(chunk)
          receivedLength += chunk.length

          await updateProgress(receivedLength, contentLength)
        }
        resolve(chunks)
      })
    })

    let chunksAll = new Uint8Array(receivedLength)
    let position = 0

    for (let chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    return new TextDecoder('utf-8').decode(chunksAll)
  } else {
    return ''
  }
}

export async function fetchMetadata(
  baseUrl: string,
  className: string,
  instanceId: string,
): Promise<PWContents<'Document' | 'Project'>> {
  return (await req())
    .url(`${baseUrl}/${className}/${instanceId}`, true)
    .get()
    .json(response => response.instances)
    .catch(err => {
      console.error(err)
    })
}

const lastLevelInProject = (currentProject: PWProjectContents): boolean =>
  !currentProject.children ||
  !currentProject.children.some(c => c.className === 'Project')

export async function fetchConnections(): Promise<any> {
  console.log('fetching connections')
  return (await req())
    .url(
      'https://dev-connect-productsettingsservice.bentley.com/v1.0/Application/2636/User/setting/SyncFolders',
      true,
    )
    .auth(`SAML ${constants.TEMP_DEV_SAML_TOKEN}`)
    .get()
    .json(response => response.properties.SyncConnections)
}

export async function fetchSyncFolders(): Promise<string[]> {
  const connections = await fetchConnections()
  const syncFolders = connections.map(c => c.SyncedFolders).flat()

  return syncFolders
}
