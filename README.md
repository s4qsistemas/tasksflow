# 🧩 Proyecto TasksFlow — Kanban Empresarial con Trazabilidad de Tareas

## 📘 Descripción General

Este proyecto forma parte del **Taller de Proyecto de Especialidad (TPE401)** de la carrera **Técnico de Nivel Superior en Programación y Análisis de Sistemas** del **Instituto Profesional AIEP**.  
Su propósito es desarrollar una **aplicación web tipo Kanban** para la **gestión centralizada de tareas empresariales**, organizada por **áreas, supervisores y trabajadores**.

La aplicación permitirá crear tableros de tareas, asignar responsables, registrar avances y mantener un **historial de cambios y acciones inspirado en las buenas prácticas de Git**.  
Con ello se busca **mejorar la organización, la comunicación y la trazabilidad** de las actividades cotidianas dentro de las empresas.

---

## 🧠 Problemática

En muchas empresas y organizaciones, la gestión de tareas diarias se realiza de manera **descentralizada**, utilizando hojas de cálculo, correos electrónicos o canales de mensajería dispersos.  
Esta fragmentación **dificulta el control del avance, la trazabilidad y la coordinación** entre áreas y equipos de trabajo.  
Supervisores y empleados carecen de una herramienta unificada que facilite el seguimiento y la colaboración estructurada.

---

## 🚀 Propuesta de Solución

Desarrollar una **aplicación web tipo Kanban** que permita:
- Gestionar tareas por **áreas, supervisores y trabajadores**.  
- Visualizar el flujo de trabajo mediante un tablero con columnas **To Do / In Progress / Done**.  
- Registrar acciones e historial de cambios **inspirado en Git**, permitiendo trazabilidad completa.  
- Facilitar la **organización, comunicación y transparencia** interna de los procesos.

---

## 🎯 Objetivo General

**Gestionar mediante una aplicación web tipo Kanban** la administración centralizada de tareas en empresas, organizada por áreas, supervisores y trabajadores, que permita asignar, registrar y dar seguimiento a actividades cotidianas con trazabilidad de acciones inspirada en Git.

---

## 🎯 Objetivos Específicos

1. Levantar y documentar los requerimientos funcionales y no funcionales del sistema.  
2. Diseñar la arquitectura y el modelo de base de datos relacional.  
3. Implementar una API REST en **Node.js con Express y MySQL2** para la gestión de usuarios, áreas y tareas.  
4. Desarrollar la interfaz web responsiva con tablero Kanban conectado al backend.  
5. Integrar un módulo de **registro de acciones e historial de cambios inspirado en Git**.  
6. Realizar pruebas funcionales, documentación técnica y despliegue básico del sistema.

---

## 💡 Elementos de Innovación

El proyecto propone una **innovación funcional**, aplicando principios de **control de versiones y trazabilidad** (propios del desarrollo de software con Git) a la **gestión de tareas empresariales**.  
Cada tarea contará con un **historial de acciones estructurado**, lo que aporta **transparencia, orden y responsabilidad** entre supervisores y empleados.  
La estructura jerárquica por **áreas, supervisores y trabajadores** permite adaptar la aplicación a distintos tipos de organizaciones.

---

## 🧩 Reflexión: *La Catedral y el Bazar*

El proyecto combina elementos de ambos modelos:
- **Catedral:** planificación estructurada, jerarquía de roles y control organizacional.  
- **Bazar:** colaboración abierta, comunicación y mejora continua.  

Este equilibrio busca fomentar un entorno digital más **colaborativo y eficiente** dentro de las empresas.

---

## ⚖️ Licencia

Este proyecto se distribuye bajo la **Licencia Pública General de GNU (GPL v3)**.  
Esta licencia garantiza que el código fuente permanezca abierto y disponible para todos los usuarios, quienes podrán **usar, estudiar, modificar y redistribuir** el software, siempre que mantengan los mismos términos de libertad en las versiones derivadas.  
La elección de la GPL refuerza el compromiso con la **colaboración, transparencia y desarrollo comunitario**.

---

## 🗂️ Estructura Inicial del Proyecto

```bash
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── db/
│   └── app.js
├── .env.example
├── package.json
├── README.md
└── LICENSE
```

---

## 🗓️ Planificación General (12 semanas)

| Semana | Actividad principal |
|:-------:|---------------------|
| 1–2 | Levantamiento de requerimientos y análisis. |
| 3 | Diseño de arquitectura y modelo de datos. |
| 4–7 | Implementación de API REST. |
| 8–10 | Desarrollo de interfaz Kanban y trazabilidad. |
| 11 | Pruebas funcionales y documentación. |
| 12 | Presentación y despliegue final. |

---

## 🧰 Tecnologías

- **Backend:** Node.js, Express, API REST  
- **Base de datos:** MySQL + mysql2  
- **Frontend:** HTML5, CSS3, JavaScript (con posible uso de EJS o Tailwind CSS)  
- **Versionamiento:** Git y GitHub (con tablero Kanban para Issues y tareas)

---

## 👥 Autor

**Nombre:** Diego Ignacio Alvial Arrepol  
**Carrera:** Técnico Nivel Superior en Programación y Análisis de Sistemas  
**Asignatura:** TPE401 – Taller de Proyecto de Especialidad  
**Institución:** Instituto Profesional AIEP  
**Año:** 2025  

---

## 🧩 Estado del Proyecto

> **Avance 1:** Informe inicial corregido con observaciones del profesor, objetivos SMART actualizados, licencia GPL adoptada, y DFD preliminar completado.  
> **Siguiente:** Elaborar Avance 2 con requerimientos RF/RNF, MER, Casos de Uso, wireframes y base de datos inicial.
