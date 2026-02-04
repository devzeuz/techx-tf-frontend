import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from './Api';
import YouTube from 'react-youtube';
import { CheckCircle, Play, Save, RotateCcw } from 'lucide-react';

const CoursePlayer = ({ user }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [watched, setWatched] = useState(new Set());
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  
  // --- PLAYER STATE ---
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); // Track playing status
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayReason, setOverlayReason] = useState(null); 
  const [nextVideo, setNextVideo] = useState(null);
  
  // Timer Ref to manage the interval
  const timerRef = useRef(null);

  useEffect(() => {
    loadCourse();
  }, [courseId, user]);

  useEffect(() => {
    if (activeVideo && course) {
        setShowOverlay(false);
        setOverlayReason(null);
        const currentIndex = course.videos.findIndex(v => v.YouTubeID === activeVideo.YouTubeID);
        if (currentIndex >= 0 && currentIndex < course.videos.length - 1) {
            setNextVideo(course.videos[currentIndex + 1]);
        } else {
            setNextVideo(null);
        }
    }
  }, [activeVideo, course]);

  // --- THE TIME WATCHER (Critical Fix) ---
  useEffect(() => {
    // Only run this loop if video is actively playing
    if (isPlaying && player) {
      timerRef.current = setInterval(() => {
        try {
          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();

          // If we are within 2 seconds of the end...
          if (duration > 0 && (duration - currentTime) < 20) {
             console.log("Pre-emptive Stop triggered!");
             finishVideo(); // Trigger our custom end sequence
          }
        } catch (e) {
          // Ignore errors (player might be buffering)
        }
      }, 1000); // Check every second
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, player]); // Re-run when play status changes

  const loadCourse = async () => {
    const courseData = await apiRequest(`/courses/${courseId}`);
    const userData = await apiRequest(`/user?userId=${user.username}`);
    const watchedData = new Set(
        Array.isArray(userData) ? userData.filter(i => i.SK.startsWith('WATCHED#')).map(i => i.VideoId) : []
    );
    
    const metadata = courseData.find(i => i.Type === 'COURSE');
    const videos = courseData.filter(i => i.Type === 'VIDEO').sort((a,b) => a.SK.localeCompare(b.SK));
    
    if (metadata) {
        setCourse({ ...metadata, videos });
        setWatched(watchedData);
        if(videos.length > 0) setActiveVideo(videos[0]);
    }
  };

  // --- ACTIONS ---
  
  const finishVideo = () => {
      // 1. Force Pause immediately
      if (player) player.pauseVideo();
      
      // 2. Show the "Completed" Overlay
      setOverlayReason('END');
      setShowOverlay(true);
      setIsPlaying(false);

      // 3. Mark as watched
      markAsWatched(activeVideo);
  };

  const loadNote = async () => {
    setNote(""); 
    const userData = await apiRequest(`/user?userId=${user.username}`);
    const noteItem = Array.isArray(userData) ? userData.find(i => i.SK === `NOTE#${courseId}#${activeVideo.YouTubeID}`) : null;
    if (noteItem) setNote(noteItem.NoteText);
  };

  const saveNote = async () => {
    setSavingNote(true);
    await apiRequest('/user', 'POST', {
        userId: user.username, type: 'NOTE', courseId, videoId: activeVideo.YouTubeID, text: note
    });
    setSavingNote(false);
  };

  const markAsWatched = async (video) => {
    if (watched.has(video.YouTubeID)) return; // Don't spam backend
    const newWatched = new Set(watched);
    newWatched.add(video.YouTubeID);
    setWatched(newWatched);
    await apiRequest('/user', 'POST', {
        userId: user.username, type: 'WATCH', videoId: video.YouTubeID, courseId
    });
  };

  // --- PLAYER HANDLERS ---
  const onReady = (event) => {
    setPlayer(event.target);
  };

  const onPlayerStateChange = (event) => {
    const status = event.data;

    if (status === 1) { // PLAYING
        setIsPlaying(true);
        // Hide overlay if it was showing "Paused"
        if (overlayReason === 'PAUSE') setShowOverlay(false);
    } 
    else if (status === 2) { // PAUSED
        setIsPlaying(false);
        // Only show Pause overlay if we haven't already finished the video
        if (overlayReason !== 'END') {
            setOverlayReason('PAUSE');
            setShowOverlay(true);
        }
    } 
    else if (status === 0) { // ENDED (Fallback)
        setIsPlaying(false);
        // This is a fallback in case our timer missed it
        if (overlayReason !== 'END') finishVideo();
    }
  };

  const handleResume = () => {
    if (player) {
        setOverlayReason(null);
        setShowOverlay(false);
        player.playVideo();
    }
  };

  const handleReplay = () => {
    if (player) {
        setOverlayReason(null);
        setShowOverlay(false);
        player.seekTo(0);
        player.playVideo();
    }
  };

  if (!course || !activeVideo) return <div style={{color:'white', padding:'40px'}}>Loading...</div>;

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      rel: 0, 
      modestbranding: 1,
      iv_load_policy: 3, 
      controls: 1 // Keep controls so they can scrub
    },
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#0f172a' }}>
        
        {/* PLAYER AREA */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'black', borderRadius: '12px', overflow: 'hidden' }}>
                
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <YouTube 
                        videoId={activeVideo.YouTubeID} 
                        opts={opts} 
                        onReady={onReady}
                        onStateChange={onPlayerStateChange}
                        style={{ height: '100%', width: '100%' }}
                    />
                </div>

                {/* --- THE CURTAIN OVERLAY --- */}
                {showOverlay && (
                    <div style={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                        background: 'rgba(15, 23, 42, 0.96)', 
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        zIndex: 10, color: 'white'
                    }}>
                        
                        {/* PAUSE SCREEN */}
                        {overlayReason === 'PAUSE' && (
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ marginBottom: '10px' }}>Paused</h2>
                                <button 
                                    onClick={handleResume}
                                    style={{ padding: '15px 40px', background: 'white', color: '#0f172a', border: 'none', borderRadius: '50px', fontSize: '1.2em', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}
                                >
                                    <Play fill="#0f172a" /> Resume Video
                                </button>
                            </div>
                        )}

                        {/* END SCREEN */}
                        {overlayReason === 'END' && (
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ marginBottom: '10px' }}>Lesson Completed! 🎉</h2>
                                {nextVideo ? (
                                    <>
                                        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Up Next: {nextVideo.VideoTitle}</p>
                                        <button 
                                            onClick={() => setActiveVideo(nextVideo)}
                                            style={{ padding: '15px 30px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                        >
                                            <Play fill="white" /> Play Next Lesson
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        style={{ padding: '12px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        Back to Dashboard
                                    </button>
                                )}
                                <div style={{ marginTop: '20px' }}>
                                    <button onClick={handleReplay} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}>
                                        <RotateCcw size={16} /> Replay Video
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTROLS & NOTES */}
            <div style={{ marginTop: '20px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8em' }}>{activeVideo.VideoTitle}</h1>
                    <button 
                        onClick={() => markAsWatched(activeVideo)}
                        style={{ padding: '10px 20px', background: watched.has(activeVideo.YouTubeID) ? '#22c55e' : '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <CheckCircle size={18} /> {watched.has(activeVideo.YouTubeID) ? 'Completed' : 'Mark Complete'}
                    </button>
                </div>
                
                <div style={{ marginTop: '30px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                    <h3 style={{ color: '#cbd5e1', fontSize: '1.2em' }}>📝 My Notes</h3>
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Type your notes here..."
                        style={{ width: '100%', height: '100px', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '15px', borderRadius: '8px', fontFamily: 'sans-serif', marginTop: '10px' }}
                    />
                    <button onClick={saveNote} disabled={savingNote} style={{ marginTop: '10px', padding: '8px 15px', background: '#475569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Save size={16} /> {savingNote ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ flex: 1, background: '#1e293b', borderLeft: '1px solid #334155', overflowY: 'auto', padding: '20px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Course Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {course.videos.map((vid, index) => (
                    <div 
                        key={vid.SK} 
                        onClick={() => setActiveVideo(vid)}
                        style={{ padding: '12px', background: activeVideo.YouTubeID === vid.YouTubeID ? '#2563eb' : 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', opacity: activeVideo.YouTubeID !== vid.YouTubeID && watched.has(vid.YouTubeID) ? 0.6 : 1 }}
                    >
                        <div style={{ color: activeVideo.YouTubeID === vid.YouTubeID ? 'white' : '#94a3b8', fontSize: '0.9em', fontWeight: 'bold', minWidth: '25px' }}>{index + 1}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: 'white', fontSize: '0.95em', fontWeight: activeVideo.YouTubeID === vid.YouTubeID ? 'bold' : 'normal' }}>{vid.VideoTitle}</div>
                            {watched.has(vid.YouTubeID) && <span style={{ fontSize: '0.8em', color: '#22c55e' }}>✓ Watched</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CoursePlayer;