import { config } from "./config/env"
import { connectDB, dbInstance } from "./lib/connect-db";
import { httpServer } from "./server"


const startServer = () => {
    httpServer.listen(config.PORT, () => {
        console.log(`App is listening at port: ${config.PORT}`)
    })
};

try {
    console.log('DB Obj:', dbInstance);

    await connectDB();
    startServer();
} catch (error) {
    console.error("MongoDB connection error", error);
}