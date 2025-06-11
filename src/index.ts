import { Elysia, status } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'

const users = [
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

const protectedRoutes = new Elysia()
  .use(jwt({
    name: 'jwt',
    secret: 'andrew paris and eugene r my senpais',
    exp: '1d'
  }))

  .get('/sign/:username', async ({ jwt, params: { username }, cookie: { auth } }) => {
    const value = await jwt.sign({ username })

    auth.set({
      value,
      httpOnly: true,
      path: '/profile'
    })

    return `Sign in as ${value}`
  })

  .get('/profile', async ({ jwt, status, cookie: { auth } }) => {
    const profile = await jwt.verify(auth.value)

    if (!profile) {
      return status(401)
    }

    const foundUser = users.filter((user) => {
      return user.username === profile.username
    })

    if (foundUser[0].role === 'admin') {
      return `Hello ${foundUser[0].username}, an admin!`
    } else {
      return status(401)
    }
})



const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Learning Elysia Auth API Documentation',
        version: ""
      },
    },
    path: '/api-docs'
  }))

  .use(protectedRoutes)

  .listen(3000);
    console.log(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} aka http://localhost:${app.server?.port}`
    );
