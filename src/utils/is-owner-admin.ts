import { USER_ROLE } from "@/types/user";


export const isOwnerAdmin = (role: USER_ROLE): boolean => {
    return role === 'owner' || role === 'admin';
}