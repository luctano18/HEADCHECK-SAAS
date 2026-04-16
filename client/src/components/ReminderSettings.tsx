/**
 * ReminderSettings.tsx
 * Allows students and facilitators to configure daily check-in reminders.
 * Embedded in the Profile page under the Notifications section.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function ReminderSettings() {
  const { data: settings, isLoading } = trpc.profile.getReminderSettings.useQuery();
  const utils = trpc.useUtils();

  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dirty, setDirty] = useState(false);

  // Sync from server
  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.reminderEnabled);
    setTime(settings.reminderTime ?? "08:00");
    setSelectedDays(
      (settings.reminderDays ?? "1,2,3,4,5")
        .split(",")
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d))
    );
  }, [settings]);

  const updateMutation = trpc.profile.updateReminderSettings.useMutation({
    onSuccess: () => {
      toast.success("Reminder settings saved!");
      setDirty(false);
      utils.profile.getReminderSettings.invalidate();
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
    setDirty(true);
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      toast.error("Please select at least one day.");
      return;
    }
    updateMutation.mutate({
      reminderEnabled: enabled,
      reminderTime: time,
      reminderDays: selectedDays.join(","),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading reminder settings…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-500" />
          <div>
            <Label htmlFor="reminder-toggle" className="text-sm font-semibold">
              Daily Check-In Reminders
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get an email and push notification at your chosen time
            </p>
          </div>
        </div>
        <Switch
          id="reminder-toggle"
          checked={enabled}
          onCheckedChange={(v) => {
            setEnabled(v);
            setDirty(true);
          }}
        />
      </div>

      {/* Time picker */}
      {enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-violet-100">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <Label htmlFor="reminder-time" className="text-sm font-medium">
                Reminder Time
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Times are in UTC. Adjust based on your timezone.
              </p>
              <input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setDirty(true);
                }}
                className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Day selector */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Reminder Days</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedDays.includes(value)
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-violet-100 hover:text-violet-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Select at least one day.</p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-violet-50 border border-violet-100 px-4 py-3">
            <p className="text-xs text-violet-700 font-medium">
              You'll receive reminders at{" "}
              <strong>{time} UTC</strong> on{" "}
              <strong>
                {selectedDays.length === 7
                  ? "every day"
                  : selectedDays.map((d) => DAYS[d].label).join(", ")}
              </strong>
              .
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      {dirty && (
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Reminder Settings
        </Button>
      )}
    </div>
  );
}
