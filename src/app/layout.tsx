import type { Metadata } from "next";
// 1. Import the fonts from Google
import { Playfair_Display, Montserrat, Caveat } from "next/font/google";
import "./globals.css";

// 2. Configure the font instances
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair", // This variable name will be used in Tailwind
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Whisk'd - Authentic Tiramisu",
  description: "Handcrafted Italian Tiramisu made with love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Inject the font variables into the body class */}
      <body className={`${playfair.variable} ${montserrat.variable} ${caveat.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}