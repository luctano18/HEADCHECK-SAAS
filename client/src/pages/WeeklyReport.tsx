/**
 * WeeklyReport.tsx
 * Admin-only page for previewing and sending the weekly emotional wellness report.
 * Route: /admin/weekly-report
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Send,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

export default function WeeklyReport() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sendSuccess, setSendSuccess] = useState<{ sent: number; total: number } | null>(null);

  // Redirect non-admins
  if (user && !["admin", "superadmin"].includes(user.role)) {
    navigate("/dashboard");
    return null;
  }

  const {
    data: preview,
    isLoading: previewLoading,
    refetch,
    isRefetching,
  } = trpc.admin.getWeeklyReportPreview.useQuery(undefined, {
    enabled: !!user && ["admin", "superadmin"].includes(user.role ?? ""),
    staleTime: 60_000,
  });

  const sendMutation = trpc.admin.sendWeeklyReport.useMutation({
    onSuccess: (result) => {
      setSendSuccess({ sent: result.sent, total: result.total });
      toast.success(`Report sent to ${result.sent} admin${result.sent !== 1 ? "s" : ""}!`);
    },
    onError: (err) => {
      toast.error(`Failed to send report: ${err.message}`);
    },
  });

  const data = preview?.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/facilitator")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-violet-600" />
              Weekly Wellness Report
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Preview and send the weekly emotional wellness summary to all institution admins
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || previewLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Report
            </Button>
          </div>
        </div>

        {/* Success banner */}
        {sendSuccess && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Report sent successfully!</p>
              <p className="text-sm text-green-700">
                Delivered to {sendSuccess.sent} of {sendSuccess.total} admin
                {sendSuccess.total !== 1 ? "s" : ""} with email addresses.
              </p>
            </div>
          </div>
        )}

        {previewLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="ml-3 text-muted-foreground">Generating report preview…</span>
          </div>
        ) : !data ? (
          <div className="text-center py-24 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
            <p className="font-medium">Could not load report data.</p>
            <p className="text-sm mt-1">Make sure your institution has check-in data.</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Check-Ins
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{data.totalCheckIns}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Students
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{data.uniqueStudents}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">participated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Wellness Score
                    </span>
                  </div>
                  <p
                    className={`text-3xl font-bold ${
                      data.avgEmotionScore >= 3.5
                        ? "text-green-600"
                        : data.avgEmotionScore >= 2.5
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {data.avgEmotionScore}
                    <span className="text-base font-normal text-muted-foreground">/5</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">avg. baseline</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Alerts
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">
                    {data.crisisAlerts + data.violenceFlags}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.resolvedAlerts} resolved
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Emotions */}
            {data.topEmotions.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top Reported Emotions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.topEmotions.map(({ emotion, count }, i) => (
                      <Badge
                        key={emotion}
                        variant="secondary"
                        className={`text-sm px-3 py-1 ${
                          ["bg-violet-100 text-violet-800", "bg-blue-100 text-blue-800", "bg-green-100 text-green-800", "bg-amber-100 text-amber-800", "bg-pink-100 text-pink-800"][i % 5]
                        }`}
                      >
                        {emotion}
                        <span className="ml-1.5 opacity-60">({count})</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Preview iframe */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-violet-500" />
                  Report Preview
                  <Badge variant="outline" className="ml-auto text-xs">
                    PDF will be generated on send
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-xl">
                <iframe
                  srcDoc={preview?.html}
                  className="w-full border-0 rounded-b-xl"
                  style={{ height: "600px" }}
                  title="Weekly Report Preview"
                  sandbox="allow-same-origin"
                />
              </CardContent>
            </Card>

            {/* Send info */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              Clicking "Send Report" will generate a PDF and email it to all admins of your
              institution who have an email address on file.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
