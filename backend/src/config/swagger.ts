import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Al Sufiaan School Management API',
      version: '1.0.0',
      description: 'API documentation for Al Sufiaan School Management System',
      contact: {
        name: 'API Support',
        email: 'support@alsufiaan.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:7000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            name: { type: 'string', description: 'User name' },
            email: { type: 'string', description: 'User email' },
            role: { type: 'string', enum: ['Admin', 'Accountant', 'Teacher'], description: 'User role' }
          }
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Student ID' },
            uniqueId: { type: 'string', description: 'Unique student identifier' },
            name: { type: 'string', description: 'Student name' },
            classId: { type: 'integer', description: 'Class ID' },
            sectionId: { type: 'integer', description: 'Section ID' }
          }
        },
        TeachingStaff: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Teaching staff ID' },
            name: { type: 'string', description: 'Staff name' },
            email: { type: 'string', description: 'Staff email' },
            designation: { type: 'string', description: 'Staff designation' },
            department: { type: 'string', description: 'Department' }
          }
        },
        NonTeachingStaff: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Non-teaching staff ID' },
            name: { type: 'string', description: 'Staff name' },
            jobTitle: { type: 'string', description: 'Job title' },
            department: { type: 'string', description: 'Department' }
          }
        },
        School: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'School ID' },
            name: { type: 'string', description: 'School name' },
            address: { type: 'string', description: 'School address' },
            contactNo: { type: 'string', description: 'Contact number' },
            email: { type: 'string', description: 'School email' }
          }
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Class ID' },
            name: { type: 'string', description: 'Class name' },
            numericValue: { type: 'integer', description: 'Numeric value for sorting' }
          }
        },
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Expense ID' },
            categoryId: { type: 'integer', description: 'Expense category ID' },
            amount: { type: 'number', description: 'Expense amount' },
            description: { type: 'string', description: 'Expense description' },
            date: { type: 'string', format: 'date', description: 'Expense date' }
          }
        },
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Vendor ID' },
            name: { type: 'string', description: 'Vendor name' },
            contactNo: { type: 'string', description: 'Contact number' },
            email: { type: 'string', description: 'Vendor email' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Transaction ID' },
            amount: { type: 'number', description: 'Transaction amount' },
            type: { type: 'string', enum: ['Income', 'Expense'], description: 'Transaction type' },
            party: { type: 'string', description: 'Transaction party' },
            paymentType: { type: 'string', enum: ['Cash', 'Cheque', 'Online'], description: 'Payment type' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/controllers/*.ts',
    './src/routes/*.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
