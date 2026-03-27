"use client";

import { useAnimation } from "@/context/AnimationContext";
import { Sparkles } from "lucide-react";

export default function AnimationTestButton() {
  const { triggerPaymentAnimation, isAnimationActive } = useAnimation();

  return (
    <button
      onClick={triggerPaymentAnimation}
      disabled={isAnimationActive}
      className={`
        fixed bottom-4 right-4 z-50
        px-4 py-2 rounded-lg
        bg-emerald-500 hover:bg-emerald-600
        text-white font-bold text-sm
        flex items-center gap-2
        transition-all duration-200
        ${isAnimationActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        shadow-lg hover:shadow-xl
      `}
    >
      <Sparkles size={16} className={isAnimationActive ? 'animate-spin' : ''} />
      {isAnimationActive ? 'Animating...' : 'Test Animation'}
    </button>
  );
}