CREATE TABLE logs (
    "id" SERIAL PRIMARY KEY,                             -- ID interno autoincremental
    timestamp TIMESTAMP NOT NULL,                        -- Fecha y hora del evento
    action VARCHAR(50) NOT NULL,                         -- Tipo de acción (CREATE, UPDATE, DELETE, etc.)
    "documentNumber" VARCHAR(10),                        -- Documento relacionado (opcional)
    service VARCHAR(50),                                 -- Servicio o módulo que genera el log
    "details" TEXT,                                      -- Descripción del evento
    "receivedAt" TIMESTAMP NOT NULL                      -- Hora en que se recibió el log
);

CREATE TABLE persons (
    "id" SERIAL PRIMARY KEY,                               -- ID interno autoincremental
    "firstName" VARCHAR(30) NOT NULL,                      -- Primer nombre
    "secondName" VARCHAR(30),                              -- Segundo nombre (opcional)
    "lastNames" VARCHAR(60) NOT NULL,                      -- Apellidos
    "birthDate" DATE NOT NULL,                             -- Fecha de nacimiento
    "gender" VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')) NOT NULL,
    "email" VARCHAR(100) UNIQUE NOT NULL,                  -- Correo único
    "phone" VARCHAR(10) CHECK (phone ~ '^[0-9]{10}$') NOT NULL,  -- Solo números de 10 dígitos
    "documentNumber" VARCHAR(10) UNIQUE NOT NULL,          -- Número de documento
    "documentType" VARCHAR(30) CHECK ("documentType" IN ('Citizen ID', 'ID Card')) NOT NULL,
    "photoUrl" TEXT                                       -- URL opcional de la foto
);

CREATE TABLE ragLogs (
    "id" SERIAL PRIMARY KEY,                               -- ID interno autoincremental
    timestamp TIMESTAMP DEFAULT NOW(),                   -- Momento en que se hizo la consulta
    "question" TEXT NOT NULL,                              -- Pregunta del usuario en lenguaje natural
    "sqlExpression" TEXT,                                  -- Consulta SQL generada por el modelo
    "resultJson" JSONB,                                    -- Resultado obtenido (formato JSON)
    "responseGenerated" TEXT,                              -- Respuesta generada por el modelo en lenguaje natural
    "userName" VARCHAR(100),                               -- Usuario o cliente que hizo la pregunta
    "createdAt" TIMESTAMP DEFAULT NOW()                    -- Hora en que se guardó el log
);
