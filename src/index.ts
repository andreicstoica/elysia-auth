import { type Context, Elysia, status, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'
import cors from "@elysiajs/cors";
import cookie from "@elysiajs/cookie";

import { findUser } from './utils/findUser'
import type { User } from './db/users'

const auth = new Elysia()
  .use(jwt({
    name:'jwt',
    secret: process.env.JWT_SECRET!,
  }))

  .post('/api/login', async ({ body, jwt, cookie }) => {
    const { username, password } = body 

    console.log(`attempting login for: ${username}`)
    console.log('Request body:', body)
    
    const foundUser = findUser(username)

    if (!foundUser) {
      return status(401, 'Unauthorized: No user found.')
    } 
    if ( foundUser.password !== password) {
      return status(401, "Unauthorized: Password incorrect.")
    } 

    const jwtToken = await jwt.sign({ 
      id: foundUser.id,
      username: foundUser.username, 
      role: foundUser.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 1 week from now
    })

    console.log('created jwt token');

    cookie.authToken.set({
      value: jwtToken,
      httpOnly: true,
      secure: false, // only for dev, true in prod,
      sameSite: 'lax',
      maxAge: (60 * 60 * 24 * 7),
      path: '/'
    })

    console.log('cookie auth set');

    return `Login successful for ${username}, ${foundUser.role}`
  },
  {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    })
  })

  .post('/api/logout', ({ cookie }) => {
    console.log('logout requested')
    cookie.authToken.remove()

    return 'Logout successful'
  })

  .onError(({code, error}) => {
    console.log('ERROR', code, error)

    if (code === 'VALIDATION') {
      return status(400, 'Validation error: Please check your input')
    }

    if (code === 'NOT_FOUND') {
      return status(404, 'Route not found')
    }

    return status(500, 'Internal server error')
  })


// ------------------------ //
// --- PROTECTED ROUTES --- //
// ------------------------ //

interface AuthenticatedContext extends Context {
  user: User;
}

const protectedRoutes = new Elysia()

  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET!,
  }))

  .use(cookie())

  .decorate('user', null as User | null)

  .onBeforeHandle(async (context) => {
    console.log(`running auth middleware...`);

    const { jwt, cookie, set } = context as AuthenticatedContext
    const authToken = cookie.authToken.value
    console.log('Auth token received:', authToken ? 'Present' : 'Missing');

    if (!authToken) {
      return status(401, 'Auth required. Please login first.')
    }

    try {
      const payload = await jwt.verify(authToken)

      if (!payload) {
        return status(401, "Unauthorized: Invalid or expired token.")
      }

      const foundUser = findUser(payload.username as string)

      if (!foundUser) {
        cookie.authToken.remove()
        return status(401, "Unauthorized: User not found Please log in again.")
      }

      context.user = foundUser;

      (set as any).request.user = foundUser

      if (foundUser.role === 'admin') {
        return `Hello ${foundUser.username}, an admin!`
      } 
      
      return status(401, 'Unauthorized: You are not an admin.')
      } 
      catch (error) {
        cookie.authToken.remove()
        return status(401, 'Token verification failed. Please login again.')
      }
  })

  .get('/profile', ({ user }) => {
    if (user?.role === 'admin') {
      return `Hello ${user.username}, an admin! Accessed via protected route`
    }

    return status(403, 'Forbidden: you are not an admin.')
  })

  .get('/api/chat', ({ user }) => {
    return `Hi ${user?.username}, you are at chat endpoint and authenticated`
  })

  .get('/api/chat/history', ({ user }) => {
    return `chat history`
  })

  .delete('/api/chat/history', () => {
    return `still need to implement chat history deletion lol`
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

  .use(cors({
    origin: true,
    credentials:true
  }))

  .use(cookie({
    secret: process.env.JWT_SECRET,
    httpOnly: true,
    secure: false, // set to true only in prod with HTTPS
    sameSite: "lax",
  }))

  .get('/', () => "Hello Elysia's world!")

  .use(auth)
  .use(protectedRoutes)

  .listen(3000);
    console.log(
      `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
    );
