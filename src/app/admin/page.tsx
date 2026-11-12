import * as React from "react";
import Link from "next/link";
import { connection } from "next/server";
import { adminService } from "@/server/services/admin.service";
import {
  Users,
  UserCheck,
  ShieldAlert,
  FileCheck2,
  CreditCard,
  UserX,
  TrendingUp,
  Activity,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "Admin Overview | MatrimonyOS",
  description: "Executive platform statistics and operations overview.",
};

export default async function AdminOverviewPage() {
  await connection();
  const stats = await adminService.getOverviewStats();

  const metricCards = [
    {
      title: "Total Registered Users",
      value: stats.totalUsers,
      subtext: `${stats.newRegistrationsLast7Days} new in past 7 days`,
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Active Accounts",
      value: stats.activeUsers,
      subtext: `${Math.round((stats.activeUsers / (stats.totalUsers || 1)) * 100)}% of total user base`,
      icon: UserCheck,
      href: "/admin/users?status=ACTIVE",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Suspended Accounts",
      value: stats.suspendedUsers,
      subtext: "Compliance or safety restricted",
      icon: UserX,
      href: "/admin/users?status=SUSPENDED",
      color: "text-rose-600 bg-rose-50 border-rose-200",
    },
    {
      title: "Completed Profiles",
      value: stats.completedProfiles,
      subtext: "Finished multi-step onboarding",
      icon: TrendingUp,
      href: "/admin/profiles",
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications,
      subtext: "Identity documents awaiting review",
      icon: FileCheck2,
      href: "/admin/verifications",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      alert: stats.pendingVerifications > 0,
    },
    {
      title: "Unresolved Reports",
      value: stats.pendingReports,
      subtext: "Member safety reports in queue",
      icon: ShieldAlert,
      href: "/admin/reports",
      color: "text-red-600 bg-red-50 border-red-200",
      alert: stats.pendingReports > 0,
    },
    {
      title: "Active Paid Subscriptions",
      value: stats.activeSubscriptions,
      subtext: "Premium & Elite recurring members",
      icon: CreditCard,
      href: "/admin/subscriptions",
      color: "text-[#B89A63] bg-amber-50/50 border-[#B89A63]/30",
    },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#14243A] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#B89A63] uppercase">
              Operations Center
            </span>
            <span className="text-xs text-[#777777]">• Database Live Sync</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-extrabold text-[#14243A] mt-1">
            Executive Overview
          </h1>
          <p className="text-xs text-[#777777] mt-0.5">
            Real-time aggregate health metrics, compliance queues, and activity monitor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/verifications"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E2D5] bg-white px-3.5 py-2 text-xs font-semibold text-[#14243A] hover:border-[#B89A63] transition shadow-xs"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-[#B89A63]" />
            <span>Verifications</span>
            {stats.pendingVerifications > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                {stats.pendingVerifications}
              </span>
            )}
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#14243A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0B1728] transition shadow-xs"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#B89A63]" />
            <span>Reports Queue</span>
            {stats.pendingReports > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {stats.pendingReports}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="group rounded-2xl border border-[#E8E2D5] bg-white p-5 shadow-xs transition hover:border-[#B89A63] hover:shadow-md flex flex-col justify-between relative overflow-hidden"
            >
              {card.alert && (
                <div className="absolute top-0 right-0 h-2 w-2 rounded-bl-lg bg-red-500" />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className="font-serif text-2xl lg:text-3xl font-extrabold text-[#14243A] mt-1">
                    {card.value.toLocaleString()}
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D5]/50 flex items-center justify-between text-[11px] text-[#777777]">
                <span>{card.subtext}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#777777] group-hover:text-[#B89A63] transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Section: Safety Reports & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unresolved Reports */}
        <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h2 className="font-serif text-base font-bold text-[#14243A]">
                Pending Safety Reports
              </h2>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-[#B89A63] hover:text-[#9A7E4B] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 flex-1 divide-y divide-[#E8E2D5]/50">
            {stats.recentReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#777777]">
                <Shield className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-semibold text-[#14243A]">No reports in queue</p>
                <p className="text-[11px]">All submitted safety alerts have been reviewed and resolved.</p>
              </div>
            ) : (
              stats.recentReports.map((report) => (
                <div key={report.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                        {report.reason}
                      </span>
                      <span className="text-[11px] text-[#777777]">
                        Against <strong>{report.reportedProfile.fullName || "Member"}</strong>
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-[11px] text-[#777777] mt-1 line-clamp-1">
                        &ldquo;{report.description}&rdquo;
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/admin/reports?id=${report.id}`}
                    className="shrink-0 rounded-lg border border-[#E8E2D5] px-2.5 py-1 text-[11px] font-semibold text-[#14243A] hover:border-[#B89A63] hover:text-[#B89A63]"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Platform Audit Logs */}
        <div className="rounded-3xl border border-[#E8E2D5] bg-white p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#B89A63]" />
              <h2 className="font-serif text-base font-bold text-[#14243A]">
                Recent Administrative Actions
              </h2>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-[#B89A63] hover:text-[#9A7E4B] flex items-center gap-1"
            >
              <span>Audit Trail</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 flex-1 divide-y divide-[#E8E2D5]/50">
            {stats.recentActivity.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#777777]">
                <Clock className="h-8 w-8 mx-auto text-[#777777] mb-2" />
                <p className="font-semibold text-[#14243A]">No audit entries recorded</p>
                <p className="text-[11px]">Administrative actions will appear here as they occur.</p>
              </div>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#14243A]">
                        {log.actor.name || log.actor.email}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700">
                        {log.action}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-[11px] text-[#777777] mt-0.5">
                        Reason: {log.reason}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#777777] shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
