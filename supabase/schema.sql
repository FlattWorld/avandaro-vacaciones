-- =============================================================================
-- Schema: Sistema de Vacaciones Hotel Avándaro
-- Ejecutar en Supabase SQL Editor (en orden)
-- =============================================================================

-- Tipos enum
CREATE TYPE employee_role AS ENUM ('empleado', 'rh');
CREATE TYPE subcompany AS ENUM (
  'AOT CRA',
  'AOT CTM',
  'AOT VILLAS',
  'CONFIANZA AOT',
  'CONFIANZA DASA',
  'CORP'
);
CREATE TYPE request_status AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- =============================================================================
-- Tabla: employees
-- =============================================================================
CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  role        employee_role NOT NULL DEFAULT 'empleado',
  subcompany  subcompany NOT NULL,
  hire_date   DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sincronizar employees con auth.users vía email
-- El empleado debe existir en esta tabla para poder iniciar sesión con OTP

-- =============================================================================
-- Tabla: vacation_periods
-- =============================================================================
CREATE TABLE vacation_periods (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_year    INT NOT NULL,                  -- año del aniversario (1, 2, 3…)
  start_date     DATE NOT NULL,                 -- fecha del aniversario
  expiry_date    DATE NOT NULL,                 -- start_date + expiry_months
  days_assigned  INT NOT NULL DEFAULT 0,
  days_bonus     INT NOT NULL DEFAULT 0,        -- días extra otorgados por RH
  days_used      INT NOT NULL DEFAULT 0,
  is_advance     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_employee_period UNIQUE (employee_id, period_year)
);

-- =============================================================================
-- Tabla: vacation_rules
-- =============================================================================
CREATE TABLE vacation_rules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcompany     subcompany NOT NULL,
  year_from      INT NOT NULL,                  -- a partir del año laboral X
  year_to        INT,                           -- hasta el año laboral Y (NULL = sin límite)
  days_assigned  INT NOT NULL,
  expiry_months  INT NOT NULL DEFAULT 18,
  valid_from     DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to       DATE,                          -- NULL = vigente
  created_by     UUID NOT NULL REFERENCES employees(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Tabla: vacation_requests
-- =============================================================================
CREATE TABLE vacation_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_id        UUID NOT NULL REFERENCES vacation_periods(id) ON DELETE CASCADE,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  total_days       INT NOT NULL,
  status           request_status NOT NULL DEFAULT 'pendiente',
  is_advance       BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  reviewed_by      UUID REFERENCES employees(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  submitted_by     UUID REFERENCES employees(id),  -- RH que registró la solicitud a nombre del empleado
  period_consumption JSONB,                         -- distribución FIFO: [{period_id, days}, ...]
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (total_days > 0)
);

-- =============================================================================
-- Índices
-- =============================================================================
CREATE INDEX idx_vacation_periods_employee ON vacation_periods(employee_id);
CREATE INDEX idx_vacation_requests_employee ON vacation_requests(employee_id);
CREATE INDEX idx_vacation_requests_period ON vacation_requests(period_id);
CREATE INDEX idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX idx_vacation_rules_subcompany ON vacation_rules(subcompany);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_rules ENABLE ROW LEVEL SECURITY;

-- Función auxiliar: verifica que un email exista en employees (usada en el login OTP)
-- SECURITY DEFINER permite ejecutarla sin sesión activa (antes del login)
CREATE OR REPLACE FUNCTION check_employee_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM employees WHERE email = p_email)
$$;

-- Función auxiliar: obtiene el rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION get_current_employee_role()
RETURNS employee_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM employees WHERE email = auth.email()
$$;

-- Función auxiliar: obtiene el id del empleado autenticado actual
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM employees WHERE email = auth.email()
$$;

-- employees: empleado ve solo su fila; rh ve todas
CREATE POLICY "empleado_ve_su_registro" ON employees
  FOR SELECT USING (
    email = auth.email() OR get_current_employee_role() = 'rh'
  );

CREATE POLICY "rh_gestiona_empleados" ON employees
  FOR ALL USING (get_current_employee_role() = 'rh');

-- vacation_periods: empleado ve sus periodos; rh ve todos
CREATE POLICY "empleado_ve_sus_periodos" ON vacation_periods
  FOR SELECT USING (
    employee_id = get_current_employee_id() OR get_current_employee_role() = 'rh'
  );

CREATE POLICY "rh_gestiona_periodos" ON vacation_periods
  FOR ALL USING (get_current_employee_role() = 'rh');

-- vacation_requests: empleado ve e inserta las suyas; rh ve y modifica todas
CREATE POLICY "empleado_ve_sus_solicitudes" ON vacation_requests
  FOR SELECT USING (
    employee_id = get_current_employee_id() OR get_current_employee_role() = 'rh'
  );

CREATE POLICY "empleado_inserta_solicitud" ON vacation_requests
  FOR INSERT WITH CHECK (
    employee_id = get_current_employee_id()
  );

CREATE POLICY "rh_gestiona_solicitudes" ON vacation_requests
  FOR ALL USING (get_current_employee_role() = 'rh');

-- vacation_rules: todos leen; solo rh escribe
CREATE POLICY "todos_leen_reglas" ON vacation_rules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "rh_gestiona_reglas" ON vacation_rules
  FOR ALL USING (get_current_employee_role() = 'rh');

-- =============================================================================
-- Datos iniciales: reglas de vacaciones
-- Año 1 = 12 días para todas las subempresas (obligatorio por ley)
-- AOT CTM desde año 2 tiene +1 día sobre la escala general
-- Insertar después de crear el primer empleado RH
-- =============================================================================

-- NOTA: Ejecutar este bloque solo después de insertar el primer empleado RH
-- y reemplazar 'UUID_DEL_RH' con el id real del empleado RH.

/*
INSERT INTO vacation_rules (subcompany, year_from, year_to, days_assigned, expiry_months, created_by, notes) VALUES
-- Año 1 universal
('AOT CRA',       1, 1,    12, 18, 'UUID_DEL_RH', 'Año 1 - ley federal'),
('AOT CTM',       1, 1,    12, 18, 'UUID_DEL_RH', 'Año 1 - ley federal'),
('AOT VILLAS',    1, 1,    12, 18, 'UUID_DEL_RH', 'Año 1 - ley federal'),
('CONFIANZA AOT', 1, 1,    12, 18, 'UUID_DEL_RH', 'Año 1 - ley federal'),
('CONFIANZA DASA',1, 1,    12, 18, 'UUID_DEL_RH', 'Año 1 - ley federal'),
('CORP',          1, 1,    12, 18, 'UUID_DEL_RH', 'Año 1 - ley federal'),
-- Escala general (todas excepto AOT CTM)
('AOT CRA',       2, 4,    14, 18, 'UUID_DEL_RH', 'Años 2-4'),
('AOT CRA',       5, 9,    16, 18, 'UUID_DEL_RH', 'Años 5-9'),
('AOT CRA',       10, NULL,18, 18, 'UUID_DEL_RH', 'Año 10+'),
('AOT VILLAS',    2, 4,    14, 18, 'UUID_DEL_RH', 'Años 2-4'),
('AOT VILLAS',    5, 9,    16, 18, 'UUID_DEL_RH', 'Años 5-9'),
('AOT VILLAS',    10, NULL,18, 18, 'UUID_DEL_RH', 'Año 10+'),
('CONFIANZA AOT', 2, 4,    14, 18, 'UUID_DEL_RH', 'Años 2-4'),
('CONFIANZA AOT', 5, 9,    16, 18, 'UUID_DEL_RH', 'Años 5-9'),
('CONFIANZA AOT', 10, NULL,18, 18, 'UUID_DEL_RH', 'Año 10+'),
('CONFIANZA DASA',2, 4,    14, 18, 'UUID_DEL_RH', 'Años 2-4'),
('CONFIANZA DASA',5, 9,    16, 18, 'UUID_DEL_RH', 'Años 5-9'),
('CONFIANZA DASA',10, NULL,18, 18, 'UUID_DEL_RH', 'Año 10+'),
('CORP',          2, 4,    14, 18, 'UUID_DEL_RH', 'Años 2-4'),
('CORP',          5, 9,    16, 18, 'UUID_DEL_RH', 'Años 5-9'),
('CORP',          10, NULL,18, 18, 'UUID_DEL_RH', 'Año 10+'),
-- AOT CTM: +1 día sobre escala general desde año 2
('AOT CTM',       2, 4,    15, 18, 'UUID_DEL_RH', 'Años 2-4 (+1 acuerdo sindicato)'),
('AOT CTM',       5, 9,    17, 18, 'UUID_DEL_RH', 'Años 5-9 (+1 acuerdo sindicato)'),
('AOT CTM',       10, NULL,19, 18, 'UUID_DEL_RH', 'Año 10+ (+1 acuerdo sindicato)');
*/
