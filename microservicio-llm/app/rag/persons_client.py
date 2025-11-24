from app.rag.db import get_connection

async def fetch_persons():
    conn = await get_connection()
    rows = await conn.fetch("""
        SELECT 
            "firstName",
            "secondName",
            "lastNames",
            "birthDate",
            "gender",
            "email",
            "phone",
            "documentNumber",
            "documentType",
            "photoUrl"
        FROM persons
    """)
    await conn.close()

    # Convertir de asyncpg.Record a dict normal
    return [dict(row) for row in rows]
