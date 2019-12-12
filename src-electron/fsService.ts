import * as path from 'path'
import * as fs from 'fs'
import { asyncForEach } from './helpers/utils'

export const createNewFiles = async (
  files,
  fileParentPath,
  getContent,
  onCreateSuccess,
) => {
  const promises = []
  asyncForEach(files, async file => {
    promises.push(
      new Promise(async (resolve, reject) => {
        const fileName = file.properties.Name

        const filePath = path.resolve(fileParentPath, fileName)
        const fileContents = await getContent(file, filePath)

        // assume the best, that fs === db
        // and that file hasn't changed :) ... for now ...

        fs.writeFile(filePath, fileContents || '', async err => {
          if (err) return handleWriteFileError(err)
          await onCreateSuccess(file, filePath)
          resolve()
        })
      }),
    )
  })

  return Promise.all(promises)
}

export const createNewFolders = (folders, currentPath, onCreateSuccess?) => {
  folders.forEach(folder => {
    const folderPath = path.resolve(currentPath, folder.properties.Name)

    // assuming the best - that fs === db
    if (fs.existsSync(folderPath)) return

    fs.mkdir(folderPath, async err =>
      err
        ? console.error(err)
        : onCreateSuccess &&
          onCreateSuccess(
            folderPath,
            folder.instanceId,
            folder.properties.ParentGuid,
          ),
    )
  })
}

const handleWriteFileError = err => console.error(err)
