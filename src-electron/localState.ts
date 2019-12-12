let store = {}

export const state = {
  getState: () => {
    return store
  },

  addEntry: (key, value) => {
    store[key] = value
  },

  updateEntry: (key, newValue) => {
    if (store[key]) store[key] = newValue
  },
}
