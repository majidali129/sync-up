import { config } from "./config/env"
import { connectDB, dbInstance } from "./db/connect-db";
import { httpServer } from "./server"


const startServer = () => {
    httpServer.listen(config.PORT, () => {
        console.log(`App is listening at port: ${config.PORT}`)
    })
};

try {
    await connectDB();
    startServer();
} catch (error) {
    console.error("MongoDB connection error", error);
}