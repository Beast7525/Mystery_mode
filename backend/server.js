const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const { User, Question, RoundSetting, UserResponse } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'event_game_secret_key_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event_game';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Multer storage configuration for Round 1 image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ==========================================
// Authentication Middleware
// ==========================================
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT Verification Failed:', err.message);
        return res.status(403).json({ error: 'Session expired or invalid token' });
      }
      req.user = user;
      next();
    });
  } else {
    console.warn('Authentication header missing');
    res.status(401).json({ error: 'Authorization header is missing' });
  }
};

const isAdmin = (req, res, next) => {
  console.log('isAdmin Middleware Check:', req.user);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    console.warn('isAdmin check failed. User role is not admin:', req.user ? req.user.role : 'undefined');
    res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }
};

// Safe math expression evaluator for Round 3
function evaluateMathExpression(expr) {
  if (!expr) return null;
  // Allow only digits, basic operators (+, -, *, /, parenthesis, and spaces)
  const cleanExpr = expr.replace(/[^0-9+\-*/().\s]/g, '');
  if (!cleanExpr.trim()) return null;
  try {
    const result = new Function(`return (${cleanExpr})`)();
    return typeof result === 'number' ? result : null;
  } catch (e) {
    return null;
  }
}

// ==========================================
// Auth Routes
// ==========================================

// Register a new user
app.post('https://mystery-mode-backend.onrender.com/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      password: hashedPassword,
      role: 'user',
      unlockedRound: 1
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        unlockedRound: newUser.unlockedRound
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user/admin
app.post('https://mystery-mode-backend.onrender.com/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        unlockedRound: user.unlockedRound,
        gameCompleted: user.gameCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get profile details
app.get('https://mystery-mode-backend.onrender.com/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error getting user profile' });
  }
});

// ==========================================
// Gameplay Routes
// ==========================================

// Get round configuration settings (time limit)
app.get('https://mystery-mode-backend.onrender.com/api/game/settings/:roundNum', authenticateJWT, async (req, res) => {
  try {
    const roundNum = parseInt(req.params.roundNum);
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    // Verify round is unlocked for this user
    const dbUser = await User.findById(req.user.id);
    if (dbUser.role !== 'admin' && dbUser.unlockedRound < roundNum) {
      return res.status(403).json({ error: 'This round is locked' });
    }

    const setting = await RoundSetting.findOne({ round: roundNum });
    res.json({
      round: roundNum,
      timeLimit: setting ? setting.timeLimit : 300
    });
  } catch (error) {
    console.error('Fetch round settings error:', error);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

// Get list of questions for a round (SECURE: hides answers!)
app.get('https://mystery-mode-backend.onrender.com/api/game/round/:roundNum', authenticateJWT, async (req, res) => {
  try {
    const roundNum = parseInt(req.params.roundNum);
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    // Verify round is unlocked for this user
    const dbUser = await User.findById(req.user.id);
    if (dbUser.role !== 'admin' && dbUser.unlockedRound < roundNum) {
      return res.status(403).json({ error: 'This round is locked' });
    }
    if (dbUser.role !== 'admin' && dbUser.unlockedRound > roundNum) {
      return res.status(403).json({ error: 'This round has already been completed' });
    }

    // Load questions, exclude the "answer" field
    const questions = await Question.find({ round: roundNum }).select('-answer');
    
    // Shuffle questions to make it dynamic
    const shuffled = questions.sort(() => 0.5 - Math.random());

    res.json({ questions: shuffled });
  } catch (error) {
    console.error('Fetch questions error:', error);
    res.status(500).json({ error: 'Server error loading questions' });
  }
});

// Submit round responses
app.post('https://mystery-mode-backend.onrender.com/api/game/submit/:roundNum', authenticateJWT, async (req, res) => {
  try {
    const roundNum = parseInt(req.params.roundNum);
    const { answers, timeTaken } = req.body; // answers is an object mapping questionId -> user response text

    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const dbUser = await User.findById(req.user.id);
    if (dbUser.unlockedRound < roundNum) {
      return res.status(403).json({ error: 'You have not unlocked this round yet' });
    }
    if (dbUser.role !== 'admin' && dbUser.unlockedRound > roundNum) {
      return res.status(403).json({ error: 'You have already completed this round' });
    }

    // Fetch the correct answers
    const questions = await Question.find({ round: roundNum });

    let roundScore = 0;
    const responseLogs = [];

    for (const question of questions) {
      const submitted = (answers && answers[question._id]) ? String(answers[question._id]).trim() : '';
      const correct = question.answer.trim();

      let isCorrect = false;
      if (roundNum === 3) {
        // Round 3: Formula Challenge (a - b*c/d) = e
        // submitted is "a,b,c,d" comma-separated values
        // questionText is the target number (e)
        const targetNumber = parseFloat(question.questionText);
        const parts = submitted.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 4 && parts.every(n => !isNaN(n)) && parts[3] !== 0) {
          const [a, b, c, d] = parts;
          const result = a- (b * c / d);
          isCorrect = Math.abs(result - targetNumber) < 0.0001;
        }
        // Also accept exact string match with stored answer
        if (!isCorrect) {
          isCorrect = submitted.replace(/\s+/g, '') === correct.replace(/\s+/g, '');
        }
      } else {
        // Case-insensitive comparisons for simplicity & fairness
        isCorrect = submitted.toLowerCase() === correct.toLowerCase();
      }

      const pointsEarned = isCorrect ? question.points : 0;

      if (isCorrect) {
        roundScore += pointsEarned;
      }

      responseLogs.push({
        userId: dbUser._id,
        questionId: question._id,
        round: roundNum,
        submittedAnswer: submitted,
        isCorrect,
        pointsEarned
      });
    }

    // Log the answers in UserResponse database (to show admin)
    await UserResponse.insertMany(responseLogs);

    // Update user game status
    const roundKey = `round${roundNum}`;
    dbUser.scores[roundKey] = roundScore;
    dbUser.timeTaken[roundKey] = timeTaken || 0;
    dbUser.roundStatus[roundKey] = 'completed';

    if (roundNum === 3) {
      dbUser.unlockedRound = 4; // Finished
      dbUser.gameCompleted = true;
      dbUser.gameCompletedAt = Date.now();
    } else {
      const nextRoundKey = `round${roundNum + 1}`;
      dbUser.unlockedRound = roundNum + 1;
      dbUser.roundStatus[nextRoundKey] = 'in_progress';
    }

    await dbUser.save();

    res.json({
      success: true,
      scoreEarned: roundScore,
      unlockedRound: dbUser.unlockedRound,
      gameCompleted: dbUser.gameCompleted
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Server error during submission' });
  }
});

// ==========================================
// Admin Control Routes
// ==========================================

// Get dashboard settings
app.get('https://mystery-mode-backend.onrender.com/api/admin/settings', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const settings = await RoundSetting.find().sort({ round: 1 });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Server error loading settings' });
  }
});

// Update round timers
app.put('https://mystery-mode-backend.onrender.com/api/admin/settings/:roundNum', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const roundNum = parseInt(req.params.roundNum);
    const { timeLimit } = req.body;
    if (!timeLimit || timeLimit <= 0) {
      return res.status(400).json({ error: 'Time limit must be a positive number' });
    }

    const updated = await RoundSetting.findOneAndUpdate(
      { round: roundNum },
      { timeLimit },
      { new: true, upsert: true }
    );
    res.json({ success: true, setting: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

// Get user list & scoreboard analytics
app.get('https://mystery-mode-backend.onrender.com/api/admin/users', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ totalScore: -1, totalTime: 1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error loading users list' });
  }
});

// Create a new user (via admin panel)
app.post('https://mystery-mode-backend.onrender.com/api/admin/users', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      password: hashedPassword,
      role: 'user',
      unlockedRound: 1
    });

    res.status(201).json({ success: true, user: { id: newUser._id, username: newUser.username } });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// Edit user status/round/credentials
app.put('https://mystery-mode-backend.onrender.com/api/admin/users/:userId', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, password, resetProgress } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) {
      const checkDup = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
      if (checkDup) return res.status(400).json({ error: 'Username already exists' });
      user.username = username.trim();
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (resetProgress) {
      user.unlockedRound = 1;
      user.gameCompleted = false;
      user.gameCompletedAt = null;
      user.scores = { round1: 0, round2: 0, round3: 0 };
      user.timeTaken = { round1: 0, round2: 0, round3: 0 };
      user.roundStatus = { round1: 'in_progress', round2: 'locked', round3: 'locked' };
      // Delete detailed responses
      await UserResponse.deleteMany({ userId });
    }

    await user.save();
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// Delete a user
app.delete('https://mystery-mode-backend.onrender.com/api/admin/users/:userId', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    await UserResponse.deleteMany({ userId });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// Admin: Get details of answers submitted by user
app.get('https://mystery-mode-backend.onrender.com/api/admin/responses/:userId', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const responses = await UserResponse.find({ userId })
      .populate('questionId', 'questionText imagePath points')
      .sort({ round: 1, createdAt: 1 });
    res.json({ responses });
  } catch (error) {
    res.status(500).json({ error: 'Server error loading user detailed answers' });
  }
});

// Admin: Get list of all questions (with correct answers)
app.get('https://mystery-mode-backend.onrender.com/api/admin/questions', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const questions = await Question.find().sort({ round: 1, createdAt: 1 });
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Server error loading questions' });
  }
});

// Admin: Create question
app.post('https://mystery-mode-backend.onrender.com/api/admin/questions', authenticateJWT, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { round, questionText, answer, points, memorizeTime, options } = req.body;
    const roundNum = parseInt(round);

    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }
    if (!answer) {
      return res.status(400).json({ error: 'Correct answer is required' });
    }

    let optionsArray = [];
    if (options) {
      if (typeof options === 'string') {
        try {
          optionsArray = JSON.parse(options);
        } catch (e) {
          optionsArray = options.split(',').map(o => o.trim()).filter(Boolean);
        }
      } else if (Array.isArray(options)) {
        optionsArray = options;
      }
    }

    let imagePath = '';
    if (roundNum === 1) {
      if (!req.file) {
        return res.status(400).json({ error: 'An image file is required for Round 1' });
      }
      imagePath = '/uploads/' + req.file.filename;
    }

    const newQuestion = await Question.create({
      round: roundNum,
      questionText: questionText || '',
      imagePath,
      answer: answer.trim(),
      options: optionsArray,
      points: parseInt(points) || 10,
      memorizeTime: parseInt(memorizeTime) || 10
    });

    res.status(201).json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Server error creating question' });
  }
});

// Admin: Edit question
app.put('https://mystery-mode-backend.onrender.com/api/admin/questions/:questionId', authenticateJWT, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionText, answer, points, memorizeTime, options } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (questionText !== undefined) question.questionText = questionText;
    if (answer !== undefined && answer.trim() !== '') question.answer = answer.trim();
    if (points !== undefined) question.points = parseInt(points) || 10;
    if (memorizeTime !== undefined) question.memorizeTime = parseInt(memorizeTime) || 10;

    if (options !== undefined) {
      let optionsArray = [];
      if (options) {
        if (typeof options === 'string') {
          try {
            optionsArray = JSON.parse(options);
          } catch (e) {
            optionsArray = options.split(',').map(o => o.trim()).filter(Boolean);
          }
        } else if (Array.isArray(options)) {
          optionsArray = options;
        }
      }
      question.options = optionsArray;
    }

    if (req.file && question.round === 1) {
      // Delete old file if it exists
      if (question.imagePath) {
        const oldFilePath = path.join(__dirname, question.imagePath);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.error('Failed to delete old image file:', e);
          }
        }
      }
      question.imagePath = '/uploads/' + req.file.filename;
    }

    await question.save();
    res.json({ success: true, question });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Server error updating question' });
  }
});

// Admin: Delete question
app.delete('https://mystery-mode-backend.onrender.com/api/admin/questions/:questionId', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Delete static picture file if it's Round 1
    if (question.round === 1 && question.imagePath) {
      const filePath = path.join(__dirname, question.imagePath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to delete image file during deletion:', e);
        }
      }
    }

    await Question.findByIdAndDelete(questionId);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting question' });
  }
});

// Catch-all route to prevent crashing
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error occurred' });
});

// Run server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
