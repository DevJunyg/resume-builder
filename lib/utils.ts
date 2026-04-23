import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui 표준 유틸: Tailwind 클래스 병합 시 충돌 제거
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
