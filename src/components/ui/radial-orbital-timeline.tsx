"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  onNodeClick?: (id: number) => void;
}

// Starfield particle
interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleOffset: number;
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 2 + 0.5,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export default function RadialOrbitalTimeline({
  timelineData,
  onNodeClick,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const stars = useMemo(() => generateStars(120), []);

  // Track active card in mobile carousel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = el.children;
      if (!children.length) return;
      const gap = 12;
      const cardWidth = (el.scrollWidth - (children.length - 1) * gap) / children.length;
      const index = Math.round(el.scrollLeft / (cardWidth + gap));
      setActiveCardIndex(Math.max(0, Math.min(index, timelineData.length - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [timelineData.length]);

  // Animate time for twinkling
  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 0.05), 50);
    return () => clearInterval(timer);
  }, []);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => { newPulseEffect[relId] = true; });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.2) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }
    return () => { if (rotationTimer) clearInterval(rotationTimer); };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 240;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const scale = 0.7 + 0.3 * ((1 + Math.sin(radian)) / 2);
    const opacity = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity, scale };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed": return "text-emerald-300 bg-emerald-500/20 border-emerald-500/50";
      case "in-progress": return "text-amber-300 bg-amber-500/20 border-amber-500/50";
      case "pending": return "text-zinc-400 bg-zinc-500/20 border-zinc-500/50";
      default: return "text-zinc-400 bg-zinc-500/20 border-zinc-500/50";
    }
  };

  const getNodeGradient = (status: TimelineItem["status"]) => {
    switch (status) {
      case "completed": return "from-emerald-400 via-emerald-500 to-teal-600";
      case "in-progress": return "from-amber-400 via-amber-500 to-orange-600";
      case "pending": return "from-zinc-400 via-zinc-500 to-zinc-700";
      default: return "from-zinc-400 via-zinc-500 to-zinc-700";
    }
  };

  const getGlowColor = (status: TimelineItem["status"]) => {
    switch (status) {
      case "completed": return "rgba(16, 185, 129, 0.4)";
      case "in-progress": return "rgba(245, 158, 11, 0.4)";
      case "pending": return "rgba(161, 161, 170, 0.2)";
      default: return "rgba(161, 161, 170, 0.2)";
    }
  };

  return (
    <div className="w-full" ref={containerRef} onClick={handleContainerClick}>
      {/* ---- Mobile carousel ---- */}
      <div className="md:hidden relative py-6">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)" }} />
        </div>
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-4 scrollbar-hide relative"
        >
          {timelineData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="snap-center flex-shrink-0 w-[72vw] max-w-[300px] bg-zinc-950/80 backdrop-blur border border-white/10 rounded-2xl p-5 cursor-pointer active:scale-[0.97] transition-transform duration-150"
                onClick={(e) => { e.stopPropagation(); onNodeClick?.(item.id); }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getNodeGradient(item.status)} shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-white/40">{item.date}</div>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-black ${
                    item.status === "completed" ? "bg-emerald-400 text-black" :
                    item.status === "in-progress" ? "bg-amber-400 text-black" :
                    "bg-zinc-600 text-white"
                  }`}>{index + 1}</div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mb-4">{item.content}</p>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${item.energy}%`,
                    background: item.status === "completed" ? "linear-gradient(to right, #10b981, #14b8a6)" : item.status === "in-progress" ? "linear-gradient(to right, #f59e0b, #f97316)" : "linear-gradient(to right, #71717a, #a1a1aa)",
                  }} />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-semibold">
                  Explorer <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Indicator dots */}
        <div className="flex justify-center gap-2 mt-4">
          {timelineData.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeCardIndex ? "w-6 bg-red-500" : "w-1.5 bg-white/20"}`} />
          ))}
        </div>
      </div>

      {/* ---- Desktop orbital (unchanged) ---- */}
      <div className="hidden md:flex flex-col items-center justify-center h-[650px] overflow-hidden relative">
      {/* Starfield background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => {
          const twinkle = Math.sin(time * star.speed + star.twinkleOffset) * 0.5 + 0.5;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                backgroundColor: `rgba(255, 255, 255, ${star.opacity * twinkle})`,
                boxShadow: star.size > 1.5 ? `0 0 ${star.size * 2}px rgba(255, 255, 255, ${star.opacity * twinkle * 0.5})` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Nebula glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(249,115,22,0.1) 40%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(147,51,234,0.05) 50%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{ perspective: "1200px" }}
        >
          {/* Center sun */}
          <div className="absolute flex items-center justify-center z-10">
            {/* Outer glow rings */}
            <div className="absolute w-28 h-28 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)", animation: "pulse 3s ease-in-out infinite" }} />
            <div className="absolute w-24 h-24 rounded-full border border-red-500/10 animate-ping opacity-40" style={{ animationDuration: "3s" }} />
            <div className="absolute w-20 h-20 rounded-full border border-orange-500/15 animate-ping opacity-30" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
            {/* Main sun */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-red-500/30"
              style={{ animation: "pulse 4s ease-in-out infinite" }}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center">
                  <span className="text-base font-black text-black">18</span>
                </div>
              </div>
            </div>
          </div>

          {/* Orbit rings */}
          <div className="absolute w-[480px] h-[480px] rounded-full border border-white/[0.06]" />
          <div className="absolute w-[490px] h-[490px] rounded-full border border-white/[0.03]" style={{ transform: `rotate(${rotationAngle * 0.5}deg)` }}>
            {/* Orbit particles */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <div key={angle} className="absolute w-1 h-1 rounded-full bg-white/10"
                style={{
                  left: `${50 + 50 * Math.cos((angle + rotationAngle) * Math.PI / 180)}%`,
                  top: `${50 + 50 * Math.sin((angle + rotationAngle) * Math.PI / 180)}%`,
                }} />
            ))}
          </div>

          {/* Connection lines between nodes */}
          <svg className="absolute w-full h-full pointer-events-none" style={{ left: 0, top: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
              </linearGradient>
            </defs>
            {timelineData.map((item, index) => {
              const pos = calculateNodePosition(index, timelineData.length);
              const centerX = containerRef.current ? containerRef.current.offsetWidth / 2 : 500;
              const centerY = 325;
              return (
                <line
                  key={item.id}
                  x1={centerX}
                  y1={centerY}
                  x2={centerX + pos.x}
                  y2={centerY + pos.y}
                  stroke="url(#lineGrad)"
                  strokeWidth="1"
                  opacity={expandedItems[item.id] ? 0.4 : 0.15}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const isHovered = hoveredNodeId === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${isExpanded ? 1.3 : isHovered ? 1.15 : position.scale})`,
                  zIndex: isExpanded ? 200 : isHovered ? 150 : position.zIndex,
                  opacity: isExpanded ? 1 : isHovered ? 1 : position.opacity,
                  filter: isExpanded || isHovered ? `drop-shadow(0 0 15px ${getGlowColor(item.status)})` : "none",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                onMouseEnter={() => { setHoveredNodeId(item.id); setAutoRotate(false); }}
                onMouseLeave={() => { setHoveredNodeId(null); if (!activeNodeId) setAutoRotate(true); }}
              >
                {/* Energy field */}
                <div
                  className={`absolute rounded-full transition-all duration-500 ${isPulsing ? "animate-pulse" : ""}`}
                  style={{
                    background: `radial-gradient(circle, ${getGlowColor(item.status)} 0%, transparent 70%)`,
                    width: `${(isHovered || isExpanded ? 90 : 70)}px`,
                    height: `${(isHovered || isExpanded ? 90 : 70)}px`,
                    left: `${-(isHovered || isExpanded ? 90 : 70) / 2 + 28}px`,
                    top: `${-(isHovered || isExpanded ? 90 : 70) / 2 + 28}px`,
                    opacity: isHovered || isExpanded ? 0.8 : 0.3,
                  }}
                />

                {/* Hover ring */}
                {(isHovered || isExpanded) && (
                  <div className="absolute -inset-2 rounded-full border border-white/20 animate-spin" style={{ animationDuration: "8s" }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50" />
                  </div>
                )}

                {/* Node circle */}
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center relative
                  bg-gradient-to-br ${getNodeGradient(item.status)}
                  border-2 transition-all duration-300
                  ${isExpanded ? "border-white shadow-lg" : isRelated ? "border-white animate-pulse" : isHovered ? "border-white/70" : "border-white/30"}
                `}>
                  <Icon size={22} className="text-white drop-shadow-md" />
                  {/* Step number */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border-2 border-black transition-all duration-300 ${
                    item.status === "completed" ? "bg-emerald-400 text-black" :
                    item.status === "in-progress" ? "bg-amber-400 text-black" :
                    "bg-zinc-500 text-white"
                  } ${isHovered ? "scale-110" : ""}`}>
                    {index + 1}
                  </div>
                </div>

                {/* Label */}
                <div className={`
                  absolute top-[70px] left-1/2 -translate-x-1/2 whitespace-nowrap text-center
                  transition-all duration-300
                  ${isExpanded ? "text-white scale-110" : isHovered ? "text-white" : "text-white/60"}
                `}>
                  <div className="text-sm font-bold tracking-wide">{item.title}</div>
                  {isHovered && !isExpanded && (
                    <div className="text-[10px] text-white/40 mt-0.5 animate-fade-in">{item.date}</div>
                  )}
                </div>

                {/* Expanded card */}
                {isExpanded && (
                  <Card className="absolute top-24 left-1/2 -translate-x-1/2 w-80 bg-black/95 backdrop-blur-xl border-white/15 shadow-2xl shadow-black/50 overflow-visible animate-fade-in">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-transparent to-white/30" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge className={`px-2 text-xs ${getStatusStyles(item.status)}`}>
                          {item.status === "completed" ? "COMPLETE" : item.status === "in-progress" ? "EN COURS" : "NON FAIT"}
                        </Badge>
                        <span className="text-xs font-mono text-white/40">{item.date}</span>
                      </div>
                      <CardTitle className="text-sm mt-2 text-white">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/70">
                      <p className="leading-relaxed">{item.content}</p>

                      <div className="mt-3 pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="flex items-center text-white/50"><Zap size={10} className="mr-1" />Progression</span>
                          <span className="font-mono text-white/70">{item.energy}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${item.energy}%`,
                              background: item.status === "completed"
                                ? "linear-gradient(to right, #10b981, #14b8a6)"
                                : item.status === "in-progress"
                                ? "linear-gradient(to right, #f59e0b, #f97316)"
                                : "linear-gradient(to right, #71717a, #a1a1aa)",
                            }} />
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 h-9 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNodeClick?.(item.id);
                        }}
                      >
                        Explorer cette etape
                        <ArrowRight size={14} className="ml-1.5" />
                      </Button>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/10">
                          <div className="flex items-center mb-2">
                            <Link size={10} className="text-white/40 mr-1" />
                            <h4 className="text-[10px] uppercase tracking-widest font-medium text-white/40">Etapes liees</h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find((i) => i.id === relatedId);
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-xs rounded-sm border-white/15 bg-transparent hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight size={8} className="ml-1 text-white/40" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
