from typing import List, Dict, Any

def build_context_from_persons(persons: List[Dict[str, Any]]) -> str:
    """
    Construye un contexto textual legible para el LLM basado en la lista de personas.
    """
    if not persons:
        return "No hay personas registradas en el sistema."

    lines = []
    for p in persons:
        line = (
            f"ID: {p.get('id', '')} | "
            f"Nombre: {p.get('primer_nombre', '')} {p.get('segundo_nombre', '')} {p.get('apellidos', '')} | "
            f"Fecha de nacimiento: {p.get('fecha_nacimiento', '')} | "
            f"Género: {p.get('genero', '')} | "
            f"Correo: {p.get('correo', '')} | "
            f"Teléfono: {p.get('phone', '')} | "
            f"Documento: {p.get('tipo_documento', '')} {p.get('nro_documento', '')} | "
            f"Foto: {p.get('foto', 'Sin foto')}"
        )
        lines.append(line)

    return "\n".join(lines)
