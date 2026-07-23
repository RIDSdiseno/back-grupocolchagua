export interface TalanaPersona {
  id: number | string;
  rut: string;

  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string | null;

  sexo?: string | null;
  fechaNacimiento?: string | null;
  nacionalidad?: string | null;

  email?: string | null;
  telefono?: string | null;

  [key: string]: unknown;
}

export interface DiagnosticoBusquedaTalana {
  empresaId: number;
  rutOriginal: string;
  rutConsultado: string;
  totalTalana: number;
  resultadosRecibidos: number;
  rutsDevueltos: string[];
}

export interface ResultadoBusquedaTalana {
  persona: TalanaPersona | null;
  diagnostico: DiagnosticoBusquedaTalana;
}