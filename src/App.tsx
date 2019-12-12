import React from 'react'
import { ipcRenderer } from 'electron'
import Registry from 'winreg'

import './app.css'

import { SyncFileList } from './SyncFileList'

export class App extends React.Component {
  state = {
    showWatchmanDebug: true,
    files: [],
  }

  componentDidMount() {
    ipcRenderer.on(
      'update-file-progress',
      (
        event,
        instanceId,
        documentName,
        documentPath,
        receivedLength,
        contentLength
      ) => {
        let fileToModify = this.state.files.find(
          f => f.instanceId == instanceId
        )
        const filteredFiles = this.state.files.filter(
          f => f.instanceId !== instanceId
        )

        if (!fileToModify) {
          this.setState({
            files: [
              ...filteredFiles,
              {
                instanceId: instanceId,
                name: documentName,
                path: documentPath,
                action: 'upload',
                progress:
                  (parseInt(receivedLength) / parseInt(contentLength)) * 100,
                position: filteredFiles.length + 1,
              },
            ],
          })
        } else {
          const updatedProgress =
            (parseInt(receivedLength) / parseInt(contentLength)) * 100
          if (parseInt(fileToModify['progress']) === 100) {
            // we need to update the position to the head:
            fileToModify['position'] = filteredFiles.length + 1
          }

          fileToModify['progress'] = updatedProgress

          this.setState({
            files: [...filteredFiles, fileToModify],
          })
        }
      }
    )
  }

  fetchDataSourceContents = () => {
    ipcRenderer.send('fetchDataSourceContents')
  }

  clearList = () => {
    this.setState({
      files: [],
    })
  }

  render() {
    return (
      <>
        <h1 id="title">ProjectWise SaaS Sync</h1>
        <>
          {/* <button onClick={this.fetchDataSourceContents}>Reinitialize</button> */}
          <SyncFileList files={this.state.files} clearList={this.clearList} />
        </>
      </>
    )
  }
}
