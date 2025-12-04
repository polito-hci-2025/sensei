import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DefaultLayout from './components/DefaultLayout';
import HomePage from './components/HomePage';

// Placeholder components per le altre pagine
const CreatePage = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Create New Lesson</h2>
      <p className="text-gray-600">Start creating your educational content</p>
    </div>
  </div>
);

const PreviewPage = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Preview</h2>
      <p className="text-gray-600">Review your lesson before publishing</p>
    </div>
  </div>
);

const AdaptPage = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Adapt Existing Lesson</h2>
      <p className="text-gray-600">Customize lessons for your students' needs</p>
    </div>
  </div>
);

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

const ViewPage = () => (
  <div className="flex items-center justify-center h-full p-8">
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">View Lesson</h2>
      <p className="text-gray-600">Lesson content details</p>
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
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/create" element={<CreatePage />} />
        <Route path="/create/preview" element={<PreviewPage />} />
        
        <Route path="/adapt" element={<AdaptPage />} />
        <Route path="/adapt/preview" element={<PreviewPage />} />
        
        <Route path="/shared" element={<SharedPage />} />
        
        <Route path="/edit/:id" element={<EditPage />} />
        
        <Route path="/view/:id" element={<ViewPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;