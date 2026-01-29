import mongoose, { ClientSession } from "mongoose";

type CB<T> = (session: ClientSession) => Promise<T>;
export const withTransaction = async <T,>(callback: CB<T>, maxCommitTimeMS: number = 5000): Promise<T> => {
    const session = await mongoose.startSession();

    try {
        return await session.withTransaction(async () => {
            return await callback(session);
        }, {
            maxCommitTimeMS
        })
    } finally {
        session.endSession()
    }
}