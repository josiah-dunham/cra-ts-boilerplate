import React from 'react'
import logo from './logo.svg'
import './App.css'

import fs from 'fs'

fs.readdir('.', (err, files) => {
  console.log('files', files)
})

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Electron.</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

export default App
