type SyncActionType = import('./localDB/dbHelpers').SyncActionType

interface Token {
  token_type: string
  id_token: string
  access_token: string
}

// I feel like this isn't the answer to the issue I'm having
// I need this as an enum and also a type
// if I use export enum, then all hell breaks loose and we cannot use this external d.ts file
// if I use declare, all works, but it seems contrary to declare's intended purpose, that
// it tells the ts compiler to look elsewhere for the definition. That's not the case here,
// but all seems to work well.

interface SyncMessage {
  action?: SyncActionType
  userId?: string
  projectId?: string
  targetType?: TargetType
  targetId?: string
  timestamp?: Date
}

interface InitializeSyncOptions {
  samlToken: string
  url: string
  mainWindow: Electron.BrowserWindow
  onUpdate: (msg: SyncMessage) => any
}

interface TargetType {
  Folder
  File
}

// interface SyncActionType {
//   Create: 0;
//   Update: 1;
//   Delete: 2;
//   Move: 3;
// }

type PWInstanceType = 'Document' | 'Project'

interface PWProjectContents {
  instanceId: string
  className: 'Project'
  properties: any
  children: PWProjectContents[]
}

interface PWDocumentContents {
  instanceId: string
  instanceType: 'Project'
  properties: any
}

interface PWResponse {
  instances: PWContents<'Project' | 'Document'>[]
}

interface PWContents<T> {
  instanceId: string
  className: T
  properties: any
  instances: any[]
}

interface SyncConnection {
  ConnectionInfo: ConnectionInfo
  ProjectGuid: string
  SyncedFolders: string[]
}

interface ConnectionInfo {
  Class: string
  ConnectionId: string
  ConnectionUrl: string
  DataSourceId: string
  Description: string
  Name: string
  Schema: string
  ServerUrl: string
  Type: string
}

interface WindowCoordinates {
  x: number
  y: number
}

// const ActionMap = [
//   {
//     Key: 0,
//     Label: 'Create',
//   },
//   {
//     Key: 1,
//     Label: 'Update',
//   },
//   {
//     Key: 2,
//     Label: 'Delete',
//   },
//   {
//     Key: 3,
//     Label: 'Move',
//   },
// ]

// export const TargetMap = [
//   {
//     Key: 0,
//     Label: 'Folder',
//   },
//   {
//     Key: 1,
//     Label: 'File',
//   },
// ]
