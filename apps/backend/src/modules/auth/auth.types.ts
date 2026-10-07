import type { UserDto } from "@tms/contracts";
import type { User } from "@prisma/client";

export function toUserDto(user: User): UserDto {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as UserDto["role"],
    status: user.status as UserDto["status"],
    createdAt: user.createdAt.toISOString(),
  };
}
