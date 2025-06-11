export type User = {
  id: number;
  username: string;
  password?: string; // Or a hash in real app
  role: 'admin' | 'basic';
}

export const users: User[] = [
  {
    id: 1,
    username: "andrei",
    password: "admin123",
    role: "admin",
  },
  {
    id: 2,
    username: "rando",
    password: "user123",
    role: "basic",
  },
];