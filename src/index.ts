import { Elysia, status, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'

import { findUser } from './utils/findUser'
import cors from "@elysiajs/cors";
import cookie from "@elysiajs/cookie";

const login = new Elysia()
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

  .get('/profile', async ({ jwt, cookie }) => {
    console.log('protected profile route accessed');
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

  app.get('/', () => "hello elysia's world!!!")

  .use(login)

  .listen(3000);
    console.log(
      `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
    );
