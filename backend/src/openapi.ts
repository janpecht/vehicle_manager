export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sprinter Damage Manager API',
    description: 'REST API for managing Mercedes Sprinter fleet damage documentation.',
    version: '1.0.0',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http' as const,
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          licensePlate: { type: 'string', example: 'HD-AB 1234' },
          label: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DamageMarking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          vehicleId: { type: 'string', format: 'uuid' },
          viewSide: { type: 'string', enum: ['FRONT', 'REAR', 'LEFT', 'RIGHT'] },
          shape: { type: 'string', enum: ['CIRCLE', 'RECTANGLE'] },
          x: { type: 'number', minimum: 0, maximum: 1 },
          y: { type: 'number', minimum: 0, maximum: 1 },
          width: { type: 'number', minimum: 0, maximum: 1 },
          height: { type: 'number', minimum: 0, maximum: 1 },
          description: { type: 'string', nullable: true },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string', format: 'uuid' },
          repairedAt: { type: 'string', format: 'date-time', nullable: true },
          repairedBy: { type: 'string', format: 'uuid', nullable: true },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, accessToken: { type: 'string' } } } } },
          },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful (refresh token set as httpOnly cookie)',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, accessToken: { type: 'string' } } } } },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token using httpOnly cookie',
        responses: {
          '200': {
            description: 'Token refreshed',
            content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' } } } } },
          },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (clears refresh token cookie)',
        responses: {
          '200': { description: 'Logged out' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } },
          },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/api/vehicles': {
      get: {
        tags: ['Vehicles'],
        summary: 'List vehicles with search and pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by license plate or label' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Paginated vehicle list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Vehicles'],
        summary: 'Create a new vehicle',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['licensePlate'],
                properties: {
                  licensePlate: { type: 'string', example: 'HD-AB 1234' },
                  label: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Vehicle created', content: { 'application/json': { schema: { type: 'object', properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } } } } } },
          '409': { description: 'License plate already exists' },
        },
      },
    },
    '/api/vehicles/{id}': {
      get: {
        tags: ['Vehicles'],
        summary: 'Get a vehicle by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Vehicle found', content: { 'application/json': { schema: { type: 'object', properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } } } } } },
          '404': { description: 'Vehicle not found' },
        },
      },
      put: {
        tags: ['Vehicles'],
        summary: 'Update a vehicle',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['licensePlate'],
                properties: {
                  licensePlate: { type: 'string', example: 'HD-AB 1234' },
                  label: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Vehicle updated', content: { 'application/json': { schema: { type: 'object', properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } } } } } },
          '404': { description: 'Vehicle not found' },
          '409': { description: 'License plate already exists' },
        },
      },
      delete: {
        tags: ['Vehicles'],
        summary: 'Delete a vehicle',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Vehicle deleted' },
          '404': { description: 'Vehicle not found' },
        },
      },
    },
    '/api/vehicles/{vehicleId}/damages': {
      get: {
        tags: ['Damages'],
        summary: 'List damages for a vehicle',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'vehicleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'viewSide', in: 'query', schema: { type: 'string', enum: ['FRONT', 'REAR', 'LEFT', 'RIGHT'] } },
          { name: 'activeOnly', in: 'query', schema: { type: 'boolean', default: true } },
        ],
        responses: {
          '200': {
            description: 'List of damages',
            content: { 'application/json': { schema: { type: 'object', properties: { damages: { type: 'array', items: { $ref: '#/components/schemas/DamageMarking' } } } } } },
          },
        },
      },
      post: {
        tags: ['Damages'],
        summary: 'Create a damage marking',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'vehicleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['viewSide', 'shape', 'x', 'y', 'width', 'height', 'severity'],
                properties: {
                  viewSide: { type: 'string', enum: ['FRONT', 'REAR', 'LEFT', 'RIGHT'] },
                  shape: { type: 'string', enum: ['CIRCLE', 'RECTANGLE'] },
                  x: { type: 'number', minimum: 0, maximum: 1 },
                  y: { type: 'number', minimum: 0, maximum: 1 },
                  width: { type: 'number', minimum: 0, maximum: 1 },
                  height: { type: 'number', minimum: 0, maximum: 1 },
                  description: { type: 'string', maxLength: 500 },
                  severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Damage created', content: { 'application/json': { schema: { type: 'object', properties: { damage: { $ref: '#/components/schemas/DamageMarking' } } } } } },
          '404': { description: 'Vehicle not found' },
        },
      },
    },
    '/api/vehicles/{vehicleId}/damages/{damageId}': {
      get: {
        tags: ['Damages'],
        summary: 'Get a specific damage marking',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'vehicleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'damageId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Damage found', content: { 'application/json': { schema: { type: 'object', properties: { damage: { $ref: '#/components/schemas/DamageMarking' } } } } } },
          '404': { description: 'Damage not found' },
        },
      },
      delete: {
        tags: ['Damages'],
        summary: 'Delete a damage marking',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'vehicleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'damageId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Damage deleted' },
          '404': { description: 'Damage not found' },
        },
      },
    },
    '/api/vehicles/{vehicleId}/damages/{damageId}/repair': {
      patch: {
        tags: ['Damages'],
        summary: 'Mark a damage as repaired',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'vehicleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'damageId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Damage marked as repaired', content: { 'application/json': { schema: { type: 'object', properties: { damage: { $ref: '#/components/schemas/DamageMarking' } } } } } },
          '400': { description: 'Damage already repaired' },
          '404': { description: 'Damage not found' },
        },
      },
    },
  },
};
