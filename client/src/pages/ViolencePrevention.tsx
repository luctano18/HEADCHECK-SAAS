import { useState } from "react";
import { Link } from "wouter";
import {
  Shield, ArrowLeft, Plus, Trash2, Phone, User, AlertTriangle,
  Heart, Lightbulb, MapPin, Save, CheckCircle2, ChevronDown, ChevronUp, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Default suggestions ──────────────────────────────────────────────────────
const DEFAULT_WARNING_SIGNALS = [
  "Thoughts of hurting someone",
  "Feeling of uncontrollable rage",
  "Sudden withdrawal",
  "Difficulty sleeping",
  "Repetitive thoughts of revenge",
];
const DEFAULT_COPING = [
  "Deep breathing (4-4-6)",
  "Walk outside for 10 minutes",
  "Call a trusted friend",
  "Write in my journal",
  "Listen to calming music",
  "Guided meditation",
];
const DEFAULT_SAFE_PLACES = [
  "My room with the door closed",
  "The park near my home",
  "The library",
  "My therapist's office",
];

// ─── Info sections ────────────────────────────────────────────────────────────
const INFO_SECTIONS = [
  {
    icon: "🧠",
    title: "Understanding Violent Thoughts",
    content:
      "Having violent thoughts does not make you a bad person. These thoughts are often a sign of deep pain, intense frustration, or an unmet need. What matters is what you do with those thoughts.",
  },
  {
    icon: "🔄",
    title: "The Escalation Cycle",
    content:
      "Intense emotions often follow a cycle: trigger → rising tension → peak → de-escalation. Recognizing early warning signals allows you to intervene before reaching the peak.",
  },
  {
    icon: "💬",
    title: "Asking for Help Is Not Weakness",
    content:
      "Talking to a trusted person — a professional or a loved one — is one of the most courageous acts you can take. HeadCheck is here to help you take that first step.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ViolencePrevention() {
  const { user } = useAuth();

  // Safety plan state
  const [warningSignals, setWarningSignals] = useState<string[]>([]);
  const [copingStrategies, setCopingStrategies] = useState<string[]>([]);
  const [safeEnvironments, setSafeEnvironments] = useState<string[]>([]);
  const [professionalSupport, setProfessionalSupport] = useState("");
  const [trustedContacts, setTrustedContacts] = useState<
    Array<{ name: string; phone: string; relation: string }>
  >([]);

  const [newSignal, setNewSignal] = useState("");
  const [newCoping, setNewCoping] = useState("");
  const [newPlace, setNewPlace] = useState("");
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });

  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  // Load existing safety plan
  const { isLoading, data: safetyPlanData } = trpc.crisis.getSafetyPlan.useQuery(undefined, {
    enabled: !!user,
  });

  // Populate form when data loads
  const [initialized, setInitialized] = useState(false);
  if (safetyPlanData && !initialized) {
    setInitialized(true);
    setWarningSignals(safetyPlanData.warningSignals ?? []);
    setCopingStrategies(safetyPlanData.copingStrategies ?? []);
    setSafeEnvironments(safetyPlanData.safeEnvironments ?? []);
    setProfessionalSupport(safetyPlanData.professionalSupport ?? "");
    setTrustedContacts(
      (safetyPlanData.trustedContacts as Array<{ name: string; phone: string; relation: string }>) ?? []
    );
  }

  const saveMutation = trpc.crisis.saveSafetyPlan.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Safety plan saved!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => toast.error("Failed to save. Please try again."),
  });

  const handleSave = () => {
    if (!user) {
      toast.error("Please sign in to save your safety plan.");
      return;
    }
    saveMutation.mutate({ warningSignals, copingStrategies, safeEnvironments, professionalSupport, trustedContacts });
  };

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setValue("");
    }
  };

  const removeItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const addContact = () => {
    const { name, phone, relation } = newContact;
    if (name.trim() && phone.trim()) {
      setTrustedContacts([...trustedContacts, { name: name.trim(), phone: phone.trim(), relation: relation.trim() }]);
      setNewContact({ name: "", phone: "", relation: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950 text-white">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/40 px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-slate-300">Violence Prevention</span>
        </div>
        <Button
          onClick={handleSave}
          disabled={!user || saveMutation.isPending}
          size="sm"
          className={`rounded-xl text-xs px-3 transition-all ${
            saved
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-purple-700 hover:bg-purple-600 text-white border-0"
          }`}
        >
          {saved ? (
            <><CheckCircle2 className="w-3 h-3 mr-1" /> Saved</>
          ) : (
            <><Save className="w-3 h-3 mr-1" /> Save</>
          )}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* ─── Hero ──────────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3 pt-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">My Safety Plan</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            A personal safety plan helps you identify your warning signals and take action
            before the situation escalates.
          </p>
          {!user && (
            <div className="inline-flex items-center gap-2 bg-amber-900/40 border border-amber-700/40 rounded-xl px-4 py-2 text-amber-300 text-xs">
              <Info className="w-3 h-3" />
              Sign in to save your plan
            </div>
          )}
        </div>

        {/* ─── Educational Info ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {INFO_SECTIONS.map((section, i) => (
            <Card key={i} className="bg-slate-900/60 border-slate-700/40 cursor-pointer" onClick={() => setExpandedInfo(expandedInfo === i ? null : i)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-200">{section.title}</h3>
                  </div>
                  {expandedInfo === i ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                </div>
                {expandedInfo === i && (
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed pl-9">{section.content}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Warning Signals ───────────────────────────────────────────────── */}
        <Card className="bg-slate-900/60 border-amber-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-300">
              <AlertTriangle className="w-5 h-5" />
              My Warning Signals
            </CardTitle>
            <p className="text-xs text-slate-500">Thoughts, emotions, or behaviors that signal rising tension</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Suggestions */}
            {warningSignals.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {DEFAULT_WARNING_SIGNALS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setWarningSignals([...warningSignals, s])}
                    className="text-xs bg-amber-900/30 hover:bg-amber-800/40 border border-amber-700/30 text-amber-300 rounded-full px-3 py-1 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
            {/* Current items */}
            <div className="flex flex-wrap gap-2">
              {warningSignals.map((signal, i) => (
                <Badge key={i} className="bg-amber-900/40 text-amber-200 border-amber-700/40 pr-1 flex items-center gap-1">
                  {signal}
                  <button onClick={() => removeItem(warningSignals, setWarningSignals, i)} className="ml-1 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {/* Add new */}
            <div className="flex gap-2">
              <Input
                value={newSignal}
                onChange={(e) => setNewSignal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem(warningSignals, setWarningSignals, newSignal, setNewSignal)}
                placeholder="Add a warning signal..."
                className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl"
              />
              <Button
                size="sm"
                onClick={() => addItem(warningSignals, setWarningSignals, newSignal, setNewSignal)}
                className="bg-amber-700/60 hover:bg-amber-600/60 text-white border-0 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Coping Strategies ─────────────────────────────────────────────── */}
        <Card className="bg-slate-900/60 border-emerald-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-emerald-300">
              <Lightbulb className="w-5 h-5" />
              My Coping Strategies
            </CardTitle>
            <p className="text-xs text-slate-500">What I can do on my own to reduce tension</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {copingStrategies.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {DEFAULT_COPING.map((s) => (
                  <button
                    key={s}
                    onClick={() => setCopingStrategies([...copingStrategies, s])}
                    className="text-xs bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-700/30 text-emerald-300 rounded-full px-3 py-1 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {copingStrategies.map((strategy, i) => (
                <Badge key={i} className="bg-emerald-900/40 text-emerald-200 border-emerald-700/40 pr-1 flex items-center gap-1">
                  {strategy}
                  <button onClick={() => removeItem(copingStrategies, setCopingStrategies, i)} className="ml-1 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCoping}
                onChange={(e) => setNewCoping(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem(copingStrategies, setCopingStrategies, newCoping, setNewCoping)}
                placeholder="Add a coping strategy..."
                className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl"
              />
              <Button
                size="sm"
                onClick={() => addItem(copingStrategies, setCopingStrategies, newCoping, setNewCoping)}
                className="bg-emerald-700/60 hover:bg-emerald-600/60 text-white border-0 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Safe Environments ─────────────────────────────────────────────── */}
        <Card className="bg-slate-900/60 border-blue-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-blue-300">
              <MapPin className="w-5 h-5" />
              My Safe Environments
            </CardTitle>
            <p className="text-xs text-slate-500">Places where I feel safe and calm</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeEnvironments.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {DEFAULT_SAFE_PLACES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSafeEnvironments([...safeEnvironments, s])}
                    className="text-xs bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/30 text-blue-300 rounded-full px-3 py-1 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {safeEnvironments.map((place, i) => (
                <Badge key={i} className="bg-blue-900/40 text-blue-200 border-blue-700/40 pr-1 flex items-center gap-1">
                  {place}
                  <button onClick={() => removeItem(safeEnvironments, setSafeEnvironments, i)} className="ml-1 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newPlace}
                onChange={(e) => setNewPlace(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem(safeEnvironments, setSafeEnvironments, newPlace, setNewPlace)}
                placeholder="Ajouter un lieu sécurisant..."
                className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl"
              />
              <Button
                size="sm"
                onClick={() => addItem(safeEnvironments, setSafeEnvironments, newPlace, setNewPlace)}
                className="bg-blue-700/60 hover:bg-blue-600/60 text-white border-0 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Trusted Contacts ──────────────────────────────────────────────── */}
        <Card className="bg-slate-900/60 border-purple-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-purple-300">
              <User className="w-5 h-5" />
              My Trusted Contacts
            </CardTitle>
            <p className="text-xs text-slate-500">People I can call when I need support</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing contacts */}
            {trustedContacts.map((contact, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-purple-900/30 rounded-xl border border-purple-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-700/50 flex items-center justify-center text-sm font-bold text-purple-200">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{contact.name}</p>
                    <p className="text-xs text-purple-400">{contact.relation} · {contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                    <Button size="sm" className="h-8 w-8 p-0 bg-purple-700/40 hover:bg-purple-600/40 text-white border-0 rounded-lg">
                      <Phone className="w-3 h-3" />
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => setTrustedContacts(trustedContacts.filter((_, idx) => idx !== i))}
                    className="h-8 w-8 p-0 bg-red-900/30 hover:bg-red-800/40 text-red-400 border-0 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add new contact */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Nom"
                  className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl"
                />
                <Input
                  value={newContact.relation}
                  onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                  placeholder="Relationship (friend, parent…)"
                  className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Phone number"
                  type="tel"
                  className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl"
                />
                <Button
                  size="sm"
                  onClick={addContact}
                  disabled={!newContact.name.trim() || !newContact.phone.trim()}
                  className="bg-purple-700/60 hover:bg-purple-600/60 text-white border-0 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Professional Support ──────────────────────────────────────────── */}
        <Card className="bg-slate-900/60 border-rose-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-rose-300">
              <Heart className="w-5 h-5" />
              Professional Support
            </CardTitle>
            <p className="text-xs text-slate-500">Therapist, doctor, or crisis service I can contact</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={professionalSupport}
              onChange={(e) => setProfessionalSupport(e.target.value)}
              placeholder="e.g. Dr. Smith — (555) 123-4567 · Local crisis line — 988"
              className="bg-slate-800/60 border-slate-700/40 text-white placeholder:text-slate-500 text-sm rounded-xl resize-none min-h-[80px]"
            />
          </CardContent>
        </Card>

        {/* ─── Save Button ───────────────────────────────────────────────────── */}
        <div className="pb-8">
          {user ? (
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 rounded-2xl font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/20"
            >
              {saved ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Plan Saved!</>
              ) : saveMutation.isPending ? (
                "Saving..."
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save My Safety Plan</>
              )}
            </Button>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-400">Sign in to save your plan</p>
              <Link href="/">
                <Button className="bg-purple-700 hover:bg-purple-600 text-white border-0 rounded-2xl px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* ─── Crisis Link ───────────────────────────────────────────────────── */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-600 mb-2">If you're in immediate crisis:</p>
          <Link href="/crisis-support">
            <button className="text-sm text-rose-400 hover:text-rose-300 underline transition-colors">
              Access Crisis Support →
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
