import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router';
import { ArrowDown } from 'lucide-react';
import API from '../API/API.mjs';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const [myWorks, setMyWorks] = useState([]);
  const [mostDownloaded, setMostDownloaded] = useState([]);
  const [recentlyShared, setRecentlyShared] = useState([]);

  useEffect(() => {
    fetchMyWorks();
    fetchMostDownloaded();
    fetchRecentlyShared();
  }, []);

  const fetchMyWorks = async () => {
    const works = await API.getAllMyWorks();
    setMyWorks(works);
  }
  
  const fetchMostDownloaded = async () => {
    const download = await API.getAllShared();
    setMostDownloaded(download);
  }

  const fetchRecentlyShared = async () => {
    const shared = await API.getAllShared();
    setRecentlyShared(shared);
  }

  const getCategoryClass = (category) => {
    const classes = {
      'Dyslexia': 'dyslexia',
      'Dysgraphia': 'dysgraphia',
      'Dyscalculia': 'dyscalculia'
    };
    return classes[category] || 'dyslexia';
  };

  const LessonCard = ({ lesson }) => (
    <div 
      className={`homepage-lesson-card ${getCategoryClass(lesson.Type)}`}
    >
      <div className="homepage-lesson-card-header">
        <span className="homepage-lesson-card-category">{lesson.Type}</span>
        <div className="homepage-lesson-card-downloads">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
          </svg>
          <span>{lesson.Download}</span>
        </div>
      </div>
      
      <h3>{lesson.NamePDF}</h3>
      <p className="homepage-lesson-card-subtitle">{lesson.Description}</p>
      
      <div className="homepage-lesson-card-tags">
        <span className={`homepage-lesson-card-tag category-${lesson.Type}`}>{lesson.Subject}</span>
        <span className="homepage-lesson-card-tag grade">{lesson.Grade}</span>
      </div>
      
      <div className="homepage-lesson-card-footer">
        <span className="homepage-lesson-card-author">by {lesson.Prof}</span>
        <button 
          className="homepage-lesson-card-button"
          onClick={() => navigate(`/shared/preview/${lesson.id}`)}
        >
          View
        </button>
      </div>
    </div>
  );

  const MyWorkCard = ({ work }) => (
    <div 
      className="homepage-work-card"
      onClick={() => navigate(`/${work.Type}/preview/${work.id_pdf}`)}
    >
      <button 
        className="homepage-work-card-menu" 
        onClick={(e) => e.stopPropagation()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
        </svg>
      </button>
      <div>
        <h4>{work.NamePDF}</h4>
        <span>{work.Type}</span>
      </div>
    </div>
  );

  return (
    <div className="homepage-container">
      {/* Sidebar */}
      <div className="homepage-sidebar">
        <div className="homepage-works-section">
          <h2>My Works</h2>
          
          <div className="homepage-works-list">
            {myWorks.map(work => (
              <MyWorkCard key={work.id_pdf} work={work} />
            ))}
          </div>
        </div>

        <div className="homepage-action-buttons">
          <button 
            onClick={() => navigate('/create')}
            className="homepage-action-button create"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
            CREATE
          </button>
          <button 
            onClick={() => navigate('/adapt')}
            className="homepage-action-button adapt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
            </svg>
            ADAPT
          </button>
          <button 
            onClick={() => navigate('/shared')}
            className="homepage-action-button shared"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
            </svg>
            SHARED
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="homepage-main-content">
        {/* Most Downloaded */}
        <section className="homepage-section">
          <h2>Most downloaded</h2>
          <div className="homepage-lessons-grid">
            {mostDownloaded.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>

        {/* Recently Shared */}
        <section className="homepage-section">
          <h2>Recently shared</h2>
          <div className="homepage-lessons-grid">
            {recentlyShared.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;