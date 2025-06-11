import { users } from '../db/users'

export function findUser(username: string) {
    return users.find(u => u.username === username);
}