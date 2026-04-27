import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI 이력서 빌더",
  description: "AI와 대화하며 완성하는 이력서. 자연어로 지시하면 AI가 즉시 수정하고, 채용공고 기반 맞춤 최적화를 제공합니다.",
  openGraph: {
    title: "AI 이력서 빌더",
    description: "AI와 대화하며 완성하는 이력서",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip to main content — 키보드 사용자용 */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent-brand focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white"
          >
            본문으로 이동
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
