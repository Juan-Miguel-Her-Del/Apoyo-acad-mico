import Link from "next/link";

export default function PrivacyStatusPage() {
  return <main className="app-shell">
    <h1>Privacidad de las cuentas estudiantiles</h1>
    <p>El aviso y la política para cuentas de estudiantes están en revisión. Esta página informa del estado del proyecto; no constituye una política aprobada ni solicita autorización.</p>
    <p>Actualmente no se habilita el registro de estudiantes ni se reciben datos de menores o representantes para crear cuentas. La demostración local permite cuentas de personas adultas con datos de prueba.</p>
    <p>Antes de abrir el registro se publicarán aquí las finalidades, los datos necesarios, el responsable, la forma de ejercer derechos y la versión aprobada del aviso. También se definirá cómo verificar al representante.</p>
    <Link href="/">Volver a la aplicación</Link>
  </main>;
}
