from typing import Dict, Any
from app.rag.utils import normalize_string


def map_person_from_api(p: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mapea la estructura del backend al formato del frontend.
    Si vienen nombres distintos, este mapper los normaliza.
    """
    return {
        "primer_nombre": normalize_string(
            p.get("primer_nombre") or
            p.get("firstName")
        ),
        "segundo_nombre": normalize_string(
            p.get("segundo_nombre") or
            p.get("secondName")
        ),
        "apellidos": normalize_string(
            p.get("apellidos") or
            p.get("lastNames")
        ),
        "fecha_nacimiento": normalize_string(
            p.get("birthDate")
        ),
        "genero": normalize_string(
            p.get("gender")
        ),
        "tipo_documento": normalize_string(
            p.get("tipo_documento") or
            p.get("documentType")
        ),
        "nro_documento": normalize_string(
            p.get("nro_documento") or
            p.get("documentNumber") or
            p.get("nroDocumento")
        ),
        "correo": normalize_string(
            p.get("correo") or
            p.get("email")
        ),
        "foto": p.get("foto") or p.get("photoUrl") or None,
    }
