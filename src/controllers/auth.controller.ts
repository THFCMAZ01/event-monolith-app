import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.utils';
import emailService from '../services/email.service';
import { ApiError } from '../utils/errors';

const prisma = new PrismaClient();

export class AuthController {
  async signup(data: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<{ token: string; user: any; message: string }> {
    const { email, password, role = UserRole.ATTENDEE } = data;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    emailService.sendWelcomeEmail(user.email, user.role);

    return {
      token,
      user,
      message: 'User registered successfully. Check Ethereal for welcome email!',
    };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: any; message: string }> {
    const { email, password } = data;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      message: 'Login successful',
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            organizedEvents: true,
            rsvps: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }
}

export default new AuthController();
