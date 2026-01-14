import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./ThemeRegistry";
import { LiveSessionProvider } from "./components/LiveSessionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TikTok Live Comments",
  description: "View TikTok Live comments in real-time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeRegistry>
          <LiveSessionProvider>{children}</LiveSessionProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
