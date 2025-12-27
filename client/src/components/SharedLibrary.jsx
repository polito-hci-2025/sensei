import React, { useEffect, useState } from 'react';
// Aggiunto ArrowLeft agli import
import { Filter, ArrowUpDown, Search, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Importato useNavigate
import API from '../API/API.mjs';
import LessonCard from './LessonCard';
import '../styles/SharedLibrary.css';

function SharedLibrary() {
  const navigate = useNavigate(); // Hook per la navigazione
  const [allWorks, setAllWorks] = useState([]);
  const [displayedWorks, setDisplayedWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Stato Filtri
  const [filters, setFilters] = useState({
    dsa: [], 
    subject: '',
    grade: ''
  });

  const [sortOrder, setSortOrder] = useState('desc'); 

  // --- FETCHING DATI ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const works = await API.getAllSharedWorks();
        
        console.log("Dati Shared Works:", works); 

        if (!Array.isArray(works)) {
          throw new Error("Formato dati non valido (atteso array)");
        }

        setAllWorks(works);
        
        // Sorting iniziale (più scaricati)
        const sorted = [...works].sort((a, b) => b.download - a.download);
        setDisplayedWorks(sorted);
      } catch (err) {
        console.error("Errore SharedLibrary:", err);
        setErrorMsg("Impossibile caricare la libreria.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- GESTIONE FILTRI ---
  const handleDsaChange = (type) => {
    setFilters(prev => {
      const isSelected = prev.dsa.includes(type);
      return isSelected 
        ? { ...prev, dsa: prev.dsa.filter(t => t !== type) }
        : { ...prev, dsa: [...prev.dsa, type] };
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Applicazione Filtri
  const applyFilters = () => {
    let result = [...allWorks];

    // 1. Filtro Subject
    if (filters.subject) {
      result = result.filter(w => w.subject === filters.subject);
    }

    // 2. Filtro Grade
    if (filters.grade) {
      const cleanFilterGrade = filters.grade.replace('°', '').trim();
      result = result.filter(w => {
        const dbGrade = String(w.grade).replace('°', '').split(' ')[0]; 
        return dbGrade === cleanFilterGrade;
      });
    }

    // 3. Filtro DSA
    if (filters.dsa.length > 0) {
      result = result.filter(w => {
        const workTags = w.tag ? w.tag.toLowerCase() : ''; 
        return filters.dsa.some(dsaType => workTags.includes(dsaType.toLowerCase()));
      });
    }

    sortWorks(result, sortOrder);
  };

  const clearFilters = () => {
    setFilters({ dsa: [], subject: '', grade: '' });
    sortWorks(allWorks, sortOrder);
  };

  // --- SORTING ---
  const toggleSort = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    sortWorks(displayedWorks, newOrder);
  };

  const sortWorks = (works, order) => {
    const sorted = [...works].sort((a, b) => {
      return order === 'asc' 
        ? a.download - b.download 
        : b.download - a.download;
    });
    setDisplayedWorks(sorted);
  };

  return (
    <div className="sl-container">
      
      {/* SIDEBAR FILTRI */}
      <aside className="sl-sidebar">
        
        {/* --- NUOVO BOTTONE BACK --- */}
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => navigate('/')} // Torna alla Dashboard
            className="sl-back-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              color: '#374151',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.color = '#7c3aed';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        {/* -------------------------- */}

        <div className="sl-sidebar-header">
          <Filter size={20} className="text-purple-600" />
          <h2>Filters</h2>
        </div>

        <div className="sl-filters-group">
          <h3>DSA Type</h3>
          <div className="sl-checkbox-group">
            {['Dyslexia', 'Dyscalculia', 'Dysgraphia', 'ADHD'].map(type => (
              <label key={type} className="sl-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={filters.dsa.includes(type)}
                  onChange={() => handleDsaChange(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="sl-filters-group">
          <h3>Subject</h3>
          <select 
            value={filters.subject} 
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            className="sl-select"
          >
            <option value="">All Subjects</option>
            <option value="English">English</option>
            <option value="Math">Math</option>
            <option value="Geography">Geography</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
            <option value="Music">Music</option>
          </select>
        </div>

        <div className="sl-filters-group">
          <h3>Grade Level</h3>
          <select 
            value={filters.grade} 
            onChange={(e) => handleFilterChange('grade', e.target.value)}
            className="sl-select"
          >
            <option value="">All Grades</option>
            <option value="1°">1°</option>
            <option value="2°">2°</option>
            <option value="3°">3°</option>
            <option value="4°">4°</option>
            <option value="5°">5°</option>
          </select>
        </div>

        <div className="sl-action-buttons">
          <button className="sl-btn-primary" onClick={applyFilters}>
            Apply Filters
          </button>
          <button className="sl-btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="sl-main">
        <div className="sl-content-header">
          <div className="sl-results-count">
            Showing <strong>{displayedWorks.length}</strong> shared documents
          </div>
          <button className="sl-sort-btn" onClick={toggleSort}>
            <ArrowUpDown size={16} />
            Sort by Downloads ({sortOrder === 'asc' ? 'Low to High' : 'High to Low'})
          </button>
        </div>

        {loading ? (
          <div className="sl-loading">
            <Loader2 className="sl-spinner" size={48} />
            <p>Loading library...</p>
          </div>
        ) : errorMsg ? (
          <div className="sl-empty">
            <p style={{color: 'red'}}>{errorMsg}</p>
          </div>
        ) : displayedWorks.length > 0 ? (
          <div className="sl-grid">
            {displayedWorks.map(work => (
              <LessonCard key={work.id} lesson={work} type="shared" />
            ))}
          </div>
        ) : (
          <div className="sl-empty">
            <Search size={48} />
            <p>No documents found matching your filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedLibrary;