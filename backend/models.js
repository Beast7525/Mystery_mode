const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  rawPassword: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  unlockedRound: { type: Number, default: 1 }, // 1 = Round 1 unlocked, 2 = Round 2 unlocked, 3 = Round 3 unlocked, 4 = finished
  roundStatus: {
    round1: { type: String, enum: ['locked', 'in_progress', 'completed'], default: 'in_progress' },
    round2: { type: String, enum: ['locked', 'in_progress', 'completed'], default: 'locked' },
    round3: { type: String, enum: ['locked', 'in_progress', 'completed'], default: 'locked' },
  },
  scores: {
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
  },
  timeTaken: {
    round1: { type: Number, default: 0 }, // seconds taken
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
  },
  totalScore: { type: Number, default: 0 },
  totalTime: { type: Number, default: 0 },
  gameCompleted: { type: Boolean, default: false },
  gameCompletedAt: { type: Date }
}, { timestamps: true });

// Pre-save hook to calculate total score and total time
userSchema.pre('save', function (next) {
  this.totalScore = this.scores.round1 + this.scores.round2 + this.scores.round3;
  this.totalTime = this.timeTaken.round1 + this.timeTaken.round2 + this.timeTaken.round3;
  next();
});

// Question Schema
const questionSchema = new mongoose.Schema({
  round: { type: Number, enum: [1, 2, 3], required: true },
  questionText: { type: String }, // Used for Round 2 (Memory text) and Round 3 (Math expression)
  imagePath: { type: String },    // Used for Round 1 (path to static image file)
  answer: { type: String, required: true, trim: true }, // The correct answer
  options: [{ type: String }],    // Used for Round 3 (Multiple Choice Options)
  points: { type: Number, default: 10 },
  memorizeTime: { type: Number, default: 10 } // Only for Round 2 (seconds to read)
}, { timestamps: true });

// Round Settings Schema
const roundSettingSchema = new mongoose.Schema({
  round: { type: Number, enum: [1, 2, 3], required: true, unique: true },
  timeLimit: { type: Number, default: 300 } // Default time limit in seconds (5 minutes)
}, { timestamps: true });

// User responses schema for detailed logs (admin viewing exact answers)
const userResponseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  round: { type: Number, required: true },
  submittedAnswer: { type: String, default: '' },
  isCorrect: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const RoundSetting = mongoose.model('RoundSetting', roundSettingSchema);
const UserResponse = mongoose.model('UserResponse', userResponseSchema);

module.exports = {
  User,
  Question,
  RoundSetting,
  UserResponse
};
