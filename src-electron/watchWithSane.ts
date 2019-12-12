import * as sane from "sane"
import { state } from './localState'

export const watchWithSane = (watchDirectory: string) => {
  const watcher = sane(watchDirectory, { glob: '**/*.*' })
  watcher.on('ready', () => {
    console.log('ready', '\n')
  })

  watcher.on('change', (filepath, root, stat) => {
    console.log('watcher on change')
    console.log(state.getState())
    if (state.getState()['syncInProgress'] === true) return
    console.log(`\nfile changed: ${filepath}`, root, stat)
  })

  watcher.on('add', (filepath, root, stat) => {
    console.log('watcher on dd')
    console.log(state.getState())
    if (state.getState()['syncInProgress'] === true) return
    console.log(`\nfile add: ${filepath}`, root, stat)
  })

  watcher.on('delete', (filepath, root) => {
    if (state.getState()['syncInProgress'] === true) return
    console.log('\nfile delete', filepath, root)
  })
}
