import { config } from "@/config/env";
import { SignJWT, jwtVerify } from "jose";




export const generateAccessToken = async (payload: { email: string, id: string, username: string }) => {
    const accessTokenKey = new TextEncoder().encode(config.ACCESS_TOKEN_SECRET);

    return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(config.ACCESS_TOKEN_EXPIRY).sign(accessTokenKey)
}

export const generateRefreshToken = async (payload: { id: string }) => {
    const refreshTokenKey = new TextEncoder().encode(config.REFRESH_TOKEN_SECRET);

    return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(config.REFRESH_TOKEN_EXPIRY).sign(refreshTokenKey)
};

//TODO: Implement refresh token function
export const refreshToken = async (token: string) => { }

export const verifyToken = async (token: string, type: 'access' | 'refresh') => {
    try {
        const secret = type === 'access' ? config.ACCESS_TOKEN_SECRET : config.REFRESH_TOKEN_SECRET;
        const tokenKey = new TextEncoder().encode(secret);
        return await jwtVerify(token, tokenKey)
    } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
    }
};