import mongoose from "mongoose";

const dbConfig: process.env.MONGODB_URI || "mongodb://localhost:27017/fuse",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  },
};

export const createIndexes  = {
  url async (): Promise<void> {) => {
  // Define indexes for collections
  await mongoose.connection
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
  await mongoose.connection
    .collection("sessions")
    .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
};

export { dbConfig };
