import { z } from 'zod';
import { insertContactSchema, insertSettingsSchema, contacts, settings } from './schema';

export const api = {
  contacts: {
    list: {
      method: 'GET' as const,
      path: '/api/contacts',
      input: z.object({
        status: z.enum(['pending', 'sent', 'failed', 'skipped']).optional(),
        search: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }).optional(),
      responses: {
        200: z.object({
          contacts: z.array(z.custom<typeof contacts.$inferSelect>()),
          total: z.number(),
          pages: z.number(),
        }),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/contacts/:id/status',
      input: z.object({
        status: z.enum(['pending', 'sent', 'failed', 'skipped']),
      }),
      responses: {
        200: z.custom<typeof contacts.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    create: { // For manual entry
      method: 'POST' as const,
      path: '/api/contacts',
      input: insertContactSchema,
      responses: {
        201: z.custom<typeof contacts.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/contacts/upload',
      // input: FormData (handled by multer)
      responses: {
        200: z.object({ 
          message: z.string(), 
          processed: z.number(), 
          duplicates: z.number() 
        }),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/contacts/stats',
      responses: {
        200: z.object({
          total: z.number(),
          pending: z.number(),
          sent: z.number(),
          failed: z.number(),
          skipped: z.number(),
        }),
      },
    }
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/settings',
      input: insertSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof settings.$inferSelect>(),
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/settings/toggle',
      input: z.object({ isActive: z.boolean() }),
      responses: {
        200: z.object({ isActive: z.boolean(), message: z.string() }),
      },
    },
    testEmail: {
      method: 'POST' as const,
      path: '/api/settings/test-email',
      input: z.object({ email: z.string().email() }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    }
  }
};

// Helper required by frontend generator
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
