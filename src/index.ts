import { Elysia, status } from "elysia";
import { swagger } from '@elysiajs/swagger'

  const users = [
    {
      id: 1,
      username: "admin",
      password: "admin123",
      role: "admin",
      secret: "admin-secret-123",
    },
    {
      id: 2,
      username: "user",
      password: "user123",
      role: "basic",
      secret: "user-secret-456",
    },
  ];

const protectedRoutes = new Elysia()
  .derive(request => {
    const authenticatedUser = users.find((user) => 
      user.secret === request.headers.bearer 
    );

    return { authenticatedUser: authenticatedUser }
  })

  .onBeforeHandle(request => {
    const authenticatedUser = request.authenticatedUser

    if (!authenticatedUser) {
      return status(401); // Unauthorized, no authenticated user
    }

    const isAdmin = authenticatedUser.role === 'admin';

    if (!isAdmin) {
      console.log('User is not an admin');
      return status(401); // Unauthorized, not admin
    }
  })

  .get('protected-with-context', ({authenticatedUser}) => {
    return { message: 'access granted!', user: authenticatedUser?.username }
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
