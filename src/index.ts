import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()

app.use(swagger({
    documentation: {
      info: {
        title: 'Test Elysia DB Documentation',
        version: ""
      },
      tags: [
        {name: 'app', description: 'general endpoints'},
        {name: 'public', description: 'public endpoints'},
        {name: 'protected', description: 'private endpoints'}
      ],
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

app.get("/", () => "Hello Elysia", {
  detail: {
    tags: ['app']
  }
})
  
app.get('/api/public', () => { return {
    message: "this is public information"
    }
  }, {
    detail: {
      tags: ['public']
    }
  })

app.get('/api/protected', () => { return {
    message: "only admin should be able to see this"
    } 
  }, {
    detail: {
      tags: ['protected']
    }
  })

app.listen(3000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port} aka http://localhost:${app.server?.port}`
);
