import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "이력서 빌더",
  description: "대화하며 완성하는 이력서. 원하는 방향을 이야기하면 이력서에 바로 반영됩니다.",
  openGraph: {
    title: "이력서 빌더",
    description: "대화하며 완성하는 이력서",
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
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
