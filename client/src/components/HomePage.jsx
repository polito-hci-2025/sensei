import React, { useState } from 'react';
import { Download, Share2, MoreVertical, Plus, RefreshCw, Users } from 'lucide-react';

const HomePage = () => {
  const [myWorks] = useState([
    { id: 1, title: 'Giulio cesare quiz', status: 'created' },
    { id: 2, title: 'WW2 Lesson', status: 'adapted' },
    { id: 3, title: 'History Quiz', status: 'created' }
  ]);

  const [mostDownloaded] = useState([
    {
      id: 1,
      category: 'Dyslexia',
      downloads: 56,
      title: 'Napoleon',
      description: 'Lesson with visual support',
      subject: 'History',
      grade: 'Grade 3',
      author: 'Prof Morello'
    },
    {
      id: 2,
      category: 'Dyslexia',
      downloads: 42,
      title: 'Roman History',
      description: 'Roman Empire Lesson',
      subject: 'History',
      grade: 'Grade 1',
      author: 'Prof Mileto'
    },
    {
      id: 3,
      category: 'Dysgraphia',
      downloads: 100,
      title: 'Solar System',
      description: 'Introduction to solar system',
      subject: 'Science',
      grade: 'Grade 2',
      author: 'Prof Morello'
    }
  ]);

  const [recentlyShared] = useState([
    {
      id: 1,
      category: 'Dyslexia',
      downloads: 15,
      title: 'Leopardi',
      description: "Giacomo Leopardi's life and works",
      subject: 'Italian',
      grade: 'Grade 5',
      author: 'Prof Morello'
    },
    {
      id: 2,
      category: 'Dyscalculia',
      downloads: 5,
      title: 'Second Grade Eq...',
      description: 'Exercises',
      subject: 'Math',
      grade: 'Grade 2',
      author: 'Prof Morello'
    },
    {
      id: 3,
      category: 'Dyslexia',
      downloads: 9,
      title: 'Industrial Revolut...',
      description: 'Lesson',
      subject: 'History',
      grade: 'Grade 4',
      author: 'Prof Verdi'
    }
  ]);

  const getCategoryColor = (category) => {
    const colors = {
      'Dyslexia': 'bg-purple-100 text-purple-700',
      'Dysgraphia': 'bg-blue-100 text-blue-700',
      'Dyscalculia': 'bg-pink-100 text-pink-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'History': 'bg-orange-50 text-orange-600',
      'Science': 'bg-green-50 text-green-600',
      'Italian': 'bg-red-50 text-red-600',
      'Math': 'bg-indigo-50 text-indigo-600'
    };
    return colors[subject] || 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
            Sensei
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="text-lg font-semibold text-gray-800">prof Rossi</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-80 space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Works</h2>
            <div className="space-y-3">
              {myWorks.map(work => (
                <div key={work.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{work.title}</h3>
                      <span className="text-xs text-gray-500">{work.status}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 px-6 font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Plus size={20} />
              CREATE
            </button>
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-3 px-6 font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
              <RefreshCw size={20} />
              ADAPT
            </button>
            <button className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl py-3 px-6 font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Users size={20} />
              SHARED
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          {/* Most Downloaded */}
          <section>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Most downloaded</h2>
            <div className="grid grid-cols-3 gap-6">
              {mostDownloaded.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Download size={16} />
                      <span className="text-sm font-semibold">{item.downloads}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <div className="flex gap-2 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${getSubjectColor(item.subject)}`}>
                      {item.subject}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                      {item.grade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">by {item.author}</span>
                    <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-md transition-all">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Shared */}
          <section>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Recently shared</h2>
            <div className="grid grid-cols-3 gap-6">
              {recentlyShared.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Share2 size={16} />
                      <span className="text-sm font-semibold">{item.downloads}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <div className="flex gap-2 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${getSubjectColor(item.subject)}`}>
                      {item.subject}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                      {item.grade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">by {item.author}</span>
                    <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-md transition-all">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;