/** Visible design for AP-258. No personal data can be entered or submitted. */
import Link from "next/link";

export default function StudentRegistrationPreview() {
  return <details className="account-panel" style={{ gridColumn: "1 / -1" }}>
    <summary>Registro de estudiantes: diseño pendiente de autorización</summary>
    <p>Esta pantalla muestra los campos previstos para una cuenta estudiantil. Aún no recibe datos ni crea cuentas. El aviso, la política y el método de verificación del representante deben aprobarse antes de habilitarla.</p>
    <p><Link href="/privacidad">Estado del aviso y la política de privacidad</Link></p>
    <fieldset disabled aria-describedby="student-registration-status">
      <legend>Datos mínimos previstos</legend>
      <label>Correo de la cuenta <input type="email" autoComplete="off" placeholder="Correo electrónico" /></label>
      <label>Contraseña <input type="password" autoComplete="off" placeholder="Mínimo 12 caracteres" /></label>
      <label>Autorización del representante <input type="text" autoComplete="off" placeholder="Verificación pendiente de definir" /></label>
      <button type="button">Crear cuenta estudiantil</button>
    </fieldset>
    <p id="student-registration-status" role="status">Registro estudiantil no disponible. No escribas aquí datos de estudiantes ni de representantes.</p>
    <p>Mensajes previstos: «Revisa los datos e inténtalo de nuevo» si faltan datos o son inválidos; «Autorización requerida» si no existe una verificación vigente; «Inténtalo de nuevo más tarde» si falla el servicio. Un correo duplicado tendrá el mismo mensaje que otro error de datos.</p>
  </details>;
}
