import { Elysia, status, t } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { jwt } from '@elysiajs/jwt'

import { findUser } from './utils/findUser'
import cors from "@elysiajs/cors";
import cookie from "@elysiajs/cookie";

type JWTPayload = {
  id: number;
  username: string;
  role: 'admin' | 'basic';
  exp: number;
}

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Learning Elysia Auth API Documentation',
        version: "1.0.0"
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

  .get('/', () => "hello elysia's world!!! any1 can access B^)")

  .group('/api', (authRoutes) => 
    authRoutes

      .use(jwt({
        name:'jwt',
        secret: process.env.JWT_SECRET!,
      }))

      .post('/login', async ({ body, jwt, cookie }) => {
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
        } satisfies JWTPayload) // new syntax!

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

      .derive(async ({ jwt, cookie }) => {
        console.log('Auth middleware...');
        const authToken = cookie.authToken.value
        console.log('Auth token received:', authToken ? 'Present' : 'Missing');

        if (!authToken) {
          return status(401, 'Auth required. Please login first.')
        }
    
        try {
          const payload = await jwt.verify(authToken)
    
          if (!payload) {
            cookie.authToken.remove()
            return status(401, "Unauthorized: Invalid or expired token.")
          }
    
          const foundUser = findUser((payload as JWTPayload).username) // new syntax!

          if (!foundUser) {
            cookie.authToken.remove()
            return status(401, "Unauthorized: User not found. Please log in again.")
          }

          return {
            user: {
              id: foundUser.id,
              username: foundUser.username,
              role: foundUser.role,
            },
          };
      } catch (error) {
        status(401);
        cookie.authToken.remove()

        throw new Error((error as Error ).message || 'Token veri failed.')
        }
      })

      .get('/profile', async ({ user }) => {
        console.log('protected profile route accessed');

        if (!user) {
          return status(401, 'Access Denied: User context missing')
        }

        if (user.role === 'admin') {
          return `Hello ${user.username}, an admin!`
        }

        return status(403, "Forbidden: You are not an admin.")
      })

      .get('/chat', async ({ user }) => {
        return `hello this is chat, only viewable if ur auth B^)`
      })
      )
      // end /api auth group

  // listen main app
  .listen(3000);
    console.log(
      `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
    );