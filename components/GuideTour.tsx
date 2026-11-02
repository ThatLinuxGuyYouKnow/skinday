"use client";
import { useEffect } from "react";

export type TourStep = {
  targetId: string;
  eyebrow: string;
  title: string;
  body: string;
};

export function GuideTour({
  steps,
  index,
  onNext,
  onBack,
  onDone,
}: {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("tour-glow");
      return () => el.classList.remove("tour-glow");
    }
  }, [step.targetId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  return (
    <div className="tour-backdrop" role="dialog" aria-modal="true" aria-label={step.title}>
      <div className="tour-card">
        <div className="tour-eyebrow">
          {step.eyebrow} · {index + 1} of {steps.length}
        </div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>
        <div className="tour-dots" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={i === index ? "tour-dot on" : "tour-dot"} />
          ))}
        </div>
        <div className="tour-row">
          {index > 0 ? (
            <button className="tour-ghost" onClick={onBack}>
              ← Back
            </button>
          ) : (
            <button className="tour-ghost" onClick={onDone}>
              Skip tour
            </button>
          )}
          {!last ? (
            <button className="tour-next" onClick={onNext}>
              Next →
            </button>
          ) : (
            <button className="tour-next" onClick={onDone}>
              Shop my edit →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
