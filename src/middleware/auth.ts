import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Необхідно авторизуватися (відсутній токен)' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-12345', (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Недійсний або прострочений токен' });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  });
};
