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
                  first_name: {
                    type: 'string',
                    example: 'John',
                    description: 'User first name'
                  },
                  last_name: {
                    type: 'string',
                    example: 'Doe',
                    description: 'User last name'
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'hello@example.com',
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
                        first_name: { type: 'string', example: 'John' },
                        last_name: { type: 'string', example: 'Doe' },
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
                  first_name: {
                    type: 'string',
                    example: 'John',
                    description: 'User first name'
                  },
                  last_name: {
                    type: 'string',
                    example: 'Doe',
                    description: 'User last name'
                  },
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
                        first_name: { type: 'string', example: 'John' },
                        last_name: { type: 'string', example: 'Doe' },
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
    '/api/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Login or register using Google',
        description: 'Authenticate a user using Google ID token. Creates a new account if the user does not already exist.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: {
                    type: 'string',
                    description: 'Google ID token obtained from Google OAuth',
                    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Google login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    token: {
                      type: 'string',
                      description: 'JWT access token'
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        avatar_url: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Google authentication failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Public registration is disabled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Forgot password',
        description: 'Request a password reset link. If the email exists, a reset link will be sent. Always returns success to prevent email enumeration.',
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
                    description: 'Registered user email address'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset email processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'If this email is registered, you will receive a password reset link'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid email input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password',
        description: 'Reset user password using a valid password reset token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: {
                    type: 'string',
                    example: '9f8c1b7a4e2d3c...',
                    description: 'Password reset token sent to user email'
                  },
                  newPassword: {
                    type: 'string',
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
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Password has been reset successfully'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid or expired token / weak password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Server error',
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
    '/api/auth/profile': {
      put: {
        tags: ['Authentication'],
        summary: 'Update current user profile',
        description: 'Update the authenticated user\'s profile information. Only provided fields will be updated.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                    example: 'john_doe'
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com'
                  },
                  first_name: {
                    type: 'string',
                    example: 'John',
                    nullable: true
                  },
                  last_name: {
                    type: 'string',
                    example: 'Doe',
                    nullable: true
                  },
                  bio: {
                    type: 'string',
                    example: 'Backend developer',
                    nullable: true
                  },
                  phone: {
                    type: 'string',
                    example: '+2348012345678',
                    nullable: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        first_name: { type: 'string', nullable: true },
                        last_name: { type: 'string', nullable: true },
                        bio: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        role: { type: 'string' },
                        avatar_url: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or email/username already in use',
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
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/avatar': {
      post: {
        tags: ['Authentication'],
        summary: 'Upload or update user avatar',
        description: 'Upload a new avatar image for the authenticated user. Replaces the existing avatar if one already exists.',
        security: [{ bearerAuth: [] }],
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
                    description: 'Avatar image file (jpg, png, webp, etc.)'
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
                    message: { type: 'string' },
                    avatar_url: {
                      type: 'string',
                      description: 'Public URL of the uploaded avatar'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'No image file provided',
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
          '500': {
            description: 'Server error',
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
    '/api/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify user email address',
        description: 'Verify a user’s email address using a 6-digit OTP sent to their email during registration.',
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
                    example: 'user@example.com'
                  },
                  otp: {
                    type: 'string',
                    description: '6-digit email verification code',
                    example: '123456'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        is_verified: { type: 'boolean', example: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request or OTP format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Invalid or expired OTP',
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
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/resend-verification': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend email verification code',
        description: 'Resend a new email verification OTP to a user who has not yet verified their email address.',
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
                    example: 'user@example.com'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Verification code resent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    remainingAttempts: {
                      type: 'integer',
                      description: 'Remaining resend attempts for the current 24-hour window',
                      example: 3
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request or email already verified',
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
          },
          '429': {
            description: 'Resend attempt limit exceeded or rate limit hit',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Failed to send verification email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/debug-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Debug OTP lookup (temporary endpoint)',
        description: 'Temporarily fetches OTP information for a given email, code, and type. **For debugging/testing only**. Not for production use.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'type'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  code: {
                    type: 'string',
                    description: 'OTP code to lookup',
                    example: '123456'
                  },
                  type: {
                    type: 'string',
                    description: 'Type of OTP (e.g., "email_verification", "mfa")',
                    example: 'email_verification'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Debug OTP lookup successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    debug: {
                      type: 'object',
                      description: 'Debug information about the OTP',
                      example: {
                        email: 'user@example.com',
                        code: '123456',
                        type: 'email_verification',
                        createdAt: '2025-12-23T10:00:00Z',
                        expiresAt: '2025-12-23T10:10:00Z',
                        isUsed: false
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Missing required fields (email, code, or type)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Server error during debug OTP lookup',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/reset-password-token/{token}': {
      get: {
        tags: ['Authentication'],
        summary: 'Validate password reset token',
        description: 'Validate a password reset token and redirect the user to the frontend reset password page if valid. Redirects to login page with an error if invalid or expired.',
        parameters: [
          {
            name: 'token',
            in: 'path',
            required: true,
            description: 'Password reset token received via email',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '302': {
            description: 'Redirect to frontend reset password page (valid token) or login page (invalid/expired token)',
            headers: {
              Location: {
                description: 'Frontend redirect URL',
                schema: {
                  type: 'string',
                  example: 'https://frontend.app/reset-password?token=abc123'
                }
              }
            }
          },
          '400': {
            description: 'Invalid or expired reset token (redirects to login page with error)',
            headers: {
              Location: {
                description: 'Redirect URL with error query parameter',
                schema: {
                  type: 'string',
                  example: 'https://frontend.app/login?error=expired_reset_token'
                }
              }
            }
          },
          '500': {
            description: 'Server error (redirects to login page with error)',
            headers: {
              Location: {
                description: 'Redirect URL with error query parameter',
                schema: {
                  type: 'string',
                  example: 'https://frontend.app/login?error=server_error'
                }
              }
            }
          }
        }
      }
    },
    // ============= DASHBOARD ===========
    '/api/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        description: 'Retrieve aggregated statistics, charts, and recent activity for admin dashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      stats: {
                        users: {
                          total: 1200,
                          newThisMonth: 45,
                          growth: 12.5,
                          byRole: [
                            {
                              role_id: 1,
                              role_name: 'Admin',
                              description: 'System administrators',
                              count: 3
                            },
                            {
                              role_id: 2,
                              role_name: 'Student',
                              description: 'Platform learners',
                              count: 1197
                            }
                          ]
                        },
                        courses: {
                          total: 86,
                          published: 70,
                          draft: 16,
                          newThisMonth: 4
                        },
                        enrollments: {
                          total: 4300,
                          newThisMonth: 210,
                          growth: 8.3
                        }
                      },
                      charts: {
                        userGrowth: [
                          { month: 'Aug 2024', count: 120 },
                          { month: 'Sep 2024', count: 180 }
                        ],
                        userSignups: [
                          { date: '2025-01-01', signups: 12 }
                        ],
                        topCourses: [
                          {
                            id: 4,
                            title: 'NestJS Bootcamp',
                            enrollment_count: 520
                          }
                        ],
                        coursesByCategory: [
                          { category: 'Programming', count: 24 }
                        ]
                      },
                      recentActivity: {
                        enrollments: [
                          {
                            id: 91,
                            created_at: '2025-01-10T09:20:00.000Z',
                            username: 'johndoe',
                            email: 'john@example.com',
                            course_title: 'NestJS Bootcamp'
                          }
                        ],
                        users: [
                          {
                            id: 32,
                            username: 'janedoe',
                            email: 'jane@example.com',
                            created_at: '2025-01-09T14:30:00.000Z'
                          }
                        ],
                        courses: [
                          {
                            id: 12,
                            title: 'Advanced SQL',
                            is_published: true,
                            created_at: '2024-12-01T10:00:00.000Z',
                            updated_at: '2025-01-08T12:00:00.000Z'
                          }
                        ]
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
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/dashboard/analytics': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get comprehensive analytics data',
        description: 'Retrieve deep analytics across users, courses, revenue, engagement, and performance',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Analytics data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      userAnalytics: {
                        registrations: {
                          monthly: [
                            { month: 'Jan 2025', registrations: 210, period: '2025-01-01T00:00:00.000Z' }
                          ],
                          total: 210
                        },
                        activityLevels: [
                          { activity_level: 'Active', count: 520 }
                        ],
                        roleDistribution: [
                          { role: 'Student', count: 1100, percentage: 91.7 }
                        ],
                        retention: {
                          total_users: 300,
                          returning_users: 190,
                          retention_rate: 63.3
                        }
                      },
                      courseAnalytics: {
                        coursePerformance: [],
                        learningProgression: [],
                        lessonEngagement: [],
                        assessmentPerformance: [],
                        categoryPopularity: []
                      },
                      revenueAnalytics: {
                        revenueTrends: [],
                        revenueByCourse: [],
                        paymentMethods: [],
                        totalRevenue: 15420,
                        totalTransactions: 340
                      },
                      engagementAnalytics: {
                        dailyActiveUsers: [],
                        peakHours: [],
                        featureUsage: [],
                        sessionDuration: {
                          avg_session_duration: 14.5,
                          median_session_duration: 12.3,
                          max_session_duration: 92.1,
                          total_sessions: 842
                        }
                      },
                      performanceAnalytics: {
                        errorRates: [],
                        responseTimes: {
                          avg_response_time: 180,
                          min_response_time: 20,
                          max_response_time: 920,
                          p95_response_time: 410,
                          total_requests: 1400
                        },
                        dbPerformance: [],
                        systemHealth: {
                          status: 'healthy',
                          uptime: 123456,
                          memoryUsage: {},
                          nodeVersion: 'v18.19.0'
                        }
                      },
                      updatedAt: '2025-01-10T12:00:00.000Z'
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
          '500': {
            description: 'Internal server error',
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
                  first_name: { type: 'string', example: 'John' },
                  last_name: { type: 'string', example: 'Doe' },
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
    '/api/auth/cover-photo': {
      post: {
        tags: ['Authentication'],
        summary: 'Upload or update user cover photo',
        description: 'Upload a new cover photo image for the authenticated user. Replaces the existing cover photo if one already exists.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['cover_photo'],
                properties: {
                  cover_photo: {
                    type: 'string',
                    format: 'binary',
                    description: 'Cover photo image file (jpg, png, webp, etc.)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Cover photo uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    cover_photo_url: {
                      type: 'string',
                      description: 'Public URL of the uploaded cover photo'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'No image file provided',
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
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/request-mfa': {
      post: {
        tags: ['Authentication'],
        summary: 'Request MFA verification code',
        description: 'Send a new MFA verification code to the user’s email if MFA is enabled for the account.',
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
                    example: 'user@example.com'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'MFA code sent successfully',
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
          },
          '400': {
            description: 'Invalid request or MFA not enabled',
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
          },
          '429': {
            description: 'Too many MFA requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Failed to send MFA code',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/verify-mfa': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify MFA code and complete login',
        description: 'Verify MFA code using a temporary MFA token and complete user authentication.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mfaToken', 'code'],
                properties: {
                  mfaToken: {
                    type: 'string',
                    description: 'Temporary MFA token generated during login',
                    example: 'a9f3c2d4e8f1...'
                  },
                  code: {
                    type: 'string',
                    description: '6-digit MFA verification code',
                    example: '123456'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'MFA verification successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    token: {
                      type: 'string',
                      description: 'JWT access token'
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        message: { type: 'string', example: 'logged in via MFA' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request or MFA code format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Invalid or expired MFA token/code',
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
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    "/api/xp/profile": {
      "get": {
        "tags": ["XP"],
        "summary": "Get current user's XP profile",
        "description": "Retrieve the authenticated user's XP profile, including total XP, level, progress, and achievements.",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": {
            "description": "XP profile retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "object",
                      "properties": {
                        "totalXP": { "type": "integer", "example": 1500 },
                        "level": { "type": "integer", "example": 5 },
                        "progressToNextLevel": { "type": "integer", "example": 200 },
                        "achievements": {
                          "type": "array",
                          "items": { "type": "string" },
                          "example": ["First Login", "XP Milestone Level 5"]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { "description": "Unauthorized", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/history": {
      "get": {
        "tags": ["XP"],
        "summary": "Get XP transaction history",
        "description": "Retrieve the authenticated user's XP transaction history with optional pagination.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 50 }, "description": "Max number of items to return" },
          { "name": "offset", "in": "query", "schema": { "type": "integer", "default": 0 }, "description": "Pagination offset" }
        ],
        "responses": {
          "200": {
            "description": "XP history retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "activity": { "type": "string", "example": "Completed Quiz" },
                          "xpEarned": { "type": "integer", "example": 50 },
                          "timestamp": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { "description": "Unauthorized", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/leaderboard": {
      "get": {
        "tags": ["XP"],
        "summary": "Get XP leaderboard",
        "description": "Retrieve the global XP leaderboard with pagination.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 }, "description": "Number of users to return" },
          { "name": "offset", "in": "query", "schema": { "type": "integer", "default": 0 }, "description": "Pagination offset" }
        ],
        "responses": {
          "200": {
            "description": "Leaderboard retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "username": { "type": "string", "example": "johndoe" },
                          "totalXP": { "type": "integer", "example": 1500 },
                          "level": { "type": "integer", "example": 5 }
                        }
                      }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": { "limit": { "type": "integer", "example": 20 }, "offset": { "type": "integer", "example": 0 } }
                    }
                  }
                }
              }
            }
          },
          "401": { "description": "Unauthorized", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/levels": {
      "get": {
        "tags": ["XP"],
        "summary": "Get all XP levels/badges",
        "description": "Retrieve all XP levels and badges.",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": {
            "description": "XP levels retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string", "example": "1" },
                          "level": { "type": "integer", "example": 5 },
                          "name": { "type": "string", "example": "Intermediate" },
                          "xpRequired": { "type": "integer", "example": 1000 },
                          "isActive": { "type": "boolean", "example": true },
                          "badgeUrl": { "type": "string", "example": "https://cdn.example.com/badges/5.png" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": { "description": "Unauthorized", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "post": {
        "tags": ["XP"],
        "summary": "Create new XP level (admin only)",
        "description": "Create a new XP level. Admin only.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "level": { "type": "integer", "example": 6 },
                  "name": { "type": "string", "example": "Advanced" },
                  "xpRequired": { "type": "integer", "example": 1200 },
                  "isActive": { "type": "boolean", "example": true }
                },
                "required": ["level", "name", "xpRequired"]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "XP level created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "example": "6" },
                        "level": { "type": "integer", "example": 6 },
                        "name": { "type": "string", "example": "Advanced" },
                        "xpRequired": { "type": "integer", "example": 1200 },
                        "isActive": { "type": "boolean", "example": true }
                      }
                    },
                    "message": { "type": "string", "example": "XP level created successfully" }
                  }
                }
              }
            }
          },
          "400": { "description": "Invalid input", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/levels/{id}": {
      "put": {
        "tags": ["XP"],
        "summary": "Update XP level (admin only)",
        "description": "Update an existing XP level.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "description": "ID of the XP level" }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "level": { "type": "integer", "example": 6 },
                  "name": { "type": "string", "example": "Advanced" },
                  "xpRequired": { "type": "integer", "example": 1200 },
                  "isActive": { "type": "boolean", "example": true }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "XP level updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "example": "6" },
                        "level": { "type": "integer", "example": 6 },
                        "name": { "type": "string", "example": "Advanced" },
                        "xpRequired": { "type": "integer", "example": 1200 },
                        "isActive": { "type": "boolean", "example": true }
                      }
                    },
                    "message": { "type": "string", "example": "XP level updated successfully" }
                  }
                }
              }
            }
          },
          "400": { "description": "Invalid input", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "delete": {
        "tags": ["XP"],
        "summary": "Delete XP level (admin only)",
        "description": "Delete an XP level by ID.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "description": "ID of the XP level" }],
        "responses": {
          "200": {
            "description": "XP level deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "message": { "type": "string", "example": "XP level deleted successfully" }
                  }
                }
              }
            }
          },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "patch": {
        "tags": ["XP"],
        "summary": "Toggle XP level active status (admin only)",
        "description": "Enable or disable an XP level by ID.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" }, "description": "ID of the XP level" }],
        "responses": {
          "200": {
            "description": "XP level status toggled successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "example": "6" },
                        "level": { "type": "integer", "example": 6 },
                        "name": { "type": "string", "example": "Advanced" },
                        "xpRequired": { "type": "integer", "example": 1200 },
                        "isActive": { "type": "boolean", "example": true }
                      }
                    },
                    "message": { "type": "string", "example": "XP level status updated successfully" }
                  }
                }
              }
            }
          },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/levels/badge": {
      "post": {
        "tags": ["XP"],
        "summary": "Upload badge image for XP level (admin only)",
        "description": "Upload a badge image file for an XP level. Admin only.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "badge": { "type": "string", "format": "binary", "description": "Badge image file" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Badge image uploaded successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "data": { "type": "object", "properties": { "badge_image_url": { "type": "string", "example": "https://cdn.example.com/xp/badges/6.png" } } },
                    "message": { "type": "string", "example": "Badge image uploaded successfully" }
                  }
                }
              }
            }
          },
          "400": { "description": "No file uploaded", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/activities": {
      "get": {
        "tags": ["XP Activities"],
        "summary": "Get all XP activities",
        "description": "Retrieve all XP activities with statistics (total, active, inactive, average XP). Admin only.",
        "security": [{ "bearerAuth": [] }],
        "responses": {
          "200": {
            "description": "XP activities retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "activities": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "integer", "example": 1 },
                          "activity_type": { "type": "string", "example": "PostComment" },
                          "xp_value": { "type": "integer", "example": 50 },
                          "description": { "type": "string", "example": "XP awarded for posting a comment" },
                          "is_active": { "type": "boolean", "example": true },
                          "created_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" },
                          "updated_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" }
                        }
                      }
                    },
                    "stats": {
                      "type": "object",
                      "properties": {
                        "total": { "type": "integer", "example": 10 },
                        "active": { "type": "integer", "example": 8 },
                        "inactive": { "type": "integer", "example": 2 },
                        "average": { "type": "integer", "example": 45 }
                      }
                    }
                  }
                }
              }
            }
          },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "post": {
        "tags": ["XP Activities"],
        "summary": "Create new XP activity",
        "description": "Add a new XP activity. Admin only.",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["activity_type", "xp_value"],
                "properties": {
                  "activity_type": { "type": "string", "example": "PostComment" },
                  "xp_value": { "type": "integer", "example": 50 },
                  "description": { "type": "string", "example": "XP awarded for posting a comment" },
                  "is_active": { "type": "boolean", "example": true }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "XP activity created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "activity": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "integer", "example": 1 },
                        "activity_type": { "type": "string", "example": "PostComment" },
                        "xp_value": { "type": "integer", "example": 50 },
                        "description": { "type": "string", "example": "XP awarded for posting a comment" },
                        "is_active": { "type": "boolean", "example": true },
                        "created_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" },
                        "updated_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": { "description": "Validation error or duplicate activity", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      }
    },
    "/api/xp/activities/{id}": {
      "put": {
        "tags": ["XP Activities"],
        "summary": "Update XP activity",
        "description": "Update an existing XP activity. Admin only.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer", "example": 1 }, "description": "XP activity ID" }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["activity_type", "xp_value"],
                "properties": {
                  "activity_type": { "type": "string", "example": "PostCommentUpdated" },
                  "xp_value": { "type": "integer", "example": 60 },
                  "description": { "type": "string", "example": "Updated description" },
                  "is_active": { "type": "boolean", "example": true }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "XP activity updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "activity": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "integer", "example": 1 },
                        "activity_type": { "type": "string", "example": "PostCommentUpdated" },
                        "xp_value": { "type": "integer", "example": 60 },
                        "description": { "type": "string", "example": "Updated description" },
                        "is_active": { "type": "boolean", "example": true },
                        "created_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" },
                        "updated_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:30:00Z" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": { "description": "Validation error or duplicate activity", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "404": { "description": "Activity not found", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "delete": {
        "tags": ["XP Activities"],
        "summary": "Delete XP activity",
        "description": "Delete an XP activity by ID. Admin only.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer", "example": 1 }, "description": "XP activity ID" }],
        "responses": {
          "200": {
            "description": "XP activity deleted successfully",
            "content": {
              "application/json": {
                "schema": { "type": "object", "properties": { "success": { "type": "boolean", "example": true }, "message": { "type": "string", "example": "XP activity deleted successfully" } } }
              }
            }
          },
          "404": { "description": "Activity not found", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
        }
      },
      "patch": {
        "tags": ["XP Activities"],
        "summary": "Toggle XP activity active/inactive",
        "description": "Switch the is_active status of an XP activity. Admin only.",
        "security": [{ "bearerAuth": [] }],
        "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "integer", "example": 1 }, "description": "XP activity ID" }],
        "responses": {
          "200": {
            "description": "XP activity status updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": { "type": "boolean", "example": true },
                    "activity": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "integer", "example": 1 },
                        "activity_type": { "type": "string", "example": "PostComment" },
                        "xp_value": { "type": "integer", "example": 50 },
                        "description": { "type": "string", "example": "XP awarded for posting a comment" },
                        "is_active": { "type": "boolean", "example": false },
                        "created_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:00:00Z" },
                        "updated_at": { "type": "string", "format": "date-time", "example": "2025-12-23T12:30:00Z" }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": { "description": "Activity not found", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } },
          "500": { "description": "Server error", "content": { "application/json": { "schema": { "$ref": "#/components/schemas/Error" } } } }
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
    '/api/courses/{id}/self-enroll': {
      post: {
        tags: ['Courses'],
        summary: 'Self-enroll in course',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '201': {
            description: 'Enrollment successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Successfully enrolled in course' },
                    data: {
                      type: 'object',
                      properties: {
                        courseId: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        enrolledAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '404': {
            description: 'Course not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },

    '/api/courses/{id}/enroll': {
      post: {
        tags: ['Courses'],
        summary: 'Enroll user in course (admin)',
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
                required: ['userId'],
                properties: {
                  userId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User enrolled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        courseId: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        enrolledAt: { type: 'string', format: 'date-time' }
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

    '/api/courses/{id}/enrollments': {
      get: {
        tags: ['Courses'],
        summary: 'Get course enrollments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Enrollments retrieved',
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
                          userId: { type: 'string', format: 'uuid' },
                          enrolledAt: { type: 'string', format: 'date-time' },
                          progress: { type: 'number' }
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

    '/api/courses/{id}/enrollment-trends': {
      get: {
        tags: ['Courses'],
        summary: 'Get enrollment trends',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Enrollment trends',
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
                          count: { type: 'integer' }
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

    '/api/courses/{id}/enrollments/{userId}': {
      delete: {
        tags: ['Courses'],
        summary: 'Unenroll user from course',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'User unenrolled',
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

    '/api/courses/{id}/reviews': {
      get: {
        tags: ['Courses'],
        summary: 'Get course reviews',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Course reviews',
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
                          rating: { type: 'integer' },
                          review: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' }
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

    '/api/courses/{id}/reviews/my': {
      get: {
        tags: ['Courses'],
        summary: 'Get my course review',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'User review',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        rating: { type: 'integer' },
                        review: { type: 'string' }
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

    '/api/courses/{id}/reviews': {
      post: {
        tags: ['Courses'],
        summary: 'Submit or update review',
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
                required: ['rating'],
                properties: {
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  review: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Review saved',
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

    '/api/courses/my-courses/enrolled': {
      get: {
        tags: ['Courses'],
        summary: 'Get my enrolled courses',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Enrolled courses',
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
                          courseId: { type: 'string', format: 'uuid' },
                          title: { type: 'string' },
                          progress: { type: 'number' }
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

    '/api/courses/{id}/enrollment-status': {
      get: {
        tags: ['Courses'],
        summary: 'Get enrollment status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Enrollment status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        enrolled: { type: 'boolean' }
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

    '/api/courses/{id}/progress': {
      get: {
        tags: ['Courses'],
        summary: 'Get course progress',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': {
            description: 'Course progress',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        percentage: { type: 'number' },
                        completedLessons: { type: 'integer' },
                        totalLessons: { type: 'integer' }
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
    // ================= WORK PROFILE =================
    '/api/me/work-profile': {
      get: {
        tags: ['WorkProfile'],
        summary: 'Get authenticated user work profile',
        description: 'Retrieve the work profile for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Work profile retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    user_id: '550e8400-e29b-41d4-a716-446655440000',
                    headline: 'Full Stack Developer',
                    bio: 'Passionate developer with 5 years experience',
                    skills: ['JavaScript', 'Node.js', 'React'],
                    projects: [
                      { name: 'Project A', description: 'Description of project A' }
                    ],
                    experience: [
                      { company: 'Company X', role: 'Developer', years: 2 }
                    ],
                    education: [
                      { institution: 'University Y', degree: 'BSc Computer Science' }
                    ],
                    linkedin_url: 'https://linkedin.com/in/user',
                    portfolio_url: 'https://userportfolio.com',
                    resume_url: 'https://storage.example.com/work-profiles/resumes/resume-uuid-file.pdf',
                    is_new: false
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to fetch work profile',
            content: {
              'application/json': {
                example: {
                  success: false,
                  error: 'Failed to fetch work profile'
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['WorkProfile'],
        summary: 'Update or create authenticated user work profile',
        description: 'Update fields in the authenticated user work profile or create it if it does not exist',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  headline: { type: 'string', example: 'Senior Developer' },
                  bio: { type: 'string', example: 'Experienced backend developer' },
                  skills: { type: 'array', items: { type: 'string' }, example: ['Node.js', 'Express', 'PostgreSQL'] },
                  projects: { type: 'array', items: { type: 'object' }, example: [{ name: 'Project X', description: 'Example project' }] },
                  experience: { type: 'array', items: { type: 'object' }, example: [{ company: 'Company A', role: 'Engineer', years: 3 }] },
                  education: { type: 'array', items: { type: 'object' }, example: [{ institution: 'University Z', degree: 'MSc Computer Science' }] },
                  linkedin_url: { type: 'string', example: 'https://linkedin.com/in/user' },
                  portfolio_url: { type: 'string', example: 'https://userportfolio.com' },
                  resume: { type: 'string', format: 'binary' }
                }
              },
              encoding: {
                resume: { contentType: 'application/pdf' }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Work profile updated successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Work profile updated successfully',
                  data: {
                    user_id: '550e8400-e29b-41d4-a716-446655440000',
                    headline: 'Senior Developer',
                    bio: 'Experienced backend developer',
                    skills: ['Node.js', 'Express', 'PostgreSQL'],
                    projects: [{ name: 'Project X', description: 'Example project' }],
                    experience: [{ company: 'Company A', role: 'Engineer', years: 3 }],
                    education: [{ institution: 'University Z', degree: 'MSc Computer Science' }],
                    linkedin_url: 'https://linkedin.com/in/user',
                    portfolio_url: 'https://userportfolio.com',
                    resume_url: 'https://storage.example.com/work-profiles/resumes/resume-uuid-file.pdf'
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to update work profile',
            content: {
              'application/json': {
                example: {
                  success: false,
                  error: 'Failed to update work profile'
                }
              }
            }
          }
        }
      }
    },
    // ============= DOCUMENTS (FULL) ============
    '/api/documents/shared/{token}': {
      get: {
        tags: ['Document Sharing'],
        summary: 'Get shared document (public)',
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'password', in: 'query', schema: { type: 'string' } },
          { name: 'email', in: 'query', schema: { type: 'string', format: 'email' } }
        ],
        responses: {
          '200': {
            description: 'Shared document details',
            content: {
              'application/json': {
                example: {
                  success: true,
                  document: {
                    id: 'doc-uuid',
                    title: 'Proposal.pdf',
                    file_url: 'https://.../proposal.pdf',
                    size: 234567,
                    mime_type: 'application/pdf',
                    created_at: '2025-01-10T10:00:00.000Z'
                  },
                  share: {
                    id: 'share-uuid',
                    permission_level: 'download',
                    expires_at: '2025-02-01T00:00:00.000Z',
                    max_downloads: 5,
                    download_count: 1,
                    requires_password: false
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '410': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/shared/{token}/download': {
      get: {
        tags: ['Document Sharing'],
        summary: 'Download shared document (public)',
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'password', in: 'query', schema: { type: 'string' } },
          { name: 'email', in: 'query', schema: { type: 'string', format: 'email' } }
        ],
        responses: {
          '302': { description: 'Redirect to file URL' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '410': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // Conditional auth applies for the rest (token query OR header)
    '/api/documents/folders': {
      post: {
        tags: ['Documents', 'Folders'],
        summary: 'Create folder',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  parent_folder_id: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Folder created',
            content: {
              'application/json': {
                example: {
                  success: true,
                  folder: {
                    id: 'folder-uuid',
                    name: 'Project Docs',
                    description: 'Files for project',
                    parentFolderId: null,
                    created_at: '2025-01-10T10:05:00.000Z'
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      get: {
        tags: ['Documents', 'Folders'],
        summary: 'Get folder tree',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Folder tree retrieved',
            content: {
              'application/json': {
                example: {
                  success: true,
                  folders: [
                    { id: 'f1', name: 'Root', parentFolderId: null, children: [] }
                  ]
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/folders/{id}/path': {
      get: {
        tags: ['Documents', 'Folders'],
        summary: 'Get folder path (breadcrumb)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Folder path returned',
            content: {
              'application/json': {
                example: {
                  success: true,
                  path: [
                    { id: 'root', name: 'Root' },
                    { id: 'f1', name: 'Project Docs' }
                  ]
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/folders/{id}': {
      delete: {
        tags: ['Documents', 'Folders'],
        summary: 'Delete folder',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Folder deleted',
            content: {
              'application/json': {
                example: { success: true, message: 'Folder deleted successfully' }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/upload': {
      post: {
        tags: ['Documents'],
        summary: 'Upload document',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  folder_id: { type: 'string', nullable: true },
                  tags: { type: 'string', description: 'JSON string array' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Document uploaded',
            content: {
              'application/json': {
                example: {
                  success: true,
                  document: {
                    id: 'doc-uuid',
                    title: 'Proposal.pdf',
                    file_url: 'https://.../proposal.pdf',
                    size: 234567,
                    mime_type: 'application/pdf',
                    folder_id: 'folder-uuid',
                    tags: ['proposal', 'client'],
                    created_at: '2025-01-10T10:10:00.000Z',
                    uploaded_by: 'user-uuid'
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '422': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/contents': {
      get: {
        tags: ['Documents'],
        summary: 'Get folder contents (folders + documents)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'folder_id', in: 'query', schema: { type: 'string', nullable: true } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'sort_by', in: 'query', schema: { type: 'string' } },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
        ],
        responses: {
          '200': {
            description: 'Folder contents returned',
            content: {
              'application/json': {
                example: {
                  success: true,
                  items: [
                    { type: 'folder', id: 'f1', name: 'Project Docs' },
                    { type: 'document', id: 'd1', title: 'Spec.pdf' }
                  ],
                  pagination: { page: 1, limit: 100, total: 2 }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents': {
      get: {
        tags: ['Documents'],
        summary: 'Get user documents (list)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'folder_id', in: 'query', schema: { type: 'string', nullable: true } },
          { name: 'file_type', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Documents list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  documents: [
                    {
                      id: 'doc-uuid',
                      title: 'Proposal.pdf',
                      file_url: 'https://.../proposal.pdf',
                      created_at: '2025-01-10T10:10:00.000Z'
                    }
                  ],
                  pagination: { page: 1, limit: 20, total: 1 }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/search': {
      get: {
        tags: ['Documents'],
        summary: 'Search documents',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'file_type', in: 'query', schema: { type: 'string' } },
          { name: 'tags', in: 'query', schema: { type: 'string' } },
          { name: 'folder_id', in: 'query', schema: { type: 'string' } },
          { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                example: {
                  success: true,
                  documents: [
                    { id: 'd1', title: 'Spec.pdf', created_at: '2025-01-05T09:00:00.000Z' }
                  ],
                  pagination: { page: 1, limit: 20, total: 1 }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/shared-with-me': {
      get: {
        tags: ['Documents', 'Sharing'],
        summary: 'Get documents shared with the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Shared documents returned',
            content: {
              'application/json': {
                example: {
                  success: true,
                  documents: [
                    { id: 'd2', title: 'SharedNote.docx', shared_by: 'user-uuid', permission: 'view' }
                  ]
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/storage': {
      get: {
        tags: ['Documents'],
        summary: 'Get storage statistics for user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Storage stats',
            content: {
              'application/json': {
                example: {
                  success: true,
                  storage: {
                    totalBytes: 1073741824,
                    usedBytes: 123456789,
                    quotaBytes: 1073741824
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= TRASH / BULK ACTIONS ============
    '/api/documents/trash': {
      get: {
        tags: ['Documents', 'Trash'],
        summary: 'Get trash (deleted documents)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'Trash items retrieved',
            content: {
              'application/json': {
                example: {
                  success: true,
                  documents: [
                    { id: 'd3', title: 'Old.docx', deleted_at: '2025-01-01T12:00:00.000Z' }
                  ],
                  pagination: { page: 1, limit: 20, total: 1 }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/trash/empty': {
      delete: {
        tags: ['Documents', 'Trash'],
        summary: 'Empty trash (permanently delete all)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Trash emptied',
            content: {
              'application/json': {
                example: { success: true, message: '3 document(s) permanently deleted from trash' }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/bulk-delete': {
      post: {
        tags: ['Documents', 'Bulk'],
        summary: 'Bulk delete documents (move to trash)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { documentIds: { type: 'array', items: { type: 'string' } } } }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk delete completed',
            content: {
              'application/json': {
                example: { success: true, message: '5 document(s) moved to trash successfully' }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/bulk-restore': {
      post: {
        tags: ['Documents', 'Bulk'],
        summary: 'Bulk restore documents from trash',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { documentIds: { type: 'array', items: { type: 'string' } } } }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk restore completed',
            content: {
              'application/json': {
                example: { success: true, message: '5 document(s) restored successfully' }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/bulk-permanent-delete': {
      post: {
        tags: ['Documents', 'Bulk'],
        summary: 'Bulk permanently delete documents',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { documentIds: { type: 'array', items: { type: 'string' } } } }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk permanent delete completed',
            content: {
              'application/json': {
                example: { success: true, message: '5 document(s) permanently deleted' }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= SINGLE DOCUMENT ROUTES ============
    '/api/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'Get document by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Document retrieved',
            content: {
              'application/json': {
                example: {
                  success: true,
                  document: {
                    id: 'doc-uuid',
                    title: 'Proposal.pdf',
                    file_url: 'https://.../proposal.pdf',
                    created_at: '2025-01-10T10:10:00.000Z'
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      patch: {
        tags: ['Documents'],
        summary: 'Update document metadata',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  folder_id: { type: 'string', nullable: true },
                  tags: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Document updated',
            content: {
              'application/json': {
                example: { success: true, document: { id: 'doc-uuid', title: 'Updated title' } }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      delete: {
        tags: ['Documents'],
        summary: 'Delete document (move to trash)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Document moved to trash', content: { 'application/json': { example: { success: true, message: 'Document moved to trash successfully' } } } },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/{id}/download': {
      get: {
        tags: ['Documents'],
        summary: 'Download a document (supports query token)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'token', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '302': { description: 'Redirect to file URL' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/{id}/restore': {
      post: {
        tags: ['Documents', 'Trash'],
        summary: 'Restore document from trash',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Document restored', content: { 'application/json': { example: { success: true, message: 'Document restored successfully' } } } },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/{id}/permanent': {
      delete: {
        tags: ['Documents'],
        summary: 'Permanently delete a document',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Document permanently deleted', content: { 'application/json': { example: { success: true, message: 'Document permanently deleted' } } } },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= SHARING ============
    '/api/documents/{documentId}/share': {
      post: {
        tags: ['Document Sharing'],
        summary: 'Create share link / share with user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  share_type: { type: 'string', enum: ['link', 'user'] },
                  shared_with_user_id: { type: 'string' },
                  recipient_email: { type: 'string', format: 'email' },
                  permission_level: { type: 'string', enum: ['view', 'download'] },
                  password: { type: 'string' },
                  expires_at: { type: 'string', format: 'date-time' },
                  max_downloads: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Share created',
            content: {
              'application/json': {
                example: {
                  success: true,
                  share: {
                    id: 'share-uuid',
                    document_id: 'doc-uuid',
                    permission_level: 'download',
                    access_token: 'abcdef12345',
                    share_url: 'https://yourhost/shared/abcdef12345'
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/{documentId}/shares': {
      get: {
        tags: ['Document Sharing'],
        summary: 'Get shares for a document',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'documentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Document shares',
            content: {
              'application/json': {
                example: {
                  shares: [
                    { id: 's1', shared_by: 'user-uuid', permission_level: 'view', created_at: '2025-01-09T08:00:00.000Z' }
                  ]
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/shares/{shareId}': {
      delete: {
        tags: ['Document Sharing'],
        summary: 'Delete a share',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'shareId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Share deleted',
            content: {
              'application/json': {
                example: { message: 'Share deleted successfully' }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/documents/shares/created': {
      get: {
        tags: ['Document Sharing'],
        summary: 'Get shares created by current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Created shares returned',
            content: {
              'application/json': {
                example: {
                  shares: [
                    { id: 's1', document_id: 'doc-uuid', access_token: 'abcdef', created_at: '2025-01-09T08:00:00.000Z' }
                  ]
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= ADMIN ============
    '/api/documents/quota': {
      post: {
        tags: ['Documents', 'Admin'],
        summary: 'Update user storage quota (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'quotaBytes'],
                properties: {
                  userId: { type: 'string' },
                  quotaBytes: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User quota updated',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'User quota updated successfully',
                  storage: { userId: 'user-uuid', quotaBytes: 1073741824, usedBytes: 12345678 }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },
    // ============= JOBS ============
    // ============= JOBS (JS literal, same style as earlier) ============

    '/api/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'List active public jobs',
        description: 'Returns paginated list of active jobs (public)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, example: 1 },
          { name: 'limit', in: 'query', schema: { type: 'integer' }, example: 20 },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List of active jobs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      jobs: [
                        {
                          id: 'job-uuid',
                          title: 'Backend Engineer',
                          company: 'Acme Ltd',
                          location: 'Remote',
                          is_active: true,
                          posted_at: '2025-01-10T10:00:00.000Z'
                        }
                      ],
                      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
                    }
                  }
                }
              }
            }
          },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get job detail',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Job details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      id: 'job-uuid',
                      title: 'Backend Engineer',
                      description: 'Job description here',
                      company: 'Acme Ltd',
                      location: 'Remote',
                      is_active: true,
                      posted_at: '2025-01-10T10:00:00.000Z'
                    }
                  }
                }
              }
            }
          },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/jobs/{id}/apply': {
      post: {
        tags: ['Jobs'],
        summary: 'Apply for a job (public)',
        description: 'Submit application with optional files (resume, cover_letter)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  resume: { type: 'string', format: 'binary' },
                  cover_letter: { type: 'string', format: 'binary' },
                  additional: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Application submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    message: 'Application submitted successfully',
                    data: {
                      applicationId: 'app-uuid',
                      jobId: 'job-uuid',
                      applicantName: 'Jane Doe',
                      submittedAt: '2025-01-10T11:00:00.000Z',
                      status: 'submitted'
                    }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= User Job Profile ============
    '/api/jobs/profile/me': {
      get: {
        tags: ['Job Profile'],
        summary: "Get current user's job profile",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: "User job profile",
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      userId: 'user-uuid',
                      fullName: 'Jane Doe',
                      headline: 'Fullstack Developer',
                      resumeUrl: 'https://.../resume.pdf',
                      skills: ['nodejs', 'postgres'],
                      updatedAt: '2025-01-05T09:00:00.000Z'
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      post: {
        tags: ['Job Profile'],
        summary: "Create or update current user's job profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  resume: { type: 'string', format: 'binary' },
                  headline: { type: 'string' },
                  skills: { type: 'string', description: 'comma separated or JSON' },
                  bio: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Job profile saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    message: 'Job profile saved successfully',
                    data: {
                      userId: 'user-uuid',
                      resumeUrl: 'https://.../resume.pdf'
                    }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= Admin Jobs ============
    '/api/admin/jobs': {
      get: {
        tags: ['Admin Jobs'],
        summary: 'List all jobs (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin list of jobs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      jobs: [{ id: 'job-uuid', title: 'Backend Engineer', is_active: true }],
                      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      post: {
        tags: ['Admin Jobs'],
        summary: 'Create a new job (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'company'],
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  company_logo: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Job created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      id: 'job-uuid',
                      title: 'Backend Engineer',
                      company: 'Acme Ltd',
                      is_active: true
                    }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/admin/jobs/{id}': {
      get: {
        tags: ['Admin Jobs'],
        summary: 'Get job (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Job detail (admin)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: { success: true, data: { id: 'job-uuid', title: 'Backend Engineer' } }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      put: {
        tags: ['Admin Jobs'],
        summary: 'Update a job (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  company: { type: 'string' },
                  description: { type: 'string' },
                  company_logo: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Job updated successfully',
            content: {
              'application/json': {
                schema: { type: 'object', example: { success: true, data: { id: 'job-uuid', title: 'Updated' } } }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      },

      delete: {
        tags: ['Admin Jobs'],
        summary: 'Delete a job (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Job deleted successfully', content: { 'application/json': { example: { success: true, message: 'Job deleted successfully' } } } },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/admin/jobs/{id}/status': {
      patch: {
        tags: ['Admin Jobs'],
        summary: 'Toggle job active/inactive status (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Job status toggled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: { id: 'job-uuid', is_active: true },
                    message: 'Job activated'
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/admin/jobs/{id}/applications': {
      get: {
        tags: ['Admin Applications'],
        summary: 'List job applications (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'Applications list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: {
                    success: true,
                    data: {
                      applications: [
                        { id: 'app-uuid', applicant_name: 'Jane Doe', status: 'submitted', appliedAt: '2025-01-10T11:00:00.000Z' }
                      ],
                      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= Admin Application Management ============
    '/api/admin/jobs/applications/{id}/status': {
      patch: {
        tags: ['Admin Applications'],
        summary: 'Update application status (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } }
        },
        responses: {
          '200': {
            description: 'Application status updated',
            content: {
              'application/json': {
                schema: { type: 'object', example: { success: true, data: { id: 'app-uuid', status: 'interview' }, message: 'Application status updated to interview' } }
              }
            }
          },
          '400': { $ref: '#/components/schemas/Error' },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/admin/jobs/applications/{id}': {
      delete: {
        tags: ['Admin Applications'],
        summary: 'Delete an application (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Application deleted successfully', content: { 'application/json': { example: { success: true, message: 'Application deleted successfully' } } } },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    // ============= Admin Job Profiles ============
    '/api/admin/job-profiles': {
      get: {
        tags: ['Admin Job Profiles'],
        summary: 'List all job profiles (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'List of job profiles',
            content: {
              'application/json': {
                schema: { type: 'object', example: { success: true, data: { profiles: [], pagination: { page: 1, limit: 20, total: 0 } } } }
              }
            }
          },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },

    '/api/admin/job-profiles/{id}': {
      delete: {
        tags: ['Admin Job Profiles'],
        summary: 'Delete a job profile (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Job profile deleted', content: { 'application/json': { example: { success: true, message: 'Job profile deleted successfully' } } } },
          '401': { $ref: '#/components/schemas/Error' },
          '403': { $ref: '#/components/schemas/Error' },
          '404': { $ref: '#/components/schemas/Error' },
          '500': { $ref: '#/components/schemas/Error' }
        }
      }
    },
    // ======PARENTS MANAGEMENT===========
    '/parents': {
      get: {
        tags: ['Parents'],
        summary: 'Get all parents',
        description: 'Retrieve a paginated list of all parents (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Number of items per page' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for parent name or email' },
          { name: 'sort_by', in: 'query', schema: { type: 'string' }, description: 'Field to sort by' },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, description: 'Sort order' }
        ],
        responses: {
          '200': { description: 'Parents fetched successfully', content: { 'application/json': { example: { success: true, data: [] } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '500': { description: 'Failed to fetch parents', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      post: {
        tags: ['Parents'],
        summary: 'Create a new parent',
        description: 'Create a new parent with required details (Protected)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' }
                },
                required: ['first_name', 'last_name', 'email']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Parent created successfully', content: { 'application/json': { example: { success: true, data: {}, message: 'Parent created successfully' } } } },
          '400': { description: 'Validation failed', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/parents/:id': {
      get: {
        tags: ['Parents'],
        summary: 'Get parent by ID',
        description: 'Retrieve a single parent by its ID (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Parent ID' }],
        responses: {
          '200': { description: 'Parent fetched successfully', content: { 'application/json': { example: { success: true, parent: {} } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '404': { description: 'Parent not found', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '500': { description: 'Failed to fetch parent', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      put: {
        tags: ['Parents'],
        summary: 'Update parent',
        description: 'Update parent details (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Parent ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Parent updated successfully', content: { 'application/json': { example: { success: true, parent: {}, message: 'Parent updated successfully' } } } },
          '400': { description: 'Validation failed', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      delete: {
        tags: ['Parents'],
        summary: 'Delete parent',
        description: 'Delete a parent by ID (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Parent ID' }],
        responses: {
          '200': { description: 'Parent deleted successfully', content: { 'application/json': { example: { success: true, message: 'Parent deleted successfully' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '404': { description: 'Parent not found', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '500': { description: 'Failed to delete parent', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/parents/:id/students': {
      get: {
        tags: ['Parents'],
        summary: 'Get students for a parent',
        description: 'Retrieve paginated list of students assigned to a parent (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Parent ID' },
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Number of items per page' }
        ],
        responses: {
          '200': { description: 'Students fetched successfully', content: { 'application/json': { example: { success: true, data: [] } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '500': { description: 'Failed to fetch students', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      post: {
        tags: ['Parents'],
        summary: 'Add student to parent',
        description: 'Assign a student to a parent (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Parent ID' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { student_id: { type: 'string' } }, required: ['student_id'] } } }
        },
        responses: {
          '200': { description: 'Student added successfully', content: { 'application/json': { example: { success: true, student: {}, message: 'Student added to parent successfully' } } } },
          '400': { description: 'Validation failed', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/parents/students/:studentId': {
      delete: {
        tags: ['Parents'],
        summary: 'Remove student from parent',
        description: 'Remove a student from parent assignment (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' }],
        responses: {
          '200': { description: 'Student removed successfully', content: { 'application/json': { example: { success: true, student: {}, message: 'Student removed from parent successfully' } } } },
          '400': { description: 'Failed to remove student', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    // ============= CATEGORIES===========
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
    // ============= RESULTS =============

    '/api/results/batches': {
      post: {
        tags: ['Results'],
        summary: 'Create result batch',
        description: 'Create a new result batch',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'batchName',
                  'classroomId',
                  'academicYear',
                  'term',
                  'gradingScaleId',
                  'subjectGroupId'
                ],
                properties: {
                  batchName: { type: 'string' },
                  classroomId: { type: 'string' },
                  academicYear: { type: 'string' },
                  term: { type: 'string' },
                  gradingScaleId: { type: 'string' },
                  subjectGroupId: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Batch created successfully' },
          '400': { $ref: '#/components/responses/Error' },
          401: { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      get: {
        tags: ['Results'],
        summary: 'Get all result batches',
        description: 'Retrieve all result batches with filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'classroomId', in: 'query', schema: { type: 'string' } },
          { name: 'academicYear', in: 'query', schema: { type: 'string' } },
          { name: 'term', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Batches fetched successfully' },
          401: { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/batches/:batchId': {
      get: {
        tags: ['Results'],
        summary: 'Get batch by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
        ],
        responses: {
          '200': { description: 'Batch fetched successfully' },
          '404': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      put: {
        tags: ['Results'],
        summary: 'Update result batch',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'batchName',
                  'classroomId',
                  'academicYear',
                  'term',
                  'gradingScaleId',
                  'subjectGroupId'
                ]
              }
            }
          }
        },
        responses: {
          '200': { description: 'Batch updated successfully' },
          '404': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      delete: {
        tags: ['Results'],
        summary: 'Delete result batch',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
        ],
        responses: {
          '200': { description: 'Batch deleted successfully' },
          '404': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/batches/:batchId/upload': {
      post: {
        tags: ['Results'],
        summary: 'Upload batch CSV',
        description: 'Upload and process CSV results for a batch',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  csv: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'CSV processed successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/batches/:batchId/publish': {
      post: {
        tags: ['Results'],
        summary: 'Publish batch results',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
        ],
        responses: {
          '200': { description: 'Batch published successfully' },
          '404': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/batches/:batchId/status': {
      patch: {
        tags: ['Results'],
        summary: 'Update batch status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
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
                    enum: ['draft', 'processing', 'completed', 'published', 'failed']
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Batch status updated successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/batches/:batchId/results': {
      get: {
        tags: ['Results'],
        summary: 'Get batch results',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'batchId', in: 'path', required: true }
        ],
        responses: {
          '200': { description: 'Batch results fetched successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/subjects': {
      get: {
        tags: ['Results'],
        summary: 'Get all subjects',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          '200': { description: 'Subjects fetched successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      post: {
        tags: ['Results'],
        summary: 'Create subject',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Subject created successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '409': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/grading-scales': {
      get: {
        tags: ['Results'],
        summary: 'Get grading scales',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Grading scales fetched successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      post: {
        tags: ['Results'],
        summary: 'Create grading scale',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Grading scale created successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/results/subject-groups': {
      post: {
        tags: ['Results'],
        summary: 'Create subject group',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Subject group created successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      get: {
        tags: ['Results'],
        summary: 'Get all subject groups',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Subject groups fetched successfully' },
          '500': { $ref: '#/components/responses/Error' }
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
    '/notifications/:id/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        description: 'Mark a specific notification as read (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Notification ID' }
        ],
        responses: {
          '200': {
            description: 'Notification marked as read successfully',
            content: { 'application/json': { example: { success: true, data: {} } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { $ref: '#/components/schemas/Error' } }
          },
          '404': {
            description: 'Notification not found',
            content: { 'application/json': { $ref: '#/components/schemas/Error' } }
          },
          '500': {
            description: 'Failed to mark notification as read',
            content: { 'application/json': { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    },

    '/notifications/:id/unread': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as unread',
        description: 'Mark a specific notification as unread (Protected)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Notification ID' }
        ],
        responses: {
          '200': {
            description: 'Notification marked as unread successfully',
            content: { 'application/json': { example: { success: true, data: {} } } }
          },
          401: {
            description: 'Unauthorized',
            content: { 'application/json': { $ref: '#/components/schemas/Error' } }
          },
          '404': {
            description: 'Notification not found',
            content: { 'application/json': { $ref: '#/components/schemas/Error' } }
          },
          '500': {
            description: 'Failed to mark notification as unread',
            content: { 'application/json': { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    },

    '/api/notifications/read-all': {
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
    '/api/notifications/unread/count': {
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
    '/api/notifications': {
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
    // ============= SEARCH =================
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Unified search across multiple modules',
        description: 'Search across multiple modules using a single query.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Search query text'
          },
          {
            name: 'modules',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Comma-separated list of modules to search (e.g. users,courses)'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              default: 5
            },
            description: 'Maximum results per module'
          }
        ],
        responses: {
          '200': {
            description: 'Search results retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    query: { type: 'string' },
                    totalResults: { type: 'integer' },
                    results: {
                      type: 'object',
                      additionalProperties: {
                        type: 'array',
                        items: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/Error'
          },
          '401': {
            $ref: '#/components/responses/Error'
          },
          '500': {
            $ref: '#/components/responses/Error'
          }
        }
      }
    },

    '/api/search/tags': {
      get: {
        tags: ['Search'],
        summary: 'Tag-based search across modules',
        description: 'Search across modules using a tag. Restricted to admin, staff, and teachers.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tag',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Tag to search for'
          },
          {
            name: 'modules',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Comma-separated list of modules to search'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              default: 10
            },
            description: 'Maximum results per module'
          }
        ],
        responses: {
          '200': {
            description: 'Tag search results retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    tag: { type: 'string' },
                    totalResults: { type: 'integer' },
                    results: {
                      type: 'object',
                      additionalProperties: {
                        type: 'array',
                        items: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/Error'
          },
          '401': {
            $ref: '#/components/responses/Error'
          },
          '403': {
            $ref: '#/components/responses/Error'
          },
          '500': {
            $ref: '#/components/responses/Error'
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
    // ===== Menu Management =====
    '/menu/items': {
      get: {
        tags: ['Menu Management'],
        summary: 'List all menu items',
        description: 'Retrieve all menu items with pagination (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number', required: false },
          { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Number of items per page', required: false }
        ],
        responses: {
          '200': { description: 'Menu items retrieved successfully', content: { 'application/json': { example: { success: true, data: [] } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      post: {
        tags: ['Menu Management'],
        summary: 'Create a new menu item',
        description: 'Create a menu item (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  userType: { type: 'string' },
                  isActive: { type: 'boolean' }
                },
                required: ['name', 'userType']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Menu item created', content: { 'application/json': { example: { success: true, data: {}, message: 'Menu item created successfully' } } } },
          '400': { description: 'Bad request', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/items/:id': {
      get: {
        tags: ['Menu Management'],
        summary: 'Get single menu item',
        description: 'Retrieve a single menu item by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Menu item retrieved', content: { 'application/json': { example: { success: true, data: {} } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '404': { description: 'Not found', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      put: {
        tags: ['Menu Management'],
        summary: 'Update menu item',
        description: 'Update a menu item by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          '200': { description: 'Menu item updated', content: { 'application/json': { example: { success: true, data: {}, message: 'Menu item updated successfully' } } } },
          '400': { description: 'Bad request', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '404': { description: 'Not found', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      delete: {
        tags: ['Menu Management'],
        summary: 'Delete menu item',
        description: 'Delete a menu item by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Menu item deleted', content: { 'application/json': { example: { success: true, message: 'Menu item deleted successfully' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          '404': { description: 'Not found', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/items/:id/toggle': {
      patch: {
        tags: ['Menu Management'],
        summary: 'Toggle menu item status',
        description: 'Activate or deactivate a menu item (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Menu status toggled', content: { 'application/json': { example: { success: true, data: {}, message: 'Menu activated/deactivated successfully' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/menus/:userType': {
      get: {
        tags: ['Menu Management'],
        summary: 'Get menus by user type',
        description: 'Retrieve menus accessible by a specific user type (Public)',
        parameters: [{ name: 'userType', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Menus retrieved', content: { 'application/json': { example: { success: true, data: [] } } } },
          '404': { description: 'Not found', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/user-types': {
      get: {
        tags: ['Menu Management'],
        summary: 'Get available user types',
        description: 'Retrieve all user types (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User types retrieved', content: { 'application/json': { example: { success: true, data: [] } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    // ===== Legacy Menu Visibility =====
    '/menu/all': {
      get: {
        tags: ['Menu Visibility (Legacy)'],
        summary: 'Get all menu settings',
        description: 'Retrieve all menu settings (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'All menu settings retrieved', content: { 'application/json': { example: { success: true, data: [] } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/:id': {
      put: {
        tags: ['Menu Visibility (Legacy)'],
        summary: 'Update menu visibility',
        description: 'Update menu visibility settings for a menu item (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': { description: 'Menu visibility updated', content: { 'application/json': { example: { success: true, message: 'Menu visibility updated' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      },
      delete: {
        tags: ['Menu Visibility (Legacy)'],
        summary: 'Delete menu item (legacy)',
        description: 'Delete a menu item (Admin only, legacy)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Menu item deleted', content: { 'application/json': { example: { success: true, message: 'Menu item deleted successfully' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/bulk/:userType': {
      post: {
        tags: ['Menu Visibility (Legacy)'],
        summary: 'Bulk update menus for a user type',
        description: 'Update multiple menu items visibility for a user type (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userType', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
        responses: {
          '200': { description: 'Bulk menu update successful', content: { 'application/json': { example: { success: true, message: 'Menus updated successfully' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
        }
      }
    },

    '/menu/': {
      post: {
        tags: ['Menu Visibility (Legacy)'],
        summary: 'Add a menu item',
        description: 'Add a new menu item (Admin only, legacy)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '201': { description: 'Menu item added', content: { 'application/json': { example: { success: true, data: {}, message: 'Menu item created successfully' } } } },
          '400': { description: 'Bad request', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          401: { description: 'Unauthorized', content: { 'application/json': { $ref: '#/components/schemas/Error' } } },
          403: { description: 'Forbidden', content: { 'application/json': { $ref: '#/components/schemas/Error' } } }
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
    '/api/settings/institution/logo/{type}': {
      delete: {
        tags: ['Settings'],
        summary: 'Delete institution logo',
        description: 'Delete an institution logo by type (admin only).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Logo type to delete (e.g. light, dark, favicon)'
          }
        ],
        responses: {
          '200': {
            description: 'Logo deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      description: 'Updated institution settings'
                    }
                  }
                }
              }
            }
          },
          '400': {
            $ref: '#/components/responses/Error'
          },
          '401': {
            $ref: '#/components/responses/Error'
          },
          '403': {
            $ref: '#/components/responses/Error'
          },
          '500': {
            $ref: '#/components/responses/Error'
          }
        }
      }
    },
    // ================= STAFF =================
    '/api/staff': {
      get: {
        tags: ['Staff'],
        summary: 'Get all staff members',
        description: 'Retrieve staff members with pagination and filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number' } },
          { name: 'limit', in: 'query', schema: { type: 'number' } },
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'employment_status', in: 'query', schema: { type: 'string' } },
          { name: 'employment_type', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Staff list retrieved successfully' },
          '401': { $ref: '#/components/responses/Error' },
          '403': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      post: {
        tags: ['Staff'],
        summary: 'Create staff member',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Staff' }
            }
          }
        },
        responses: {
          '201': { description: 'Staff member created successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '409': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/generate-id': {
      get: {
        tags: ['Staff'],
        summary: 'Generate staff ID',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Staff ID generated' },
          '401': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/statistics/departments': {
      get: {
        tags: ['Staff'],
        summary: 'Department statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Department statistics retrieved' },
          '401': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/statistics/employment': {
      get: {
        tags: ['Staff'],
        summary: 'Employment statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Employment statistics retrieved' },
          '401': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/upcoming-reviews': {
      get: {
        tags: ['Staff'],
        summary: 'Upcoming staff reviews',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'number' } }
        ],
        responses: {
          '200': { description: 'Upcoming reviews retrieved' },
          '401': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/export/csv': {
      get: {
        tags: ['Staff'],
        summary: 'Export staff to CSV',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'employment_status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'CSV file generated' },
          '401': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/department/{department}': {
      get: {
        tags: ['Staff'],
        summary: 'Get staff by department',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'department', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Staff retrieved' },
          '401': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/by-staff-id/{staffId}': {
      get: {
        tags: ['Staff'],
        summary: 'Get staff by staff ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'staffId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Staff retrieved' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/{id}': {
      get: {
        tags: ['Staff'],
        summary: 'Get staff by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Staff retrieved' },
          '404': { $ref: '#/components/responses/Error' }
        }
      },
      put: {
        tags: ['Staff'],
        summary: 'Update staff member',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Staff' }
            }
          }
        },
        responses: {
          '200': { description: 'Staff updated successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      },
      delete: {
        tags: ['Staff'],
        summary: 'Delete staff member',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Staff deleted successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/{id}/status': {
      patch: {
        tags: ['Staff'],
        summary: 'Update employment status',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Status updated successfully' },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/{id}/custom-fields': {
      patch: {
        tags: ['Staff'],
        summary: 'Update custom fields',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Custom fields updated' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/{id}/metadata': {
      patch: {
        tags: ['Staff'],
        summary: 'Update metadata',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Metadata updated' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/staff/bulk-update': {
      post: {
        tags: ['Staff'],
        summary: 'Bulk update staff',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Staff updated successfully' },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    }
    ,
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
    // ================== CLASSROOM MANAGEMENT ==================
    '/api/classrooms': {
      post: {
        tags: ['Classrooms'],
        summary: 'Create a new classroom',
        description: 'Create a new classroom. Requires classroom.create permission.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code', 'level', 'academic_year'],
                properties: {
                  name: { type: 'string', example: 'JSS 1A', description: 'Classroom name' },
                  code: { type: 'string', example: 'JSS1A', description: 'Unique classroom code' },
                  level: { type: 'string', example: 'jss1', description: 'Classroom level' },
                  type: { type: 'string', example: 'secondary', description: 'Classroom type' },
                  section: { type: 'string', example: 'A', description: 'Classroom section' },
                  capacity: { type: 'integer', example: 30, description: 'Maximum number of students' },
                  academic_year: { type: 'integer', example: 2025, description: 'Academic year' },
                  academic_term: { type: 'string', example: 'First Term', description: 'Academic term' },
                  class_teacher_id: { type: 'string', format: 'uuid', description: 'Class teacher UUID' },
                  room_number: { type: 'string', description: 'Room number' },
                  description: { type: 'string', description: 'Classroom description' },
                  is_active: { type: 'boolean', example: true, description: 'Whether the classroom is active' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Classroom created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Classroom created successfully' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '400': { description: 'Validation error or duplicate code', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Classrooms'],
        summary: 'Get all classrooms',
        description: 'Retrieve all classrooms with optional filters, pagination, and sorting.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or code' },
          { name: 'level', in: 'query', schema: { type: 'string' }, description: 'Filter by level' },
          { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Filter by type' },
          { name: 'academic_year', in: 'query', schema: { type: 'integer' }, description: 'Filter by academic year' },
          { name: 'academic_term', in: 'query', schema: { type: 'string' }, description: 'Filter by academic term' },
          { name: 'is_active', in: 'query', schema: { type: 'boolean' }, description: 'Filter by active status' },
          { name: 'class_teacher_id', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by class teacher ID' },
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Pagination page' },
          { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Pagination limit' },
          { name: 'sort_by', in: 'query', schema: { type: 'string' }, description: 'Sort field' },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, description: 'Sort order' }
        ],
        responses: {
          '200': {
            description: 'Classrooms retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Classrooms retrieved successfully' },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    data: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/my-classroom': {
      get: {
        tags: ['Classrooms'],
        summary: 'Get current student\'s classroom',
        description: 'Retrieve the classroom information for the authenticated student.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Classroom retrieved successfully',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } }
              }
            }
          },
          '404': {
            description: 'Student not assigned to any classroom',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },

    '/api/classrooms/{id}': {
      get: {
        tags: ['Classrooms'],
        summary: 'Get classroom by ID',
        description: 'Retrieve a classroom by its ID.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        responses: {
          '200': { description: 'Classroom retrieved', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      put: {
        tags: ['Classrooms'],
        summary: 'Update classroom',
        description: 'Update classroom information. Only provided fields are updated.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  level: { type: 'string' },
                  type: { type: 'string' },
                  section: { type: 'string' },
                  capacity: { type: 'integer' },
                  academic_year: { type: 'integer' },
                  academic_term: { type: 'string' },
                  class_teacher_id: { type: 'string', format: 'uuid' },
                  room_number: { type: 'string' },
                  description: { type: 'string' },
                  is_active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Classroom updated', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '400': { description: 'Validation error or duplicate code', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      delete: {
        tags: ['Classrooms'],
        summary: 'Delete classroom',
        description: 'Delete a classroom if it has no assigned students.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        responses: {
          '200': { description: 'Classroom deleted successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          '400': { description: 'Cannot delete classroom with students', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/api/classrooms/{id}/students': {
      post: {
        tags: ['Classrooms'],
        summary: 'Assign a student to a classroom',
        description: 'Assign a student to a classroom. Requires classroom.assign_students permission.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['student_id'],
                properties: {
                  student_id: { type: 'string', format: 'uuid', description: 'Student UUID' },
                  enrollment_number: { type: 'string', description: 'Enrollment number' },
                  roll_number: { type: 'integer', description: 'Roll number' },
                  notes: { type: 'string', description: 'Optional notes' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Student assigned successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '400': { description: 'Validation error, duplicate assignment, or capacity exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Classrooms'],
        summary: 'Get all students in a classroom',
        description: 'Retrieve all students assigned to a classroom. Requires classroom.read permission.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by student name' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by assignment status' },
          { name: 'sort_by', in: 'query', schema: { type: 'string' }, description: 'Sort field' },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] }, description: 'Sort order' }
        ],
        responses: {
          '200': { description: 'Classroom students retrieved successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'array', items: { type: 'object' } } } } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/{id}/students/bulk': {
      post: {
        tags: ['Classrooms'],
        summary: 'Bulk assign students to a classroom',
        description: 'Assign multiple students to a classroom at once. Requires classroom.assign_students permission.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['students'],
                properties: {
                  students: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['student_id'],
                      properties: {
                        student_id: { type: 'string', format: 'uuid' },
                        enrollment_number: { type: 'string' },
                        roll_number: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Students assigned successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'array', items: { type: 'object' } } } } } } },
          '400': { description: 'Validation error, duplicate assignment, or capacity exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/{id}/students/{studentId}': {
      delete: {
        tags: ['Classrooms'],
        summary: 'Remove a student from a classroom',
        description: 'Remove a student from a classroom. Requires classroom.assign_students permission.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' },
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Student UUID' }
        ],
        responses: {
          '200': { description: 'Student removed successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          '404': { description: 'Classroom or student not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/assignments/{assignmentId}': {
      put: {
        tags: ['Classrooms'],
        summary: 'Update student assignment',
        description: 'Update student assignment information such as roll number or enrollment number.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'assignmentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Assignment ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { type: 'object', properties: { roll_number: { type: 'integer' }, enrollment_number: { type: 'string' }, notes: { type: 'string' } } } }
          }
        },
        responses: {
          '200': { description: 'Assignment updated successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '404': { description: 'Assignment not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/students/{studentId}/classroom': {
      get: {
        tags: ['Classrooms'],
        summary: 'Get student\'s current classroom',
        description: 'Retrieve the current classroom of a specific student. Requires classroom.read permission.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Student UUID' },
          { name: 'academic_year', in: 'query', schema: { type: 'integer' }, description: 'Optional academic year' }
        ],
        responses: {
          '200': { description: 'Student classroom retrieved', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '404': { description: 'Student not assigned to any classroom', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/{id}/statistics': {
      get: {
        tags: ['Classrooms'],
        summary: 'Get classroom statistics',
        description: 'Retrieve statistics for a classroom, including student and teacher counts. Requires classroom.read permission.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        responses: {
          '200': { description: 'Classroom statistics retrieved', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/{id}/teachers': {
      post: {
        tags: ['Classrooms'],
        summary: 'Assign a teacher to a classroom',
        description: 'Assign a teacher to a classroom. Requires classroom.assign_teachers permission.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { type: 'object', required: ['teacher_id'], properties: { teacher_id: { type: 'string', format: 'uuid' }, is_primary: { type: 'boolean' }, notes: { type: 'string' } } } }
          }
        },
        responses: {
          '201': { description: 'Teacher assigned successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' } } } } } },
          '400': { description: 'Validation error or duplicate assignment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      get: {
        tags: ['Classrooms'],
        summary: 'Get all teachers in a classroom',
        description: 'Retrieve all teachers assigned to a classroom. Requires classroom.read permission.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'is_primary', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort_by', in: 'query', schema: { type: 'string' } },
          { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } }
        ],
        responses: {
          '200': { description: 'Teachers retrieved successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'array', items: { type: 'object' } } } } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/{id}/teachers/bulk': {
      post: {
        tags: ['Classrooms'],
        summary: 'Bulk assign teachers to a classroom',
        description: 'Assign multiple teachers to a classroom at once. Requires classroom.assign_teachers permission.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['teachers'],
                properties: {
                  teachers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['teacher_id'],
                      properties: {
                        teacher_id: { type: 'string', format: 'uuid' },
                        is_primary: { type: 'boolean' },
                        notes: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Teachers assigned successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'array', items: { type: 'object' } } } } } } },
          '400': { description: 'Validation error or duplicate assignment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Classroom not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/{id}/teachers/{teacherId}': {
      delete: {
        tags: ['Classrooms'],
        summary: 'Remove a teacher from a classroom',
        description: 'Remove a teacher assignment. Requires classroom.assign_teachers permission.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Classroom ID' },
          { name: 'teacherId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Teacher UUID' }
        ],
        responses: {
          '200': { description: 'Teacher removed successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          '404': { description: 'Classroom or teacher not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/classrooms/students/{studentId}/transfer': {
      post: {
        tags: ['Classrooms'],
        summary: 'Transfer or promote a student to a new classroom',
        description: 'Transfer or promote a student to another classroom. Requires classroom.assign_students permission.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Student UUID' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['student_id', 'id'],
                properties: {
                  student_id: { type: 'string', format: 'uuid' },
                  id: { type: 'integer', description: 'Target classroom ID' },
                  reason: { type: 'string', enum: ['transfer', 'promotion'] },
                  enrollment_number: { type: 'string' },
                  roll_number: { type: 'integer' },
                  notes: { type: 'string' },
                  transfer_notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Student transferred successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, data: { type: 'object' }, previous_classroom: { type: 'object' } } } } } },
          '400': { description: 'Validation error or student already in target classroom', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Target classroom or student not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    // ================= SUBSCRIPTION =================
    '/api/subscription/tiers': {
      get: {
        tags: ['Subscription'],
        summary: 'Get all subscription tiers',
        description: 'Retrieve all subscription tiers with optional pagination, search, and sorting',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', example: 50 } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean', example: true } },
          { name: 'search', in: 'query', schema: { type: 'string', example: 'premium' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'sort_order' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', example: 'asc' } }
        ],
        responses: {
          '200': { description: 'Subscription tiers retrieved successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      post: {
        tags: ['Subscription'],
        summary: 'Create a subscription tier',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscriptionTier' },
              example: {
                name: 'Premium Plan',
                slug: 'premium-plan',
                description: 'Full access to all features',
                price: 49.99,
                currency: 'USD',
                billingCycleMonths: 1,
                features: ['Feature 1', 'Feature 2'],
                maxUsers: -1,
                isPopular: true,
                sortOrder: 0
              }
            }
          }
        },
        responses: {
          '201': { description: 'Subscription tier created successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '409': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/tiers/{id}': {
      get: {
        tags: ['Subscription'],
        summary: 'Get subscription tier by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        responses: {
          '200': { description: 'Subscription tier retrieved successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      },
      put: {
        tags: ['Subscription'],
        summary: 'Update subscription tier',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscriptionTierUpdate' },
              example: { price: 59.99, isPopular: false }
            }
          }
        },
        responses: {
          '200': { description: 'Subscription tier updated successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' },
          '409': { $ref: '#/components/responses/Error' }
        }
      },
      delete: {
        tags: ['Subscription'],
        summary: 'Delete subscription tier',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        responses: {
          '200': { description: 'Subscription tier deleted successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/tiers/slug/{slug}': {
      get: {
        tags: ['Subscription'],
        summary: 'Get subscription tier by slug',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', example: 'premium-plan' } }
        ],
        responses: {
          '200': { description: 'Subscription tier retrieved successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/tiers/{id}/toggle': {
      patch: {
        tags: ['Subscription'],
        summary: 'Toggle subscription tier active status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        responses: {
          '200': { description: 'Subscription tier active status toggled' },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/tiers/reorder': {
      patch: {
        tags: ['Subscription'],
        summary: 'Reorder subscription tiers',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: { type: 'number' } },
              example: { 'uuid-tier1': 0, 'uuid-tier2': 1 }
            }
          }
        },
        responses: {
          '200': { description: 'Subscription tiers reordered successfully' },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/subscribe': {
      post: {
        tags: ['Subscription'],
        summary: 'Subscribe current user to a tier',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscribeRequest' },
              example: { tierId: 'uuid-here', paymentProvider: 'manual' }
            }
          }
        },
        responses: {
          '201': { description: 'User subscribed successfully' },
          '409': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/my-subscriptions': {
      get: {
        tags: ['Subscription'],
        summary: 'Get subscriptions of the current user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', example: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', example: 'active' } }
        ],
        responses: {
          '200': { description: 'Subscriptions retrieved successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/my-active-subscription': {
      get: {
        tags: ['Subscription'],
        summary: 'Get active subscription of the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Active subscription retrieved' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/cancel-subscription': {
      patch: {
        tags: ['Subscription'],
        summary: 'Cancel current user subscription',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CancelSubscription' },
              example: { reason: 'No longer needed' }
            }
          }
        },
        responses: {
          '200': { description: 'Subscription cancelled successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/subscriptions': {
      get: {
        tags: ['Subscription'],
        summary: 'Get all subscriptions (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', example: 50 } },
          { name: 'status', in: 'query', schema: { type: 'string', example: 'active' } },
          { name: 'userId', in: 'query', schema: { type: 'string', example: 'uuid-here' } },
          { name: 'tierId', in: 'query', schema: { type: 'string', example: 'uuid-here' } }
        ],
        responses: {
          '200': { description: 'Subscriptions retrieved successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/subscriptions/{id}': {
      get: {
        tags: ['Subscription'],
        summary: 'Get subscription by ID (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        responses: {
          '200': { description: 'Subscription retrieved successfully' },
          '404': { $ref: '#/components/responses/Error' }
        }
      },
      patch: {
        tags: ['Subscription'],
        summary: 'Update subscription (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscriptionUpdate' },
              example: { status: 'cancelled', confirmed: true }
            }
          }
        },
        responses: {
          '200': { description: 'Subscription updated successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' }
        }
      },
      post: {
        tags: ['Subscription'],
        summary: 'Cancel subscription (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-here' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CancelSubscription' },
              example: { reason: 'Violation', confirmed: true }
            }
          }
        },
        responses: {
          '200': { description: 'Subscription cancelled successfully' },
          '400': { $ref: '#/components/responses/Error' },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/subscription/stats': {
      get: {
        tags: ['Subscription'],
        summary: 'Get subscription statistics (Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Subscription statistics retrieved successfully' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },
    // ================= TAG MANAGEMENT =================
    '/api/tags': {
      get: {
        tags: ['Tags'],
        summary: 'Get all tags',
        description: 'Retrieve tags with optional search, filtering by key/type/category, and pagination',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string', example: 'urgent' } },
          { name: 'tag_key', in: 'query', schema: { type: 'string', example: 'priority' } },
          { name: 'tag_type', in: 'query', schema: { type: 'string', example: 'system' } },
          { name: 'category_id', in: 'query', schema: { type: 'string', example: 'uuid-category' } },
          { name: 'page', in: 'query', schema: { type: 'number', example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', example: 100 } }
        ],
        responses: {
          '200': {
            description: 'Tags retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    { id: 'uuid1', tag_key: 'priority', tag_value: 'high', tag_type: 'system', category_id: 'uuid-cat1' },
                    { id: 'uuid2', tag_key: 'status', tag_value: 'open', tag_type: 'custom', category_id: 'uuid-cat2' }
                  ],
                  pagination: { page: 1, limit: 100 }
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/Error' }
        }
      },
      post: {
        tags: ['Tags'],
        summary: 'Create a new tag',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Tag' },
              example: {
                tag_key: 'priority',
                tag_value: 'urgent',
                description: 'Tasks that need immediate attention',
                tag_type: 'custom',
                category_id: 'uuid-category'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Tag created successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Tag created successfully',
                  data: { id: 'uuid-tag1', tag_key: 'priority', tag_value: 'urgent' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/Error' },
          '500': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/tags/:id': {
      get: {
        tags: ['Tags'],
        summary: 'Get tag by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-tag1' } }
        ],
        responses: {
          '200': {
            description: 'Tag retrieved successfully',
            content: {
              'application/json': {
                example: { success: true, data: { id: 'uuid-tag1', tag_key: 'priority', tag_value: 'urgent' } }
              }
            }
          },
          '404': {
            description: 'Tag not found',
            content: { 'application/json': { example: { success: false, message: 'Tag not found' } } }
          }
        }
      },
      patch: {
        tags: ['Tags'],
        summary: 'Update a tag',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-tag1' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TagUpdate' },
              example: { description: 'Updated description', tag_type: 'system', category_id: 'uuid-cat2' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Tag updated successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Tag updated successfully',
                  data: { id: 'uuid-tag1', tag_key: 'priority', tag_value: 'urgent', description: 'Updated description' }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/Error' }
        }
      },
      delete: {
        tags: ['Tags'],
        summary: 'Delete a tag',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-tag1' } }
        ],
        responses: {
          '200': {
            description: 'Tag deleted successfully',
            content: { 'application/json': { example: { success: true, message: 'Tag deleted successfully' } } }
          },
          '404': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/tags/keys': {
      get: {
        tags: ['Tags'],
        summary: 'Get all tag keys',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Tag keys retrieved successfully',
            content: { 'application/json': { example: { success: true, data: ['priority', 'status', 'type'] } } }
          }
        }
      }
    },

    '/api/tags/keys/:key/values': {
      get: {
        tags: ['Tags'],
        summary: 'Get tag values for a key',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'key', in: 'path', required: true, schema: { type: 'string', example: 'priority' } }
        ],
        responses: {
          '200': {
            description: 'Tag values retrieved successfully',
            content: { 'application/json': { example: { success: true, data: ['low', 'medium', 'high', 'urgent'] } } }
          }
        }
      }
    },

    '/api/tags/categories': {
      get: {
        tags: ['Tags'],
        summary: 'Get all tag categories',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Categories retrieved successfully',
            content: { 'application/json': { example: { success: true, data: [{ id: 'uuid-cat1', name: 'Priority' }] } } }
          }
        }
      }
    },

    '/api/tags/resources': {
      post: {
        tags: ['Tags'],
        summary: 'Tag a resource',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TagResource' },
              example: {
                resource_type: 'task',
                resource_id: 'uuid-task1',
                tag_key: 'priority',
                tag_value: 'high',
                tag_description: 'High priority task',
                tag_type: 'custom',
                category_id: 'uuid-cat1'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Resource tagged successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Resource tagged successfully',
                  data: { id: 'uuid-tag-resource1', resource_type: 'task', tag_key: 'priority', tag_value: 'high' }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/tags/resources/:resource_type/:resource_id': {
      get: {
        tags: ['Tags'],
        summary: 'Get tags for a resource',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'resource_type', in: 'path', required: true, schema: { type: 'string', example: 'task' } },
          { name: 'resource_id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-task1' } }
        ],
        responses: {
          '200': {
            description: 'Tags retrieved for resource',
            content: {
              'application/json': {
                example: { success: true, data: [{ tag_key: 'priority', tag_value: 'high' }] }
              }
            }
          }
        }
      }
    },

    '/api/tags/resources/:resource_type/:resource_id/:tag_id': {
      delete: {
        tags: ['Tags'],
        summary: 'Untag a resource',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'resource_type', in: 'path', required: true, schema: { type: 'string', example: 'task' } },
          { name: 'resource_id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-task1' } },
          { name: 'tag_id', in: 'path', required: true, schema: { type: 'string', example: 'uuid-tag1' } }
        ],
        responses: {
          '200': {
            description: 'Resource untagged successfully',
            content: { 'application/json': { example: { success: true, message: 'Resource untagged successfully' } } }
          }
        }
      }
    },

    '/api/tags/search': {
      post: {
        tags: ['Tags'],
        summary: 'Search resources by tags',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SearchResourcesByTags' },
              example: {
                resource_type: 'task',
                tags: [{ tag_key: 'priority', tag_value: 'high' }],
                match_type: 'all'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resources found by tags',
            content: {
              'application/json': {
                example: { success: true, data: ['uuid-task1', 'uuid-task2'], count: 2 }
              }
            }
          },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    },

    '/api/tags/bulk': {
      post: {
        tags: ['Tags'],
        summary: 'Bulk tag resources',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BulkTagResources' },
              example: {
                resources: [{ resource_type: 'task', resource_id: 'uuid-task1' }],
                tags: [{ tag_key: 'priority', tag_value: 'high' }]
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resources bulk tagged successfully',
            content: {
              'application/json': {
                example: { success: true, message: 'Successfully tagged 1 resource-tag combinations', data: { count: 1 } }
              }
            }
          },
          '400': { $ref: '#/components/responses/Error' }
        }
      }
    },
    // ================= PERSONALISATION =================
    '/api/personalisation/preferences': {
      get: {
        tags: ['Personalisation'],
        summary: 'Get user preferences',
        description: 'Retrieve the preferences for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User preferences retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    theme: 'dark',
                    notifications: { email: true, sms: false },
                    language: 'en'
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to fetch preferences',
            content: {
              'application/json': {
                example: {
                  success: false,
                  error: 'Failed to fetch preferences'
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Personalisation'],
        summary: 'Update user preferences',
        description: 'Update the preferences for the authenticated user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  theme: { type: 'string', example: 'light' },
                  notifications: {
                    type: 'object',
                    properties: {
                      email: { type: 'boolean', example: true },
                      sms: { type: 'boolean', example: false }
                    }
                  },
                  language: { type: 'string', example: 'fr' }
                }
              },
              example: {
                theme: 'light',
                notifications: { email: true, sms: true },
                language: 'fr'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Preferences updated successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Preferences updated successfully',
                  data: {
                    theme: 'light',
                    notifications: { email: true, sms: true },
                    language: 'fr'
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to update preferences',
            content: {
              'application/json': {
                example: {
                  success: false,
                  error: 'Failed to update preferences'
                }
              }
            }
          }
        }
      }
    },
    // ================= WISHLIST =================
    '/api/wishlist': {
      post: {
        tags: ['Wishlist'],
        summary: 'Add item to wishlist',
        description: 'Add a course, library item, or shop product to the authenticated user\'s wishlist',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  item_type: { type: 'string', enum: ['course', 'library_item', 'shop_product'], example: 'course' },
                  item_id: { type: 'string', example: '1234' },
                  notes: { type: 'string', example: 'Must review this later' }
                },
                required: ['item_type', 'item_id']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Item added to wishlist',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Item added to wishlist',
                  data: {
                    id: 'abcd-1234',
                    user_id: '550e8400-e29b-41d4-a716-446655440000',
                    item_type: 'course',
                    item_id: '1234',
                    notes: 'Must review this later',
                    created_at: '2025-12-24T12:00:00.000Z'
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid item or already exists',
            content: {
              'application/json': {
                example: {
                  success: false,
                  message: 'Item is already in your wishlist'
                }
              }
            }
          }
        }
      },
      post_toggle: {
        path: '/api/wishlist/toggle',
        tags: ['Wishlist'],
        summary: 'Toggle item in wishlist',
        description: 'Add item if not present, remove if already in wishlist',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  item_type: { type: 'string', enum: ['course', 'library_item', 'shop_product'], example: 'course' },
                  item_id: { type: 'string', example: '1234' }
                },
                required: ['item_type', 'item_id']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Item toggled successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Item added to wishlist',
                  in_wishlist: true
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Wishlist'],
        summary: 'Get user wishlist with details',
        description: 'Retrieve the authenticated user\'s wishlist with courses, library items, and shop products',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'item_type', in: 'query', schema: { type: 'string', enum: ['course', 'library_item', 'shop_product'] } }
        ],
        responses: {
          '200': {
            description: 'Wishlist retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    courses: [{ id: 'c1', title: 'Course 1' }],
                    library_items: [{ id: 'l1', title: 'Library Item 1' }],
                    shop_products: [{ id: 'p1', name: 'Product 1' }],
                    counts: {
                      total: 3,
                      courses: 1,
                      library_items: 1,
                      shop_products: 1
                    }
                  }
                }
              }
            }
          }
        }
      },
      get_count: {
        path: '/api/wishlist/count',
        tags: ['Wishlist'],
        summary: 'Get wishlist count',
        description: 'Get count of items in user wishlist, optionally filtered by type',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'item_type', in: 'query', schema: { type: 'string', enum: ['course', 'library_item', 'shop_product'] } }
        ],
        responses: {
          '200': {
            description: 'Wishlist count retrieved successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    count: 3
                  }
                }
              }
            }
          }
        }
      },
      get_check: {
        path: '/api/wishlist/check/{item_type}/{item_id}',
        tags: ['Wishlist'],
        summary: 'Check if item is in wishlist',
        description: 'Returns whether a given item is in the authenticated user\'s wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'item_type', in: 'path', required: true, schema: { type: 'string', enum: ['course', 'library_item', 'shop_product'] } },
          { name: 'item_id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Wishlist status retrieved',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    in_wishlist: true
                  }
                }
              }
            }
          }
        }
      },
      delete_item: {
        path: '/api/wishlist/{item_type}/{item_id}',
        tags: ['Wishlist'],
        summary: 'Remove item from wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'item_type', in: 'path', required: true, schema: { type: 'string', enum: ['course', 'library_item', 'shop_product'] } },
          { name: 'item_id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Item removed from wishlist',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Item removed from wishlist'
                }
              }
            }
          },
          '404': {
            description: 'Item not found in wishlist',
            content: {
              'application/json': {
                example: {
                  success: false,
                  message: 'Item not found in wishlist'
                }
              }
            }
          }
        }
      },
      delete_clear: {
        path: '/api/wishlist',
        tags: ['Wishlist'],
        summary: 'Clear wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'item_type', in: 'query', schema: { type: 'string', enum: ['course', 'library_item', 'shop_product'] } }
        ],
        responses: {
          '200': {
            description: 'Wishlist cleared successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Wishlist cleared successfully'
                }
              }
            }
          }
        }
      },
      patch_notes: {
        path: '/api/wishlist/{item_type}/{item_id}/notes',
        tags: ['Wishlist'],
        summary: 'Update wishlist item notes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'item_type', in: 'path', required: true, schema: { type: 'string', enum: ['course', 'library_item', 'shop_product'] } },
          { name: 'item_id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: { type: 'string', example: 'Updated notes for this wishlist item' }
                },
                required: ['notes']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Notes updated successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Notes updated successfully',
                  data: {
                    item_type: 'course',
                    item_id: '1234',
                    notes: 'Updated notes for this wishlist item'
                  }
                }
              }
            }
          },
          '404': {
            description: 'Item not found in wishlist',
            content: {
              'application/json': {
                example: {
                  success: false,
                  message: 'Item not found in wishlist'
                }
              }
            }
          }
        }
      }
    },
    // ===================CONTACT MANAGEMENT ==============
    '/api/contact/submit': {
      post: {
        tags: ['Contact'],
        summary: 'Submit contact form',
        description: 'Submit a contact form with name, email, phone, subject, and message. Public endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'subject', 'message'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'John Doe',
                    description: 'Full name of the person contacting'
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com',
                    description: 'Email address of the person contacting'
                  },
                  phone: {
                    type: 'string',
                    example: '+1234567890',
                    description: 'Optional phone number'
                  },
                  subject: {
                    type: 'string',
                    example: 'Support Request',
                    description: 'Subject of the message'
                  },
                  message: {
                    type: 'string',
                    example: 'I need help with my account.',
                    description: 'Message content'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Contact form submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Thank you for contacting us! We will get back to you soon.' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        created_at: { type: 'string', format: 'date-time', example: '2025-12-24T12:00:00Z' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Failed to submit contact form',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/contact/statistics': {
      get: {
        tags: ['Contact'],
        summary: 'Get contact statistics',
        description: 'Retrieve statistics about contact submissions. Admin access required.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' } // Can be detailed further with fields like total_submissions, read_count, unread_count
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },

    '/api/contact/submissions': {
      get: {
        tags: ['Contact'],
        summary: 'List all contact submissions',
        description: 'Retrieve a paginated list of contact submissions. Admin access required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Number of items per page' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
          { name: 'query', in: 'query', schema: { type: 'string' }, description: 'Search query' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'created_at' }, description: 'Sort field' },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', default: 'DESC' }, description: 'Sort order' }
        ],
        responses: {
          '200': {
            description: 'Submissions retrieved successfully',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'array', items: { type: 'object' } } } } } }
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/contact/submissions/{id}': {
      get: {
        tags: ['Contact'],
        summary: 'Get single contact submission',
        description: 'Retrieve a specific contact submission by ID. Admin access required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Submission ID' }
        ],
        responses: {
          '200': { description: 'Submission retrieved', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { type: 'object' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      put: {
        tags: ['Contact'],
        summary: 'Update contact submission',
        description: 'Update status and admin notes of a contact submission. Admin access required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Submission ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'read', description: 'Status of submission' },
                  admin_notes: { type: 'string', example: 'Followed up', description: 'Admin notes' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Submission updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Contact submission updated successfully' }, data: { type: 'object' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      delete: {
        tags: ['Contact'],
        summary: 'Delete contact submission',
        description: 'Delete a contact submission by ID. Admin access required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Submission ID' }
        ],
        responses: {
          '200': { description: 'Submission deleted', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Contact submission deleted successfully' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/contact/submissions/{id}/read': {
      patch: {
        tags: ['Contact'],
        summary: 'Mark submission as read',
        description: 'Set submission status to read. Admin access required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Submission ID' }
        ],
        responses: {
          '200': { description: 'Marked as read', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Marked as read' }, data: { type: 'object' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },

    '/api/contact/submissions/{id}/unread': {
      patch: {
        tags: ['Contact'],
        summary: 'Mark submission as unread',
        description: 'Set submission status to unread. Admin access required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Submission ID' }
        ],
        responses: {
          '200': { description: 'Marked as unread', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Marked as unread' }, data: { type: 'object' } } } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    // =================== CERTIFICATES ====================
    '/api/courses/{courseId}/certificate': {
      post: {
        tags: ['Certificates'],
        summary: 'Generate certificate for a course',
        description: 'Generates a certificate if the course is fully completed. Returns existing certificate if already generated.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'courseId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '201': {
            description: 'Certificate generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Certificate generated successfully' },
                    certificate: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        course_id: { type: 'string' },
                        certificate_number: { type: 'string' },
                        certificate_data: { type: 'object' },
                        issued_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '200': {
            description: 'Certificate already exists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Certificate already exists' },
                    certificate: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        course_id: { type: 'string' },
                        certificate_number: { type: 'string' },
                        certificate_data: { type: 'object' },
                        issued_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Course not completed or certificates disabled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },

      get: {
        tags: ['Certificates'],
        summary: 'Get certificate for current user and course',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'courseId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Certificate retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    certificate: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        course_id: { type: 'string' },
                        certificate_number: { type: 'string' },
                        certificate_data: { type: 'object' },
                        issued_at: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Certificate not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },

    '/api/courses/{courseId}/certificate/eligibility': {
      get: {
        tags: ['Certificates'],
        summary: 'Check certificate eligibility',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'courseId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Eligibility status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    eligible: { type: 'boolean' },
                    has_certificate: { type: 'boolean' },
                    completion_percentage: { type: 'number', example: 100 },
                    completed_modules: { type: 'integer', example: 10 },
                    total_modules: { type: 'integer', example: 10 }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/my-certificates': {
      get: {
        tags: ['Certificates'],
        summary: 'Get certificates for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User certificates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    certificates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          certificate_number: { type: 'string' },
                          course_title: { type: 'string' },
                          course_description: { type: 'string' },
                          thumbnail_url: { type: 'string' },
                          issued_at: { type: 'string', format: 'date-time' }
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

    '/api/users/{userId}/certificates': {
      get: {
        tags: ['Certificates'],
        summary: 'Get certificates by user ID',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'User certificates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    certificates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          certificate_number: { type: 'string' },
                          course_title: { type: 'string' },
                          course_description: { type: 'string' },
                          thumbnail_url: { type: 'string' },
                          issued_at: { type: 'string', format: 'date-time' }
                        }
                      }
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
      }
    },

    '/api/verify/{certificateNumber}': {
      get: {
        tags: ['Certificates'],
        summary: 'Verify certificate',
        parameters: [
          {
            name: 'certificateNumber',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Certificate verified',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    valid: { type: 'boolean', example: true },
                    certificate: {
                      type: 'object',
                      properties: {
                        certificate_number: { type: 'string' },
                        issued_at: { type: 'string', format: 'date-time' },
                        student_name: { type: 'string' },
                        course_title: { type: 'string' },
                        certificate_data: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Certificate not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
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
