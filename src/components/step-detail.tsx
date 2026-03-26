"use client";
import { X, Terminal, Info, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EvalStep } from "@/lib/eval-data";
import { useState, useRef, useEffect, useCallback } from "react";

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
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "in-progress": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "pending": return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
      default: return "";
    }
  };

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const triggerPoint = containerRect.top + containerRect.height * 0.35;

    let current = 0;
    sectionRefs.current.forEach((ref, i) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (rect.top < triggerPoint) {
          current = i;
        }
      }
    });
    setActiveSection(current);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const currentScreenshot = (() => {
    for (let i = activeSection; i >= 0; i--) {
      if (step.sections[i]?.screenshot) return step.sections[i].screenshot;
    }
    return null;
  })();

  const currentNote = step.sections[activeSection]?.note;

  return (
    <>
      {fullscreenImage && <ImageModal src={fullscreenImage.src} caption={fullscreenImage.caption} onClose={() => setFullscreenImage(null)} />}

      <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm" onClick={onClose}>
        <div
          className="absolute inset-0 sm:inset-2 md:inset-4 lg:inset-6 bg-zinc-950 border-0 sm:border border-white/10 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <step.icon size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{step.title}</h2>
                <p className="text-sm text-white/40">{step.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(step.status)} text-sm px-3 py-1 hidden sm:flex`}>
                {step.status === "completed" ? "COMPLETE" : step.status === "in-progress" ? "EN COURS" : "NON FAIT"}
              </Badge>
              <span className="text-2xl font-bold text-white font-mono">{step.pointsObtained}{step.points}</span>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Split content */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT — scrollable narrative */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-0">
              {/* Intro */}
              <div className="mb-8 pb-6 border-b border-white/5">
                <p className="text-white/50 text-base leading-relaxed border-l-2 border-red-500/30 pl-4">{step.content}</p>
              </div>

              {/* Sections */}
              {step.sections.map((section, i) => (
                <div
                  key={i}
                  ref={(el) => { sectionRefs.current[i] = el; }}
                  className={`py-6 transition-opacity duration-300 ${
                    i !== step.sections.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  {/* Section number + title */}
                  {section.title && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors duration-300 ${
                        i === activeSection ? "bg-red-500 text-white" :
                        i < activeSection ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        "bg-zinc-800 text-white/40"
                      }`}>
                        {i + 1}
                      </span>
                      <h3 className="text-lg font-bold text-white">{section.title}</h3>
                    </div>
                  )}

                  {/* Text */}
                  <p className="text-white/65 text-sm leading-relaxed mb-4 sm:ml-10">{section.text}</p>

                  {/* Commands */}
                  {section.commands && section.commands.length > 0 && (
                    <div className="sm:ml-10 mb-4 bg-zinc-900 rounded-lg border border-white/5 p-4 space-y-1 font-mono text-sm overflow-x-auto">
                      {section.commands.map((cmd, j) => (
                        <div key={j} className={cmd.startsWith("#") ? "text-white/25 italic" : "text-emerald-400"}>
                          {!cmd.startsWith("#") && <span className="text-red-400 mr-2">$</span>}
                          {cmd}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Screenshot inline on mobile */}
                  {section.screenshot && (
                    <div className="sm:ml-10 mb-4 lg:hidden">
                      <div
                        className="bg-zinc-900 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/25 transition-all"
                        onClick={() => setFullscreenImage(section.screenshot!)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={section.screenshot.src} alt={section.screenshot.caption} className="w-full h-auto object-contain" />
                        <p className="p-2 text-white/40 text-xs text-center border-t border-white/5">{section.screenshot.caption}</p>
                      </div>
                    </div>
                  )}

                  {/* Note inline on mobile */}
                  {section.note && (
                    <div className="sm:ml-10 lg:hidden bg-blue-500/5 border border-blue-500/15 rounded-lg p-3 flex gap-3">
                      <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-white/60 text-xs leading-relaxed">{section.note}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Findings at bottom of scroll */}
              {step.findings.length > 0 && (
                <div className="pt-8 border-t border-white/10 mt-4">
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Resultats cles</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {step.findings.map((finding, i) => (
                      <div key={i} className="bg-zinc-900 border border-white/5 rounded-lg px-4 py-3 text-sm text-white/80 font-mono flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                        {finding}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom padding */}
              <div className="h-20"></div>
            </div>

            {/* RIGHT — sticky screenshot + context panel (desktop only) */}
            <div className="hidden lg:flex w-[420px] flex-shrink-0 border-l border-white/5 flex-col bg-zinc-900/30">
              {/* Screenshot */}
              <div className="flex-1 p-5 flex flex-col">
                {currentScreenshot ? (
                  <div className="flex-1 flex flex-col animate-fade-in">
                    <div
                      className="flex-1 bg-zinc-900 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-white/25 transition-all flex flex-col"
                      onClick={() => setFullscreenImage(currentScreenshot)}
                    >
                      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentScreenshot.src}
                          alt={currentScreenshot.caption}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="p-3 border-t border-white/5 flex-shrink-0">
                        <p className="text-white/50 text-xs">{currentScreenshot.caption}</p>
                        <p className="text-white/25 text-[10px] mt-1">Cliquer pour agrandir</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-white/20">
                      <step.icon size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Faites defiler pour voir les screenshots</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Note panel */}
              {currentNote && (
                <div className="flex-shrink-0 p-5 pt-0 animate-fade-in">
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info size={14} className="text-blue-400" />
                      <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Analyse</span>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">{currentNote}</p>
                  </div>
                </div>
              )}

              {/* Progress dots */}
              <div className="flex-shrink-0 px-5 pb-5">
                <div className="flex items-center gap-1.5 justify-center">
                  {step.sections.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeSection ? "w-6 bg-red-500" :
                        i < activeSection ? "w-1.5 bg-emerald-500/50" :
                        "w-1.5 bg-white/10"
                      }`} />
                    </div>
                  ))}
                </div>
                <p className="text-center text-white/20 text-[10px] mt-2">
                  {activeSection + 1} / {step.sections.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
