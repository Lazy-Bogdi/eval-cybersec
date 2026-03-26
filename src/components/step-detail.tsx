"use client";
import { X, Terminal, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EvalStep } from "@/lib/eval-data";
import { useState } from "react";

interface StepDetailProps {
  step: EvalStep;
  onClose: () => void;
}

function ImageModal({ src, caption, onClose }: { src: string; caption: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <X size={24} />
      </button>
      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption} className="max-h-[80vh] w-auto object-contain rounded-lg" />
        <p className="text-white/70 text-sm mt-3 text-center">{caption}</p>
      </div>
    </div>
  );
}

export default function StepDetail({ step, onClose }: StepDetailProps) {
  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; caption: string } | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "in-progress": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "pending": return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
      default: return "";
    }
  };

  const totalSections = step.sections.length;

  return (
    <>
      {fullscreenImage && <ImageModal src={fullscreenImage.src} caption={fullscreenImage.caption} onClose={() => setFullscreenImage(null)} />}

      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
        <div
          className="bg-zinc-950 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <step.icon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
                <p className="text-sm text-white/50">{step.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(step.status)} text-sm px-3 py-1`}>
                {step.status === "completed" ? "COMPLETE" : step.status === "in-progress" ? "EN COURS" : "NON FAIT"}
              </Badge>
              <span className="text-2xl font-bold text-white font-mono">{step.pointsObtained}{step.points}</span>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Intro */}
            <p className="text-white/60 text-base leading-relaxed border-l-2 border-red-500/30 pl-4">{step.content}</p>

            {/* Section navigation */}
            {totalSections > 1 && (
              <div className="flex items-center justify-between bg-zinc-900/50 rounded-lg px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white"
                  onClick={() => setSectionIndex(Math.max(0, sectionIndex - 1))}
                  disabled={sectionIndex === 0}
                >
                  <ChevronLeft size={16} className="mr-1" /> Precedent
                </Button>
                <div className="flex gap-1.5">
                  {step.sections.map((_, i) => (
                    <button
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === sectionIndex ? "bg-red-500 scale-125" :
                        i < sectionIndex ? "bg-emerald-500/50" : "bg-white/15 hover:bg-white/30"
                      }`}
                      onClick={() => setSectionIndex(i)}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white"
                  onClick={() => setSectionIndex(Math.min(totalSections - 1, sectionIndex + 1))}
                  disabled={sectionIndex === totalSections - 1}
                >
                  Suivant <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

            {/* Current section */}
            {step.sections.map((section, i) => (
              <div
                key={i}
                className={`space-y-4 transition-all duration-300 ${
                  i === sectionIndex ? "opacity-100" : "hidden"
                }`}
              >
                {/* Section title */}
                {section.title && (
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-red-500 font-mono text-sm">{String(i + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h3>
                )}

                {/* Section text */}
                <p className="text-white/70 text-sm leading-relaxed">{section.text}</p>

                {/* Commands */}
                {section.commands && section.commands.length > 0 && (
                  <div className="bg-zinc-900 rounded-lg border border-white/5 p-4 space-y-1 font-mono text-sm">
                    {section.commands.map((cmd, j) => (
                      <div key={j} className={cmd.startsWith("#") ? "text-white/30" : "text-emerald-400"}>
                        {!cmd.startsWith("#") && <span className="text-red-400 mr-2">$</span>}
                        {cmd}
                      </div>
                    ))}
                  </div>
                )}

                {/* Screenshot */}
                {section.screenshot && (
                  <div
                    className="bg-zinc-900 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/25 transition-all group"
                    onClick={() => setFullscreenImage(section.screenshot!)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={section.screenshot.src}
                      alt={section.screenshot.caption}
                      className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
                    />
                    <div className="p-3 border-t border-white/5 flex items-center justify-between">
                      <p className="text-white/50 text-xs">{section.screenshot.caption}</p>
                      <span className="text-white/30 text-xs">Cliquer pour agrandir</span>
                    </div>
                  </div>
                )}

                {/* Note/Explanation */}
                {section.note && (
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4 flex gap-3">
                    <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-white/70 text-sm leading-relaxed">{section.note}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Findings */}
            {step.findings.length > 0 && (
              <div className="border-t border-white/5 pt-6">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Resultats cles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.findings.map((finding, i) => (
                    <div key={i} className="bg-zinc-900 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white/80 font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
