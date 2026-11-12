"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppRole, AccountStatus } from "@/generated/prisma";
import {
  updateUserStatusAction,
  updateUserRoleAction,
} from "@/server/actions/admin.actions";
import { Button } from "@/components/ui/button";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  image: string | null;
  createdAt: Date;
  roles: AppRole[];
  profile: {
    id: string;
    slug: string;
    fullName: string | null;
    onboardingStatus: string;
    completionPercentage: number;
    isVerified: boolean;
    moderationStatus: string;
  } | null;
  activeSubscription: {
    planName: string;
    planCode: string;
    status: string;
    currentPeriodEnd: Date;
  } | null;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  total: number;
  currentPage: number;
  limit: number;
  currentUserId: string;
  currentUserRoles: AppRole[];
}

export function UsersClient({
  initialUsers,
  total,
  currentPage,
  limit,
  currentUserId,
  currentUserRoles,
}: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = React.useState<UserItem[]>(initialUsers);
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [selectedRole, setSelectedRole] = React.useState(searchParams.get("role") || "");
  const [selectedStatus, setSelectedStatus] = React.useState(searchParams.get("status") || "");

  // Modal states
  const [statusModalUser, setStatusModalUser] = React.useState<UserItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<AccountStatus>(AccountStatus.SUSPENDED);
  const [statusReason, setStatusReason] = React.useState("");

  const [roleModalUser, setRoleModalUser] = React.useState<UserItem | null>(null);
  const [roleAction, setRoleAction] = React.useState<"ASSIGN" | "REVOKE">("ASSIGN");
  const [targetRole, setTargetRole] = React.useState<AppRole>(AppRole.PREMIUM_MEMBER);
  const [roleReason, setRoleReason] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const isSuperAdmin = currentUserRoles.includes(AppRole.SUPER_ADMIN);

  // Filter application
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedRole) params.set("role", selectedRole);
    if (selectedStatus) params.set("status", selectedStatus);
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  // Submit status update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser || !statusReason.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    const res = await updateUserStatusAction({
      userId: statusModalUser.id,
      status: newStatus,
      reason: statusReason,
    });

    setIsLoading(false);

    if (res.success) {
      setFeedback({ type: "success", message: res.message || "Status updated" });
      setUsers((prev) =>
        prev.map((u) => (u.id === statusModalUser.id ? { ...u, accountStatus: newStatus } : u))
      );
      setStatusModalUser(null);
      setStatusReason("");
    } else {
      setFeedback({ type: "error", message: res.error || "Action failed" });
    }
  };

  // Submit role update
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser || !roleReason.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    const res = await updateUserRoleAction({
      userId: roleModalUser.id,
      role: targetRole,
      action: roleAction,
      reason: roleReason,
    });

    setIsLoading(false);

    if (res.success) {
      setFeedback({ type: "success", message: res.message || "Role updated" });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== roleModalUser.id) return u;
          const updatedRoles =
            roleAction === "ASSIGN"
              ? Array.from(new Set([...u.roles, targetRole]))
              : u.roles.filter((r) => r !== targetRole);
          return { ...u, roles: updatedRoles };
        })
      );
      setRoleModalUser(null);
      setRoleReason("");
    } else {
      setFeedback({ type: "error", message: res.error || "Action failed" });
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#B89A63]" />
            <span className="rounded-md bg-[#14243A] px-2 py-0.5 text-[10px] font-bold text-[#B89A63] uppercase">
              Directory
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#14243A] mt-1">User Management</h1>
          <p className="text-xs text-[#777777]">
            Monitor account lifecycles, assign roles, enforce suspensions, and manage member credentials.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#14243A]">{total} total members</span>
          <p className="text-[10px] text-[#777777]">Page {currentPage} of {totalPages}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-[#E8E2D5] bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 pl-9 pr-3 text-xs text-[#14243A] placeholder-[#777777] focus:border-[#B89A63] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
            >
              <option value="">All Roles</option>
              {Object.values(AppRole).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] py-2 px-3 text-xs text-[#14243A] focus:border-[#B89A63] focus:outline-none"
            >
              <option value="">All Statuses</option>
              {Object.values(AccountStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              onClick={applyFilters}
              size="sm"
              className="rounded-xl bg-[#14243A] text-white hover:bg-[#0B1728] px-4 text-xs font-semibold"
            >
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-[#E8E2D5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E8E2D5] bg-[#FAF8F3] text-[11px] font-bold text-[#777777] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Roles</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Matrimonial Profile</th>
                <th className="py-3.5 px-4">Subscription</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D5]/50 text-[#14243A]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#777777]">
                    No accounts found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="hover:bg-[#FAF8F3]/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {isSelf && (
                            <span className="rounded bg-blue-100 px-1 py-0.2 text-[9px] font-bold text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#777777] truncate">{user.email}</div>
                        <div className="text-[9px] text-[#777777]/80 font-mono">ID: {user.id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <span
                              key={r}
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${
                                r === AppRole.SUPER_ADMIN
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : r === AppRole.ADMIN
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : r === AppRole.MODERATOR
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : r === AppRole.PREMIUM_MEMBER
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            user.accountStatus === AccountStatus.ACTIVE
                              ? "bg-emerald-100 text-emerald-800"
                              : user.accountStatus === AccountStatus.SUSPENDED
                              ? "bg-rose-100 text-rose-800"
                              : user.accountStatus === AccountStatus.DEACTIVATED
                              ? "bg-gray-100 text-gray-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{user.accountStatus}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {user.profile ? (
                          <div>
                            <div className="font-semibold text-xs flex items-center gap-1">
                              <span>{user.profile.fullName || user.profile.slug}</span>
                              {user.profile.isVerified && (
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              )}
                            </div>
                            <div className="text-[10px] text-[#777777]">
                              {user.profile.completionPercentage}% complete • {user.profile.moderationStatus}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#777777] italic">No Profile</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {user.activeSubscription ? (
                          <div>
                            <span className="rounded bg-[#B89A63]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#B89A63]">
                              {user.activeSubscription.planName}
                            </span>
                            <div className="text-[9px] text-[#777777] mt-0.5">
                              Renews {new Date(user.activeSubscription.currentPeriodEnd).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#777777]">Free Tier</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#777777] text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setStatusModalUser(user);
                            setNewStatus(
                              user.accountStatus === AccountStatus.SUSPENDED
                                ? AccountStatus.ACTIVE
                                : AccountStatus.SUSPENDED
                            );
                            setStatusReason("");
                          }}
                          disabled={isSelf && user.accountStatus === AccountStatus.ACTIVE}
                          className="rounded-lg border border-[#E8E2D5] px-2.5 py-1 text-[11px] font-semibold text-[#14243A] hover:border-[#B89A63] hover:text-[#B89A63] disabled:opacity-40"
                        >
                          {user.accountStatus === AccountStatus.SUSPENDED ? "Reactivate" : "Status"}
                        </button>

                        <button
                          onClick={() => {
                            setRoleModalUser(user);
                            setRoleAction("ASSIGN");
                            setTargetRole(AppRole.PREMIUM_MEMBER);
                            setRoleReason("");
                          }}
                          disabled={isSelf}
                          className="rounded-lg border border-[#E8E2D5] px-2.5 py-1 text-[11px] font-semibold text-[#14243A] hover:border-[#B89A63] hover:text-[#B89A63] disabled:opacity-40"
                        >
                          Role
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="border-t border-[#E8E2D5] p-4 flex items-center justify-between text-xs text-[#777777]">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="rounded-lg border border-[#E8E2D5] p-1.5 hover:bg-[#FAF8F3] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="rounded-lg border border-[#E8E2D5] p-1.5 hover:bg-[#FAF8F3] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================= STATUS MODAL ======================= */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleStatusSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Update Account Status
                </h3>
                <p className="text-xs text-[#777777]">
                  Target: {statusModalUser.name} ({statusModalUser.email})
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              >
                <option value={AccountStatus.ACTIVE}>ACTIVE</option>
                <option value={AccountStatus.SUSPENDED}>SUSPENDED</option>
                <option value={AccountStatus.DEACTIVATED}>DEACTIVATED</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Mandatory Audit Reason (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="State the compliance or administrative rationale..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusModalUser(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || statusReason.trim().length < 5}
                className="rounded-xl bg-[#14243A] text-white text-xs font-semibold"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Confirm Status</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ======================= ROLE MODAL ======================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRoleSubmit}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E8E2D5] space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#14243A]">
                  Manage User Roles
                </h3>
                <p className="text-xs text-[#777777]">
                  Target: {roleModalUser.name} ({roleModalUser.email})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Action</label>
                <select
                  value={roleAction}
                  onChange={(e) => setRoleAction(e.target.value as "ASSIGN" | "REVOKE")}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                >
                  <option value="ASSIGN">Grant Role</option>
                  <option value="REVOKE">Revoke Role</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14243A]">Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as AppRole)}
                  className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
                >
                  <option value={AppRole.MEMBER}>MEMBER</option>
                  <option value={AppRole.PREMIUM_MEMBER}>PREMIUM_MEMBER</option>
                  <option value={AppRole.FAMILY_MANAGER}>FAMILY_MANAGER</option>
                  {isSuperAdmin && <option value={AppRole.MODERATOR}>MODERATOR</option>}
                  {isSuperAdmin && <option value={AppRole.ADMIN}>ADMIN</option>}
                  {isSuperAdmin && <option value={AppRole.SUPER_ADMIN}>SUPER_ADMIN</option>}
                </select>
              </div>
            </div>

            {!isSuperAdmin && (
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Note: Administrative roles (ADMIN, SUPER_ADMIN, MODERATOR) can only be granted by SUPER_ADMIN.
              </p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#14243A]">
                Audit Reason (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder="State the justification for this role modification..."
                className="w-full rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRoleModalUser(null)}
                className="rounded-xl border-[#E8E2D5] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || roleReason.trim().length < 5}
                className="rounded-xl bg-[#14243A] text-white text-xs font-semibold"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Confirm Role Change</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

