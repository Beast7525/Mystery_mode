import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Gauge,
  Home,
  Image as ImageIcon,
  LockKeyhole,
  LogOut,
  Pencil,
  Play,
  Plus,
  Save,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
  X
} from 'lucide-react';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '').replace(/\/(?:health|api)$/, '');
const apiUrl = (path) => `${API_BASE_URL}${path}`;
const assetUrl = (path) => path?.startsWith('http') ? path : apiUrl(path || '');
const API_DISPLAY_URL = API_BASE_URL || 'Local Vite proxy';

const getMediaKind = (path = '') => {
  const cleanPath = path.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(cleanPath)) return 'video';
  if (/\.(mp3|wav|m4a|aac|oga|flac)$/.test(cleanPath)) return 'audio';
  return 'image';
};

function ButtonIcon({ icon: Icon }) {
  return Icon ? <Icon aria-hidden="true" className="btn-icon" /> : null;
}

function MediaPreview({ src, alt = 'Media preview', className = '', mode = 'original', kindOverride = '' }) {
  if (!src) {
    return (
      <div className={`media-preview media-empty ${className}`}>
        <ImageIcon aria-hidden="true" />
        <span>No media</span>
      </div>
    );
  }

  const url = assetUrl(src);
  const kind = kindOverride || getMediaKind(src);

  if (kind === 'video') {
    return (
      <video className={`media-preview ${className}`} controls playsInline preload="metadata">
        <source src={url} />
      </video>
    );
  }

  if (kind === 'audio') {
    return (
      <div className={`media-preview audio-preview ${className}`}>
        <audio controls src={url} />
      </div>
    );
  }

  return <img src={url} alt={alt} className={`media-preview ${mode === 'blurred' ? 'blurred-image' : ''} ${className}`} />;
}

// Helper: Get authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // login, home, round1, round2, round3, admin
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' });

  // Fetch current user details on load or token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetch(apiUrl('/api/auth/me'), {
        headers: getAuthHeaders()
      })
        .then(res => {
          if (!res.ok) throw new Error('Token invalid');
          return res.json();
        })
        .then(data => {
          setUser(data.user);
          if (data.user.role === 'admin') {
            setView('admin');
          } else {
            setView('home');
          }
          setLoading(false);
        })
        .catch(() => {
          handleLogout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const showAlert = (text, type = 'danger') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setView('login');
  };

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="glass-panel text-center" style={{ padding: '40px' }}>
          <h2 style={{ marginBottom: '16px' }}>Loading Event Game...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Alert Banner */}
      {alertMsg.text && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 2000,
            padding: '12px 24px',
            borderRadius: '8px',
            backgroundColor: alertMsg.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
            color: 'white',
            fontWeight: '600',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {alertMsg.text}
        </div>
      )}

      {view !== 'login' && (
        <Header user={user} view={view} setView={setView} handleLogout={handleLogout} />
      )}

      <main className="app-container">
        {view === 'login' && (
          <LoginForm setToken={setToken} showAlert={showAlert} />
        )}
        {view === 'home' && user && (
          <Dashboard user={user} setView={setView} setUser={setUser} showAlert={showAlert} />
        )}
        {view === 'round1' && user && (
          <Round1Challenge user={user} setView={setView} setUser={setUser} showAlert={showAlert} />
        )}
        {view === 'round2' && user && (
          <Round2Challenge user={user} setView={setView} setUser={setUser} showAlert={showAlert} />
        )}
        {view === 'round3' && user && (
          <Round3Challenge user={user} setView={setView} setUser={setUser} showAlert={showAlert} />
        )}
        {view === 'admin' && user && user.role === 'admin' && (
          <AdminPanel showAlert={showAlert} />
        )}
      </main>
    </div>
  );
}

// ==========================================
// 1. Header Component
// ==========================================
function Header({ user, view, setView, handleLogout }) {
  return (
    <header className="app-header">
      <a href="#" className="header-brand" onClick={(e) => {
        e.preventDefault();
        if (user.role === 'admin') setView('admin');
        else setView('home');
      }}>
        Mystery Mode
      </a>

      <div className="header-user-info">
        <span style={{ fontSize: '0.95rem' }}>
          Hello, <strong style={{ color: 'hsl(var(--secondary))' }}>{user?.username}</strong>
          {user?.role === 'admin' && <span className="badge badge-primary mr-2" style={{ marginLeft: '8px' }}>Admin</span>}
        </span>

        {user?.role === 'admin' && view !== 'admin' && (
          <button className="btn btn-outline btn-sm" onClick={() => setView('admin')}>
            <ButtonIcon icon={Shield} />
            Admin Panel
          </button>
        )}

       

        <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={handleLogout}>
          <ButtonIcon icon={LogOut} />
          Logout
        </button>
      </div>
    </header>
  );
}

// ==========================================
// 2. Authentication (Login / Register) Component
// ==========================================
function LoginForm({ setToken, showAlert }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      return showAlert('Please enter both username and password.');
    }

    setLoading(true);
    const endpoint = '/api/auth/login';

    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showAlert('Welcome back!', 'success');
      setToken(data.token);
    } catch (err) {
      showAlert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper fade-in">
      <div className="glass-panel login-card">
        <h1 className="login-logo">Mystery Mode</h1>
        <p className="login-subtitle">
          Sign in to access your tournament
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. User Dashboard Component
// ==========================================
function Dashboard({ user, setView, setUser, showAlert }) {
  // Reload user status to ensure up-to-date unlock states
  useEffect(() => {
    fetch(apiUrl('/api/auth/me'), {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
      })
      .catch(err => console.error(err));
  }, []);

  const rounds = [
    {
      num: 1,
      title: 'Round 1: Pixeled Vision',
      description: 'Identify 5 objects hidden behind pixeled photos. Work fast to secure your time score!',
      icon: '01',
      Icon: ImageIcon,
      viewKey: 'round1'
    },
    {
      num: 2,
      title: 'Round 2: Memory Matrix',
      description: 'Study sentences before the screen goes pitch black. Type back exactly what you recall.',
      icon: '02',
      Icon: Sparkles,
      viewKey: 'round2'
    },
    {
      num: 3,
      title: 'Round 3: Math Dash',
      description: 'Solve arithmetic calculations against a rapid countdown clock. Correctness and speed are key.',
      icon: '03',
      Icon: Gauge,
      viewKey: 'round3'
    }
  ];

  return (
    <div className="fade-in">
      <div className="hub-intro">
        <p className="eyebrow">Mystery Mode / Player board</p>
        <h1>Ready when you are.</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
          Three short challenges. One shot at each. Take your time where it matters, then trust your instincts.
        </p>
      </div>

      {user.gameCompleted && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', border: '1px solid hsl(var(--success) / 0.3)', background: 'rgba(34, 197, 94, 0.05)' }}>
          <h3 style={{ color: 'hsl(var(--success))', fontSize: '1.5rem', marginBottom: '8px' }}>🎉 Congratulations!</h3>
          <p>You have completed all the rounds in the tournament! Your scores and timing have been safely submitted to the leaderboard.</p>
        </div>
      )}

      <div className="dashboard-grid">
        {rounds.map((round) => {
          const isCompleted = user.unlockedRound > round.num || user.gameCompleted;
          const isUnlocked = user.unlockedRound >= round.num;

          let statusText = 'Locked';
          let badgeClass = 'locked';
          if (isCompleted) {
            statusText = 'Completed';
            badgeClass = 'completed';
          } else if (isUnlocked) {
            statusText = 'Unlocked';
            badgeClass = 'unlocked';
          }

          return (
            <div
              key={round.num}
              className={`glass-panel round-card ${isUnlocked ? 'is-unlocked' : 'is-locked'} slide-up`}
              style={{ animationDelay: `${round.num * 0.1}s` }}
            >
              <span className={`round-badge ${badgeClass}`}>{statusText}</span>
              <div className="round-icon-wrapper">
                <round.Icon aria-hidden="true" />
                <span>{round.icon}</span>
              </div>
              <h3 className="round-title">{round.title}</h3>
              <p className="round-desc">{round.description}</p>

              <button
                className={`btn w-full ${isCompleted ? 'btn-outline' : isUnlocked ? 'btn-primary' : 'btn-outline'}`}
                disabled={!isUnlocked || isCompleted}
                onClick={() => setView(round.viewKey)}
              >
                <ButtonIcon icon={isCompleted ? CheckCircle2 : isUnlocked ? Play : LockKeyhole} />
                {isCompleted ? 'Completed' : isUnlocked ? 'Begin Challenge' : 'Stage Locked'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 4. Timer Utility Hook
// ==========================================
function useGameTimer(initialSeconds, onTimeout) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onTimeoutRef = useRef(onTimeout);
  const initializedRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (initialSeconds > 0) {
      setSeconds(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds == null || seconds <= 0) {
      if (seconds != null && seconds <= 0) onTimeoutRef.current();
      return;
    }
    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const formatTime = () => {
    if (seconds == null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    seconds,
    formatTime,
    isWarning: seconds != null && seconds < 30
  };
}

// ==========================================
// 5. Round 1: Blurred Pictures Component
// ==========================================
function Round1Challenge({ user, setView, setUser, showAlert }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLimit, setTimeLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');

  // Time tracking
  const startTime = useRef(Date.now());

  useEffect(() => {
    const loadSettings = () => {
      fetch(apiUrl(`/api/game/settings/1?t=${Date.now()}`), { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => setTimeLimit(data.timeLimit || 300))
        .catch(() => {
          if (timeLimit === null) setTimeLimit(300);
        });
    };

    // Load setting first
    loadSettings();
    fetch(apiUrl(`/api/game/round/1?t=${Date.now()}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        // Initialize answer objects
        const initAns = {};
        data.questions.forEach(q => { initAns[q._id] = ''; });
        setAnswers(initAns);
        setLoading(false);
        startTime.current = Date.now();
      })
      .catch(err => {
        showAlert('Failed to load Round 1 challenges');
        setView('home');
      });

    const timerRefresh = setInterval(loadSettings, 10000);
    return () => clearInterval(timerRefresh);
  }, []);

  const submitGame = async (forcedAnswers = null) => {
    if (submitting) return;
    setSubmitting(true);

    const elapsedSeconds = Math.round((Date.now() - startTime.current) / 1000);
    const finalAnswers = forcedAnswers || { ...answers };

    // Include current selection if any
    if (questions[currentIndex] && selectedOption) {
      finalAnswers[questions[currentIndex]._id] = selectedOption;
    }

    try {
      const res = await fetch(apiUrl('/api/game/submit/1'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          answers: finalAnswers,
          timeTaken: Math.min(elapsedSeconds, timeLimit)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      showAlert(`Round 1 Submitted! You earned points. Unlocking Round 2.`, 'success');

      // Update local state
      setUser(prev => ({ ...prev, unlockedRound: 2 }));
      setView('home');
    } catch (err) {
      showAlert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedOption) {
      return showAlert('Please select an option to proceed.');
    }

    const currentQ = questions[currentIndex];
    const updatedAnswers = { ...answers, [currentQ._id]: selectedOption };
    setAnswers(updatedAnswers);
    setSelectedOption('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      submitGame(updatedAnswers);
    }
  };

  const timer = useGameTimer(timeLimit, () => {
    showAlert("Time limit exceeded! Auto-submitting responses...");
    submitGame(answers);
  });

  if (loading) return <div className="text-center mt-4"><h3>Loading Round 1 Assets...</h3></div>;
  if (questions.length === 0) return <div className="text-center mt-4"><h3>No questions seeded.</h3></div>;

  const currentQuestion = questions[currentIndex];
  const optionsList = currentQuestion.options || [];

  return (
    <div className="game-main glass-panel fade-in">
      <div className="game-info-bar">
        <div>
          <h2>Round 1: Blurred Visions</h2>
          <p>Identify the object in the blurred picture. Pick the correct answer.</p>
        </div>
        <div className={`timer-box ${timer.isWarning ? 'warning' : ''}`}>
          <Clock3 aria-hidden="true" className="timer-icon" /> {timer.formatTime()}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <div className="glass-card question-card">
          <div className="question-header">
            <h4>Question {currentIndex + 1} of {questions.length}</h4>
            <span className="badge badge-secondary">{currentQuestion.points} Points</span>
          </div>

          <div className="image-blur-container">
            <MediaPreview
              src={currentQuestion.imagePath}
              alt="Challenge media"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
            {optionsList.map((opt, idx) => (
              <button
                key={idx}
                className={`btn ${selectedOption === opt ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '14px 20px',
                  fontSize: '1.05rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease',
                  border: selectedOption === opt ? '2px solid hsl(var(--primary))' : '2px solid var(--border-glass)',
                }}
                onClick={() => setSelectedOption(opt)}
                disabled={submitting}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-primary" onClick={handleNextQuestion} disabled={submitting}>
          <ButtonIcon icon={currentIndex + 1 === questions.length ? Save : Play} />
          {currentIndex + 1 === questions.length ? 'Submit Round 1' : 'Submit & Next Question'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 6. Round 2: Memory Challenge Component
// ==========================================
function Round2Challenge({ user, setView, setUser, showAlert }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLimit, setTimeLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Challenge game progression
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMemorizing, setIsMemorizing] = useState(true);
  const [memorizeSeconds, setMemorizeSeconds] = useState(10);
  const [typedSentence, setTypedSentence] = useState('');

  // Reference for timestamps
  const startTime = useRef(Date.now());
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    const loadSettings = () => {
      fetch(apiUrl(`/api/game/settings/2?t=${Date.now()}`), { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => setTimeLimit(data.timeLimit || 300))
        .catch(() => {
          if (timeLimit === null) setTimeLimit(300);
        });
    };

    // Load setting first
    loadSettings();
    fetch(apiUrl(`/api/game/round/2?t=${Date.now()}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        // Initialize blank answers
        const initAns = {};
        data.questions.forEach(q => { initAns[q._id] = ''; });
        setAnswers(initAns);
        setLoading(false);
        startTime.current = Date.now();
      })
      .catch(err => {
        showAlert('Failed to load Round 2 challenges');
        setView('home');
      });

    const timerRefresh = setInterval(loadSettings, 10000);
    return () => clearInterval(timerRefresh);
  }, []);

  // Manage individual question memorization timers
  useEffect(() => {
    if (loading || questions.length === 0 || currentIndex >= questions.length) return;

    if (isMemorizing) {
      setMemorizeSeconds(questions[currentIndex].memorizeTime || 10);

      timerIntervalRef.current = setInterval(() => {
        setMemorizeSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsMemorizing(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [currentIndex, isMemorizing, loading, questions]);

  const submitGame = async (forcedAnswers = null) => {
    if (submitting) return;
    setSubmitting(true);

    clearInterval(timerIntervalRef.current);
    const elapsedSeconds = Math.round((Date.now() - startTime.current) / 1000);
    const finalAnswers = { ...answers };

    // Save current sentence if typed in answer prompt
    if (!isMemorizing && questions[currentIndex]) {
      finalAnswers[questions[currentIndex]._id] = typedSentence;
    }

    const submissionAnswers = forcedAnswers || finalAnswers;

    try {
      const res = await fetch(apiUrl('/api/game/submit/2'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          answers: submissionAnswers,
          timeTaken: Math.min(elapsedSeconds, timeLimit)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      showAlert(`Round 2 Submitted! Unlocking Round 3.`, 'success');
      setUser(prev => ({ ...prev, unlockedRound: 3 }));
      setView('home');
    } catch (err) {
      showAlert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    // Save answer
    const currentQ = questions[currentIndex];
    setAnswers(prev => ({ ...prev, [currentQ._id]: typedSentence }));
    setTypedSentence('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setIsMemorizing(true);
    } else {
      // Last question finished
      const updatedAnswers = { ...answers, [currentQ._id]: typedSentence };
      submitGame(updatedAnswers);
    }
  };

  const roundTimer = useGameTimer(timeLimit, () => {
    showAlert("Time limit exceeded! Auto-submitting responses...");
    submitGame(answers);
  });

  if (loading) return <div className="text-center mt-4"><h3>Loading Memory Challenges...</h3></div>;
  if (questions.length === 0) return <div className="text-center mt-4"><h3>No questions seeded.</h3></div>;

  const currentQuestion = questions[currentIndex];

  return (
    <div className="game-main glass-panel fade-in">
      <div className="game-info-bar">
        <div>
          <h2>Round 2: Memory Matrix</h2>
          <p>Read, remember, and transcribe sentences accurately.</p>
        </div>
        <div className={`timer-box ${roundTimer.isWarning ? 'warning' : ''}`}>
          <Clock3 aria-hidden="true" className="timer-icon" /> {roundTimer.formatTime()}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <div className="glass-card question-card">
          <div className="question-header">
            <h4>Sentence {currentIndex + 1} of {questions.length}</h4>
            <span className="badge badge-secondary">{currentQuestion.points} Points</span>
          </div>

          {isMemorizing ? (
            <div className="memory-viewer">
              <p className="sentence-display">"{currentQuestion.questionText}"</p>
              <div className="memorize-timer-ring">
                ⏱️ Memorize this! ({memorizeSeconds}s)
              </div>
            </div>
          ) : (
            <div className="memory-viewer black-screen">
              {/* Screen turns fully black */}
            </div>
          )}

          {!isMemorizing && (
            <div className="form-group slide-up" style={{ marginTop: '20px' }}>
              <label className="form-label">Type the sentence you remember:</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Type the exact sentence here..."
                value={typedSentence}
                onChange={(e) => setTypedSentence(e.target.value)}
                disabled={submitting}
                style={{ resize: 'none' }}
              />
              <p style={{ fontSize: '0.8rem', marginTop: '4px', color: 'hsl(var(--text-muted))' }}>
                Note: Check spelling, punctuation, and casing!
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="btn-group">

        {isMemorizing ? (
          <button className="btn btn-secondary" onClick={() => setIsMemorizing(false)}>
            I am Ready (Hide Text)
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNextQuestion} disabled={submitting}>
            {currentIndex + 1 === questions.length ? 'Submit Stage' : 'Next Sentence'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. Round 3: Math Challenge Component
// ==========================================
function Round3Challenge({ user, setView, setUser, showAlert }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLimit, setTimeLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState({ a: '', b: '', c: '', d: '' });

  const startTime = useRef(Date.now());

  useEffect(() => {
    const loadSettings = () => {
      fetch(apiUrl(`/api/game/settings/3?t=${Date.now()}`), { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => setTimeLimit(data.timeLimit || 180))
        .catch(() => {
          if (timeLimit === null) setTimeLimit(180);
        });
    };

    loadSettings();
    fetch(apiUrl(`/api/game/round/3?t=${Date.now()}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        const initAns = {};
        data.questions.forEach(q => { initAns[q._id] = ''; });
        setAnswers(initAns);
        setLoading(false);
        startTime.current = Date.now();
      })
      .catch(err => {
        showAlert('Failed to load Round 3 challenges');
        setView('home');
      });

    const timerRefresh = setInterval(loadSettings, 10000);
    return () => clearInterval(timerRefresh);
  }, []);

  const submitGame = async (forcedAnswers = null) => {
    if (submitting) return;
    setSubmitting(true);

    const elapsedSeconds = Math.round((Date.now() - startTime.current) / 1000);
    const finalAnswers = forcedAnswers || { ...answers };

    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      finalAnswers[currentQuestion._id] = `${selections.a},${selections.b},${selections.c},${selections.d}`;
    }

    try {
      const res = await fetch(apiUrl('/api/game/submit/3'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          answers: finalAnswers,
          timeTaken: Math.min(elapsedSeconds, timeLimit)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      showAlert(`Game Completed successfully! Welcome to the finish line.`, 'success');
      setUser(prev => ({ ...prev, unlockedRound: 4, gameCompleted: true }));
      setView('home');
    } catch (err) {
      showAlert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelect = (v, opt) => {
    setSelections(prev => ({ ...prev, [v]: opt }));
  };

  const handleNextQuestion = () => {
    if (!selections.a || !selections.b || !selections.c || !selections.d) {
      return showAlert('Please select an option from each list.');
    }

    const currentQuestion = questions[currentIndex];
    const combinedVal = `${selections.a},${selections.b},${selections.c},${selections.d}`;
    const updatedAnswers = { ...answers, [currentQuestion._id]: combinedVal };
    setAnswers(updatedAnswers);
    setSelections({ a: '', b: '', c: '', d: '' }); // Reset selections for next question

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      submitGame(updatedAnswers);
    }
  };

  const roundTimer = useGameTimer(timeLimit, () => {
    showAlert("Time limit exceeded! Auto-submitting responses...");
    const combinedVal = `${selections.a},${selections.b},${selections.c},${selections.d}`;
    const currentQuestion = questions[currentIndex];
    const updatedAnswers = currentQuestion ? { ...answers, [currentQuestion._id]: combinedVal } : answers;
    submitGame(updatedAnswers);
  });

  if (loading) return <div className="text-center mt-4"><h3>Loading Math Challenges...</h3></div>;
  if (questions.length === 0) return <div className="text-center mt-4"><h3>No questions seeded.</h3></div>;

  const currentQuestion = questions[currentIndex];
  const optionsForA = currentQuestion.options?.[0] ? currentQuestion.options[0].split(',') : [];
  const optionsForB = currentQuestion.options?.[1] ? currentQuestion.options[1].split(',') : [];
  const optionsForC = currentQuestion.options?.[2] ? currentQuestion.options[2].split(',') : [];
  const optionsForD = currentQuestion.options?.[3] ? currentQuestion.options[3].split(',') : [];

  const vars = ['a', 'b', 'c', 'd'];
  const varNames = ['a', 'b', 'c', 'd'];
  const varOptions = [optionsForA, optionsForB, optionsForC, optionsForD];

  return (
    <div className="game-main glass-panel fade-in">
      <div className="game-info-bar">
        <div>
          <h2>Round 3: Formula Challenge</h2>
          <p>Pick values for <strong>a, b, c, d</strong> so the formula equals the target.</p>
        </div>
        <div className={`timer-box ${roundTimer.isWarning ? 'warning' : ''}`}>
          <Clock3 aria-hidden="true" className="timer-icon" /> {roundTimer.formatTime()}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <div className="glass-card question-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div className="question-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <h4>Equation {currentIndex + 1} of {questions.length}</h4>
            <span className="badge badge-secondary">{currentQuestion.points} Points</span>
          </div>

          <p className="mb-2" style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.1rem' }}>
            Find values so that:
          </p>
          <div className="math-expression" style={{ fontSize: '2.5rem', fontWeight: '700', letterSpacing: '0.05em', color: 'hsl(var(--primary))' }}>
            ( <span style={{ color: 'hsl(var(--secondary))' }}>a</span> − <span style={{ color: 'hsl(var(--secondary))' }}>b</span> × <span style={{ color: 'hsl(var(--secondary))' }}>c</span> ÷ <span style={{ color: 'hsl(var(--secondary))' }}>d</span> ) = <span style={{ color: 'hsl(var(--success))' }}>{currentQuestion.questionText}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '32px' }}>
            {vars.map((v, idx) => {
              const opts = varOptions[idx] || [];
              return (
                <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: 'hsl(var(--text-secondary))' }}>
                    {varNames[idx]}
                  </label>
                  <select
                    className="form-input"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                    value={selections[v]}
                    onChange={(e) => handleSelect(v, e.target.value)}
                    disabled={submitting}
                  >
                    <option value="" style={{ background: '#0f172a' }}>-- Select --</option>
                    {opts.map((opt) => {
                      const val = opt.trim();
                      return (
                        <option key={val} value={val} style={{ background: '#0f172a' }}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="btn-group" style={{ marginTop: '30px' }}>
        <button className="btn btn-primary w-full" onClick={handleNextQuestion} disabled={submitting}>
          {currentIndex + 1 === questions.length ? 'Submit Stage' : 'Submit & Next Question'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 8. Admin Panel Component
// ==========================================
function AdminPanel({ showAlert }) {
  const [activeTab, setActiveTab] = useState('scoreboard'); // scoreboard, users, questions, settings
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [settings, setSettings] = useState([]);

  // Modals / Details states
  const [selectedUserResponses, setSelectedUserResponses] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  // CRUD Helpers
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ id: '', username: '', password: '', resetProgress: false });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({ id: '', round: 1, questionText: '', answer: '', points: 10, memorizeTime: 10, options: '', imagePath: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('');
  const uploadPreviewRef = useRef('');

  const fetchScoreboard = () => {
    fetch(apiUrl(`/api/admin/users?t=${Date.now()}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(err => showAlert('Error loading scoreboard'));
  };

  const fetchQuestions = () => {
    fetch(apiUrl(`/api/admin/questions?t=${Date.now()}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setQuestions(data.questions || []))
      .catch(err => showAlert('Error loading questions'));
  };

  const fetchSettings = () => {
    fetch(apiUrl(`/api/admin/settings?t=${Date.now()}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setSettings(data.settings || []))
      .catch(err => showAlert('Error loading timer settings'));
  };

  // Sync data based on active tab
  useEffect(() => {
    if (activeTab === 'scoreboard' || activeTab === 'users') {
      fetchScoreboard();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const clearUploadPreview = () => {
    if (uploadPreviewRef.current) {
      URL.revokeObjectURL(uploadPreviewRef.current);
      uploadPreviewRef.current = '';
    }
    setUploadFile(null);
    setUploadPreviewUrl('');
  };

  const handleUploadChange = (file) => {
    clearUploadPreview();
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    uploadPreviewRef.current = nextUrl;
    setUploadFile(file);
    setUploadPreviewUrl(nextUrl);
  };

  const closeQuestionModal = () => {
    clearUploadPreview();
    setQuestionModalOpen(false);
  };

  const viewUserResponses = (u) => {
    fetch(apiUrl(`/api/admin/responses/${u._id}`), { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setSelectedUserResponses(data.responses);
        setSelectedUserName(u.username);
      })
      .catch(err => showAlert('Failed to load user responses'));
  };

  // User Save/Update
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.username.trim()) return;

    const isEdit = !!userForm.id;
    const url = isEdit ? `/api/admin/users/${userForm.id}` : '/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(apiUrl(url), {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      showAlert(`User ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
      setUserModalOpen(false);
      fetchScoreboard();
    } catch (err) {
      showAlert(err.message);
    }
  };

  const handleDeleteUser = async (uId) => {
    if (!window.confirm('Are you sure you want to delete this user? All their responses will be purged.')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${uId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete');
      showAlert('User deleted successfully', 'success');
      fetchScoreboard();
    } catch (err) {
      showAlert(err.message);
    }
  };

  // Question Save/Update
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.answer.trim()) return showAlert('Correct answer is required');

    const isEdit = !!questionForm.id;
    const url = isEdit ? `/api/admin/questions/${questionForm.id}` : '/api/admin/questions';
    const method = isEdit ? 'PUT' : 'POST';

    // Since we handle file uploads (multer), we must use FormData
    const formData = new FormData();
    formData.append('round', questionForm.round);
    formData.append('questionText', questionForm.questionText);
    formData.append('answer', questionForm.answer);
    formData.append('points', questionForm.points);
    formData.append('memorizeTime', questionForm.memorizeTime);
    formData.append('options', questionForm.options);
    if (uploadFile) {
      formData.append('image', uploadFile);
    }

    try {
      const headers = getAuthHeaders();
      delete headers['Content-Type']; // Required so browser sets boundary for FormData

      const res = await fetch(apiUrl(url), {
        method,
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      showAlert(`Question saved successfully!`, 'success');
      closeQuestionModal();
      fetchQuestions();
    } catch (err) {
      showAlert(err.message);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/questions/${qId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete');
      showAlert('Question deleted successfully', 'success');
      fetchQuestions();
    } catch (err) {
      showAlert(err.message);
    }
  };

  // Settings update
  const handleSettingUpdate = async (roundNum, currentSecs) => {
    const newVal = window.prompt(`Enter new time limit in seconds for Round ${roundNum}:`, currentSecs);
    if (newVal === null) return;

    const secs = parseInt(newVal);
    if (isNaN(secs) || secs <= 0) return showAlert('Please enter a valid positive number');

    try {
      const res = await fetch(apiUrl(`/api/admin/settings/${roundNum}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ timeLimit: secs })
      });
      if (!res.ok) throw new Error('Failed to update timer');
      showAlert(`Round ${roundNum} timer updated to ${secs}s`, 'success');
      fetchSettings();
    } catch (err) {
      showAlert(err.message);
    }
  };

  return (
    <div className="fade-in">
      <div className="admin-hero">
        <div>
          <p className="eyebrow">Mystery Mode / Admin</p>
          <h2>Admin Management Panel</h2>
        </div>
      </div>

      <div className="admin-container">
        {/* Navigation Sidebar */}
        <aside className="glass-panel admin-sidebar">
          <button
            className={`sidebar-tab ${activeTab === 'scoreboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoreboard')}
          >
            <BarChart3 aria-hidden="true" />
            Leaderboard Analytics
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users aria-hidden="true" />
            User Accounts
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <FileQuestion aria-hidden="true" />
            Contest Questions
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings aria-hidden="true" />
            Stage Configurations
          </button>
        </aside>

        {/* Dynamic Panel Content */}
        <section className="glass-panel admin-content">

          {/* TAB 1: SCOREBOARD */}
          {activeTab === 'scoreboard' && (
            <div className="fade-in">
              <h3 className="mb-4">Tournament Leaderboard</h3>
              <p>Scores are graded on correct responses. Ties resolved by fastest execution times.</p>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Contestant</th>
                      <th>Round 1 (Time)</th>
                      <th>Round 2 (Time)</th>
                      <th>Round 3 (Time)</th>
                      <th>Total Score</th>
                      <th>Total Time</th>
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.scores.round1} pts ({u.timeTaken.round1}s)</td>
                        <td>{u.scores.round2} pts ({u.timeTaken.round2}s)</td>
                        <td>{u.scores.round3} pts ({u.timeTaken.round3}s)</td>
                        <td><span style={{ color: 'hsl(var(--secondary))', fontWeight: 'bold' }}>{u.totalScore}</span></td>
                        <td>{u.totalTime}s</td>
                        <td>
                          <span className={`status-indicator ${u.gameCompleted ? 'completed' : 'pending'}`}>
                            {u.gameCompleted ? 'Finished' : `R${u.unlockedRound}`}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => viewUserResponses(u)}>
                            <ButtonIcon icon={Trophy} />
                            Audit Submissions
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="8" className="text-center">No participants registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: USER ACCOUNTS */}
          {activeTab === 'users' && (
            <div className="fade-in">
              <div className="flex-between mb-4">
                <h3>User Accounts Directory</h3>
                <button className="btn btn-primary" onClick={() => {
                  setUserForm({ id: '', username: '', password: '', resetProgress: false });
                  setUserModalOpen(true);
                }}>
                  <ButtonIcon icon={Plus} />
                  Create Participant
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Progress</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td><strong>{u.username}</strong></td>
                        <td>R{u.unlockedRound} {u.gameCompleted && '(Completed)'}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-outline btn-sm mr-2" onClick={() => {
                            setUserForm({ id: u._id, username: u.username, password: '', resetProgress: false });
                            setUserModalOpen(true);
                          }}>
                            <ButtonIcon icon={Pencil} />
                            Modify
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>
                            <ButtonIcon icon={Trash2} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="4" className="text-center">No participant accounts.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="fade-in">
              <div className="flex-between mb-4">
                <h3>Question Databank</h3>
                <button className="btn btn-primary" onClick={() => {
                  setQuestionForm({ id: '', round: 1, questionText: '', answer: '', points: 10, memorizeTime: 10, options: '', imagePath: '' });
                  clearUploadPreview();
                  setQuestionModalOpen(true);
                }}>
                  <ButtonIcon icon={Plus} />
                  Add Challenge Question
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Prompt / Clue</th>
                      <th>Reference Asset</th>
                      <th>Answer Key</th>
                      <th>Valuation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q._id}>
                        <td><span className="badge badge-secondary">R{q.round}</span></td>
                        <td>
                          <div style={{ maxWidth: '300px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {q.round === 2 ? 'n/a' : (q.questionText || '(No text clue)')}
                          </div>
                        </td>
                        <td>
                          {q.round === 1 ? (
                            <div className="asset-cell">
                              <MediaPreview src={q.imagePath} className="img-preview" alt="Question media thumbnail" />
                            </div>
                          ) : q.round === 2 ? (
                            <span>{q.memorizeTime}s Study Timer</span>
                          ) : (
                            <span style={{ color: 'hsl(var(--text-muted))' }}>N/A</span>
                          )}
                        </td>
                        <td><code style={{ fontSize: '0.85rem' }}>{q.answer}</code></td>
                        <td>{q.points} Pts</td>
                        <td>
                          <button className="btn btn-outline btn-sm mr-2" onClick={() => {
                            setQuestionForm({
                              id: q._id,
                              round: q.round,
                              questionText: q.questionText || '',
                              answer: q.answer,
                              points: q.points,
                              memorizeTime: q.memorizeTime || 10,
                              options: q.options ? q.options.join(', ') : '',
                              imagePath: q.imagePath || ''
                            });
                            clearUploadPreview();
                            setQuestionModalOpen(true);
                          }}>
                            <ButtonIcon icon={Pencil} />
                            Modify
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q._id)}>
                            <ButtonIcon icon={Trash2} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {questions.length === 0 && (
                      <tr><td colSpan="6" className="text-center">No questions in the database. Use seed.js or create above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROUND SETTINGS */}
          {activeTab === 'settings' && (
            <div className="fade-in">
              <h3 className="mb-4">Round Configurations</h3>
              <p className="mb-6">Adjust the duration timers allowed for submissions during individual challenges.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {settings.map(s => (
                  <div key={s._id} className="glass-card settings-row" style={{ padding: '20px' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>Round {s.round}</strong>
                      <p style={{ fontSize: '0.9rem' }}>Time limit constraints</p>
                    </div>
                    <div className="settings-controls">
                      <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '6px 12px' }}>
                        {s.timeLimit} seconds ({Math.floor(s.timeLimit / 60)}m {s.timeLimit % 60}s)
                      </span>
                      <button className="btn btn-outline" onClick={() => handleSettingUpdate(s.round, s.timeLimit)}>
                        <ButtonIcon icon={Clock3} />
                        Edit Limit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </div>

      {/* USER AUDIT RESPONSES MODAL */}
      {selectedUserResponses && (
        <div className="modal-overlay" onClick={() => setSelectedUserResponses(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="modal-close" onClick={() => setSelectedUserResponses(null)} aria-label="Close"><X aria-hidden="true" /></button>
            <h3 className="mb-4">Submission Audit: <span style={{ color: 'hsl(var(--secondary))' }}>{selectedUserName}</span></h3>

            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {selectedUserResponses.map((r, idx) => (
                <div key={r._id} className="glass-card mb-4" style={{ padding: '16px', borderLeft: r.isCorrect ? '4px solid hsl(var(--success))' : '4px solid hsl(var(--danger))' }}>
                  <div className="flex-between mb-2">
                    <strong>Round {r.round} - Question {idx + 1}</strong>
                    <span className={`status-indicator ${r.isCorrect ? 'completed' : 'danger'}`} style={{ backgroundColor: r.isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                      {r.isCorrect ? `Correct (+${r.pointsEarned} pts)` : 'Incorrect (0 pts)'}
                    </span>
                  </div>

                  {r.questionId?.questionText && (
                    <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                      <strong>Question/Clue:</strong> "{r.questionId.questionText}"
                    </p>
                  )}

                  <p style={{ fontSize: '0.9rem' }}>
                    <strong>User Submitted:</strong> <code style={{ color: r.isCorrect ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>"{r.submittedAnswer}"</code>
                  </p>
                </div>
              ))}

              {selectedUserResponses.length === 0 && (
                <p className="text-center" style={{ padding: '20px' }}>This user has not submitted any answers yet.</p>
              )}
            </div>

            <div className="btn-group">
              <button className="btn btn-outline" onClick={() => setSelectedUserResponses(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* USER CREATE / MODIFY MODAL */}
      {userModalOpen && (
        <div className="modal-overlay" onClick={() => setUserModalOpen(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setUserModalOpen(false)} aria-label="Close"><X aria-hidden="true" /></button>
            <h3>{userForm.id ? 'Modify Account' : 'New Participant Registration'}</h3>

            <form onSubmit={handleSaveUser} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {userForm.id ? 'New Password (leave blank to keep current)' : 'Account Password'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={!userForm.id}
                />
              </div>

              {userForm.id && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="reset-chk"
                    checked={userForm.resetProgress}
                    onChange={(e) => setUserForm({ ...userForm, resetProgress: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <label htmlFor="reset-chk" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                    Reset all scores, times, and responses (locks to Round 1)
                  </label>
                </div>
              )}

              <div className="btn-group">
                <button type="button" className="btn btn-outline" onClick={() => setUserModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <ButtonIcon icon={Save} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION CREATE / MODIFY MODAL */}
      {questionModalOpen && (
        <div className="modal-overlay" onClick={closeQuestionModal}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeQuestionModal} aria-label="Close"><X aria-hidden="true" /></button>
            <h3>{questionForm.id ? 'Modify Challenge' : 'New Challenge Definition'}</h3>

            <form onSubmit={handleSaveQuestion} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Tournament Round</label>
                <select
                  className="form-input"
                  value={questionForm.round}
                  onChange={(e) => setQuestionForm({ ...questionForm, round: parseInt(e.target.value) })}
                  disabled={!!questionForm.id} // Cannot change round after creation due to media differences
                >
                  <option value="1">Round 1 (Blurred Picture)</option>
                  <option value="2">Round 2 (Memory Challenge)</option>
                  <option value="3">Round 3 (Math Challenge)</option>
                </select>
              </div>

              {/* R1 Image Upload */}
              {questionForm.round === 1 && (
                <div className="form-group">
                  <label className="form-label">
                    Challenge Image File {questionForm.id ? '(Leave empty to preserve existing image)' : '*'}
                  </label>
                  <input
                    type="file"
                    className="form-input"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => handleUploadChange(e.target.files?.[0] || null)}
                    required={!questionForm.id}
                  />
                  <div className="upload-hint">
                    <UploadCloud aria-hidden="true" />
                    <span>Images are blurred for players. Video and audio are preserved as media previews for admin use.</span>
                  </div>
                  {(uploadPreviewUrl || questionForm.imagePath) && (
                    <div className="media-pair-preview">
                      <div>
                        <span>Player view</span>
                        <MediaPreview src={uploadPreviewUrl || questionForm.imagePath} className="img-preview-lg" mode="blurred" alt="Blurred upload preview" kindOverride={uploadFile?.type?.split('/')[0]} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {questionForm.round === 1 ? 'Image Text Clue / Category' :
                    questionForm.round === 2 ? 'Sentence to Remember *' : 'Math Equation (e.g. 15 + 8 - 4) *'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter content details..."
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                  required={questionForm.round !== 1}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correct Answer Key *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Exact correct response..."
                  value={questionForm.answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                  required
                />
              </div>

              {(questionForm.round === 1 || questionForm.round === 3) && (
                <div className="form-group">
                  <label className="form-label">
                    {questionForm.round === 1 ? 'Answer Options (comma-separated) *' : 'Options (comma-separated list, e.g. 12, 14, 16, 18) *'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={questionForm.round === 1 ? 'Cat, Dog, Car, Banana' : 'Enter 4 options separated by commas...'}
                    value={questionForm.options}
                    onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Points Valuation</label>
                  <input
                    type="number"
                    className="form-input"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                {questionForm.round === 2 && (
                  <div>
                    <label className="form-label">Study Window (Seconds)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={questionForm.memorizeTime}
                      onChange={(e) => setQuestionForm({ ...questionForm, memorizeTime: parseInt(e.target.value) || 10 })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="btn-group">
                <button type="button" className="btn btn-outline" onClick={closeQuestionModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <ButtonIcon icon={Save} />
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
