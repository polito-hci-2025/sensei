import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import AdaptPage from './components/AdaptPage';
import CreatePage from './components/CreatePage';
import PreviewPage from './components/PreviewPage';
import SharePage from './components/SharePage';
import SharedLibrary from './components/SharedLibrary';
import NotFound from './components/NotFound';
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext.jsx';




function App() {
  return (
    <UnsavedChangesProvider>
      <Routes>
        <Route path="/share/:id" element={<SharePage />} />
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* ---> NUOVA ROTTA LIBRERIA CONDIVISA <--- */}
          <Route path="/shared-library" element={<SharedLibrary />} />
          
          <Route path="/create" element={<CreatePage />} />
          <Route path="/create/preview" element={<PreviewPage type="created" />} />

          <Route path="/shared/preview/:id" element={<PreviewPage type="shared" />} />

          <Route path="/:type/preview/:id" element={<PreviewPage />} />

          <Route path="/adapt" element={<AdaptPage />} />

          <Route path="/shared" element={<SharePage />} />
          
          <Route path="/edit/:id" element={<PreviewPage />} />
                  
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </UnsavedChangesProvider>
  );
}

export default App;