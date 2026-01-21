import { config } from "@/config/env";
import mongoose, { ConnectOptions, Mongoose } from "mongoose"

const dbOptions: ConnectOptions = {
    dbName: config.DB_NAME,
    appName: config.APP_NAME,
    maxPoolSize: 10
}

type DB_Instance = Mongoose | null;
export let dbInstance: DB_Instance = null;

export const connectDB = async () => {
    try {
        const connInstance = await mongoose.connect(config.DATABASE_URI, dbOptions);
        dbInstance = connInstance;
        console.log(`✅ Database connected 🚀 at host: ${dbInstance.connection.host}`, { ...dbOptions, uri: config.DATABASE_URI });

    } catch (error) {
        console.error("MongoDB connection error", error);
        process.exit(1)
    }
}

