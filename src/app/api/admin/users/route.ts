import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { adminService } from "@/server/services/admin.service";
import { AccountStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasAnyRole(user.roles, [
        AppRole.MODERATOR,
        AppRole.ADMIN,
        AppRole.SUPER_ADMIN,
      ])
    ) {
      return NextResponse.json(
        { error: "Forbidden: Administrative access required" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const roleParam = searchParams.get("role") as AppRole | null;
    const statusParam = searchParams.get("status") as AccountStatus | null;

    const data = await adminService.listUsers({
      page,
      limit,
      search,
      role: roleParam || undefined,
      status: statusParam || undefined,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

