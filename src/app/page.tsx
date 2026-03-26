"use client";

import { useState } from "react";
import { Shield, Trophy, ChevronDown, Download, Terminal, Cpu, Wifi, KeyRound, Fingerprint, Globe } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import StepDetail from "@/components/step-detail";
import { evalSteps, totalPoints, obtainedPoints } from "@/lib/eval-data";

export default function Home() {
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const selectedStep = evalSteps.find((s) => s.id === selectedStepId);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Title */}
        <div className="text-center mb-8 z-10 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield size={32} className="text-red-500" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Evaluation <span className="text-red-500">Cybersecurite</span>
            </h1>
          </div>
          <p className="text-white/50 text-lg">Pentest de la machine de Raptor Dissident</p>
          <p className="text-white/30 text-sm mt-2">Cliquez sur les noeuds pour explorer chaque etape</p>
        </div>

        {/* Orbital Timeline */}
        <div className="w-full max-w-5xl z-10">
          <RadialOrbitalTimeline
            timelineData={evalSteps}
            onNodeClick={(id) => setSelectedStepId(id)}
          />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 flex flex-col items-center text-white/30 animate-bounce z-10">
          <span className="text-xs mb-1">Bareme</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* Grading section */}
      <section className="max-w-4xl mx-auto px-6 py-20" id="bareme">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy size={28} className="text-yellow-500" />
            Bareme et Notation
          </h2>
          <p className="text-white/50">Evaluation sur {totalPoints} points</p>
        </div>

        {/* Score card */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 mb-10 text-center">
          <div className="text-6xl font-bold mb-2">
            <span className="text-red-500">{obtainedPoints}</span>
            <span className="text-white/30">/{totalPoints}</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${(obtainedPoints / totalPoints) * 100}%` }}
            />
          </div>
          <p className="text-white/40 text-sm mt-3">{Math.round((obtainedPoints / totalPoints) * 100)}% de reussite</p>
        </div>

        {/* Grading table */}
        <div className="space-y-3">
          {evalSteps.map((step) => (
            <div
              key={step.id}
              className="bg-zinc-950 border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/15 transition-colors cursor-pointer group"
              onClick={() => setSelectedStepId(step.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                  step.status === "in-progress" ? "bg-amber-500/10 text-amber-400" :
                  "bg-zinc-800 text-zinc-500"
                }`}>
                  <step.icon size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{step.title}</h3>
                  <p className="text-xs text-white/40">{step.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-xs px-2 py-1 rounded-full border ${
                  step.status === "completed" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                  step.status === "in-progress" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
                  "text-zinc-500 border-zinc-500/30 bg-zinc-500/10"
                }`}>
                  {step.status === "completed" ? "Complete" : step.status === "in-progress" ? "En cours" : "Non fait"}
                </div>
                <span className="text-xl font-bold font-mono text-white/80">
                  {step.pointsObtained}<span className="text-white/30">{step.points}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* CyberKit Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-white/5" id="cyberkit">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Terminal size={28} className="text-red-500" />
            CyberKit — Outil d&apos;automatisation
          </h2>
          <p className="text-white/50">Script Python centralisant tous les outils du pentest</p>
        </div>

        {/* Download button */}
        <div className="text-center mb-10">
          <a
            href="/cyberkit.py"
            download
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Download size={18} />
            Telecharger cyberkit.py
          </a>
          <p className="text-white/30 text-xs mt-2">Python 3 — Necessite les droits root</p>
        </div>

        {/* Architecture */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Architecture</h3>
          <p className="text-white/60 text-sm mb-6">
            CyberKit (alias LazyKit) est un toolkit de pentest tout-en-un de ~1400 lignes Python.
            Il encapsule Nmap, CUPP, Hydra, Hashcat, Zphisher, Bettercap et OpenSSL dans une interface
            interactive avec menu colore et gestion de session.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Cpu, title: "Module 1 — Reconnaissance", desc: "Scans Nmap : decouverte reseau (-sn), ports/services (-sV), OS detection (-A), vuln scan (--script vuln), UDP, SYN stealth" },
              { icon: KeyRound, title: "Module 2 — Brute Force", desc: "CUPP profiling OSINT, Crunch combinatoire, Hydra (SSH, FTP, HTTP form, custom), Hashcat et John the Ripper" },
              { icon: Fingerprint, title: "Module 3 — Phishing", desc: "Zphisher templates, serveur HTTP/HTTPS integre avec capture de credentials, generation de certificats SSL auto-signes" },
              { icon: Wifi, title: "Module 4 — MITM", desc: "Bettercap automatise : ARP spoofing, DNS spoofing, sniffing trafic, configuration cible et gateway" },
              { icon: Globe, title: "Module 5 — Full Auto", desc: "Enchaine automatiquement : IP forwarding, cert SSL, serveurs phishing HTTP/HTTPS, Bettercap ARP+DNS spoof" },
            ].map((mod, i) => (
              <div key={i} className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <mod.icon size={16} className="text-red-400" />
                  <h4 className="font-semibold text-white text-sm">{mod.title}</h4>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technical details */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8">
          <h3 className="text-lg font-bold text-white mb-4">Details techniques</h3>
          <div className="space-y-3 text-sm">
            {[
              "Classe State : gestion globale de session (interface, IPs, gateway, cible, wordlists, processus background)",
              "Serveurs HTTP/HTTPS : capturent les POST sur /login.php, sauvegardent dans /tmp/cyberkit_creds.txt, redirect vers le vrai site",
              "Bettercap : commandes injectees via --eval pour automatiser arp.spoof, dns.spoof et net.sniff",
              "CUPP : mode interactif ou quick-fill avec profil OSINT pre-rempli",
              "Hashcat : reference des modes courants (MD5=0, SHA1=100, NTLM=1000, KeePass=13400, WPA=2500)",
              "Cleanup automatique : arret des processus, desactivation IP forwarding, affichage des credentials capturees",
            ].map((detail, i) => (
              <div key={i} className="flex gap-2 text-white/70">
                <span className="text-red-400 mt-0.5">&#9656;</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-white/20 text-xs border-t border-white/5">
        <p>Evaluation Cybersecurite — Mars 2026</p>
        <p className="mt-1">Pentest realise avec CyberKit, Nmap, Hydra, CUPP, Hashcat, Zphisher, Bettercap</p>
      </footer>

      {/* Step detail modal */}
      {selectedStep && (
        <StepDetail step={selectedStep} onClose={() => setSelectedStepId(null)} />
      )}
    </main>
  );
}
