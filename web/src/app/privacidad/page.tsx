import Link from "next/link";

export default function PrivacyStatusPage() {
  return <main className="app-shell">
    <div className="legal-status"><p className="eyebrow">Documento en revisión</p><h1>Privacidad y datos de tu perfil</h1>
      <p>Esta página explica qué datos usa hoy la aplicación. La política de tratamiento de datos todavía necesita completar la revisión jurídica; este resumen no constituye una política aprobada.</p>
      <h2>Estudiantes de 18 años o más</h2>
      <p>La cuenta guarda correo, contraseña protegida mediante hash, nombre o apodo para mostrar, grado que cursas o preparas y resultados de diagnósticos y prácticas. El nombre y el grado se pueden cambiar en «Cuenta»; la cuenta y sus datos se pueden eliminar allí.</p>
      <p>En el registro nuevo, estos datos de perfil y el hash de la contraseña quedan pendientes hasta confirmar el correo. Si se configura el envío, el proveedor de correo recibirá la dirección necesaria para mandar el enlace. Cuando el envío no está configurado, el registro nuevo permanece deshabilitado.</p>
      <p>El grado del perfil sirve para preparar la ruta inicial. Las respuestas y avances quedan asociados a la cuenta para poder consultarlos después. La aplicación no solicita fotografías de documentos ni fechas de nacimiento en este recorrido.</p>
      <h2>Estudiantes menores de edad</h2>
      <p>El registro de menores continúa deshabilitado. El aviso, la política y la verificación del representante están pendientes de aprobación e implementación. No se deben crear cuentas de mayores de edad con datos de menores.</p>
      <h2>Antes de publicar el servicio</h2>
      <p>Falta definir el responsable, el canal de solicitudes de privacidad, la limpieza periódica de registros pendientes, los plazos de conservación y las condiciones del proveedor de correo. Estos puntos deben reflejarse en la versión final revisada de la política.</p>
      <p><Link href="/terminos">Ver estado de los términos</Link> · <Link href="/#cuenta">Volver a mi cuenta</Link></p>
    </div>
  </main>;
}
