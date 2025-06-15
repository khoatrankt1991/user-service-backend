import { Router } from 'express';
import { HealthController } from '@/interfaces/controllers/HealthController';

export const createHealthRoutes = (): Router => {
  const router = Router();
  const healthController = new HealthController();

  router.get('/', healthController.getHealthStatus.bind(healthController));
  router.get('/detailed', healthController.getDetailedHealth.bind(healthController));
  router.get('/ready', healthController.getReadinessStatus.bind(healthController));
  router.get('/live', healthController.getLivenessStatus.bind(healthController));

  return router;
};