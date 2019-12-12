import { fetchMetadata, downloadProjectContents } from './PWService'
import { createNewFolders } from './fsService'
import { constants } from './helpers/constants'
import { asyncForEach } from './helpers/utils'

export class Connection implements SyncConnection {
  public ConnectionInfo: ConnectionInfo
  public ProjectGuid: string
  public SyncedFolders: string[]
  public BaseWSGUrl: string

  constructor(connection: SyncConnection) {
    this.ConnectionInfo = connection.ConnectionInfo
    this.ProjectGuid = connection.ProjectGuid
    this.SyncedFolders = connection.SyncedFolders
    this.BaseWSGUrl = this.constructBaseUrl()
  }

  public initializeSyncFolders() {
    asyncForEach(this.SyncedFolders, async folderId => {
      const folderMetadata = await fetchMetadata(
        this.BaseWSGUrl,
        'Project',
        folderId,
      )

      createNewFolders(folderMetadata, constants.ROOT_WATCH_DIRECTORY)

      const contents = await downloadProjectContents(
        folderId,
        folderMetadata[0].properties.Name,
        this.BaseWSGUrl,
      )
    })

    console.log('Downloaded Synced Folders')
  }

  private constructBaseUrl(): string {
    return `${this.ConnectionInfo.ServerUrl}v2.8/repositories/${this.ConnectionInfo.DataSourceId}/${this.ConnectionInfo.Schema}/`
  }
}
