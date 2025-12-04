import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, ArrowDown } from 'lucide-react';

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

  const getCategoryColor = (category) => {
    const colors = {
      'Dyslexia': 'bg-gradient-to-br from-purple-400 to-purple-500',
      'Dysgraphia': 'bg-gradient-to-br from-blue-400 to-blue-500',
      'Dyscalculia': 'bg-gradient-to-br from-pink-400 to-pink-500'
    };
    return colors[category] || 'bg-gradient-to-br from-gray-400 to-gray-500';
  };

  const LessonCard = ({ lesson }) => (
    <div 
      className={`${getCategoryColor(lesson.category)} rounded-3xl p-6 relative shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer`}
      onClick={() => navigate(`/view/${lesson.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-white italic font-light">{lesson.category}</span>
        <div className="flex items-center text-white text-sm">
          <ArrowDown size={16} className="mr-1" />
          <span className="font-semibold">{lesson.downloads}</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">{lesson.title}</h3>
      <p className="text-base text-white/95 mb-5">{lesson.subtitle}</p>
      
      <div className="flex gap-2 mb-6 text-sm text-white">
        <span className="bg-white/25 px-3 py-1 rounded-full">{lesson.subject}</span>
        <span className="bg-white/25 px-3 py-1 rounded-full">{lesson.grade}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/90">by {lesson.author}</span>
        <button 
          className="bg-white hover:bg-white/90 text-gray-800 px-6 py-2 rounded-full text-sm font-semibold shadow-md transition-all"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/view/${lesson.id}`);
          }}
        >
          View
        </button>
      </div>
    </div>
  );

  const MyWorkCard = ({ work }) => (
    <div 
      className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 relative hover:shadow-md transition-all duration-200 cursor-pointer border border-purple-200"
      onClick={() => navigate(`/edit/${work.id}`)}
    >
      <button 
        className="absolute top-3 right-3 text-purple-600 hover:text-purple-800" 
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical size={18} />
      </button>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1 pr-6">{work.title}</h4>
        <span className="text-xs text-purple-600 font-medium">{work.status}</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 px-5 py-8 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-5">My Works</h2>
        
        <div className="space-y-3 mb-10">
          {myWorks.map(work => (
            <MyWorkCard key={work.id} work={work} />
          ))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/create')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3.5 rounded-full font-semibold text-base shadow-md transition-all duration-200"
          >
            CREATE
          </button>
          <button 
            onClick={() => navigate('/adapt')}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3.5 rounded-full font-semibold text-base shadow-md transition-all duration-200"
          >
            ADAPT
          </button>
          <button 
            onClick={() => navigate('/shared')}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-3.5 rounded-full font-semibold text-base shadow-md transition-all duration-200"
          >
            SHARED
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-10 py-8 overflow-y-auto bg-white">
        {/* Most Downloaded */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Most downloaded</h2>
          <div className="grid grid-cols-3 gap-6">
            {mostDownloaded.map(lesson => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>

        {/* Recently Shared */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently shared</h2>
          <div className="grid grid-cols-3 gap-6">
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