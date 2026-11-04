import Link from "next/link";

export default function TermsStatusPage() {
  return <main className="app-shell"><div className="legal-status">
    <p className="eyebrow">Documento en revisión</p><h1>Estado de los términos de uso</h1>
    <p>Los términos definitivos siguen en revisión jurídica. Esta página resume cómo está preparada la cuenta de estudiante mayor de edad y los límites actuales del contenido.</p>
    <h2>Uso de la cuenta</h2>
    <p>La cuenta está dirigida a estudiantes de 18 años o más, incluidos quienes cursan o preparan un grado mediante educación por ciclos o aceleración. Cada persona debe proteger su contraseña y cerrar sesión cuando termine en un computador compartido.</p>
    <p>Las cuentas nuevas requieren confirmar el correo antes del primer acceso. Este paso comprueba el control de la dirección, no verifica la edad ni la identidad.</p>
    <h2>Contenido académico</h2>
    <p>Las preguntas, explicaciones y sugerencias son provisionales y están pendientes de revisión docente. Los resultados ayudan a seguir el recorrido de estudio; no constituyen una evaluación académica validada.</p>
    <h2>Estudiantes menores</h2>
    <p>El registro de menores no está disponible. Se definirá después de la revisión de los documentos y del método de autorización de representantes.</p>
    <p><Link href="/privacidad">Ver estado de privacidad</Link> · <Link href="/#cuenta">Volver a mi cuenta</Link></p>
  </div></main>;
}
