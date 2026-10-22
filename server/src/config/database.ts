import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/campusflow';

export interface DatabaseStatus {
  connected: boolean;
  uri: string;
  dbName: string;
  host: string;
  supportsTransactions: boolean;
  error?: string;
}

let dbStatus: DatabaseStatus = {
  connected: false,
  uri: process.env.MONGODB_URI || DEFAULT_URI,
  dbName: 'campusflow',
  host: '127.0.0.1:27017',
  supportsTransactions: false,
};

export function getDatabaseStatus(): DatabaseStatus {
  return {
    ...dbStatus,
    connected: mongoose.connection.readyState === 1,
  };
}

export async function connectDatabase(): Promise<DatabaseStatus> {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    // Check if deployment is a replica set / mongos that supports multi-document transactions
    let supportsTransactions = false;
    try {
      const admin = conn.connection.db?.admin();
      if (admin) {
        const hello = await admin.command({ hello: 1 });
        supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');
      }
    } catch {
      supportsTransactions = false;
    }

    dbStatus = {
      connected: true,
      uri: uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
      dbName: conn.connection.name || 'campusflow',
      host: `${conn.connection.host}:${conn.connection.port}`,
      supportsTransactions,
    };

    console.log(
      `[CampusFlow DB] Connected to local MongoDB at ${dbStatus.host}/${dbStatus.dbName} (transactions: ${
        supportsTransactions ? 'replica-set' : 'standalone-atomic'
      })`
    );

    return dbStatus;
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    dbStatus = {
      ...dbStatus,
      connected: false,
      error: message,
    };
    console.error(`[CampusFlow DB] Connection error (${uri}): ${message}`);
    console.error(
      `[CampusFlow DB] Ensure MongoDB Community Server is running locally on 127.0.0.1:27017 (PowerShell: Start-Service MongoDB)`
    );
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    dbStatus.connected = false;
  }
}
