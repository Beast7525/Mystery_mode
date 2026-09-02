require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { User, Question, RoundSetting } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event_game';

// Base64 for 5 distinct small placeholder PNG images of different solid colors (Red, Green, Blue, Yellow, Magenta)
// This ensures that we have actual image files in the upload folder, so the server can serve them and the UI doesn't break
const placeholders = {
  'apple.png': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAF0lEQVR42u3BAQEAAACCIP+vbkhAAQAAAMgB4AA/AAF8mU4AAAAASUVORK5CYII=', // Red 100x100 (dummy)
  'banana.png': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAF0lEQVR42u3BAQEAAACCIP+vbkhAAQAAAMgB4AA/AAF8mU4AAAAASUVORK5CYII=', // Yellow
  'car.png': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAF0lEQVR42u3BAQEAAACCIP+vbkhAAQAAAMgB4AA/AAF8mU4AAAAASUVORK5CYII=', // Blue
  'cat.png': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAF0lEQVR42u3BAQEAAACCIP+vbkhAAQAAAMgB4AA/AAF8mU4AAAAASUVORK5CYII=', // Green
  'dog.png': 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAF0lEQVR42u3BAQEAAACCIP+vbkhAAQAAAMgB4AA/AAF8mU4AAAAASUVORK5CYII='  // Purple
};

async function seed(shouldDisconnect = true) {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log('Created uploads/ directory.');
    }

    // Write placeholder images
    for (const [filename, base64Str] of Object.entries(placeholders)) {
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, Buffer.from(base64Str, 'base64'));
        console.log(`Created placeholder image: uploads/${filename}`);
      }
    }

    // Clear existing configurations if seeding fresh
    await RoundSetting.deleteMany({});
    await Question.deleteMany({});
    
    // Check if admin user exists, if not, create it
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('avamanam', salt);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        unlockedRound: 4, // admin has access to all
      });
      console.log('Created default admin user (Username: admin, Password: adminpassword123)');
    } else {
      console.log('Admin user already exists.');
    }

    // Seed Round Settings
    const defaultSettings = [
      { round: 1, timeLimit: 300 }, // 5 mins
      { round: 2, timeLimit: 1800 }, // 5 mins
      { round: 3, timeLimit: 900 }  // 3 mins
    ];
    await RoundSetting.insertMany(defaultSettings);
    console.log('Seed: Default round settings inserted.');

    // Seed Questions
    const defaultQuestions = [
      // Round 1 (Blurred Pictures - 4 options, one correct, no clues)
      { round: 1, questionText: '', imagePath: '/uploads/image1.jpeg', answer: 'Thamizh Padam 2', options: ['Vikram Vadha', 'Singam 3', 'Thamizh Padam 2', ''], points: 10 },
      { round: 1, questionText: '', imagePath: '/uploads/image2.jpeg', answer: 'Seashore', options: ['Field', 'Mountain', 'Desert', 'Seashore'], points: 10 },
      { round: 1, questionText: '', imagePath: '/uploads/image3.jpeg', answer: 'Elephant', options: ['Cat', 'Dog', 'Bird', 'Elephant'], points: 10 },
      { round: 1, questionText: '', imagePath: '/uploads/image5.png', answer: 'Cat', options: ['dog', 'rabbit', 'hamster', 'Cat'], points: 10 },
      { round: 1, questionText: '', imagePath: '/uploads/image4.png', answer: 'dog', options: ['cat', 'dog', 'parrot', 'horse'], points: 10 },

      // Round 2 (Memory Challenge)
      { round: 2, questionText: 'The quick brown fox jumps over the lazy dog.', answer: 'The quick brown fox jumps over the lazy dog.', points: 15, memorizeTime: 10 },
      { round: 2, questionText: 'A journey of a thousand miles begins with a single step.', answer: 'A journey of a thousand miles begins with a single step.', points: 15, memorizeTime: 10 },
      { round: 2, questionText: 'To be or not to be, that is the question.', answer: 'To be or not to be, that is the question.', points: 15, memorizeTime: 10 },
      { round: 2, questionText: 'All that glitters is not gold.', answer: 'All that glitters is not gold.', points: 15, memorizeTime: 10 },
      { round: 2, questionText: 'In the middle of difficulty lies opportunity.', answer: 'In the middle of difficulty lies opportunity.', points: 15, memorizeTime: 10 },

      // Round 3 (Formula Challenge: (a - b*c/d) = e, all values 0-50)
      { 
        round: 3, 
        questionText: '10', 
        answer: '30,4,10,2', 
        options: ['30,25,40,15', '4,7,3,9', '10,5,8,12', '2,5,4,8'], 
        points: 20
      },
      { 
        round: 3, 
        questionText: '15', 
        answer: '25,5,4,2', 
        options: ['25,35,18,42', '5,8,3,10', '4,6,9,2', '2,3,7,4'], 
        points: 20 
      },
      { 
        round: 3, 
        questionText: '20', 
        answer: '50,6,10,2', 
        options: ['50,35,45,28', '6,9,3,12', '10,4,8,15', '2,5,3,7'], 
        points: 20 
      }
    ];

    await Question.insertMany(defaultQuestions);
    console.log('Seed: Default questions inserted successfully.');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('Database disconnected.');
    }
  }
}

if (require.main === module) {
  seed(true);
}

module.exports = seed;
