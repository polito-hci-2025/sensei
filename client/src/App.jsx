import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './components/HomePage';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import CreateAssignment from './components/CreateAssignment';
import ClassStatus from './components/ClassStatus';
import MyAssignments from './components/MyAssignments';
import API from './API/API.mjs'; 
import DefaultLayout from './components/DefaultLayout';
import {LoginForm} from './components/Login';
import NotFound from './components/NotFound';



function App() {
  const [user, setUser] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate(); 

  useEffect(()=> {
    const checkAuth = async ()=> {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (error) {
        setLoggedIn(false);
        setUser({});
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (credentials) =>{
    try {
      const user= await API.logIn(credentials);
      setLoggedIn(true);
      setUser(user);

      if(user.ruolo === 'studente'){
        navigate(`/studenti/${user.id_utente}`);
      } else if(user.ruolo === 'professore'){
        navigate(`/professori/${user.id_utente}`);
      } 
    }catch(err){
      throw new Error(err);
    }
  };

  const handleLogout = async ()=> {
    await API.logOut();
    setLoggedIn(false);
    setMessage('');
    setUser({});
    navigate('/'); // Reindirizza alla home page dopo il logout
  }

  return (
    
    <Routes>
      <Route element={<DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage} user={user} />}>
        <Route path="/" element={
          loggedIn ? (
            user.ruolo === 'professore' ? <Navigate replace to={`/professori/${user.id_utente}`} /> :
            <Navigate replace to={`/studenti/${user.id_utente}`}  /> 
          ) : <HomePage />} />

        <Route path="/login" element ={<LoginForm handleLogin={handleLogin}/>} />
        
        <Route path="/professori/:id_prof" element={<TeacherDashboard user={user} /> } />
        <Route path="/professori/:id_prof/compiti/new" element={<CreateAssignment user={user} /> } />            
        <Route path="/professori/:id_prof/statoclasse" element={<ClassStatus user={user}/> } />

        <Route path="/studenti/:id_studente" element={<StudentDashboard user={user}/> } />
        <Route path="/studenti/:id_studente/compiti/:id_compito" element={<MyAssignments user={user} /> } />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
        
  );
}

export default App;