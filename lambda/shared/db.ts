import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI");
    }
    connectionPromise = mongoose
      .connect(uri, { autoIndex: true })
      .catch((err) => {
        connectionPromise = null;
        console.log('nope')
        throw err;
      });
  }
};
