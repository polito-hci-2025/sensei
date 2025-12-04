import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const myWorks = [
    { id: 1, title: 'Giulio cesare quiz', status: 'created' },
    { id: 2, title: 'WW2 Lesson', status: 'adapted' },
    { id: 3, title: 'History Quiz', status: 'created' }
  ];

  const mostDownloaded = [
    {
      id: 1,
      title: 'Napoleon',
      subtitle: 'Lesson with visual support',
      category: 'Dyslexia',
      subject: 'History',
      grade: 'Grade 3',
      author: 'Prof Morello',
      downloads: 56
    },
    {
      id: 2,
      title: 'Roman History',
      subtitle: 'Roman Empire Lesson',
      category: 'Dyslexia',
      subject: 'History',
      grade: 'Grade 1',
      author: 'Prof Mileto',
      downloads: 42
    },
    {
      id: 3,
      title: 'Solar System',
      subtitle: 'Introduction to solar system',
      category: 'Dysgraphia',
      subject: 'Science',
      grade: 'Grade 2',
      author: 'Prof Morello',
      downloads: 100
    }
  ];

  const recentlyShared = [
    {
      id: 1,
      title: 'Leopardi',
      subtitle: "Giacomo Leopardi's life and works",
      category: 'Dyslexia',
      subject: 'Italian',
      grade: 'Grade 5',
      author: 'Prof Morello',
      downloads: 15
    },
    {
      id: 2,
      title: 'Second Grade Eq...',
      subtitle: 'Exercises',
      category: 'Dyscalculia',
      subject: 'Math',
      grade: 'Grade 2',
      author: 'Prof Morello',
      downloads: 5
    },
    {
      id: 3,
      title: 'Industrial Revolut...',
      subtitle: 'Lesson',
      category: 'Dyslexia',
      subject: 'History',
      grade: 'Grade 4',
      author: 'Prof Verdi',
      downloads: 9
    }
  ];

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
      className={`homepage-lesson-card ${getCategoryClass(lesson.category)}`}
    >
      <div className="homepage-lesson-card-header">
        <span className="homepage-lesson-card-category">{lesson.category}</span>
        <div className="homepage-lesson-card-downloads">
          <ArrowDown size={16} />
          <span>{lesson.downloads}</span>
        </div>
      </div>
      
      <h3>{lesson.title}</h3>
      <p className="homepage-lesson-card-subtitle">{lesson.subtitle}</p>
      
      <div className="homepage-lesson-card-tags">
        <span className="homepage-lesson-card-tag">{lesson.subject}</span>
        <span className="homepage-lesson-card-tag">{lesson.grade}</span>
      </div>
      
      <div className="homepage-lesson-card-footer">
        <span className="homepage-lesson-card-author">by {lesson.author}</span>
        <button 
          className="homepage-lesson-card-button"
          onClick={() => navigate(`/view/${lesson.id}`)}
        >
          View
        </button>
      </div>
    </div>
  );

  const MyWorkCard = ({ work }) => (
    <div 
      className="homepage-work-card"
      onClick={() => navigate(`/edit/${work.id}`)}
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
        <h4>{work.title}</h4>
        <span>{work.status}</span>
      </div>
    </div>
  );

  return (
    <div className="homepage-container">
      {/* Sidebar */}
      <div className="homepage-sidebar">
        <h2>My Works</h2>
        
        <div className="homepage-works-list">
          {myWorks.map(work => (
            <MyWorkCard key={work.id} work={work} />
          ))}
        </div>

        <div className="homepage-action-buttons">
          <button 
            onClick={() => navigate('/create')}
            className="homepage-action-button create"
          >
            CREATE
          </button>
          <button 
            onClick={() => navigate('/adapt')}
            className="homepage-action-button adapt"
          >
            ADAPT
          </button>
          <button 
            onClick={() => navigate('/shared')}
            className="homepage-action-button shared"
          >
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