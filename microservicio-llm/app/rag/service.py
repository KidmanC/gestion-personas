from typing import Dict, Any, List
from app.rag.persons_client import fetch_persons
from app.rag.mapper import map_person_from_api
from app.rag.context_builder import build_context_from_persons
from app.rag.llm_client import call_huggingface
from app.rag.config import MAX_CONTEXT_PERSONS
from app.rag.utils import logger
from app.rag.logs import register_log


def normalize(text: str) -> str:
    return " ".join(text.lower().split())

def filtrar_personas(personas, answer):

    if not answer:
        return []

    nombres_respuesta = [
        normalize(linea)
        for linea in answer.split("\n")
        if linea.strip()
    ]

    resultado = []
    for persona in personas:
        nombre_completo = f"{persona['primer_nombre']} {persona['segundo_nombre']} {persona['apellidos']}".strip()
        nombre_completo_norm = normalize(nombre_completo)

        # Coincidencia exacta o parcial
        if any(n in nombre_completo_norm for n in nombres_respuesta):
            resultado.append(persona)

    return resultado


async def rag_process(consulta: str) -> List[Dict[str, Any]]:
    """
    Lógica principal del endpoint /rag usado por el frontend.
    Debe devolver SOLO la lista de personas.
    """
    logger.info("Ejecutando RAG para consulta: %s", consulta)

    # 1. Obtener personas del microservicio
    persons_raw = await fetch_persons()

    # 2. Mapear personas al formato usado por el frontend
    mapped = [map_person_from_api(p) for p in persons_raw]

    # Si no hay resultados, devolver lista vacía (frontend lo maneja)
    if not mapped:
        return []

    # 3. Construir contexto
    context = build_context_from_persons(mapped[:MAX_CONTEXT_PERSONS])

    # 4. Llamar al LLM (no afecta la respuesta enviada al frontend)
    llm = await call_huggingface(consulta, context)
    respuesta = llm.get("answer")

    personas = filtrar_personas(mapped, respuesta)

    await register_log("LLM_CONSULT", {
        "consulta": consulta,
        "respuesta": respuesta
    })

    # 5. Devolver SOLO la lista mapeada (frontend usa personas)
    return personas


async def rag_full_process(consulta: str) -> Dict[str, Any]:
    """
    Devuelve: personas + respuesta del LLM.
    Perfecto para debugging o endpoints internos.
    """
    persons_raw = await fetch_persons()
    mapped = [map_person_from_api(p) for p in persons_raw]

    context = build_context_from_persons(mapped[:MAX_CONTEXT_PERSONS])
    llm = await call_huggingface(consulta, context)
    respuesta = llm.get("answer")
    personas = filtrar_personas(mapped, respuesta)

    await register_log("LLM_CONSULT", {
        "consulta": consulta,
        "respuesta": respuesta
    })

    return {
        "personas": personas,
        "answer": respuesta,
        "raw": llm.get("raw")
    }
