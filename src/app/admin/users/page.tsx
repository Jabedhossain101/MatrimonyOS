import * as React from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { adminService } from "@/server/services/admin.service";
import { UsersClient, type UserItem } from "./users-client";
import { AppRole, AccountStatus } from "@/generated/prisma";

export const instant = false;

export const metadata = {
  title: "User Management | MatrimonyOS Admin",
  description: "Administrative directory, role assignments, and lifecycle management.",
};

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await connection();
  const user = await getCurrentUser();
  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);
  const search = params.search;
  const role = params.role as AppRole | undefined;
  const status = params.status as AccountStatus | undefined;

  const result = await adminService.listUsers({
    page,
    limit,
    search,
    role,
    status,
  });

  return (
    <UsersClient
      initialUsers={result.users as unknown as UserItem[]}
      total={result.total}
      currentPage={result.page}
      limit={result.limit}
      currentUserId={user!.id}
      currentUserRoles={user!.roles}
    />
  );
}

