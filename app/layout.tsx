import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Fieldwork — Healthcare intelligence",
    description: "Explore healthcare sentiment, model prevention ROI, and plan mobile health outreach. An interactive workspace with clearly labeled synthetic data.",
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
