import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Fieldwork — Healthcare intelligence",
    description: "Explore community health sentiment, assess intervention evidence, model local impact and economic value, and plan health outreach.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
