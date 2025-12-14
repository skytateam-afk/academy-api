/**
 * OpenAPI 3.1 Specification
 * Complete API documentation schema
 */

const PORT = process.env.PORT || 8080;

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Skyta Academy',
    version: '1.0.0',
    description: 'A comprehensive Learning Management System API with RBAC, course management, and rich content support',
    contact: {
      name: 'skyta Academy Support',
      email: 'support@topuniverse.org'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.BASE_URL,
      description: 'Development server'
    },
    {
      url: 'https://api.topuniverse.org',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Users', description: 'User management operations' },
    { name: 'Roles', description: 'Role management and assignment' },
    { name: 'Permissions', description: 'Permission management' },
    { name: 'Courses', description: 'Course management operations' },
    { name: 'Categories', description: 'Course category management' },
    { name: 'Lessons', description: 'Lesson management and content delivery' },
    { name: 'Modules', description: 'Lesson module management' },
    { name: 'Attachments', description: 'Lesson attachment management' },
    { name: 'Module Attachments', description: 'Module attachment management' },
    { name: 'Payments', description: 'Payment processing and transactions' },
    { name: 'Notifications', description: 'User notification management' },
    { name: 'Library', description: 'Library management and digital resources' },
    { name: 'Settings', description: 'System and institution settings management' },
    { name: 'Promotions', description: 'Marketing promotions and campaigns' },
    { name: 'Announcements', description: 'System announcements and notifications' },
    { name: 'Pathways', description: 'Learning pathway management' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          dateOfBirth: { type: 'string', format: 'date', nullable: true },
          roleId: { type: 'string', format: 'uuid', nullable: true },
          roleName: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          isSystemRole: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Permission: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' }
        }
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          shortDescription: { type: 'string', nullable: true },
          instructorId: { type: 'string', format: 'uuid' },
          instructorName: { type: 'string', nullable: true },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          categoryName: { type: 'string', nullable: true },
          thumbnailUrl: { type: 'string', nullable: true },
          previewVideoUrl: { type: 'string', nullable: true },
          price: { type: 'number', format: 'decimal' },
          discountPrice: { type: 'number', format: 'decimal', nullable: true },
          currency: { type: 'string', default: 'USD' },
          durationHours: { type: 'number', nullable: true },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'beginner' },
          language: { type: 'string', default: 'en' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'], default: 'draft' },
          isFeatured: { type: 'boolean', default: false },
          enrollmentCount: { type: 'integer', default: 0 },
          rating: { type: 'number', format: 'decimal', nullable: true },
          reviewCount: { type: 'integer', default: 0 },
          requirements: { type: 'array', items: { type: 'string' }, nullable: true },
          learningOutcomes: { type: 'array', items: { type: 'string' }, nullable: true },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          parentId: { type: 'string', format: 'uuid', nullable: true },
          iconUrl: { type: 'string', nullable: true },
          displayOrder: { type: 'integer', default: 0 },
          isActive: { type: 'boolean', default: true },
          courseCount: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          courseId: { type: 'string', format: 'uuid' },
          amount: { type: 'number', format: 'decimal' },
          currency: { type: 'string', default: 'USD' },
          paymentMethod: { type: 'string', enum: ['stripe', 'paystack', 'free'] },
          paymentProvider: { type: 'string' },
          providerTransactionId: { type: 'string', nullable: true },
          providerReference: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'] },
          paidAt: { type: 'string', format: 'date-time', nullable: true },
          refundedAt: { type: 'string', format: 'date-time', nullable: true },
          refundReason: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Lesson: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          courseId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Introduction to JavaScript' },
          slug: { type: 'string', example: 'intro-to-javascript' },
          description: { type: 'string', nullable: true },
          contentType: { 
            type: 'string', 
            enum: ['video', 'audio', 'text', 'document', 'interactive', 'mixed'],
            description: 'Type of lesson content'
          },
          videoUrl: { type: 'string', nullable: true, description: 'URL for video content' },
          videoDuration: { type: 'integer', nullable: true, description: 'Video duration in seconds' },
          audioUrl: { type: 'string', nullable: true, description: 'URL for audio content' },
          audioDuration: { type: 'integer', nullable: true, description: 'Audio duration in seconds' },
          textContent: { type: 'string', nullable: true, description: 'Rich text content (HTML/Markdown)' },
          documentUrl: { type: 'string', nullable: true, description: 'URL for document content' },
          interactiveContent: { type: 'object', nullable: true, description: 'Interactive content configuration' },
          durationMinutes: { type: 'integer', nullable: true, description: 'Estimated completion time' },
          orderIndex: { type: 'integer', default: 0, description: 'Display order within course' },
          isPreview: { type: 'boolean', default: false, description: 'Available without enrollment' },
          isPublished: { type: 'boolean', default: false, description: 'Published status' },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          scheduledPublishAt: { type: 'string', format: 'date-time', nullable: true, description: 'Scheduled publish date' },
          version: { type: 'integer', default: 1, description: 'Content version number' },
          previousVersionId: { type: 'string', format: 'uuid', nullable: true, description: 'Reference to previous version' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      LessonAttachment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          lessonId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Lesson Slides' },
          description: { type: 'string', nullable: true },
          fileUrl: { type: 'string', description: 'URL to the file' },
          fileType: { type: 'string', example: 'application/pdf' },
          fileSize: { type: 'integer', description: 'File size in bytes' },
          isDownloadable: { type: 'boolean', default: true },
          orderIndex: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Module: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          lessonId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Variables and Data Types' },
          slug: { type: 'string', example: 'variables-and-data-types' },
          description: { type: 'string', nullable: true },
          contentType: { 
            type: 'string', 
            enum: ['video', 'audio', 'text', 'document', 'interactive', 'quiz', 'mixed'],
            description: 'Type of module content'
          },
          videoUrl: { type: 'string', nullable: true },
          videoDuration: { type: 'integer', nullable: true },
          audioUrl: { type: 'string', nullable: true },
          audioDuration: { type: 'integer', nullable: true },
          textContent: { type: 'string', nullable: true },
          documentUrl: { type: 'string', nullable: true },
          interactiveContent: { type: 'object', nullable: true },
          quizData: { type: 'object', nullable: true },
          durationMinutes: { type: 'integer', nullable: true },
          orderIndex: { type: 'integer', default: 0 },
          isPreview: { type: 'boolean', default: false },
          isPublished: { type: 'boolean', default: false },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          version: { type: 'integer', default: 1 },
          previousVersionId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ModuleAttachment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          moduleId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Module Resources' },
          description: { type: 'string', nullable: true },
          fileUrl: { type: 'string' },
          fileType: { type: 'string', example: 'application/pdf' },
          fileSize: { type: 'integer' },
          isDownloadable: { type: 'boolean', default: true },
          orderIndex: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          type: {
            type: 'string',
            enum: [
              'welcome',
              'password_changed',
              'role_changed',
              'permission_granted',
              'account_status_changed',
              'payment_success',
              'payment_failed',
              'refund_processed',
              'course_enrollment'
            ]
          },
          title: { type: 'string' },
          message: { type: 'string' },
          data: { type: 'object', nullable: true, description: 'Additional notification data' },
          isRead: { type: 'boolean', default: false },
          readAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      LibraryCategory: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Fiction' },
          slug: { type: 'string', example: 'fiction' },
          description: { type: 'string', nullable: true },
          itemCount: { type: 'integer', default: 0 },
          isActive: { type: 'boolean', default: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      LibraryItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'The Great Gatsby' },
          slug: { type: 'string', example: 'the-great-gatsby' },
          author: { type: 'string', example: 'F. Scott Fitzgerald', nullable: true },
          isbn: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true },
          publishedDate: { type: 'string', format: 'date', nullable: true },
          description: { type: 'string', nullable: true },
          categoryId: { type: 'string', format: 'uuid', nullable: true },
          categoryName: { type: 'string', nullable: true },
          itemType: { type: 'string', enum: ['book', 'ebook', 'audiobook', 'journal', 'magazine', 'other'], default: 'book' },
          format: { type: 'string', enum: ['physical', 'digital', 'both'], default: 'physical' },
          coverImageUrl: { type: 'string', nullable: true },
          fileUrl: { type: 'string', nullable: true, description: 'URL for digital content (PDF, MP3, etc.)' },
          fileType: { type: 'string', nullable: true },
          fileSize: { type: 'integer', nullable: true },
          totalCopies: { type: 'integer', default: 1 },
          availableCopies: { type: 'integer', default: 1 },
          location: { type: 'string', nullable: true, description: 'Physical location in library' },
          isFeatured: { type: 'boolean', default: false },
          viewCount: { type: 'integer', default: 0 },
          downloadCount: { type: 'integer', default: 0 },
          borrowCount: { type: 'integer', default: 0 },
          tags: { type: 'array', items: { type: 'string' }, nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      LibraryBorrowing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          itemId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          borrowedDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          returnedDate: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['active', 'returned', 'overdue'], default: 'active' },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      LibraryReservation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          itemId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          reservedDate: { type: 'string', format: 'date-time' },
          expiryDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'ready', 'fulfilled', 'cancelled', 'expired'], default: 'pending' },
          notifiedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      InstitutionSettings: {
        type: 'object',
        properties: {
          institutionName: { type: 'string', example: 'Skyta Academy' },
          institutionEmail: { type: 'string', format: 'email', nullable: true },
          institutionPhone: { type: 'string', nullable: true },
          institutionAddress: { type: 'string', nullable: true },
          lightLogoUrl: { type: 'string', nullable: true },
          darkLogoUrl: { type: 'string', nullable: true },
          faviconUrl: { type: 'string', nullable: true },
          primaryColor: { type: 'string', nullable: true },
          secondaryColor: { type: 'string', nullable: true },
          timezone: { type: 'string', default: 'UTC' },
          currency: { type: 'string', default: 'USD' },
          language: { type: 'string', default: 'en' },
          maintenanceMode: { type: 'boolean', default: false },
          allowRegistration: { type: 'boolean', default: true },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Promotion: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Summer Sale' },
          message: { type: 'string' },
          imageUrl: { type: 'string', nullable: true },
          link: { type: 'string', nullable: true },
          targetAudience: { type: 'string', enum: ['all', 'students', 'instructors', 'admins'], default: 'all' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean', default: true },
          displayCount: { type: 'integer', default: 0 },
          clickCount: { type: 'integer', default: 0 },
          dismissCount: { type: 'integer', default: 0 },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Announcement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'System Maintenance Notice' },
          message: { type: 'string' },
          type: { type: 'string', enum: ['info', 'warning', 'success', 'error'], default: 'info' },
          priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
          targetAudience: { type: 'string', enum: ['all', 'students', 'instructors', 'admins'], default: 'all' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time', nullable: true },
          isActive: { type: 'boolean', default: true },
          isPinned: { type: 'boolean', default: false },
          viewCount: { type: 'integer', default: 0 },
          dismissCount: { type: 'integer', default: 0 },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Pathway: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Full Stack Web Development' },
          slug: { type: 'string', example: 'full-stack-web-development' },
          description: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          duration: { type: 'string', nullable: true, description: 'Estimated duration (e.g., "3 months")' },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'beginner' },
          isPublished: { type: 'boolean', default: false },
          isFeatured: { type: 'boolean', default: false },
          enrollmentCount: { type: 'integer', default: 0 },
          createdBy: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          courses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                courseId: { type: 'string', format: 'uuid' },
                orderIndex: { type: 'integer' },
                isRequired: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'User signup (self-registration)',
        description: 'Create a new user account through public self-registration. Username is auto-generated. User is automatically logged in upon successful signup.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { 
                    type: 'string', 
                    format: 'email', 
                    example: 'newuser@example.com',
                    description: 'User email address'
                  },
                  password: { 
                    type: 'string', 
                    minLength: 8, 
                    example: 'SecurePass123!',
                    description: 'Password (min 8 chars, must contain uppercase, lowercase, and number)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Account created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Account created successfully' },
                    token: { type: 'string', description: 'JWT access token for immediate login' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', example: 'playful_panda_42' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', example: 'student' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Create a new user account (requires authentication). Username is auto-generated. Any authenticated user can register others.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { 
                    type: 'string', 
                    format: 'email', 
                    example: 'user@example.com',
                    description: 'User email address'
                  },
                  password: { 
                    type: 'string', 
                    minLength: 8, 
                    example: 'SecurePass123!',
                    description: 'Password (min 8 chars, must contain uppercase, lowercase, and number)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'User registered successfully' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', example: 'playful_panda_42' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', example: 'student' },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        description: 'Authenticate user with username/email and password, receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  user: { 
                    type: 'string', 
                    example: 'user@example.com',
                    description: 'Username or email address'
                  },
                  username: { 
                    type: 'string', 
                    example: 'johndoe',
                    description: 'Username (alternative to user field)'
                  },
                  password: { 
                    type: 'string', 
                    example: 'SecurePass123!',
                    description: 'User password'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'You have successfully logged in!' },
                    token: { type: 'string', description: 'JWT access token' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        message: { type: 'string', example: 'logged in' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Missing credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Retrieve the authenticated user\'s profile information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        is_active: { type: 'boolean' },
                        is_verified: { type: 'boolean' },
                        mfa_enabled: { type: 'boolean' },
                        last_login: { type: 'string', format: 'date-time', nullable: true },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/password': {
      put: {
        tags: ['Authentication'],
        summary: 'Update user password',
        description: 'Change the authenticated user\'s password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: {
                    type: 'string',
                    format: 'password',
                    example: 'OldPass123!',
                    description: 'Current password'
                  },
                  newPassword: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    example: 'NewSecurePass123!',
                    description: 'New password (min 8 chars, must contain uppercase, lowercase, and number)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Password updated successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or weak password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Current password is incorrect',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/mfa': {
      put: {
        tags: ['Authentication'],
        summary: 'Toggle MFA (Multi-Factor Authentication)',
        description: 'Enable or disable MFA for the authenticated user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['enabled'],
                properties: {
                  enabled: {
                    type: 'boolean',
                    example: true,
                    description: 'Set to true to enable MFA, false to disable'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'MFA status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'MFA enabled successfully' },
                    mfa_enabled: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/request-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Request OTP for email login',
        description: 'Request a one-time password (OTP) to be sent to the user\'s email for passwordless login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                    description: 'Email address to send OTP to'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'OTP sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'OTP has been sent to your email' },
                    expiresIn: { type: 'integer', example: 600, description: 'OTP expiration time in seconds' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid email format or email not registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Failed to send OTP email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify OTP and login',
        description: 'Verify the OTP code and authenticate the user (passwordless login)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                    description: 'Email address'
                  },
                  otp: {
                    type: 'string',
                    pattern: '^\\d{6}$',
                    example: '123456',
                    description: '6-digit OTP code'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'OTP verified successfully, user logged in',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'You have successfully logged in!' },
                    token: { type: 'string', description: 'JWT access token' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        message: { type: 'string', example: 'logged in' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Invalid or expired OTP, or too many failed attempts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve paginated list of users with optional filtering',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, email, or username' },
          { name: 'role', in: 'query', schema: { type: 'string' }, description: 'Filter by role name' },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Filter by active status' }
        ],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        description: 'Create a new user account (requires user.create permission)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'username', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  username: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  roleId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID (UUID or numeric)' }
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid user ID',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        description: 'Update user profile information (first name, last name, bio, phone)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  bio: { type: 'string', example: 'Software developer and tech enthusiast' },
                  phone: { type: 'string', example: '+1234567890' },
                  dateOfBirth: { type: 'string', format: 'date', example: '1990-01-15' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        description: 'Delete a user from the system (cannot delete yourself)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        responses: {
          '200': {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'Cannot delete your own account',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Update user role',
        description: 'Update a user\'s role (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role_name'],
                properties: {
                  role_name: { 
                    type: 'string', 
                    example: 'instructor',
                    description: 'New role name (e.g., student, instructor, admin, super_admin)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User role updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        role_name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid role name or role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}/password': {
      put: {
        tags: ['Users'],
        summary: 'Update user password',
        description: 'Update a user\'s password (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['new_password'],
                properties: {
                  current_password: { 
                    type: 'string', 
                    format: 'password',
                    description: 'Current password (optional for admin)'
                  },
                  new_password: { 
                    type: 'string', 
                    format: 'password',
                    minLength: 8,
                    example: 'NewSecurePass123!',
                    description: 'New password (minimum 8 characters)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Password updated successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Password too weak or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}/toggle-status': {
      patch: {
        tags: ['Users'],
        summary: 'Toggle user active status',
        description: 'Activate or deactivate a user account (cannot toggle your own status)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        responses: {
          '200': {
            description: 'User status toggled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        is_active: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Cannot toggle your own status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}/permissions': {
      get: {
        tags: ['Users'],
        summary: 'Get user permissions',
        description: 'Retrieve all permissions for a specific user (requires user.read permission or self)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        responses: {
          '200': {
            description: 'User permissions retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Permission' }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Grant permission to user',
        description: 'Grant a specific permission to a user (requires user.manage_roles permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['permissionName'],
                properties: {
                  permissionName: {
                    type: 'string',
                    example: 'course.create',
                    description: 'Permission name to grant'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Permission granted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Permission granted successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid permission name',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'User or permission not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}/permissions/{permissionName}': {
      delete: {
        tags: ['Users'],
        summary: 'Revoke permission from user',
        description: 'Revoke a specific permission from a user (requires user.manage_roles permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' },
          { name: 'permissionName', in: 'path', required: true, schema: { type: 'string' }, description: 'Permission name to revoke', example: 'course.create' }
        ],
        responses: {
          '200': {
            description: 'Permission revoked successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Permission revoked successfully' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User or permission not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Upload user avatar',
        description: 'Upload avatar image for a user (requires user.update permission or self)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Avatar image file (JPEG, PNG, WebP, max 5MB)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Avatar uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Avatar uploaded successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        avatarUrl: { type: 'string', example: 'https://cdn.example.com/avatars/user-123.jpg' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid file format or size',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/roles': {
      get: {
        tags: ['Roles'],
        summary: 'Get all roles',
        description: 'Retrieve all roles with their permissions (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of roles',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Role' }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Roles'],
        summary: 'Create new role',
        description: 'Create a new role (requires role.create permission)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { 
                    type: 'string',
                    example: 'content_manager',
                    description: 'Unique role name'
                  },
                  description: { 
                    type: 'string',
                    example: 'Manages course content and lessons',
                    description: 'Role description'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Role created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Role created successfully' },
                    data: { $ref: '#/components/schemas/Role' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or role already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/roles/{id}': {
      get: {
        tags: ['Roles'],
        summary: 'Get role by ID',
        description: 'Retrieve a specific role with its permissions (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Role ID'
          }
        ],
        responses: {
          '200': {
            description: 'Role details with permissions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/Role' },
                        {
                          type: 'object',
                          properties: {
                            permissions: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Permission' }
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Roles'],
        summary: 'Update role',
        description: 'Update role details (requires role.update permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Role ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { 
                    type: 'string',
                    example: 'content_manager',
                    description: 'Role name'
                  },
                  description: { 
                    type: 'string',
                    example: 'Manages all course content',
                    description: 'Role description'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Role updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Role updated successfully' },
                    data: { $ref: '#/components/schemas/Role' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Roles'],
        summary: 'Delete role',
        description: 'Delete a role (requires role.delete permission). Cannot delete system roles.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Role ID'
          }
        ],
        responses: {
          '200': {
            description: 'Role deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Role deleted successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Cannot delete system role or role in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/roles/{id}/permissions': {
      get: {
        tags: ['Roles'],
        summary: 'Get role permissions',
        description: 'Retrieve all permissions assigned to a role (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Role ID'
          }
        ],
        responses: {
          '200': {
            description: 'List of role permissions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Permission' }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Roles'],
        summary: 'Sync role permissions',
        description: 'Replace all role permissions with new set (requires role.update permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Role ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['permission_ids'],
                properties: {
                  permission_ids: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
                    description: 'Array of permission IDs to assign to the role'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Role permissions updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Role permissions updated successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input - permission_ids must be an array',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/roles/{id}/users': {
      get: {
        tags: ['Roles'],
        summary: 'Get users with role',
        description: 'Retrieve all users assigned to a specific role (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Role ID'
          }
        ],
        responses: {
          '200': {
            description: 'List of users with this role',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Role not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/permissions': {
      get: {
        tags: ['Permissions'],
        summary: 'Get all permissions',
        description: 'Retrieve all system permissions with optional filtering and grouping (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'resource',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by resource (e.g., user, course, lesson)',
            example: 'course'
          },
          {
            name: 'group_by_resource',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Group permissions by resource',
            example: true
          }
        ],
        responses: {
          '200': {
            description: 'List of permissions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      oneOf: [
                        {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Permission' },
                          description: 'Flat list when group_by_resource is false'
                        },
                        {
                          type: 'object',
                          additionalProperties: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Permission' }
                          },
                          description: 'Grouped by resource when group_by_resource is true'
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Permissions'],
        summary: 'Create new permission',
        description: 'Create a new permission (super admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'resource', 'action'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'course.publish',
                    description: 'Permission name (format: resource.action)'
                  },
                  resource: {
                    type: 'string',
                    example: 'course',
                    description: 'Resource type (e.g., user, course, lesson)'
                  },
                  action: {
                    type: 'string',
                    example: 'publish',
                    description: 'Action type (e.g., create, read, update, delete, publish)'
                  },
                  description: {
                    type: 'string',
                    example: 'Allows publishing courses',
                    description: 'Permission description'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Permission created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Permission created successfully' },
                    data: { $ref: '#/components/schemas/Permission' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input or permission already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Super admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/permissions/resources': {
      get: {
        tags: ['Permissions'],
        summary: 'Get all unique resources',
        description: 'Retrieve list of all unique resource types (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of unique resources',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['user', 'role', 'course', 'lesson', 'category', 'payment']
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/permissions/bulk': {
      post: {
        tags: ['Permissions'],
        summary: 'Bulk create permissions',
        description: 'Create multiple permissions at once (super admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['permissions'],
                properties: {
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['name', 'resource', 'action'],
                      properties: {
                        name: { type: 'string', example: 'course.publish' },
                        resource: { type: 'string', example: 'course' },
                        action: { type: 'string', example: 'publish' },
                        description: { type: 'string', example: 'Allows publishing courses' }
                      }
                    },
                    example: [
                      {
                        name: 'course.publish',
                        resource: 'course',
                        action: 'publish',
                        description: 'Allows publishing courses'
                      },
                      {
                        name: 'course.archive',
                        resource: 'course',
                        action: 'archive',
                        description: 'Allows archiving courses'
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Permissions created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: '2 permissions created successfully' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Permission' }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Super admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/permissions/{id}': {
      get: {
        tags: ['Permissions'],
        summary: 'Get permission by ID',
        description: 'Retrieve a specific permission with associated roles and users (requires role.read permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Permission ID'
          }
        ],
        responses: {
          '200': {
            description: 'Permission details with roles and users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      allOf: [
                        { $ref: '#/components/schemas/Permission' },
                        {
                          type: 'object',
                          properties: {
                            roles: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/Role' },
                              description: 'Roles that have this permission'
                            },
                            users: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/User' },
                              description: 'Users that have this permission (via roles)'
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Permission not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Permissions'],
        summary: 'Update permission',
        description: 'Update permission details (super admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Permission ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'course.publish' },
                  resource: { type: 'string', example: 'course' },
                  action: { type: 'string', example: 'publish' },
                  description: { type: 'string', example: 'Allows publishing courses' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Permission updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Permission updated successfully' },
                    data: { $ref: '#/components/schemas/Permission' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Permission not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Super admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Permissions'],
        summary: 'Delete permission',
        description: 'Delete a permission from the system (super admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { 
            name: 'id', 
            in: 'path', 
            required: true, 
            schema: { type: 'string', format: 'uuid' },
            description: 'Permission ID'
          }
        ],
        responses: {
          '200': {
            description: 'Permission deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Permission deleted successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Cannot delete permission in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Permission not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Super admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/courses': {
      get: {
        tags: ['Courses'],
        summary: 'Get all courses',
        description: 'Retrieve paginated list of courses with filtering options',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by title or description' },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'instructorId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'level', in: 'query', schema: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'all'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'archived'] } },
          { name: 'isFeatured', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': {
            description: 'List of courses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Courses'],
        summary: 'Create new course',
        description: 'Create a new course (requires course.create permission)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Introduction to Web Development' },
                  description: { type: 'string' },
                  shortDescription: { type: 'string' },
                  categoryId: { type: 'string', format: 'uuid' },
                  price: { type: 'number', example: 49.99 },
                  discountPrice: { type: 'number', example: 39.99 },
                  durationHours: { type: 'number', example: 40 },
                  level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'all'] },
                  language: { type: 'string', example: 'en' },
                  requirements: { type: 'array', items: { type: 'string' } },
                  learningOutcomes: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Course created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{id}': {
      get: {
        tags: ['Courses'],
        summary: 'Get course by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Course details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Course not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Courses'],
        summary: 'Update course',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  shortDescription: { type: 'string' },
                  categoryId: { type: 'string', format: 'uuid' },
                  price: { type: 'number' },
                  discountPrice: { type: 'number' },
                  durationHours: { type: 'number' },
                  level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'all'] },
                  requirements: { type: 'array', items: { type: 'string' } },
                  learningOutcomes: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Course updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Courses'],
        summary: 'Delete course',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Course deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/courses/slug/{slug}': {
      get: {
        tags: ['Courses'],
        summary: 'Get course by slug',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Course details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/featured': {
      get: {
        tags: ['Courses'],
        summary: 'Get featured courses',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }
        ],
        responses: {
          '200': {
            description: 'List of featured courses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/instructor/{instructorId}': {
      get: {
        tags: ['Courses'],
        summary: 'Get courses by instructor',
        description: 'Retrieve all courses created by a specific instructor',
        parameters: [
          { name: 'instructorId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Instructor user ID' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          '200': {
            description: 'List of instructor courses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{id}/publish': {
      patch: {
        tags: ['Courses'],
        summary: 'Publish/unpublish course',
        description: 'Toggle course publish status (requires course.publish permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['draft', 'published', 'archived'],
                    example: 'published',
                    description: 'New course status'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Course status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Course published successfully' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          },
          '403': {
            description: 'Forbidden - Missing required permission',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/courses/{id}/featured': {
      patch: {
        tags: ['Courses'],
        summary: 'Toggle featured status',
        description: 'Mark or unmark course as featured (requires course.update permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_featured'],
                properties: {
                  is_featured: {
                    type: 'boolean',
                    example: true,
                    description: 'Set to true to feature the course, false to unfeature'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Featured status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Course featured status updated' },
                    data: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{id}/thumbnail': {
      post: {
        tags: ['Courses'],
        summary: 'Upload course thumbnail',
        description: 'Upload thumbnail image for a course (requires course.update permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['thumbnail'],
                properties: {
                  thumbnail: {
                    type: 'string',
                    format: 'binary',
                    description: 'Thumbnail image file (JPEG, PNG, WebP)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Thumbnail uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Thumbnail uploaded successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        thumbnailUrl: { type: 'string', example: 'https://cdn.example.com/thumbnails/course-123.jpg' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid file format or size',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/courses/{id}/preview-video': {
      post: {
        tags: ['Courses'],
        summary: 'Upload preview video',
        description: 'Upload preview video for a course (requires course.update permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['video'],
                properties: {
                  video: {
                    type: 'string',
                    format: 'binary',
                    description: 'Preview video file (MP4, WebM)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Preview video uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Preview video uploaded successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        previewVideoUrl: { type: 'string', example: 'https://cdn.example.com/videos/preview-123.mp4' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid file format or size',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get all categories',
        description: 'Retrieve all categories with optional filtering',
        parameters: [
          { name: 'parentId', in: 'query', schema: { type: 'string' }, description: 'Filter by parent ID (use "null" for root)' },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'includeChildren', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Category' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Categories'],
        summary: 'Create new category',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Web Development' },
                  description: { type: 'string' },
                  parentId: { type: 'string', format: 'uuid', nullable: true },
                  iconUrl: { type: 'string' },
                  displayOrder: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Category created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/categories/tree': {
      get: {
        tags: ['Categories'],
        summary: 'Get category tree',
        description: 'Retrieve hierarchical category structure',
        responses: {
          '200': {
            description: 'Category tree',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Category' },
                          {
                            type: 'object',
                            properties: {
                              children: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Category' }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/categories/slug/{slug}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by slug',
        description: 'Retrieve category details using its slug',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'web-development' }
        ],
        responses: {
          '200': {
            description: 'Category details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Category not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/categories/reorder': {
      post: {
        tags: ['Categories'],
        summary: 'Reorder categories',
        description: 'Update display order of multiple categories (requires category.update permission)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['categories'],
                properties: {
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'displayOrder'],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        displayOrder: { type: 'integer' }
                      }
                    },
                    example: [
                      { id: '123e4567-e89b-12d3-a456-426614174000', displayOrder: 1 },
                      { id: '223e4567-e89b-12d3-a456-426614174001', displayOrder: 2 }
                    ]
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Categories reordered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Categories reordered successfully' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Category details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Categories'],
        summary: 'Update category',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  parentId: { type: 'string', format: 'uuid', nullable: true },
                  iconUrl: { type: 'string' },
                  displayOrder: { type: 'integer' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Category updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Category deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/payments/config': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment configuration',
        description: 'Get public payment provider keys and configuration for frontend',
        responses: {
          '200': {
            description: 'Payment configuration',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        stripe: {
                          type: 'object',
                          properties: {
                            enabled: { type: 'boolean' },
                            publishableKey: { type: 'string', nullable: true }
                          }
                        },
                        paystack: {
                          type: 'object',
                          properties: {
                            enabled: { type: 'boolean' },
                            publicKey: { type: 'string', nullable: true }
                          }
                        },
                        defaultCurrency: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/payments/initialize': {
      post: {
        tags: ['Payments'],
        summary: 'Initialize payment',
        description: 'Initialize payment for a course enrollment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId'],
                properties: {
                  courseId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
                  provider: { type: 'string', enum: ['stripe', 'paystack'], default: 'stripe' },
                  currency: { type: 'string', default: 'USD', example: 'USD' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment initialized successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        transactionId: { type: 'string', format: 'uuid' },
                        clientSecret: { type: 'string', description: 'Stripe client secret' },
                        authorizationUrl: { type: 'string', description: 'Paystack authorization URL' },
                        provider: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/payments/verify/{transactionId}': {
      post: {
        tags: ['Payments'],
        summary: 'Verify payment',
        description: 'Verify payment status and create enrollment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'transactionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['provider'],
                properties: {
                  provider: { type: 'string', enum: ['stripe', 'paystack'] }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Transaction' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/payments/transactions': {
      get: {
        tags: ['Payments'],
        summary: 'Get user transactions',
        description: 'Get transaction history for authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] } }
        ],
        responses: {
          '200': {
            description: 'Transaction list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/payments/refund/{transactionId}': {
      post: {
        tags: ['Payments'],
        summary: 'Refund payment',
        description: 'Process refund for a transaction (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'transactionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: 'Customer request' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Refund processed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/courses/{courseId}/lessons': {
      get: {
        tags: ['Lessons'],
        summary: 'Get all lessons for a course',
        description: 'Retrieve paginated list of lessons for a specific course',
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'isPublished', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': {
            description: 'List of lessons',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Lesson' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Lessons'],
        summary: 'Create new lesson',
        description: 'Create a new lesson for a course (requires lesson.create permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'contentType'],
                properties: {
                  title: { type: 'string', example: 'Introduction to JavaScript' },
                  slug: { type: 'string', example: 'intro-to-javascript' },
                  description: { type: 'string' },
                  contentType: { type: 'string', enum: ['video', 'audio', 'text', 'document', 'interactive', 'mixed'] },
                  videoUrl: { type: 'string' },
                  videoDuration: { type: 'integer' },
                  audioUrl: { type: 'string' },
                  audioDuration: { type: 'integer' },
                  textContent: { type: 'string' },
                  documentUrl: { type: 'string' },
                  interactiveContent: { type: 'object' },
                  durationMinutes: { type: 'integer' },
                  orderIndex: { type: 'integer' },
                  isPreview: { type: 'boolean' },
                  isPublished: { type: 'boolean' },
                  scheduledPublishAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Lesson created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Lesson' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{courseId}/lessons/search': {
      get: {
        tags: ['Lessons'],
        summary: 'Search lessons in a course',
        description: 'Search for lessons within a specific course',
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Lesson' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{courseId}/lessons/progress': {
      get: {
        tags: ['Lessons'],
        summary: 'Get lessons with user progress',
        description: 'Retrieve lessons for a course with the authenticated user\'s progress',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lessons with progress',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Lesson' },
                          {
                            type: 'object',
                            properties: {
                              progress: {
                                type: 'object',
                                properties: {
                                  completed: { type: 'boolean' },
                                  completedAt: { type: 'string', format: 'date-time', nullable: true },
                                  timeSpent: { type: 'integer', description: 'Time spent in seconds' }
                                }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{courseId}/lessons/reorder': {
      put: {
        tags: ['Lessons'],
        summary: 'Reorder lessons in a course',
        description: 'Update the order of lessons within a course',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lessonIds'],
                properties: {
                  lessonIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Array of lesson IDs in desired order'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Lessons reordered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Lessons reordered successfully' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/courses/{courseId}/attachments/statistics': {
      get: {
        tags: ['Attachments'],
        summary: 'Get course attachment statistics',
        description: 'Get statistics for all attachments in a course',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Attachment statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalAttachments: { type: 'integer' },
                        totalSize: { type: 'integer', description: 'Total size in bytes' },
                        downloadableCount: { type: 'integer' },
                        byFileType: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/attachments': {
      get: {
        tags: ['Attachments'],
        summary: 'Get all attachments for a lesson',
        description: 'Retrieve all attachments associated with a specific lesson',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'List of attachments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Attachment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Attachments'],
        summary: 'Create a new attachment',
        description: 'Add a new attachment to a lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'fileUrl', 'fileType'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  fileUrl: { type: 'string' },
                  fileType: { type: 'string' },
                  fileSize: { type: 'integer' },
                  isDownloadable: { type: 'boolean', default: true },
                  orderIndex: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attachment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Attachment' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/attachments/downloadable': {
      get: {
        tags: ['Attachments'],
        summary: 'Get downloadable attachments',
        description: 'Retrieve only downloadable attachments for a lesson',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'List of downloadable attachments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Attachment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/attachments/search': {
      get: {
        tags: ['Attachments'],
        summary: 'Search attachments in a lesson',
        description: 'Search for attachments within a specific lesson',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'query', in: 'query', schema: { type: 'string' }, description: 'Search query' },
          { name: 'fileType', in: 'query', schema: { type: 'string' }, description: 'Filter by file type' }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Attachment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/attachments/bulk': {
      post: {
        tags: ['Attachments'],
        summary: 'Bulk create attachments',
        description: 'Create multiple attachments at once for a lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attachments'],
                properties: {
                  attachments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['title', 'fileUrl', 'fileType'],
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        fileUrl: { type: 'string' },
                        fileType: { type: 'string' },
                        fileSize: { type: 'integer' },
                        isDownloadable: { type: 'boolean' },
                        orderIndex: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attachments created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Attachment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/attachments/reorder': {
      put: {
        tags: ['Attachments'],
        summary: 'Reorder attachments',
        description: 'Update the order of attachments in a lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attachmentIds'],
                properties: {
                  attachmentIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Array of attachment IDs in desired order'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Attachments reordered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/attachments/{id}': {
      get: {
        tags: ['Attachments'],
        summary: 'Get attachment by ID',
        description: 'Retrieve a specific attachment by its ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Attachment details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Attachment' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Attachment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Attachments'],
        summary: 'Update attachment',
        description: 'Update an existing attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  fileUrl: { type: 'string' },
                  fileType: { type: 'string' },
                  fileSize: { type: 'integer' },
                  isDownloadable: { type: 'boolean' },
                  orderIndex: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Attachment updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Attachment' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Attachments'],
        summary: 'Delete attachment',
        description: 'Delete an attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Attachment deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/attachments/{id}/downloadable': {
      patch: {
        tags: ['Attachments'],
        summary: 'Toggle attachment downloadable status',
        description: 'Enable or disable downloading for an attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isDownloadable'],
                properties: {
                  isDownloadable: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Downloadable status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Attachment' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{id}': {
      get: {
        tags: ['Lessons'],
        summary: 'Get lesson by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lesson details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Lesson' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Lesson not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Lessons'],
        summary: 'Update lesson',
        description: 'Update lesson details (creates new version if content changed)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  videoUrl: { type: 'string' },
                  videoDuration: { type: 'integer' },
                  audioUrl: { type: 'string' },
                  audioDuration: { type: 'integer' },
                  textContent: { type: 'string' },
                  documentUrl: { type: 'string' },
                  interactiveContent: { type: 'object' },
                  durationMinutes: { type: 'integer' },
                  orderIndex: { type: 'integer' },
                  isPreview: { type: 'boolean' },
                  isPublished: { type: 'boolean' },
                  scheduledPublishAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Lesson updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Lesson' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Lessons'],
        summary: 'Delete lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lesson deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{id}/versions': {
      get: {
        tags: ['Lessons'],
        summary: 'Get lesson version history',
        description: 'Retrieve all versions of a lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lesson version history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Lesson' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{id}/publish': {
      patch: {
        tags: ['Lessons'],
        summary: 'Toggle lesson publish status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_published'],
                properties: {
                  is_published: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Publish status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Lesson' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{id}/duplicate': {
      post: {
        tags: ['Lessons'],
        summary: 'Duplicate lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Title for duplicated lesson' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Lesson duplicated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Lesson' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{id}/statistics': {
      get: {
        tags: ['Lessons'],
        summary: 'Get lesson statistics',
        description: 'Retrieve statistics for a specific lesson including views, completions, and engagement metrics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Lesson statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        viewCount: { type: 'integer', description: 'Total number of views' },
                        completionCount: { type: 'integer', description: 'Number of completions' },
                        averageTimeSpent: { type: 'number', description: 'Average time spent in minutes' },
                        completionRate: { type: 'number', description: 'Completion rate percentage' },
                        attachmentCount: { type: 'integer', description: 'Number of attachments' },
                        moduleCount: { type: 'integer', description: 'Number of modules' }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Lesson not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/attachments': {
      get: {
        tags: ['Attachments'],
        summary: 'Get all attachments for a lesson',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'List of attachments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LessonAttachment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Attachments'],
        summary: 'Create lesson attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'fileUrl', 'fileType', 'fileSize'],
                properties: {
                  title: { type: 'string', example: 'Lesson Slides' },
                  description: { type: 'string' },
                  fileUrl: { type: 'string' },
                  fileType: { type: 'string', example: 'application/pdf' },
                  fileSize: { type: 'integer' },
                  isDownloadable: { type: 'boolean' },
                  orderIndex: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attachment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/LessonAttachment' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/attachments/{id}': {
      put: {
        tags: ['Attachments'],
        summary: 'Update attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  isDownloadable: { type: 'boolean' },
                  orderIndex: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Attachment updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/LessonAttachment' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Attachments'],
        summary: 'Delete attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Attachment deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/modules': {
      get: {
        tags: ['Modules'],
        summary: 'Get all modules for a lesson',
        description: 'Retrieve all modules for a specific lesson',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'isPublished', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': {
            description: 'List of modules',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Module' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Modules'],
        summary: 'Create new module',
        description: 'Create a new module for a lesson (requires lesson.create permission)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'contentType'],
                properties: {
                  title: { type: 'string', example: 'Variables and Data Types' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  contentType: { type: 'string', enum: ['video', 'audio', 'text', 'document', 'interactive', 'quiz', 'mixed'] },
                  videoUrl: { type: 'string' },
                  videoDuration: { type: 'integer' },
                  audioUrl: { type: 'string' },
                  textContent: { type: 'string' },
                  documentUrl: { type: 'string' },
                  interactiveContent: { type: 'object' },
                  quizData: { type: 'object' },
                  durationMinutes: { type: 'integer' },
                  orderIndex: { type: 'integer' },
                  isPreview: { type: 'boolean' },
                  isPublished: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Module created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Module' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/modules/search': {
      get: {
        tags: ['Modules'],
        summary: 'Search modules in a lesson',
        description: 'Search for modules within a specific lesson',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Module' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/modules/with-attachments': {
      get: {
        tags: ['Modules'],
        summary: 'Get modules with their attachments',
        description: 'Retrieve all modules for a lesson including their attachments',
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Modules with attachments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Module' },
                          {
                            type: 'object',
                            properties: {
                              attachments: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/ModuleAttachment' }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/modules/bulk': {
      post: {
        tags: ['Modules'],
        summary: 'Bulk create modules',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modules'],
                properties: {
                  modules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['title', 'contentType'],
                      properties: {
                        title: { type: 'string' },
                        contentType: { type: 'string' },
                        description: { type: 'string' },
                        orderIndex: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Modules created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Module' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/modules/reorder': {
      put: {
        tags: ['Modules'],
        summary: 'Reorder modules',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['moduleIds'],
                properties: {
                  moduleIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Array of module IDs in desired order'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Modules reordered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{id}': {
      get: {
        tags: ['Modules'],
        summary: 'Get module by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Module details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Module' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Module not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Modules'],
        summary: 'Update module',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  videoUrl: { type: 'string' },
                  videoDuration: { type: 'integer' },
                  textContent: { type: 'string' },
                  documentUrl: { type: 'string' },
                  interactiveContent: { type: 'object' },
                  quizData: { type: 'object' },
                  durationMinutes: { type: 'integer' },
                  orderIndex: { type: 'integer' },
                  isPreview: { type: 'boolean' },
                  isPublished: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Module updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Module' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Modules'],
        summary: 'Delete module',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Module deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/modules/{id}/publish': {
      patch: {
        tags: ['Modules'],
        summary: 'Toggle module publish status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['is_published'],
                properties: {
                  is_published: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Publish status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Module' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{id}/duplicate': {
      post: {
        tags: ['Modules'],
        summary: 'Duplicate module',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Title for duplicated module' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Module duplicated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Module' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{id}/statistics': {
      get: {
        tags: ['Modules'],
        summary: 'Get module statistics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Module statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        viewCount: { type: 'integer' },
                        completionCount: { type: 'integer' },
                        averageTimeSpent: { type: 'number' },
                        attachmentCount: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{id}/versions': {
      get: {
        tags: ['Modules'],
        summary: 'Get module version history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Module version history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Module' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{moduleId}/attachments': {
      get: {
        tags: ['Module Attachments'],
        summary: 'Get all attachments for a module',
        parameters: [
          { name: 'moduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'List of attachments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ModuleAttachment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Module Attachments'],
        summary: 'Create module attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'moduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'fileUrl', 'fileType', 'fileSize'],
                properties: {
                  title: { type: 'string', example: 'Module Resources' },
                  description: { type: 'string' },
                  fileUrl: { type: 'string' },
                  fileType: { type: 'string', example: 'application/pdf' },
                  fileSize: { type: 'integer' },
                  isDownloadable: { type: 'boolean' },
                  orderIndex: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attachment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/ModuleAttachment' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{moduleId}/attachments/bulk': {
      post: {
        tags: ['Module Attachments'],
        summary: 'Bulk create module attachments',
        description: 'Create multiple attachments at once for a module',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'moduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attachments'],
                properties: {
                  attachments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['title', 'fileUrl', 'fileType', 'fileSize'],
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        fileUrl: { type: 'string' },
                        fileType: { type: 'string' },
                        fileSize: { type: 'integer' },
                        isDownloadable: { type: 'boolean' },
                        orderIndex: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Attachments created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ModuleAttachment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/modules/{moduleId}/attachments/reorder': {
      put: {
        tags: ['Module Attachments'],
        summary: 'Reorder module attachments',
        description: 'Update the order of attachments in a module',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'moduleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['attachmentIds'],
                properties: {
                  attachmentIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Array of attachment IDs in desired order'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Attachments reordered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/lessons/{lessonId}/module-attachments/statistics': {
      get: {
        tags: ['Module Attachments'],
        summary: 'Get module attachment statistics',
        description: 'Get statistics for all module attachments in a lesson',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lessonId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Module attachment statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalAttachments: { type: 'integer' },
                        totalSize: { type: 'integer', description: 'Total size in bytes' },
                        downloadableCount: { type: 'integer' },
                        byFileType: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        },
                        byModule: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              moduleId: { type: 'string', format: 'uuid' },
                              moduleTitle: { type: 'string' },
                              attachmentCount: { type: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/module-attachments/{id}': {
      get: {
        tags: ['Module Attachments'],
        summary: 'Get attachment by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Attachment details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/ModuleAttachment' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Module Attachments'],
        summary: 'Update attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  isDownloadable: { type: 'boolean' },
                  orderIndex: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Attachment updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/ModuleAttachment' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Module Attachments'],
        summary: 'Delete attachment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Attachment deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/payments/transactions/{id}': {
      get: {
        tags: ['Payments'],
        summary: 'Get specific transaction',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Transaction details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Transaction' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Transaction not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/payments/webhooks/stripe': {
      post: {
        tags: ['Payments'],
        summary: 'Stripe webhook handler',
        description: 'Handle Stripe webhook events (public endpoint)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Stripe webhook payload'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    received: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/payments/webhooks/paystack': {
      post: {
        tags: ['Payments'],
        summary: 'Paystack webhook handler',
        description: 'Handle Paystack webhook events (public endpoint)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Paystack webhook payload'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    received: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get user notifications',
        description: 'Retrieve paginated list of notifications for the authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'isRead', in: 'query', schema: { type: 'boolean' }, description: 'Filter by read status' },
          { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Filter by notification type' }
        ],
        responses: {
          '200': {
            description: 'List of notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Notification' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/notifications/{id}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notification by ID',
        description: 'Retrieve a specific notification by its ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Notification details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Notification' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Notification not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Notifications'],
        summary: 'Update notification',
        description: 'Update notification properties (e.g., mark as read)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  isRead: { type: 'boolean', description: 'Mark notification as read/unread' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Notification updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Notification' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Notification not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Delete notification',
        description: 'Delete a notification',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Notification deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '404': {
            description: 'Notification not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/notifications/mark-read': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark notifications as read',
        description: 'Mark multiple notifications as read',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notificationIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Array of notification IDs to mark as read'
                  },
                  markAll: {
                    type: 'boolean',
                    default: false,
                    description: 'Mark all user notifications as read'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Notifications marked as read successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Notifications marked as read' },
                    count: { type: 'integer', description: 'Number of notifications marked as read' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        description: 'Get the count of unread notifications for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Unread notification count',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        count: { type: 'integer', description: 'Number of unread notifications' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/bulk-delete': {
      delete: {
        tags: ['Notifications'],
        summary: 'Bulk delete notifications',
        description: 'Delete multiple notifications at once',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notificationIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' },
                    description: 'Array of notification IDs to delete'
                  },
                  deleteAll: {
                    type: 'boolean',
                    default: false,
                    description: 'Delete all user notifications'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Notifications deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string', example: 'Notifications deleted successfully' },
                    count: { type: 'integer', description: 'Number of notifications deleted' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    // ==================== LIBRARY MANAGEMENT ====================
  
  '/api/library/categories': {
    get: {
      tags: ['Library'],
      summary: 'Get all library categories',
      description: 'Retrieve all library categories',
      responses: {
        '200': {
          description: 'List of library categories',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryCategory' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Library'],
      summary: 'Create library category',
      description: 'Create a new library category (requires library.manage permission)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Science Fiction' },
                description: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Category created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryCategory' }
                }
              }
            }
          }
        }
      }
    }
  },
  
  '/api/library/categories/{id}': {
    get: {
      tags: ['Library'],
      summary: 'Get library category by ID',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Category details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryCategory' }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Library'],
      summary: 'Update library category',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Category updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryCategory' }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Library'],
      summary: 'Delete library category',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Category deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/items': {
    get: {
      tags: ['Library'],
      summary: 'Get all library items',
      description: 'Retrieve paginated list of library items',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'itemType', in: 'query', schema: { type: 'string', enum: ['book', 'ebook', 'audiobook', 'journal', 'magazine', 'other'] } },
        { name: 'format', in: 'query', schema: { type: 'string', enum: ['physical', 'digital', 'both'] } }
      ],
      responses: {
        '200': {
          description: 'List of library items',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryItem' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Library'],
      summary: 'Create library item',
      description: 'Create a new library item (requires library.manage permission)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'itemType', 'format'],
              properties: {
                title: { type: 'string', example: 'The Great Gatsby' },
                author: { type: 'string', example: 'F. Scott Fitzgerald' },
                isbn: { type: 'string' },
                publisher: { type: 'string' },
                publishedDate: { type: 'string', format: 'date' },
                description: { type: 'string' },
                categoryId: { type: 'string', format: 'uuid' },
                itemType: { type: 'string', enum: ['book', 'ebook', 'audiobook', 'journal', 'magazine', 'other'] },
                format: { type: 'string', enum: ['physical', 'digital', 'both'] },
                totalCopies: { type: 'integer', default: 1 },
                location: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Item created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryItem' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/items/featured': {
    get: {
      tags: ['Library'],
      summary: 'Get featured library items',
      parameters: [
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }
      ],
      responses: {
        '200': {
          description: 'List of featured items',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryItem' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/items/search': {
    get: {
      tags: ['Library'],
      summary: 'Search library items',
      parameters: [
        { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        '200': {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryItem' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/items/{id}': {
    get: {
      tags: ['Library'],
      summary: 'Get library item by ID',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Item details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryItem' }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Library'],
      summary: 'Update library item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                author: { type: 'string' },
                isbn: { type: 'string' },
                publisher: { type: 'string' },
                publishedDate: { type: 'string', format: 'date' },
                description: { type: 'string' },
                categoryId: { type: 'string', format: 'uuid' },
                itemType: { type: 'string', enum: ['book', 'ebook', 'audiobook', 'journal', 'magazine', 'other'] },
                format: { type: 'string', enum: ['physical', 'digital', 'both'] },
                totalCopies: { type: 'integer' },
                location: { type: 'string' },
                isFeatured: { type: 'boolean' },
                tags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Item updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryItem' }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Library'],
      summary: 'Delete library item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Item deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/items/{id}/download': {
    get: {
      tags: ['Library'],
      summary: 'Download digital file',
      description: 'Download digital file for library item (requires authentication)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'File download initiated',
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary'
              }
            }
          }
        }
      }
    }
  },

  '/api/library/borrowings': {
    get: {
      tags: ['Library'],
      summary: 'Get all borrowings',
      description: 'Get all borrowings (requires library.view permission)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'returned', 'overdue'] } }
      ],
      responses: {
        '200': {
          description: 'List of borrowings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryBorrowing' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Library'],
      summary: 'Borrow a library item',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['itemId', 'userId', 'dueDate'],
              properties: {
                itemId: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' },
                dueDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Item borrowed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryBorrowing' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/borrowings/my': {
    get: {
      tags: ['Library'],
      summary: 'Get my borrowings',
      description: 'Get current user\'s borrowings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of borrowings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryBorrowing' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/borrowings/{id}/return': {
    put: {
      tags: ['Library'],
      summary: 'Return a borrowed item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Item returned successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryBorrowing' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/reservations': {
    get: {
      tags: ['Library'],
      summary: 'Get all reservations',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        '200': {
          description: 'List of reservations',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LibraryReservation' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Library'],
      summary: 'Reserve a library item',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['itemId'],
              properties: {
                itemId: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Reservation created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/LibraryReservation' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/library/statistics': {
    get: {
      tags: ['Library'],
      summary: 'Get library statistics',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Library statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      totalItems: { type: 'integer' },
                      totalBorrowings: { type: 'integer' },
                      activeBorrowings: { type: 'integer' },
                      overdueBorrowings: { type: 'integer' },
                      totalReservations: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // ==================== SETTINGS ====================

  '/api/settings': {
    get: {
      tags: ['Settings'],
      summary: 'Get user settings',
      description: 'Get current user\'s settings',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'User settings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      notifications: { type: 'object' },
                      preferences: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update user settings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                notifications: { type: 'object' },
                preferences: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Settings updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/settings/institution': {
    get: {
      tags: ['Settings'],
      summary: 'Get institution settings',
      description: 'Get institution-wide settings (public)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Institution settings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/InstitutionSettings' }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Settings'],
      summary: 'Update institution settings',
      description: 'Update institution-wide settings (requires settings.update permission)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                institutionName: { type: 'string' },
                institutionEmail: { type: 'string', format: 'email' },
                institutionPhone: { type: 'string' },
                institutionAddress: { type: 'string' },
                primaryColor: { type: 'string' },
                secondaryColor: { type: 'string' },
                timezone: { type: 'string' },
                currency: { type: 'string' },
                language: { type: 'string' },
                maintenanceMode: { type: 'boolean' },
                allowRegistration: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Institution settings updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/InstitutionSettings' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/settings/institution/logo': {
    post: {
      tags: ['Settings'],
      summary: 'Upload institution logo',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['logo'],
              properties: {
                logo: {
                  type: 'string',
                  format: 'binary',
                  description: 'Logo image file'
                },
                type: {
                  type: 'string',
                  enum: ['light', 'dark', 'favicon'],
                  description: 'Logo type'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Logo uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      logoUrl: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // ==================== PROMOTIONS ====================

  '/api/promotions': {
    get: {
      tags: ['Promotions'],
      summary: 'Get all promotions',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        '200': {
          description: 'List of promotions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Promotion' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Promotions'],
      summary: 'Create promotion',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'message', 'startDate', 'endDate'],
              properties: {
                title: { type: 'string', example: 'Summer Sale' },
                message: { type: 'string' },
                imageUrl: { type: 'string' },
                link: { type: 'string' },
                targetAudience: { type: 'string', enum: ['all', 'students', 'instructors', 'admins'] },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Promotion created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Promotion' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/active': {
    get: {
      tags: ['Promotions'],
      summary: 'Get active promotions',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Active promotions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Promotion' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/{id}': {
    get: {
      tags: ['Promotions'],
      summary: 'Get promotion by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Promotion details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Promotion' }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Promotions'],
      summary: 'Update promotion',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                message: { type: 'string' },
                imageUrl: { type: 'string' },
                link: { type: 'string' },
                targetAudience: { type: 'string', enum: ['all', 'students', 'instructors', 'admins'] },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Promotion updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Promotion' }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Promotions'],
      summary: 'Delete promotion',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Promotion deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/upload-image': {
    post: {
      tags: ['Promotions'],
      summary: 'Upload promotion image',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: {
                image: {
                  type: 'string',
                  format: 'binary',
                  description: 'Image file'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Image uploaded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      imageUrl: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/{id}/display': {
    post: {
      tags: ['Promotions'],
      summary: 'Record promotion display',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '201': {
          description: 'Display recorded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      displayId: { type: 'string', format: 'uuid' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/displays/{displayId}/click': {
    post: {
      tags: ['Promotions'],
      summary: 'Record promotion click',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'displayId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Click recorded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/displays/{displayId}/dismiss': {
    post: {
      tags: ['Promotions'],
      summary: 'Record promotion dismissal',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'displayId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Dismissal recorded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/{id}/stats': {
    get: {
      tags: ['Promotions'],
      summary: 'Get promotion statistics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Promotion statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      totalDisplays: { type: 'integer' },
                      totalClicks: { type: 'integer' },
                      totalDismissals: { type: 'integer' },
                      clickThroughRate: { type: 'number' },
                      dismissalRate: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/promotions/{id}/performance': {
    get: {
      tags: ['Promotions'],
      summary: 'Get promotion performance over time',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Promotion performance data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', format: 'date' },
                        displays: { type: 'integer' },
                        clicks: { type: 'integer' },
                        dismissals: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // ==================== ANNOUNCEMENTS ====================

  '/api/announcements': {
    get: {
      tags: ['Announcements'],
      summary: 'Get all announcements',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        '200': {
          description: 'List of announcements',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Announcement' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Announcements'],
      summary: 'Create announcement',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'message', 'startDate', 'endDate'],
              properties: {
                title: { type: 'string', example: 'System Maintenance' },
                message: { type: 'string' },
                type: { type: 'string', enum: ['info', 'warning', 'success', 'error'] },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                targetAudience: { type: 'string', enum: ['all', 'students', 'instructors', 'admins'] },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Announcement created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Announcement' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/announcements/active': {
    get: {
      tags: ['Announcements'],
      summary: 'Get active announcements',
      description: 'Get active announcements for current user',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Active announcements',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Announcement' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/announcements/{id}': {
    get: {
      tags: ['Announcements'],
      summary: 'Get announcement by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Announcement details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Announcement' }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Announcements'],
      summary: 'Update announcement',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                message: { type: 'string' },
                type: { type: 'string', enum: ['info', 'warning', 'success', 'error'] },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                targetAudience: { type: 'string', enum: ['all', 'students', 'instructors', 'admins'] },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Announcement updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Announcement' }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Announcements'],
      summary: 'Delete announcement',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Announcement deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/announcements/{id}/view': {
    post: {
      tags: ['Announcements'],
      summary: 'Mark announcement as viewed',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Announcement marked as viewed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/announcements/{id}/dismiss': {
    post: {
      tags: ['Announcements'],
      summary: 'Dismiss announcement',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Announcement dismissed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/announcements/{id}/stats': {
    get: {
      tags: ['Announcements'],
      summary: 'Get announcement statistics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Announcement statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      totalViews: { type: 'integer' },
                      totalDismissals: { type: 'integer' },
                      viewRate: { type: 'number' },
                      dismissalRate: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // ==================== PATHWAYS ====================

  '/api/pathways': {
    get: {
      tags: ['Pathways'],
      summary: 'Get all pathways',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        '200': {
          description: 'List of pathways',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Pathway' }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Pathways'],
      summary: 'Create pathway',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'description'],
              properties: {
                title: { type: 'string', example: 'Web Development Pathway' },
                description: { type: 'string' },
                slug: { type: 'string' },
                imageUrl: { type: 'string' },
                duration: { type: 'string' },
                difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                isPublished: { type: 'boolean' },
                isFeatured: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Pathway created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/featured': {
    get: {
      tags: ['Pathways'],
      summary: 'Get featured pathways',
      responses: {
        '200': {
          description: 'Featured pathways',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Pathway' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/slug/{slug}': {
    get: {
      tags: ['Pathways'],
      summary: 'Get pathway by slug',
      parameters: [
        { name: 'slug', in: 'path', required: true, schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Pathway details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/{id}': {
    get: {
      tags: ['Pathways'],
      summary: 'Get pathway by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Pathway details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Pathways'],
      summary: 'Update pathway',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                slug: { type: 'string' },
                imageUrl: { type: 'string' },
                duration: { type: 'string' },
                difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                isPublished: { type: 'boolean' },
                isFeatured: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Pathway updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Pathways'],
      summary: 'Delete pathway',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Pathway deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/{id}/publish': {
    patch: {
      tags: ['Pathways'],
      summary: 'Toggle pathway publish status',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Publish status toggled',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/{id}/featured': {
    patch: {
      tags: ['Pathways'],
      summary: 'Toggle pathway featured status',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Featured status toggled',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/{id}/courses': {
    post: {
      tags: ['Pathways'],
      summary: 'Add course to pathway',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['courseId', 'order'],
              properties: {
                courseId: { type: 'string', format: 'uuid' },
                order: { type: 'integer', description: 'Order of course in pathway' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Course added to pathway',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Pathway' }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/pathways/{id}/courses/{courseId}': {
    delete: {
      tags: ['Pathways'],
      summary: 'Remove course from pathway',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'courseId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        '200': {
          description: 'Course removed from pathway',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
  },
};

module.exports = openApiSpec;
