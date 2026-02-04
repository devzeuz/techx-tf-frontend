import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from './Api';
import { Bookmark } from 'lucide-react';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    // 1. Fetch User Data
    const userData = await apiRequest(`/user?userId=${user.username}`);
    if (!Array.isArray(userData)) return;

    // 2. Fetch Public Catalog (To fix missing "TotalVideos" data)
    const catalog = await apiRequest('/courses'); 
    
    // 3. Parse User Data
    const enrollments = userData.filter(item => item.SK.startsWith('COURSE#'));
    const watchedItems = userData.filter(item => item.SK.startsWith('WATCHED#'));
    const bookmarkItems = userData.filter(item => item.SK.startsWith('BOOKMARK#'));
    
    setBookmarks(bookmarkItems);

    // 4. Calculate Progress (With Data Repair)
    const coursesWithProgress = enrollments.map(userCourse => {
        const courseId = userCourse.SK.split('#')[1];
        
        // REPAIR STEP: If User Record is missing TotalVideos, grab it from Public Catalog
        let total = userCourse.TotalVideos;
        if (!total || total === 0) {
            const publicCourse = catalog.find(c => c.PK === `COURSE#${courseId}`);
            total = publicCourse ? publicCourse.TotalVideos : 0;
        }
        
        // Safety Fallback: If still 0, default to 1 to avoid NaN
        if (!total) total = 1;

        // Count Watched Videos
        // We match by CourseId OR check if the video belongs to this course via Catalog
        const watchedCount = watchedItems.filter(w => {
            if (w.CourseId === courseId) return true; // Ideal case
            // Fallback for old data: Check if video ID exists in this course (requires complex logic, skipping for MVP)
            return false; 
        }).length;
        
        let percent = Math.round((watchedCount / total) * 100);
        if (percent > 100) percent = 100;

        return { ...userCourse, progress: percent, TotalVideos: total };
    });

    setMyCourses(coursesWithProgress);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>My Dashboard</h1>

      {/* --- BOOKMARKS SECTION --- */}
      {bookmarks.length > 0 && (
          <div style={{ marginBottom: '50px' }}>
            <h2><Bookmark style={{ display:'inline', verticalAlign:'middle' }}/> Saved for Later</h2>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                {bookmarks.map(b => (
                    <div key={b.SK} style={{ minWidth: '250px', border: '1px solid #ddd', padding: '15px', borderRadius: '10px', background: '#fff' }}>
                        <h4 style={{color: "black"}}>{b.Title}</h4>
                        <Link to={`/learn/${b.SK.split('#')[1]}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>View Course</Link>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* --- PROGRESS SECTION --- */}
      <h2>In Progress</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {myCourses.map(c => (
            <div key={c.SK} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: 'white' }}>
                <h3 style={{ margin: '0 0 10px 0', color: "black" }}>{c.Title}</h3>
                
                {/* REAL TIME PROGRESS BAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', marginBottom: '5px', color: '#64748b' }}>
                    <span>{c.progress}% Complete</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '20px' }}>
                    <div style={{ height: '100%', width: `${c.progress}%`, background: c.progress === 100 ? '#22c55e' : '#2563eb', borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
                </div>

                <button 
                    onClick={() => navigate(`/learn/${c.SK.split('#')[1]}`)}
                    style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                    {c.progress === 100 ? 'Review Course' : 'Continue Learning'}
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;