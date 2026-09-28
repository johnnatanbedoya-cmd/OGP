// Tipo y valor por defecto del formulario de Perfil — en su propio archivo
// (sin "use client") a propósito: un Server Component no puede leer el
// valor real de una constante exportada desde un módulo "use client" (solo
// recibe una referencia opaca para poder renderizar el componente), así que
// `perfilVacio` no puede vivir dentro de perfil-form.tsx si algo del lado
// del servidor necesita usarlo directamente (ver editar/page.tsx).
export type PerfilDefaultValues = {
  razonSer: string;
  criticidadAusencia: string;
  numeroPuestos: string;
  sede: string;
  modalidadTrabajo: string;
  jornada: string;
  claseRiesgoArl: string;
  tipoVinculacion: string;

  autonomiaDecision: string;
  recursoPersonasNivel: string;
  recursoPersonasDescripcion: string;
  recursoDineroNivel: string;
  recursoDineroDescripcion: string;
  recursoEquiposNivel: string;
  recursoEquiposDescripcion: string;
  recursoInfoConfidencialNivel: string;
  recursoInfoConfidencialDescripcion: string;
  recursoMaterialesNivel: string;
  recursoMaterialesDescripcion: string;

  participacionComites: string;

  eppRequerido: string;
  protocolosEmergencia: string;
  rolesSst: string[];
  evaluacionPreocupacional: string;
  evaluacionPeriodica: string;
  evaluacionPostIncapacidad: string;
  evaluacionEgreso: string;
  respSistemaCalidad: string;
  respSistemaAmbiental: string;
  respSistemaSeguridadVial: string;
  respSistemaSeguridadInformacion: string;
  respSistemaSagrilaft: string;

  requisitoEducacionFormal: string;
  requisitoTarjetaProfesional: string;
  requisitoFormacionComplementaria: string;
  requisitoCertificaciones: string;
  requisitoExperienciaGeneral: string;
  requisitoExperienciaEspecifica: string;
  requisitoEquivalencias: string;
  requisitoOtros: string;
  dotacion: string;
  equiposHerramientas: string;

  evidenciaProducto: string;
  evidenciaDesempeno: string;
  evidenciaConocimiento: string;

  funciones: { descripcion: string; frecuencia: string; criterioDesempeno: string; porcentajeTiempo: string }[];
  flujos: { tipo: string; descripcion: string; contraparte: string; contraparteCargoId: string }[];
  riesgos: { tipo: string; descripcion: string; nivel: string; controlesExistentes: string; eppRequerido: string }[];
  ajustes: { tipoBarrera: string; descripcionBarrera: string; apoyoSugerido: string }[];
  competencias: { nombre: string; tipo: string; nivelRequerido: string }[];
  decisiones: { descripcion: string; nivelAutonomia: string }[];
  responsabilidadesSst: { descripcion: string }[];
  indicadores: { nombre: string; formula: string; meta: string; frecuencia: string }[];
};

export const perfilVacio: PerfilDefaultValues = {
  razonSer: "",
  criticidadAusencia: "",
  numeroPuestos: "",
  sede: "",
  modalidadTrabajo: "",
  jornada: "",
  claseRiesgoArl: "",
  tipoVinculacion: "",

  autonomiaDecision: "",
  recursoPersonasNivel: "",
  recursoPersonasDescripcion: "",
  recursoDineroNivel: "",
  recursoDineroDescripcion: "",
  recursoEquiposNivel: "",
  recursoEquiposDescripcion: "",
  recursoInfoConfidencialNivel: "",
  recursoInfoConfidencialDescripcion: "",
  recursoMaterialesNivel: "",
  recursoMaterialesDescripcion: "",

  participacionComites: "",

  eppRequerido: "",
  protocolosEmergencia: "",
  rolesSst: [],
  evaluacionPreocupacional: "",
  evaluacionPeriodica: "",
  evaluacionPostIncapacidad: "",
  evaluacionEgreso: "",
  respSistemaCalidad: "",
  respSistemaAmbiental: "",
  respSistemaSeguridadVial: "",
  respSistemaSeguridadInformacion: "",
  respSistemaSagrilaft: "",

  requisitoEducacionFormal: "",
  requisitoTarjetaProfesional: "",
  requisitoFormacionComplementaria: "",
  requisitoCertificaciones: "",
  requisitoExperienciaGeneral: "",
  requisitoExperienciaEspecifica: "",
  requisitoEquivalencias: "",
  requisitoOtros: "",
  dotacion: "",
  equiposHerramientas: "",

  evidenciaProducto: "",
  evidenciaDesempeno: "",
  evidenciaConocimiento: "",

  funciones: [],
  flujos: [],
  riesgos: [],
  ajustes: [],
  competencias: [],
  decisiones: [],
  responsabilidadesSst: [],
  indicadores: [],
};
