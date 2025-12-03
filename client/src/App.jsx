import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './components/HomePage';
import API from './API/API.mjs'; 




function App() {

  const navigate = useNavigate(); 

  return (
    
    <Routes>
      <Route element={<DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage} user={user} />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/create" element={<CreatePage/>} />
        <Route path="/create/preview" element={<PreviewPage/>} />

        <Route path="/adapt" element={<AdaptPage/>} />
        <Route path="/adapt/preview" element={<PreviewPage/>} />

        <Route path="/shared" element={<SharedPage/>} />

        <Route path="/edit/:id" element={<EditPage/>} />

        <Route path="/view/:id" element={<ViewPage/>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
        
  );
}

export default App;