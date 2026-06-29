import { Router } from 'express';
import {
  addCustomer,
  listCustomers,
  removeCustomer,
  streamQueue,
  updateCustomer,
} from '../controllers/queue.controller';
import { validateCreateCustomer, validateUpdateCustomer } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * RESTful router for the queue resource.
 *   GET    /api/queue           list customers (optional ?status= filter)
 *   GET    /api/queue/stream    Server-Sent Events stream of live queue updates
 *   POST   /api/queue           add a customer
 *   PATCH  /api/queue/:id       update a customer's status
 *   DELETE /api/queue/:id       remove a customer
 */
export const queueRouter = Router();

// Long-lived SSE stream (not wrapped in asyncHandler — it intentionally never resolves).
queueRouter.get('/stream', streamQueue);

queueRouter.get('/', asyncHandler(listCustomers));
queueRouter.post('/', validateCreateCustomer, asyncHandler(addCustomer));
queueRouter.patch('/:id', validateUpdateCustomer, asyncHandler(updateCustomer));
queueRouter.delete('/:id', asyncHandler(removeCustomer));
