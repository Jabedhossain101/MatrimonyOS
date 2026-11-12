import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { adminService } from "@/server/services/admin.service";

export async function GET() {
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

    const stats = await adminService.getOverviewStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch overview stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

