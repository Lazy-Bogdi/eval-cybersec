"use client";
import { X, Terminal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { assetUrl } from "@/lib/utils";
import type { EvalStep } from "@/lib/eval-data";
import { useState } from "react";

interface StepDetailProps {
  step: EvalStep;
  onClose: () => void;
}

function ImageModal({ src, caption, onClose }: { src: string; caption: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
        <X size={24} />
      </button>
      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(src)} alt={caption} className="max-h-[80vh] w-auto object-contain rounded-lg" />
        <p className="text-white/70 text-sm mt-3 text-center">{caption}</p>
      </div>
    </div>
  );
}

export default function StepDetail({ step, onClose }: StepDetailProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; caption: string } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "in-progress": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "pending": return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
      default: return "";
    }
  };

  return (
    <>
      {selectedImage && <ImageModal src={selectedImage.src} caption={selectedImage.caption} onClose={() => setSelectedImage(null)} />}

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

          <div className="p-6 space-y-8">
            {/* Description */}
            <p className="text-white/70 text-base leading-relaxed">{step.content}</p>

            {/* Details */}
            <div>
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Search size={14} /> Deroulement
              </h3>
              <ul className="space-y-2">
                {step.details.map((detail, i) => (
                  <li key={i} className="text-white/80 text-sm flex gap-2">
                    <span className="text-red-400 mt-0.5">&#9656;</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Commands */}
            {step.commands.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Terminal size={14} /> Commandes
                </h3>
                <div className="bg-zinc-900 rounded-lg border border-white/5 p-4 space-y-1 font-mono text-sm">
                  {step.commands.map((cmd, i) => (
                    <div key={i} className={cmd.startsWith("#") ? "text-white/30" : "text-emerald-400"}>
                      {!cmd.startsWith("#") && <span className="text-red-400 mr-2">$</span>}
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Findings */}
            {step.findings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Resultats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.findings.map((finding, i) => (
                    <div key={i} className="bg-zinc-900 border border-white/5 rounded-lg px-4 py-2 text-sm text-white/80 font-mono">
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Screenshots */}
            {step.screenshots.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
                  Screenshots ({step.screenshots.length})
                </h3>
                <div className="relative">
                  {/* Main image */}
                  <div
                    className="bg-zinc-900 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition-colors"
                    onClick={() => setSelectedImage(step.screenshots[currentImageIndex])}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(step.screenshots[currentImageIndex].src)}
                      alt={step.screenshots[currentImageIndex].caption}
                      className="w-full h-auto object-contain"
                    />
                    <div className="p-3 border-t border-white/5">
                      <p className="text-white/60 text-xs text-center">{step.screenshots[currentImageIndex].caption}</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  {step.screenshots.length > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/50 hover:text-white h-8 w-8"
                        onClick={() => setCurrentImageIndex((prev) => prev === 0 ? step.screenshots.length - 1 : prev - 1)}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <div className="flex gap-1.5">
                        {step.screenshots.map((_, i) => (
                          <button
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? "bg-red-500" : "bg-white/20 hover:bg-white/40"}`}
                            onClick={() => setCurrentImageIndex(i)}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/50 hover:text-white h-8 w-8"
                        onClick={() => setCurrentImageIndex((prev) => prev === step.screenshots.length - 1 ? 0 : prev + 1)}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  )}

                  {/* Thumbnails */}
                  {step.screenshots.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {step.screenshots.map((ss, i) => (
                        <button
                          key={i}
                          className={`flex-shrink-0 w-20 h-14 rounded border overflow-hidden transition-all ${
                            i === currentImageIndex ? "border-red-500 opacity-100" : "border-white/10 opacity-50 hover:opacity-80"
                          }`}
                          onClick={() => setCurrentImageIndex(i)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={assetUrl(ss.src)} alt={ss.caption} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
