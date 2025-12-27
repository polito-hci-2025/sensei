import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';
import AdaptPage from './components/AdaptPage';
import CreatePage from './components/CreatePage';
import PreviewPage from './components/PreviewPage';
import SharePage from './components/SharePage';
import SharedPreviewPage from './components/SharedPreviewPage';
import SharedLibrary from './components/SharedLibrary';
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext.jsx';


const SharedPage = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Shared Lessons</h2>
      <p className="text-gray-600">Browse lessons shared by other educators</p>
    </div>
  </div>
);

const EditPage = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Edit Lesson</h2>
      <p className="text-gray-600">Modify your existing lesson</p>
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h2>
      <p className="text-gray-600">The page you're looking for doesn't exist</p>
    </div>
  </div>
);

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

          <Route path="/shared" element={<SharedPage />} />
          
          <Route path="/edit/:id" element={<EditPage />} />

          <Route path="/shared/view/:id" element={<SharedPreviewPage />} />
                  
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </UnsavedChangesProvider>
  );
}

export default App;