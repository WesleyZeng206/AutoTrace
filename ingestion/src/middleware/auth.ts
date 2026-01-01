import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { Pool } from 'pg';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
      };
      teams?: { id: string; name: string; slug: string; role: string;
      }[];
      currentTeamId?: string;
      userRole?: 'owner' | 'admin' | 'member';
    }
  }
}

export function requireAuth(pool: Pool) {
  const authService = new AuthService(pool);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from cookie or Authorization header
      let token: string | undefined;

      if (req.cookies && req.cookies.session_token) {
        token = req.cookies.session_token;
      }

      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No session token provided' });
      }

      const userWithTeams = await authService.validateSession(token);

      if (!userWithTeams) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
      }

      req.user = userWithTeams.user;
      req.teams = userWithTeams.teams;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}


export function requireTeamAccess(pool: Pool) {
  const authService = new AuthService(pool);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      }

      const teamId =
        req.params.teamId ||
        (req.query.teamId as string) ||
        (req.body && req.body.teamId);

      if (!teamId) {
        return res.status(400).json({ error: 'Bad Request: teamId is required' });
      }

      // Check if user has access to this team
      const x = await authService.checkTeamAccess(req.user.id, teamId);

      if (!x) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this team' });
      }

      const role = await authService.getUserRole(req.user.id, teamId);

      req.currentTeamId = teamId;
      req.userRole = role || undefined;

      next();
    } catch (error) {
      console.error('Team access middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function requireRole(allowedRoles: ('owner' | 'admin' | 'member')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    if (!req.userRole) {
      return res.status(403).json({ error: 'Forbidden: No role found for this team' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}


export function optionalAuth(pool: Pool) {
  const authService = new AuthService(pool);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      if (req.cookies && req.cookies.session_token) {
        token = req.cookies.session_token;
      }

      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (token) {
        const userWithTeams = await authService.validateSession(token);
        if (userWithTeams) {
          req.user = userWithTeams.user;
          req.teams = userWithTeams.teams;
        }
      }

      next();
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      next(); 
    }
  };
}
