import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { storageService } from '../services/storage';

export const servicesRouter = Router();

servicesRouter.get('/', requireAuth(storageService.pool), async (req: Request, res: Response) => {
  try {
    const { teamId } = req.query;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'teamId query parameter is required',
      });
    }

    const hasAccess = req.teams?.some((team) => team.id === teamId);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this team',
      });
    }

    const result = await storageService.pool.query<{ service_name: string }>(
      'SELECT DISTINCT service_name FROM requests_raw WHERE team_id = $1 ORDER BY service_name ASC',
      [teamId]
    );

    const services = result.rows.map((row) => row.service_name);

    res.status(200).json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch services',
    });
  }
});
