import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apoyo académico | Tu ruta de estudio",
  description: "Elige grado, materia y tema para preparar tu ruta de aprendizaje.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
