"use client";

import { useState } from "react";
import { Shield, Trophy, ChevronDown } from "lucide-react";
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

        {/* Footer */}
        <div className="text-center mt-16 text-white/20 text-xs">
          <p>Evaluation Cybersecurite — Mars 2026</p>
          <p className="mt-1">Pentest realise avec CyberKit, Nmap, Hydra, CUPP, Hashcat, Zphisher, Bettercap</p>
        </div>
      </section>

      {/* Step detail modal */}
      {selectedStep && (
        <StepDetail step={selectedStep} onClose={() => setSelectedStepId(null)} />
      )}
    </main>
  );
}
