const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {

  animals: {
    getAll:     ()            => ipcRenderer.invoke('animals:getAll'),
    getById:    (id)          => ipcRenderer.invoke('animals:getById', id),
    create:     (data)        => ipcRenderer.invoke('animals:create', data),
    update:     (id, data)    => ipcRenderer.invoke('animals:update', id, data),
    delete:     (id)          => ipcRenderer.invoke('animals:delete', id),
    getHistory: (id)          => ipcRenderer.invoke('animals:getHistory', id),
  },

  species: {
    getAll: () => ipcRenderer.invoke('species:getAll'),
  },

  morphs: {
    getBySpecies:  (speciesId) => ipcRenderer.invoke('morphs:getBySpecies', speciesId),
    getAll:        ()          => ipcRenderer.invoke('morphs:getAll'),
    search:        (query)     => ipcRenderer.invoke('morphs:search', query),
    getCategories: (speciesId) => ipcRenderer.invoke('morphs:getCategories', speciesId),
  },

  breeding: {
    getAll:            ()                 => ipcRenderer.invoke('breeding:getAll'),
    getById:           (id)               => ipcRenderer.invoke('breeding:getById', id),
    create:            (data)             => ipcRenderer.invoke('breeding:create', data),
    update:            (id, data)         => ipcRenderer.invoke('breeding:update', id, data),
    delete:            (id)               => ipcRenderer.invoke('breeding:delete', id),
    getSuggestedPairs: (speciesId)        => ipcRenderer.invoke('breeding:getSuggestedPairs', speciesId),
    calculateOutcomes: (maleId, femaleId) => ipcRenderer.invoke('breeding:calculateOutcomes', maleId, femaleId),
    getByAnimal:       (animalId)         => ipcRenderer.invoke('breeding:getByAnimal', animalId),
  },

  clutches: {
    getByBreeding: (breedingId) => ipcRenderer.invoke('clutches:getByBreeding', breedingId),
    create:        (data)       => ipcRenderer.invoke('clutches:create', data),
    update:        (id, data)   => ipcRenderer.invoke('clutches:update', id, data),
    delete:        (id)         => ipcRenderer.invoke('clutches:delete', id),
  },

  offspring: {
    getByClutch: (clutchId)       => ipcRenderer.invoke('offspring:getByClutch', clutchId),
    add:         (clutchId, data) => ipcRenderer.invoke('offspring:add', clutchId, data),
    update:      (id, data)       => ipcRenderer.invoke('offspring:update', id, data),
    delete:      (id)             => ipcRenderer.invoke('offspring:delete', id),
  },

  photos: {
    choose:       ()                  => ipcRenderer.invoke('photos:choose'),
    save:         (animalId, files)   => ipcRenderer.invoke('photos:save', animalId, files),
    setPrimary:   (animalId, photoId) => ipcRenderer.invoke('photos:setPrimary', animalId, photoId),
    getForAnimal: (animalId)          => ipcRenderer.invoke('photos:getForAnimal', animalId),
    delete:       (photoId)           => ipcRenderer.invoke('photos:delete', photoId),
    getPath:      (filename)          => ipcRenderer.invoke('photos:getPath', filename),
  },

  measurements: {
    add:    (animalId, data) => ipcRenderer.invoke('measurements:add', animalId, data),
    delete: (id)             => ipcRenderer.invoke('measurements:delete', id),
  },

  feedings: {
    add:    (animalId, data) => ipcRenderer.invoke('feedings:add', animalId, data),
    delete: (id)             => ipcRenderer.invoke('feedings:delete', id),
  },

  pairingEvents: {
    add:    (breedingId, data) => ipcRenderer.invoke('pairingEvents:add', breedingId, data),
    delete: (id)               => ipcRenderer.invoke('pairingEvents:delete', id),
  },

  dashboard: {
    getSummary: () => ipcRenderer.invoke('dashboard:getSummary'),
  },

  genetics: {
    calculate: (maleGenes, femaleGenes) => ipcRenderer.invoke('genetics:calculate', maleGenes, femaleGenes),
  },

  export: {
    chooseFolder:  ()           => ipcRenderer.invoke('export:chooseFolder'),
    collectionCsv: (folderPath) => ipcRenderer.invoke('export:collectionCsv', folderPath),
    breedingCsv:   (folderPath) => ipcRenderer.invoke('export:breedingCsv', folderPath),
    fullBackup:    (folderPath) => ipcRenderer.invoke('export:fullBackup', folderPath),
  },

  settings: {
    getAll: ()           => ipcRenderer.invoke('settings:getAll'),
    set:    (key, value) => ipcRenderer.invoke('settings:set', key, value),
  },

  window: {
    minimize:    ()  => ipcRenderer.invoke('window:minimize'),
    maximize:    ()  => ipcRenderer.invoke('window:maximize'),
    close:       ()  => ipcRenderer.invoke('window:close'),
    isMaximized: ()  => ipcRenderer.invoke('window:isMaximized'),
    onMaximized: (cb) => ipcRenderer.on('window:maximized', (_, val) => cb(val)),
    offMaximized: (cb) => ipcRenderer.removeListener('window:maximized', cb),
  },

  health: {
    getAllAnimalsOverview:  ()                => ipcRenderer.invoke('health:getAllAnimalsOverview'),
    getSummaryForAnimal:   (animalId)         => ipcRenderer.invoke('health:getSummaryForAnimal', animalId),
    getForAnimal:          (animalId)         => ipcRenderer.invoke('health:getForAnimal', animalId),
    addIssue:              (animalId, data)   => ipcRenderer.invoke('health:addIssue', animalId, data),
    updateIssue:           (id, data)         => ipcRenderer.invoke('health:updateIssue', id, data),
    deleteIssue:           (id)               => ipcRenderer.invoke('health:deleteIssue', id),
    getVetVisits:          (animalId)         => ipcRenderer.invoke('health:getVetVisits', animalId),
    addVetVisit:           (animalId, data)   => ipcRenderer.invoke('health:addVetVisit', animalId, data),
    updateVetVisit:        (id, data)         => ipcRenderer.invoke('health:updateVetVisit', id, data),
    deleteVetVisit:        (id)               => ipcRenderer.invoke('health:deleteVetVisit', id),
    getMedications:        (animalId)         => ipcRenderer.invoke('health:getMedications', animalId),
    addMedication:         (animalId, data)   => ipcRenderer.invoke('health:addMedication', animalId, data),
    updateMedication:      (id, data)         => ipcRenderer.invoke('health:updateMedication', id, data),
    deleteMedication:      (id)               => ipcRenderer.invoke('health:deleteMedication', id),
  },
})