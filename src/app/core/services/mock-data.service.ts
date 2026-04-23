import { Inject, Injectable } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { ITasksRepository, TASKS_REPOSITORY } from '../repositories/tasks.repository';
import { ICategoriesRepository, CATEGORIES_REPOSITORY } from '../repositories/categories.repository';

interface CategorySeed { id: string; name: string; color: string; createdAt: string; }
interface TaskSeed {
  id: string; title: string; description: string | null;
  completed: number; categoryId: string | null; dueDate: string | null;
  sortOrder: number; createdAt: string; updatedAt: string;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function iso(d: Date): string { return d.toISOString(); }

@Injectable({ providedIn: 'root' })
export class MockDataService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(TASKS_REPOSITORY) private readonly tasksRepo: ITasksRepository,
    @Inject(CATEGORIES_REPOSITORY) private readonly categoriesRepo: ICategoriesRepository
  ) {}

  async seedIfEmpty(): Promise<void> {
    await this.db.initialize();
    const count = this.db.query<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM tasks');
    if ((count[0]?.cnt ?? 0) > 0) return;

    const categories = this.buildCategories();
    const tasks = this.buildTasks(categories);

    this.db.runBatch(
      categories.map(c => ({
        sql: `INSERT INTO categories (id, name, color, createdAt) VALUES (?, ?, ?, ?)`,
        params: [c.id, c.name, c.color, c.createdAt],
      }))
    );

    this.db.runBatch(
      tasks.map(t => ({
        sql: `INSERT INTO tasks
                (id, title, description, completed, categoryId, dueDate,
                 sortOrder, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          t.id, t.title, t.description, t.completed,
          t.categoryId, t.dueDate, t.sortOrder, t.createdAt, t.updatedAt,
        ],
      }))
    );

    await this.categoriesRepo.init();
    await this.tasksRepo.init();
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  private buildCategories(): CategorySeed[] {
    const defs = [
      { name: 'Trabajo',        color: '#2E86C1' },
      { name: 'Personal',       color: '#28B463' },
      { name: 'Urgente',        color: '#E74C3C' },
      { name: 'Salud',          color: '#1ABC9C' },
      { name: 'Finanzas',       color: '#F39C12' },
      { name: 'Estudio',        color: '#8E44AD' },
      { name: 'Hogar',          color: '#FF5733' },
      { name: 'Proyecto Alpha', color: '#3498DB' },
      { name: 'Reuniones',      color: '#FFC300' },
      { name: 'Ejercicio',      color: '#95A5A6' },
    ];
    return defs.map((d, i) => ({
      id: `cat-${String(i + 1).padStart(2, '0')}`,
      name: d.name,
      color: d.color,
      createdAt: iso(daysAgo(60 - i * 4)),
    }));
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  private buildTasks(cats: CategorySeed[]): TaskSeed[] {
    // [title, desc | null, status, catIndex, dueDaysOffset, createdDaysAgo]
    // status: 'done' | 'overdue' | 'soon' | 'pending'
    type S = 'done' | 'overdue' | 'soon' | 'pending';
    type Row = [string, string | null, S, number, number, number];

    const rows: Row[] = [
      // ── Trabajo (cat 0) ──────────────────────────────────────────────────
      ['Preparar presentación del Q2',         'Incluir métricas de ventas y KPIs del trimestre.',   'overdue',  0, -5,  20],
      ['Revisar y aprobar PR #42',             'Refactorización del módulo de autenticación.',        'done',     0,  0,  15],
      ['Actualizar documentación de API',      null,                                                   'pending',  0,  0,  10],
      ['Enviar informe semanal al equipo',     'Resumen de avances y bloqueos.',                      'done',     0,  0,   7],
      ['Revisar propuesta de nuevo cliente',   'Cliente del sector financiero.',                       'soon',     0,  8,   5],
      ['Configurar pipeline de CI/CD',         'Jenkins + Docker + SonarQube.',                       'pending',  0,  0,  12],
      ['Reunión de seguimiento stakeholders',  'Preparar deck de 10 slides.',                         'overdue',  0, -3,   8],
      ['Migrar servidor a nueva región',       'us-east-2 → eu-west-1.',                              'soon',     0, 14,   6],
      ['Revisar métricas de rendimiento',      null,                                                   'done',     0,  0,   4],
      ['Escribir especificación técnica',      'Para el módulo de reportes.',                         'pending',  0,  0,  18],

      // ── Personal (cat 1) ─────────────────────────────────────────────────
      ['Llamar al dentista para cita',         null,                                                   'overdue',  1, -7,  14],
      ['Renovar pasaporte',                    'Necesario antes del viaje de junio.',                 'soon',     1, 20,   9],
      ['Organizar fotos del viaje',            null,                                                   'done',     1,  0,  30],
      ['Buscar regalos para cumpleaños',       'Cumpleaños de mamá el próximo mes.',                  'soon',     1, 10,   5],
      ['Actualizar lista de contactos',        null,                                                   'pending',  1,  0,  22],
      ['Planificar vacaciones de verano',      'Opciones: Cartagena, Medellín o Santa Marta.',        'pending',  1,  0,  11],
      ['Ordenar armario de invierno',          null,                                                   'done',     1,  0,  25],
      ['Renovar suscripción de streaming',     null,                                                   'overdue',  1, -2,   3],
      ['Revisar contrato de arrendamiento',    'Vence en 3 semanas.',                                 'soon',     1, 18,   7],
      ['Escribir carta a familiar',            null,                                                   'pending',  1,  0,  16],

      // ── Urgente (cat 2) ──────────────────────────────────────────────────
      ['Pagar factura de electricidad',        '¡Fecha límite vencida!',                              'overdue',  2, -1,   5],
      ['Responder email del jefe',             null,                                                   'done',     2,  0,   2],
      ['Entregar formulario fiscal',           'Multa si no se entrega antes del plazo.',              'overdue',  2, -4,  10],
      ['Reparar fuga de agua en baño',         'Urgente antes de que empeore.',                        'done',     2,  0,   6],
      ['Confirmar reserva de hotel',           'Para el viaje de trabajo del martes.',                 'soon',     2,  4,   3],
      ['Llamar al seguro por accidente',       null,                                                   'done',     2,  0,   8],
      ['Actualizar contraseñas comprometidas', 'Contraseñas filtradas en breach.',                     'pending',  2,  0,   1],
      ['Renovar medicamento urgente',          'Sin stock en farmacia habitual.',                      'overdue',  2, -2,   4],
      ['Firmar contrato antes del viernes',    null,                                                   'soon',     2,  5,   2],
      ['Resolver incidencia en producción',    'Error 500 en endpoint /api/payments.',                'done',     2,  0,   1],

      // ── Salud (cat 3) ────────────────────────────────────────────────────
      ['Cita con médico general',              'Chequeo anual de rutina.',                             'soon',     3,  7,  12],
      ['Comprar vitaminas',                    'Vitamina D y Omega-3.',                                'done',     3,  0,   9],
      ['Revisión oftalmológica anual',         null,                                                   'overdue',  3, -10, 20],
      ['Iniciar dieta mediterránea',           'Plan de 30 días.',                                    'pending',  3,  0,  15],
      ['Cita con dentista',                    'Limpieza y revisión general.',                         'soon',     3, 12,   5],
      ['Hacerse análisis de sangre',           'Hemograma completo y glucosa.',                        'overdue',  3, -6,  18],
      ['Buscar nutricionista recomendado',     null,                                                   'pending',  3,  0,  22],
      ['Revisar resultados de laboratorio',    null,                                                   'done',     3,  0,   7],
      ['Vacuna contra la gripe',               'Antes de la temporada.',                               'soon',     3, 21,   4],
      ['Registrarse en app de salud',          null,                                                   'done',     3,  0,  11],

      // ── Finanzas (cat 4) ─────────────────────────────────────────────────
      ['Declaración de impuestos',             'Renta persona natural.',                               'overdue',  4, -8,  30],
      ['Revisar extracto bancario',            null,                                                   'done',     4,  0,   5],
      ['Transferir ahorro mensual',            'Meta: 20% del ingreso.',                               'pending',  4,  0,   3],
      ['Comparar seguros de auto',             'Mínimo 3 cotizaciones.',                               'soon',     4, 15,  10],
      ['Revisar inversiones de cartera',       null,                                                   'done',     4,  0,  14],
      ['Pagar tarjeta de crédito',             '¡Evitar intereses!',                                  'overdue',  4, -3,   6],
      ['Abrir cuenta de ahorro nueva',         'Buscar CDT con mejor tasa.',                           'pending',  4,  0,  20],
      ['Consultar con asesor financiero',      'Planificación del próximo año.',                       'soon',     4, 25,   8],
      ['Actualizar presupuesto mensual',       null,                                                   'done',     4,  0,  16],
      ['Revisar gastos del mes pasado',        null,                                                   'pending',  4,  0,   2],

      // ── Estudio (cat 5) ──────────────────────────────────────────────────
      ['Completar módulo 4 de curso online',   'Curso de TypeScript avanzado.',                        'done',     5,  0,  20],
      ['Leer capítulo 3 del libro técnico',    'Clean Architecture — Robert Martin.',                  'pending',  5,  0,  12],
      ['Practicar ejercicios de algoritmos',   'LeetCode: arrays y strings.',                          'soon',     5,  6,   8],
      ['Ver tutoriales de nuevo framework',    'Angular Signals.',                                     'pending',  5,  0,  15],
      ['Terminar proyecto final del curso',    'Proyecto de e-commerce con Angular.',                  'overdue',  5, -9,  25],
      ['Repasar apuntes de la semana',         null,                                                   'done',     5,  0,   4],
      ['Inscribirse en conferencia tech',      'NgConf 2026.',                                         'soon',     5, 19,   6],
      ['Estudiar para certificación AWS',      'Associate Developer.',                                 'pending',  5,  0,  30],
      ['Entregar tarea del curso',             'Módulo de pruebas unitarias.',                         'overdue',  5, -4,  10],
      ['Preparar exposición grupal',           'Tema: microservicios.',                                'soon',     5, 11,   7],

      // ── Hogar (cat 6) ────────────────────────────────────────────────────
      ['Limpiar nevera y organizar alimentos', null,                                                   'done',     6,  0,  10],
      ['Reparar bombilla del pasillo',         null,                                                   'overdue',  6, -5,  12],
      ['Comprar detergente y limpiadores',     null,                                                   'pending',  6,  0,   4],
      ['Regar todas las plantas',              null,                                                   'done',     6,  0,   3],
      ['Revisar sistema de alarma',            'Llamar al técnico.',                                   'soon',     6, 13,   8],
      ['Limpiar filtros de aire acondicionado',null,                                                   'pending',  6,  0,  20],
      ['Comprar mueble para sala',             'Mueble TV moderno.',                                   'soon',     6, 17,   5],
      ['Pintar habitación de invitados',       'Color: blanco roto.',                                  'pending',  6,  0,  25],
      ['Revisar plomería del baño',            'Goteo en llave.',                                      'overdue',  6, -7,  15],
      ['Organizar garaje',                     null,                                                   'pending',  6,  0,  35],

      // ── Proyecto Alpha (cat 7) ───────────────────────────────────────────
      ['Definir arquitectura módulo pagos',    'Decisión: microservicio vs monolito.',                 'done',     7,  0,  40],
      ['Implementar autenticación OAuth2',     'Google + GitHub providers.',                           'soon',     7,  9,  15],
      ['Crear wireframes pantalla principal',  'Figma — revisión con UX.',                             'done',     7,  0,  30],
      ['Revisar backlog del sprint',           'Sprint 5 — 2 semanas.',                                'pending',  7,  0,   5],
      ['Hacer demo para inversores',           'Ronda seed — 10 min de pitch.',                        'soon',     7, 16,  10],
      ['Corregir bugs del release 1.2',        'Issues #88, #91 y #95.',                               'overdue',  7, -2,   8],
      ['Actualizar roadmap del producto',      'Q3 y Q4 2026.',                                        'pending',  7,  0,  12],
      ['Diseñar esquema de base de datos',     'Entidades: User, Order, Product.',                     'done',     7,  0,  45],
      ['Integrar pasarela de pagos',           'Stripe API v3.',                                       'soon',     7, 22,  18],
      ['Configurar monitoreo de errores',      'Sentry + alertas en Slack.',                           'pending',  7,  0,   6],

      // ── Reuniones (cat 8) ────────────────────────────────────────────────
      ['Preparar agenda reunión directivos',   'Martes 9am — sala de juntas.',                         'overdue',  8, -1,   5],
      ['Enviar minuta reunión del lunes',      null,                                                   'done',     8,  0,   7],
      ['Organizar team building trimestral',   'Actividad outdoor.',                                   'soon',     8, 28,  14],
      ['Confirmar asistencia a conferencia',   null,                                                   'done',     8,  0,  10],
      ['Agendar 1:1 con mentor',               'Temas: carrera y objetivos.',                          'pending',  8,  0,   8],
      ['Preparar presentación cliente',        'Demo del módulo de reportes.',                         'soon',     8,  6,   4],
      ['Revisar notas de reunión anterior',    null,                                                   'done',     8,  0,   3],
      ['Coordinar horarios con equipo remoto', 'Zona horaria: EST vs COT.',                            'pending',  8,  0,  11],
      ['Organizar retro del sprint',           'Herramienta: Miro.',                                   'soon',     8, 10,   2],
      ['Enviar recordatorio reunión semanal',  null,                                                   'overdue',  8, -3,   6],

      // ── Ejercicio (cat 9) ────────────────────────────────────────────────
      ['Correr 5km en el parque',              null,                                                   'done',     9,  0,   5],
      ['Ir al gimnasio — rutina de piernas',   null,                                                   'pending',  9,  0,   2],
      ['Clase de yoga por la mañana',          null,                                                   'done',     9,  0,   8],
      ['Inscribirse en carrera 10K',           'Carrera Ciudad de Bogotá.',                            'soon',     9, 24,   6],
      ['Comprar zapatillas deportivas',        'Talla 42 — neutral para running.',                     'pending',  9,  0,  10],
      ['Revisar rutina con trainer',           'Ajuste de pesos y series.',                            'soon',     9,  7,   4],
      ['Completar reto 30 días de plancha',    'Día 18/30.',                                           'overdue',  9, -6,  18],
      ['Nadar 30 minutos',                     null,                                                   'done',     9,  0,   3],
      ['Ir en bicicleta al trabajo',           null,                                                   'pending',  9,  0,   1],
      ['Programar clase de natación',          null,                                                   'soon',     9, 12,   9],
    ];

    return rows.map(([title, desc, status, catIdx, dueDays, createdDays], i) => {
      const catId = cats[catIdx as number].id;
      const created = daysAgo(createdDays as number);
      const completed = status === 'done' ? 1 : 0;
      let dueDate: string | null = null;

      if (status === 'overdue') dueDate = iso(daysAgo(Math.abs(dueDays as number)));
      else if (status === 'soon') dueDate = iso(daysFromNow(dueDays as number));

      return {
        id: `task-${String(i + 1).padStart(3, '0')}`,
        title: title as string,
        description: desc as string | null,
        completed,
        categoryId: catId,
        dueDate,
        sortOrder: i,
        createdAt: iso(created),
        updatedAt: iso(created),
      };
    });
  }
}
