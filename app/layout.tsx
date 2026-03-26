import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "HealthROI – Calculate Your Company's Health Cost",
    description: "Discover how much preventable illness is costing your company annually, and what a mobile health unit could save you. Powered by AI.",
    openGraph: {
        title: "HealthROI – AI-Powered Healthcare Cost Calculator",
        description: "Calculate your company's annual healthcare burden and ROI from preventative screenings in seconds.",
        type: "website",
    },
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} antialiased`}>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </body>
        </html>
    );
}
