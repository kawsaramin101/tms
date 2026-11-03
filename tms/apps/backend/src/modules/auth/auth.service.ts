import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/jwt.js";
import { HttpError } from "../../middleware/error.middleware.js";
import { toUserDto } from "./auth.types.js";
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  LoginResponse,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserRole,
} from "@tms/contracts";

async function writeAudit(
  actorId: number,
  action: string,
  recordId: number | null,
  description: string,
  ipAddress?: string,
) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      tableName: "users",
      recordId,
      description,
      ipAddress: ipAddress ?? null,
    },
  });
}

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "This account has been deactivated");
  }
  const token = signToken({ userId: user.userId, role: user.role as UserRole });
  await writeAudit(user.userId, "LOGIN", user.userId, "User logged in", ipAddress);
  return { token, user: toUserDto(user) };
}

export async function logout(userId: number, ipAddress?: string) {
  await writeAudit(userId, "LOGOUT", userId, "User logged out", ipAddress);
  return { message: "Logged out successfully" };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return toUserDto(user);
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { userId: "asc" } });
  return users.map(toUserDto);
}

export async function createUser(
  actorId: number,
  data: CreateUserRequest,
  ipAddress?: string,
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new HttpError(409, "A user with this email already exists");
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone ?? null,
      role: data.role,
      status: "ACTIVE",
    },
  });
  await writeAudit(actorId, "CREATE_USER", user.userId, `Created user ${user.email}`, ipAddress);
  return toUserDto(user);
}

export async function updateUser(
  actorId: number,
  targetId: number,
  data: UpdateUserRequest,
  ipAddress?: string,
) {
  const target = await prisma.user.findUnique({ where: { userId: targetId } });
  if (!target) {
    throw new HttpError(404, "User not found");
  }
  if (data.email && data.email !== target.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      throw new HttpError(409, "A user with this email already exists");
    }
  }
  const user = await prisma.user.update({
    where: { userId: targetId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
    },
  });
  await writeAudit(actorId, "UPDATE_USER", user.userId, `Updated user ${user.email}`, ipAddress);
  return toUserDto(user);
}

export async function updateUserStatus(
  actorId: number,
  targetId: number,
  data: UpdateUserStatusRequest,
  ipAddress?: string,
) {
  const target = await prisma.user.findUnique({ where: { userId: targetId } });
  if (!target) {
    throw new HttpError(404, "User not found");
  }
  if (targetId === actorId && data.status === "INACTIVE") {
    throw new HttpError(400, "You cannot deactivate your own account");
  }
  const user = await prisma.user.update({
    where: { userId: targetId },
    data: { status: data.status },
  });
  await writeAudit(
    actorId,
    data.status === "ACTIVE" ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    user.userId,
    `Set status of ${user.email} to ${data.status}`,
    ipAddress,
  );
  return toUserDto(user);
}

export async function changePassword(
  userId: number,
  data: ChangePasswordRequest,
  ipAddress?: string,
) {
  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) {
    throw new HttpError(400, "Current password is incorrect");
  }
  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { userId }, data: { passwordHash } });
  await writeAudit(userId, "CHANGE_PASSWORD", userId, "User changed password", ipAddress);
  return { message: "Password updated successfully" };
}
