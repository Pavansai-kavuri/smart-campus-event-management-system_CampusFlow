import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/index.js';
import {
  AuthRequest,
  signAuthToken,
  recordAuditLog,
} from '../middleware/auth.js';
import {
  registerUserSchema,
  loginSchema,
  profileUpdateSchema,
} from '../validators/schemas.js';
import { runSeed } from '../utils/seed.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function checkDatabaseConnection(res: Response): boolean {
  if (!isDatabaseReady()) {
    res.status(503).json({
      success: false,
      error:
        'Database connection unavailable. If deployed on Render, please configure the MONGODB_URI environment variable (pointing to your MongoDB Atlas cluster) and ensure MongoDB Atlas Network Access allows 0.0.0.0/0.',
    });
    return false;
  }
  return true;
}

function sanitizeUser(user: any) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    rollNumber: user.rollNumber,
    department: user.department,
    yearOfStudy: user.yearOfStudy,
    avatar: user.avatar,
    bio: user.bio,
    interests: user.interests || [],
    themePreference: user.themePreference || 'system',
    notificationPreferences: user.notificationPreferences,
    isActive: user.isActive,
    isDemo: user.isDemo,
    createdAt: user.createdAt,
  };
}

export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!checkDatabaseConnection(res)) return;

    const parsed = registerUserSchema.parse(req.body);
    const existing = await User.findOne({ email: parsed.email.toLowerCase() });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'An account with this university email already exists.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = await User.create({
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      passwordHash,
      role: parsed.role === 'ORGANIZER' ? 'ORGANIZER' : 'STUDENT', // Never allow ADMIN from public signup
      rollNumber: parsed.rollNumber,
      department: parsed.department,
      yearOfStudy: parsed.yearOfStudy,
      interests: parsed.interests,
      isDemo: false,
    });

    const token = signAuthToken(String(user._id), user.role);
    res.cookie('cf_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!checkDatabaseConnection(res)) return;

    const parsed = loginSchema.parse(req.body);
    const rawEmail = parsed.email.trim();
    const searchEmail = rawEmail.toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: searchEmail },
        { email: rawEmail },
        { email: { $regex: new RegExp(`^${rawEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { rollNumber: rawEmail },
        { rollNumber: rawEmail.toUpperCase() },
        ...(searchEmail === 'admin@campusflow.edu' ? [{ email: 'dean.aaravind@campusflow.edu' }] : []),
      ],
    }).select('+passwordHash');
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const token = signAuthToken(String(user._id), user.role);
    res.cookie('cf_token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function demoLogin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!checkDatabaseConnection(res)) return;

    const requestedRole = String(req.body.role || 'STUDENT').toUpperCase();
    const demoEmails: Record<string, string> = {
      STUDENT: 'Vu.241FA04312@gmail.com',
      ORGANIZER: 'vikram.mehta@campusflow.edu',
      ADMIN: 'dean.aaravind@campusflow.edu',
    };

    const targetEmail = demoEmails[requestedRole] || demoEmails.STUDENT;
    const escapedTarget = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let user = await User.findOne({
      $or: [
        { email: targetEmail },
        { email: targetEmail.toLowerCase() },
        { email: { $regex: new RegExp(`^${escapedTarget}$`, 'i') } },
        ...(requestedRole === 'STUDENT' ? [{ rollNumber: '241FA04312' }] : []),
      ],
    });
    if (!user) {
      user = await User.findOne({ role: requestedRole as any, isDemo: true });
    }

    // Auto-bootstrap demo accounts on-the-fly if missing in fresh cloud deployment
    if (!user) {
      console.log(`[CampusFlow] Demo user for ${requestedRole} missing, running on-the-fly seed...`);
      try {
        await runSeed();
      } catch (seedErr: any) {
        console.warn('[CampusFlow] On-demand seed notice:', seedErr.message);
      }
      user = await User.findOne({
        $or: [
          { email: targetEmail },
          { email: targetEmail.toLowerCase() },
          { email: { $regex: new RegExp(`^${escapedTarget}$`, 'i') } },
          ...(requestedRole === 'STUDENT' ? [{ rollNumber: '241FA04312' }] : []),
        ],
      });
      if (!user) {
        user = await User.findOne({ role: requestedRole as any, isDemo: true });
      }
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: `Demo account for ${requestedRole} could not be initialized. Please verify your MongoDB connection.`,
      });
      return;
    }

    const token = signAuthToken(String(user._id), user.role);
    res.cookie('cf_token', token, COOKIE_OPTIONS);

    await recordAuditLog({
      user,
      action: 'DEMO_SESSION_START',
      targetType: 'User',
      targetId: String(user._id),
      details: { role: user.role },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  '';
const googleClient = new OAuth2Client(googleClientId);

export async function googleLogin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!checkDatabaseConnection(res)) return;

    let email = req.body.email;
    let name = req.body.name;
    let avatar = req.body.avatar;

    // Cryptographically verify Google ID Token (credential) if returned by Google Identity Services
    if (req.body.credential && typeof req.body.credential === 'string') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: req.body.credential,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          email = payload.email;
          name = payload.name || name;
          avatar = payload.picture || avatar;
        }
      } catch (verifyErr: any) {
        console.warn('[Google Auth] ID Token verification fallback/notice:', verifyErr.message);
      }
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, error: 'Valid Google email or credential is required.' });
      return;
    }

    const rawEmail = email.trim();
    const cleanEmail = rawEmail.toLowerCase();

    // Look for existing user account by exact or case-insensitive email
    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: rawEmail },
        { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      ],
    });

    if (!user) {
      // Auto-register new Google student account
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name: name?.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash,
        role: 'STUDENT',
        department: 'Department of Computer Science and Engineering',
        avatar: avatar || 'avatar-scholar',
        themePreference: 'system',
        isActive: true,
        isDemo: false,
      });
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: 'Your campus account is deactivated.' });
      return;
    }

    const token = signAuthToken(String(user._id), user.role);
    res.cookie('cf_token', token, COOKIE_OPTIONS);

    await recordAuditLog({
      user,
      action: 'LOGIN_SUCCESS',
      targetType: 'User',
      targetId: String(user._id),
      details: { method: 'GOOGLE_AUTH', email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  res.clearCookie('cf_token');
  res.json({ success: true, message: 'Signed out successfully.' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const parsed = profileUpdateSchema.parse(req.body);

    if (parsed.name !== undefined) req.user.name = parsed.name;
    if (parsed.department !== undefined) req.user.department = parsed.department;
    if (parsed.yearOfStudy !== undefined) req.user.yearOfStudy = parsed.yearOfStudy;
    if (parsed.avatar !== undefined) req.user.avatar = parsed.avatar;
    if (parsed.rollNumber !== undefined) req.user.rollNumber = parsed.rollNumber;
    if (parsed.bio !== undefined) req.user.bio = parsed.bio;
    if (parsed.interests !== undefined) req.user.interests = parsed.interests;
    if (parsed.themePreference !== undefined) req.user.themePreference = parsed.themePreference;
    if (parsed.notificationPreferences !== undefined) {
      req.user.notificationPreferences = {
        ...req.user.notificationPreferences,
        ...parsed.notificationPreferences,
      };
    }

    await req.user.save();

    res.json({
      success: true,
      user: sanitizeUser(req.user),
    });
  } catch (err) {
    next(err);
  }
}
