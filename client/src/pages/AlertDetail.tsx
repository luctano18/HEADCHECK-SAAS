import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Phone,
  Shield,
  TrendingUp,
  User,
  UserPlus,
  Zap,
} from "lucide-react";

type AlertType = "crisis" | "violence";

const ACTION_LABELS: Record<string, string> = {
  acknowledged: "Acknowledged",
  contacted_student: "Contacted Student",
  escalated: "Escalated",
  referred_to_counselor: "Referred to Counselor",
  resolved: "Resolved",
  note_added: "Note Added",
  protocol_initiated: "Protocol Initiated",
  assigned: "Assigned to Team Member",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  acknowledged: <CheckCircle className="w-4 h-4 text-blue-500" />,
  contacted_student: <Phone className="w-4 h-4 text-green-500" />,
  escalated: <TrendingUp className="w-4 h-4 text-orange-500" />,
  referred_to_counselor: <User className="w-4 h-4 text-purple-500" />,
  resolved: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  note_added: <FileText className="w-4 h-4 text-gray-500" />,
  protocol_initiated: <Shield className="w-4 h-4 text-red-500" />,
  assigned: <UserPlus className="w-4 h-4 text-violet-500" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const FLAG_TYPE_LABELS: Record<string, string> = {
  self_harm: "Self-Harm",
  violence_toward_others: "Violence Toward Others",
  crisis: "Crisis",
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnonymizedId({ userId }: { userId: number }) {
  // Show anonymized ID: hash the userId to a short code
  const code = `STU-${(userId * 7919 + 1234) % 9000 + 1000}`;
  return (
    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">
      {code}
    </span>
  );
}

// ─── Assign Alert Card ────────────────────────────────────────────────────────
function AssignAlertCard({ alertType, alertId, currentAssigneeId, onAssigned }: {
  alertType: "crisis" | "violence";
  alertId: number;
  currentAssigneeId?: number | null;
  onAssigned: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const { data: teamMembers = [] } = trpc.crisis.getTeamMembers.useQuery();

  const assignMutation = trpc.crisis.assignAlert.useMutation({
    onSuccess: (result) => {
      setAssigning(false);
      setSelectedUserId("");
      toast.success(`Alert assigned to ${result.assignee.name ?? result.assignee.email}`);
      onAssigned();
    },
    onError: () => setAssigning(false),
  });

  const currentAssignee = currentAssigneeId
    ? teamMembers.find((m) => m.id === currentAssigneeId)
    : null;

  return (
    <Card className="border-violet-100">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-violet-500" />
          Assign for Follow-Up
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentAssignee && (
          <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg border border-violet-100 text-sm">
            <User className="w-4 h-4 text-violet-500" />
            <span className="text-violet-700">Currently assigned to:</span>
            <span className="font-medium text-violet-900">{currentAssignee.name ?? currentAssignee.email}</span>
            <Badge variant="outline" className="ml-auto text-xs text-violet-600 border-violet-300">
              {currentAssignee.role}
            </Badge>
          </div>
        )}
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a team member…" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={String(member.id)}>
                  <span className="flex items-center gap-2">
                    {member.name ?? member.email}
                    <span className="text-xs text-gray-400">({member.role})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (!selectedUserId) return;
              setAssigning(true);
              assignMutation.mutate({ alertType, alertId, assignedToId: parseInt(selectedUserId, 10) });
            }}
            disabled={!selectedUserId || assigning}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {assigning ? "Assigning…" : "Assign"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Crisis Alert Detail ───────────────────────────────────────────────────────
function CrisisAlertDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = trpc.crisis.getCrisisDetail.useQuery({ id });
  const [actionType, setActionType] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addAction = trpc.crisis.addAction.useMutation({
    onSuccess: () => {
      setActionType("");
      setNote("");
      setSubmitting(false);
      refetch();
    },
    onError: () => setSubmitting(false),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Alert not found.
        <Button variant="link" onClick={() => navigate("/facilitator")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { event, actions } = data;

  const handleSubmit = () => {
    if (!actionType) return;
    setSubmitting(true);
    addAction.mutate({
      alertType: "crisis",
      alertId: id,
      actionType: actionType as Parameters<typeof addAction.mutate>[0]["actionType"],
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/facilitator")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Button>
      </div>

      {/* Alert Summary Card */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-800">Crisis Alert #{id}</CardTitle>
            </div>
            <Badge className={`border ${SEVERITY_COLORS[event.severity]}`}>
              {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Student (Anonymized)</span>
              <AnonymizedId userId={event.userId} />
            </div>
            <div>
              <span className="text-gray-500 block">Detected</span>
              <span className="font-medium">{formatDate(event.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Status</span>
              {event.acknowledged ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Resolved
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Open
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-500 block">Facilitator Notified</span>
              <span className={event.facilitatorNotified ? "text-green-600 font-medium" : "text-gray-400"}>
                {event.facilitatorNotified ? "Yes" : "Not yet"}
              </span>
            </div>
          </div>
          {event.triggerText && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Trigger excerpt (anonymized)</p>
              <p className="text-sm text-gray-700 italic">"{event.triggerText.slice(0, 120)}{event.triggerText.length > 120 ? "…" : ""}"</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Student identity is fully protected. Contact through official institutional channels only.
          </p>
        </CardContent>
      </Card>

      {/* Action History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Action History ({actions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No actions recorded yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-3 space-y-4">
              {actions.map((action) => (
                <li key={action.id} className="ml-4">
                  <span className="absolute -left-2 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-2 ring-gray-200">
                    {ACTION_ICONS[action.actionType] ?? <Zap className="w-3 h-3 text-gray-400" />}
                  </span>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-800">
                        {ACTION_LABELS[action.actionType] ?? action.actionType}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(action.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      By: <span className="font-medium text-gray-700">{action.adminName ?? "Admin"}</span>
                    </p>
                    {action.note && (
                      <p className="mt-1.5 text-sm text-gray-600 bg-white rounded p-2 border border-gray-100">
                        {action.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Assign for Follow-Up */}
      <AssignAlertCard
        alertType="crisis"
        alertId={id}
        currentAssigneeId={event.assignedToId}
        onAssigned={refetch}
      />

      {/* Add Action Form */}
      {!event.acknowledged && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Record an Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select action type…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_LABELS).filter(([v]) => v !== "assigned").map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Add a note (optional) — e.g., 'Contacted student via email on April 15'"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <Button
              onClick={handleSubmit}
              disabled={!actionType || submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? "Saving…" : "Save Action"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Violence Alert Detail ─────────────────────────────────────────────────────
function ViolenceAlertDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = trpc.crisis.getViolenceDetail.useQuery({ id });
  const [actionType, setActionType] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addAction = trpc.crisis.addAction.useMutation({
    onSuccess: () => {
      setActionType("");
      setNote("");
      setSubmitting(false);
      refetch();
    },
    onError: () => setSubmitting(false),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Alert not found.
        <Button variant="link" onClick={() => navigate("/facilitator")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const { flag, actions } = data;

  const handleSubmit = () => {
    if (!actionType) return;
    setSubmitting(true);
    addAction.mutate({
      alertType: "violence",
      alertId: id,
      actionType: actionType as Parameters<typeof addAction.mutate>[0]["actionType"],
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/facilitator")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Button>
      </div>

      {/* Alert Summary Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-800">Violence Alert #{id}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge className={`border ${SEVERITY_COLORS[flag.severity]}`}>
                {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-orange-700 border-orange-300 bg-white">
                {FLAG_TYPE_LABELS[flag.flagType] ?? flag.flagType}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Student (Anonymized)</span>
              <AnonymizedId userId={flag.userId} />
            </div>
            <div>
              <span className="text-gray-500 block">Detected</span>
              <span className="font-medium">{formatDate(flag.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Status</span>
              {flag.acknowledged ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Resolved
                </span>
              ) : (
                <span className="text-orange-600 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Open
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-500 block">Facilitator Notified</span>
              <span className={flag.facilitatorNotified ? "text-green-600 font-medium" : "text-gray-400"}>
                {flag.facilitatorNotified ? "Yes" : "Not yet"}
              </span>
            </div>
          </div>
          {flag.triggerText && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-orange-100">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Trigger excerpt (anonymized)</p>
              <p className="text-sm text-gray-700 italic">"{flag.triggerText.slice(0, 120)}{flag.triggerText.length > 120 ? "…" : ""}"</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Student identity is fully protected. Contact through official institutional channels only.
          </p>
        </CardContent>
      </Card>

      {/* Action History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Action History ({actions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No actions recorded yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-3 space-y-4">
              {actions.map((action) => (
                <li key={action.id} className="ml-4">
                  <span className="absolute -left-2 flex items-center justify-center w-4 h-4 bg-white rounded-full ring-2 ring-gray-200">
                    {ACTION_ICONS[action.actionType] ?? <Zap className="w-3 h-3 text-gray-400" />}
                  </span>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-800">
                        {ACTION_LABELS[action.actionType] ?? action.actionType}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(action.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      By: <span className="font-medium text-gray-700">{action.adminName ?? "Admin"}</span>
                    </p>
                    {action.note && (
                      <p className="mt-1.5 text-sm text-gray-600 bg-white rounded p-2 border border-gray-100">
                        {action.note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Assign for Follow-Up */}
      <AssignAlertCard
        alertType="violence"
        alertId={id}
        currentAssigneeId={flag.assignedToId}
        onAssigned={refetch}
      />

      {/* Add Action Form */}
      {!flag.acknowledged && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Record an Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select action type…" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_LABELS).filter(([v]) => v !== "assigned").map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Add a note (optional) — e.g., 'Referred to campus counselor on April 15'"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <Button
              onClick={handleSubmit}
              disabled={!actionType || submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? "Saving…" : "Save Action"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Router Component ──────────────────────────────────────────────────────────
export default function AlertDetailPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Match /alert/crisis/:id or /alert/violence/:id
  const [matchCrisis, paramsCrisis] = useRoute("/alert/crisis/:id");
  const [matchViolence, paramsViolence] = useRoute("/alert/violence/:id");

  const isAdmin = user?.role === "admin" || user?.role === "superadmin" || user?.role === "facilitator";

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Please sign in to view alert details.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <Shield className="w-10 h-10 text-gray-300" />
        <p>You do not have permission to view alert details.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {matchCrisis && paramsCrisis?.id && (
          <CrisisAlertDetail id={parseInt(paramsCrisis.id, 10)} />
        )}
        {matchViolence && paramsViolence?.id && (
          <ViolenceAlertDetail id={parseInt(paramsViolence.id, 10)} />
        )}
        {!matchCrisis && !matchViolence && (
          <div className="text-center py-16 text-gray-500">
            Invalid alert URL.
            <Button variant="link" onClick={() => navigate("/facilitator")}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
