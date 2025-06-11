import { Elysia, status } from "elysia";
import { swagger } from '@elysiajs/swagger'
import { password } from "bun";

const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "user", password: "user123", role: "basic" },
];

const protectedRoutes = new Elysia()
  .derive((request) => {
    const authenticatedUser = users.find(
      (user) =>
        user.username === request.headers.username &&
        user.password === request.headers.password
    );

    return { authenticatedUser: authenticatedUser }
  })

  .onBeforeHandle((request) => {
    const authenticatedUser = request.authenticatedUser

    if (!authenticatedUser) {
      return status(401); // Unauthorized
    }

    const isAdmin = authenticatedUser.role === 'admin';

    if (!isAdmin) {
      console.log('User is not an admin');
      return status(401); // Unauthorized
    }

  })
  
  .get('/protected', () => {
    return { message: 'access granted!'}
  })

  .get('protected-with-context', ({authenticatedUser}) => {
    return { message: 'access granted!', user: authenticatedUser?.username }
  })

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Test Elysia DB Documentation',
        version: ""
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    path: '/api-docs'
  }))

  .get("/", () => "Hello Elysia", {
      detail: {
        tags: ['app']
      }
    })
  .use(protectedRoutes)

  .listen(3000);
    console.log(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} aka http://localhost:${app.server?.port}`
    );
