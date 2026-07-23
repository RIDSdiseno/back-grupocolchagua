export type DireccionMarcacionTalana =
  | "E"
  | "X"
  | "O";

export interface TalanaMarcaPersona {
  id: number;
  rut: string;

  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string | null;
  sexo?: string | null;

  [key: string]: unknown;
}

export interface TalanaMarca {
  id: number;
  person: TalanaMarcaPersona;

  office?: number | null;
  photo?: string | null;

  TS: string;
  direction: DireccionMarcacionTalana;

  message?: string | null;
  checksum?: string | null;

  lat?: string | null;
  lng?: string | null;

  sourceMark?: string | null;
  markingMethod?: string | null;
  phoneModel?: string | null;
  staticmap?: string | null;

  [key: string]: unknown;
}

export interface TrabajadorConMarcacionesTalana {
  talanaPersonaId: number;
  rut: string;

  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string | null;
  nombreCompleto: string;

  cantidadMarcaciones: number;
  primeraMarcacion: string;
  ultimaMarcacion: string;

  oficinas: number[];
  metodosMarcacion: string[];
}

export interface ResultadoTrabajadoresConMarcacionesTalana {
  empresaId: number;
  desde: string;
  hasta: string;

  totalMarcaciones: number;
  marcacionesProcesadas: number;
  paginasProcesadas: number;

  trabajadoresUnicos: number;
  trabajadores: TrabajadorConMarcacionesTalana[];
}