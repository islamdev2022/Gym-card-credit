import mongoose from "mongoose"

// MongoDB connection
let isConnected = false

export const connectDB = async () => {
  if (isConnected) {
    return
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: 'GYM-CARD',
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  rfidUid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  credit: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastScan: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Create indexes for better performance
userSchema.index({ rfidUid: 1 })
userSchema.index({ lastScan: -1 })

export const User = mongoose.models.User || mongoose.model("User", userSchema)
