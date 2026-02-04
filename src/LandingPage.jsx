import React, { useState, useEffect } from 'react';
import { apiRequest } from './Api';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Bookmark } from 'lucide-react';

const LandingPage = ({ user }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCatalog();
    loadBookmarks();
  }, []);

  const loadCatalog = async () => {
    const catalog = await apiRequest('/courses');
    setAllCourses(Array.isArray(catalog) ? catalog : []);
  };

  const loadBookmarks = async () => {
    const userData = await apiRequest(`/user?userId=${user.username}`);
    const b = new Set(
        Array.isArray(userData) ? userData.filter(i => i.SK.startsWith('BOOKMARK#')).map(i => i.SK.split('#')[1]) : []
    );
    setBookmarks(b);
  }

   // action_type enroll function
  const handleEnroll = async (course) => {
    alert(`Enrolling in ${course.Title}...`);
    await apiRequest('/user', 'POST', {
        userId: user.username,
        type: 'ENROLL', // This is how the action type is included in the API request from API.js
        courseId: course.PK.split('#')[1],
        title: course.Title,
        totalVideos: course.TotalVideos 
    });
    navigate('/dashboard'); 
  };

  const toggleBookmark = async (course) => {
    const courseId = course.PK.split('#')[1];
    
    if (bookmarks.has(courseId)) {
        await apiRequest('/user', 'POST', { userId: user.username, type: 'REMOVE_BOOKMARK', courseId });
        const newSet = new Set(bookmarks);
        newSet.delete(courseId);
        setBookmarks(newSet);
    } else {
        await apiRequest('/user', 'POST', { 
            userId: user.username, type: 'BOOKMARK', courseId,
            title: course.Title, totalVideos: course.TotalVideos
        });
        const newSet = new Set(bookmarks);
        newSet.add(courseId);
        setBookmarks(newSet);
    }
  };

  const filteredCatalog = allCourses.filter(c => 
    c.Title && c.Title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // WRAPPER: Forces the whole page to be white (overriding the global dark body)
    <div style={{ background: '#ffffff', minHeight: '100vh', color: '#1e293b' }}>
      
      {/* --- HERO SECTION (LIGHT) --- */}
      <div style={{ 
          background: '#ffffff',  /* Pure White */
          padding: '80px 20px', 
          textAlign: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #f1f5f9' /* Subtle separation line */
      }}>
        <h1 style={{ fontSize: '3.5em', marginBottom: '20px', fontWeight: '800', letterSpacing: '-1px', color: '#0f172a' }}>
          Master Your Future.
        </h1>
        <p style={{ fontSize: '1.2em', color: '#64748b', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Curated tech courses to take you from zero to hero. Start learning today.
        </p>

        {/* Search Bar (Dark Border for visibility) */}
        <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} />
            <input 
                type="text" 
                placeholder="What do you want to learn? (e.g. Python, React)" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                    width: '100%', 
                    padding: '15px 15px 15px 50px', 
                    fontSize: '16px', 
                    borderRadius: '50px', 
                    border: '2px solid #e2e8f0', /* Visible Border */
                    outline: 'none',
                    background: '#f8fafc',
                    color: '#334155'
                }}
            />
        </div>
      </div>

      {/* --- COURSE GRID --- */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px 20px' }}>
        <h2 style={{ marginBottom: '30px', color: '#334155' }}>Explore Courses</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {filteredCatalog.map(course => (
                <div key={course.PK} style={{ 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    background: 'white',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                }}
                >
                    {/* Course Image */}
                    <div style={{ height: '140px', background: 'linear-gradient(45deg, #3b82f6, #2563eb)' }}></div>
                    
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25em', color: '#1e293b' }}>{course.Title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '20px', fontSize: '0.9em' }}>
                            <PlayCircle size={16} />
                            <span>{course.TotalVideos} Videos</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => handleEnroll(course)}
                                style={{ flex: 1, padding: '10px', background: 'white', border: '2px solid #2563eb', color: '#2563eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Enroll Now
                            </button>
                            <button 
                                onClick={() => toggleBookmark(course)}
                                style={{ padding: '10px', background: bookmarks.has(course.PK.split('#')[1]) ? '#2563eb' : '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', color: bookmarks.has(course.PK.split('#')[1]) ? 'white' : '#64748b' }}
                            >
                                <Bookmark size={20} fill={bookmarks.has(course.PK.split('#')[1]) ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {filteredCatalog.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>
                <p>No courses found matching "{search}".</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;