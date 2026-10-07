"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import {
  createUser,
  listUsers,
  updateUserStatus,
} from "@/modules/auth/api";
import type { UserDto, UserRole } from "@/modules/auth/types";
import { USER_ROLES } from "@/modules/auth/types";
import { formatRole } from "@/modules/auth/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("MEMBER");

  const refresh = useCallback(() => {
    const token = getToken();
    if (!token) return;
    listUsers(token)
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) return;
    try {
      await createUser(token, { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("MEMBER");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  async function handleToggleStatus(user: UserDto) {
    const token = getToken();
    if (!token) return;
    try {
      await updateUserStatus(token, user.userId, {
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        User Management
      </h1>

      <form onSubmit={handleCreate} className="flex max-w-xl flex-col gap-4">
        <h2 className="text-lg font-medium text-foreground">Create user</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {formatRole(r)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" className="w-fit">Create user</Button>
      </form>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.userId}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{formatRole(user.role)}</TableCell>
              <TableCell>{user.status}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleToggleStatus(user)}>
                  {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
