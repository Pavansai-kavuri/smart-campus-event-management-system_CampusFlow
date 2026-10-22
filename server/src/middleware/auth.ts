import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole, AuditLog } from '../models/index.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'campusflow-local-dev-secret-key-2026-change-in-production';
};

export function signAuthToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role }, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.cf_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to continue.',
      });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { sub: string; role: UserRole };
    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Session invalid or account deactivated.',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication session.',
    });
  }
}

export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.cf_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }
    if (token) {
      const decoded = jwt.verify(token, getJwtSecret()) as { sub: string; role: UserRole };
      const user = await User.findById(decoded.sub);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Continue unauthenticated
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }
    next();
  };
}

export async function recordAuditLog(params: {
  user: IUser;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await AuditLog.create({
      actorId: params.user._id,
      actorName: params.user.name,
      actorRole: params.user.role,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details || {},
      ipAddress: params.ipAddress,
    });
  } catch (err) {
    console.error('[CampusFlow Audit] Failed to record audit log:', err);
  }
}
