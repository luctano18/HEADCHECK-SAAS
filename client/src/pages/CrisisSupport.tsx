import { useState } from "react";
import { Link } from "wouter";
import { Heart, Phone, MessageSquare, AlertTriangle, Shield, ArrowLeft, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ─── Emergency Resources ──────────────────────────────────────────────────────
const EMERGENCY_RESOURCES = [
  {
    region: "International",
    lines: [
      { name: "Ligne de crise internationale", number: "988", type: "call", description: "Disponible 24h/24 — États-Unis, Canada" },
      { name: "SMS de crise (Crisis Text Line)", number: "741741", type: "sms", description: "Envoyer HOME au 741741" },
    ],
  },
  {
    region: "France",
    lines: [
      { name: "SOS Amitié", number: "09 72 39 40 50", type: "call", description: "Disponible 24h/24, 7j/7" },
      { name: "Numéro national de prévention du suicide", number: "3114", type: "call", description: "Disponible 24h/24, 7j/7 — Gratuit" },
      { name: "Urgences médicales", number: "15", type: "call", description: "SAMU — Urgences médicales" },
    ],
  },
  {
    region: "Belgique",
    lines: [
      { name: "Centre de Prévention du Suicide", number: "0800 32 123", type: "call", description: "Gratuit, 24h/24" },
      { name: "Urgences", number: "112", type: "call", description: "Urgences générales" },
    ],
  },
  {
    region: "Côte d'Ivoire",
    lines: [
      { name: "SAMU social", number: "185", type: "call", description: "Aide sociale d'urgence" },
      { name: "Urgences", number: "185", type: "call", description: "Urgences générales" },
    ],
  },
];

// ─── Grounding Techniques ─────────────────────────────────────────────────────
const GROUNDING_STEPS = [
  { step: "1", title: "Respire", description: "Inspire 4 secondes, retiens 4 secondes, expire 6 secondes. Répète 3 fois." },
  { step: "2", title: "Nomme", description: "Dis à voix haute 5 choses que tu vois autour de toi en ce moment." },
  { step: "3", title: "Touche", description: "Pose les deux mains à plat sur une surface. Sens sa texture, sa température." },
  { step: "4", title: "Reste", description: "Tu n'as pas besoin de résoudre quoi que ce soit maintenant. Tu as juste besoin d'être là." },
];

export default function CrisisSupport() {
  const [showAllResources, setShowAllResources] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 text-white">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-purple-950/80 backdrop-blur-sm border-b border-purple-800/40 px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">Support de Crise</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* ─── Hero Message ──────────────────────────────────────────────────── */}
        <div className="text-center space-y-4 pt-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Heart className="w-10 h-10 text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vous n'êtes pas seul·e
          </h1>
          <p className="text-lg text-purple-200 leading-relaxed max-w-md mx-auto">
            Votre sécurité compte. Vous méritez du soutien en ce moment.
            Ce que vous ressentez est réel, et de l'aide est disponible.
          </p>
        </div>

        {/* ─── Primary Emergency Actions ─────────────────────────────────────── */}
        <Card className="bg-rose-950/60 border-rose-500/40 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-semibold text-rose-200">Aide immédiate</h2>
            </div>

            {/* France 3114 — most prominent */}
            <a href="tel:3114" className="block">
              <Button
                className="w-full h-14 text-base font-bold bg-rose-600 hover:bg-rose-500 text-white border-0 rounded-2xl shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02]"
                size="lg"
              >
                <Phone className="w-5 h-5 mr-3" />
                Appeler le 3114 — France (Gratuit 24h/24)
              </Button>
            </a>

            {/* 988 */}
            <a href="tel:988" className="block">
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-semibold bg-purple-900/60 hover:bg-purple-800/60 text-white border-purple-600/50 rounded-2xl transition-all hover:scale-[1.02]"
              >
                <Phone className="w-4 h-4 mr-2" />
                Appeler le 988 — International
              </Button>
            </a>

            {/* SMS */}
            <a href="sms:741741?body=HOME" className="block">
              <Button
                variant="outline"
                className="w-full h-12 text-sm font-semibold bg-purple-900/60 hover:bg-purple-800/60 text-white border-purple-600/50 rounded-2xl transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Envoyer HOME au 741741 (SMS)
              </Button>
            </a>

            {/* Emergency services */}
            <div className="grid grid-cols-2 gap-3">
              <a href="tel:15" className="block">
                <Button
                  variant="outline"
                  className="w-full h-11 text-sm bg-purple-900/40 hover:bg-purple-800/40 text-white border-purple-700/40 rounded-xl"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  SAMU — 15
                </Button>
              </a>
              <a href="tel:112" className="block">
                <Button
                  variant="outline"
                  className="w-full h-11 text-sm bg-purple-900/40 hover:bg-purple-800/40 text-white border-purple-700/40 rounded-xl"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Urgences — 112
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* ─── Grounding Technique ───────────────────────────────────────────── */}
        <Card className="bg-indigo-950/60 border-indigo-500/30">
          <CardContent className="p-6">
            <button
              onClick={() => setShowGrounding(!showGrounding)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-800/60 flex items-center justify-center">
                  <span className="text-xl">🌬️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-200">Technique d'ancrage rapide</h3>
                  <p className="text-sm text-indigo-400">Revenir à soi en 2 minutes</p>
                </div>
              </div>
              {showGrounding ? (
                <ChevronUp className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              )}
            </button>

            {showGrounding && (
              <div className="mt-5 space-y-4">
                {GROUNDING_STEPS.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-700/60 flex items-center justify-center text-sm font-bold text-indigo-200 flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-200">{item.title}</p>
                      <p className="text-sm text-indigo-300 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Stay With Me (Reconnect Card) ─────────────────────────────────── */}
        {!reconnected ? (
          <Card className="bg-purple-900/40 border-purple-600/30">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-purple-200 leading-relaxed">
                Si vous n'êtes pas en danger immédiat mais que vous avez besoin d'un espace pour souffler,
                HeadCheck est là pour vous accompagner.
              </p>
              <Button
                onClick={() => setReconnected(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 rounded-2xl px-8 py-3 font-semibold transition-all hover:scale-[1.02]"
              >
                <Heart className="w-4 h-4 mr-2" />
                Rester avec moi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-emerald-950/60 border-emerald-500/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-400" fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-200">Vous êtes ici. C'est suffisant.</h3>
                  <p className="text-sm text-emerald-400">Prenez le temps qu'il vous faut.</p>
                </div>
              </div>
              <p className="text-emerald-200 text-sm leading-relaxed">
                Vous n'avez pas besoin de tout résoudre maintenant. Vous avez juste besoin de nommer
                ce qui est réel, de choisir ce qui est possible, et de laisser le soutien vous rejoindre là où vous êtes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/checkin" className="flex-1">
                  <Button
                    className="w-full bg-emerald-700/60 hover:bg-emerald-600/60 text-white border-0 rounded-xl"
                  >
                    Faire un check-in
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover:bg-emerald-900/40 text-emerald-300 border-emerald-700/40 rounded-xl"
                  >
                    Retourner à l'accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── More Resources ────────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowAllResources(!showAllResources)}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-200 transition-colors text-sm w-full justify-center py-2"
          >
            {showAllResources ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Masquer les ressources supplémentaires
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Voir toutes les ressources par région
              </>
            )}
          </button>

          {showAllResources && (
            <div className="mt-4 space-y-4">
              {EMERGENCY_RESOURCES.map((region) => (
                <Card key={region.region} className="bg-purple-900/30 border-purple-700/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-purple-200 mb-3 text-sm uppercase tracking-wider">
                      {region.region}
                    </h4>
                    <div className="space-y-2">
                      {region.lines.map((line) => (
                        <a
                          key={line.number}
                          href={line.type === "call" ? `tel:${line.number.replace(/\s/g, "")}` : `sms:${line.number}?body=HOME`}
                          className="flex items-center justify-between p-3 rounded-xl bg-purple-800/30 hover:bg-purple-700/40 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {line.type === "call" ? (
                              <Phone className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">{line.name}</p>
                              <p className="text-xs text-purple-400">{line.description}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-purple-300 group-hover:text-white transition-colors">
                            {line.number}
                          </span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ─── External Resources ────────────────────────────────────────────── */}
        <Card className="bg-purple-900/20 border-purple-800/20">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Ressources en ligne</h3>
            <div className="space-y-2">
              {[
                { name: "OMS — Santé mentale", url: "https://www.who.int/fr/health-topics/mental-health" },
                { name: "UNICEF — Bien-être émotionnel", url: "https://www.unicef.org/mental-health" },
                { name: "Psycom — Ressources francophones", url: "https://www.psycom.org" },
              ].map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-800/30 transition-colors group"
                >
                  <span className="text-sm text-purple-300 group-hover:text-white transition-colors">{link.name}</span>
                  <ExternalLink className="w-3 h-3 text-purple-500 group-hover:text-purple-300 transition-colors" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── Disclaimer ────────────────────────────────────────────────────── */}
        <div className="text-center pb-8">
          <p className="text-xs text-purple-500 leading-relaxed max-w-sm mx-auto">
            HeadCheck AI est un outil de soutien émotionnel, non un service de crise.
            En cas d'urgence, contactez les services d'urgence de votre région.
          </p>
        </div>

      </div>
    </div>
  );
}
