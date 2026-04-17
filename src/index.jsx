import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import App              from './renderer/App'
import DashboardPage    from './renderer/pages/DashboardPage'
import CollectionsPage  from './renderer/pages/CollectionsPage'
import AnimalDetailPage from './renderer/pages/AnimalDetailPage'
import AddAnimalPage    from './renderer/pages/AddAnimalPage'
import BreedingPage     from './renderer/pages/BreedingPage'
import BreedingDetailPage from './renderer/pages/BreedingDetailPage'
import GeneticsPage     from './renderer/pages/GeneticsPage'
import MorphLibraryPage from './renderer/pages/MorphLibraryPage'
import AddMorphPage     from './renderer/pages/AddMorphPage'
import SettingsPage     from './renderer/pages/SettingsPage'
import HealthPage       from './renderer/pages/HealthPage'
import './renderer/styles/global.css'
import './renderer/styles/shared.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"           element={<DashboardPage />} />
          <Route path="collection"          element={<CollectionsPage />} />
          <Route path="collection/add"      element={<AddAnimalPage />} />
          <Route path="collection/:id"      element={<AnimalDetailPage />} />
          <Route path="collection/:id/edit" element={<AddAnimalPage />} />
          <Route path="breeding"            element={<BreedingPage />} />
          <Route path="breeding/:id"        element={<BreedingDetailPage />} />
          <Route path="genetics"            element={<GeneticsPage />} />
          <Route path="morphs"              element={<MorphLibraryPage />} />
          <Route path="morphs/add"          element={<AddMorphPage />} />
          <Route path="health"              element={<HealthPage />} />
          <Route path="settings"            element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
