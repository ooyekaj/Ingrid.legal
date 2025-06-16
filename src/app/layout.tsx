import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "Ingrid | Your Filing Assistant",
	description:
		"The first integrated platform to combine a deterministic rules engine with an end-to-end filing workflow.",
	icons: {
		icon: [
			{
				url: "/favicon.svg",
				type: "image/svg+xml",
			},
		],
		shortcut: "/favicon.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${inter.variable} antialiased relative`}>
				<div className="fixed inset-0 -z-10" id="canvas-container"></div>
				{children}
			</body>
		</html>
	);
}
