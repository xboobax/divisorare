import "./globals.css";
export const metadata = { title: "Divination Planer", description: "Prognosen und Lineup-Empfehlungen für Sorare Football und NBA" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="de"><body>{children}</body></html>);
}
