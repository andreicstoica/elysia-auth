import { users, type User } from '../db/users'

export function findUser(username: string): User | undefined {
    return users.find(u => u.username === username);
}