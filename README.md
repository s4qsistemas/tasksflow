# 🧩 TasksFlow — Kanban Empresarial con Trazabilidad de Tareas

## 📘 Descripción general

**TasksFlow** es una aplicación web tipo **Kanban** para la gestión centralizada de tareas en empresas, organizada por **roles** (Root, Admin, Supervisor, User), **áreas**, **equipos** y **proyectos**.

El sistema incorpora un módulo de **trazabilidad inspirado en Git**, registrando acciones e historial de cambios sobre las tareas para mejorar el control, la transparencia y el seguimiento.

> Proyecto académico: **Taller de Proyecto de Especialidad (TPE401)** —  
> **Técnico de Nivel Superior en Programación y Análisis de Sistemas**, **AIEP** (2025).

---

## 🧠 Problemática

En muchas organizaciones la gestión diaria se realiza de forma **descentralizada** (planillas, correos, mensajería), lo que dificulta:

- Control del avance real.
- Coordinación entre áreas/equipos.
- Trazabilidad de cambios y responsables.
- Auditoría y continuidad operativa.

---

## 🚀 Propuesta de solución

Desarrollar una plataforma web que permita:

- Tablero Kanban con columnas **To Do / In Progress / Done**.
- Gestión por **roles** y permisos.
- Asignación de tareas a usuarios/equipos.
- Registro de acciones tipo “commit” para trazabilidad.
- Interfaz web con vistas por rol (Root/Admin/Supervisor/User).

---

## 🎯 Objetivos

### Objetivo general
Gestionar mediante una aplicación web tipo Kanban la administración centralizada de tareas en empresas, organizada por áreas y roles, permitiendo asignar, registrar y dar seguimiento a actividades con trazabilidad de acciones inspirada en Git.

### Objetivos específicos
1. Levantar y documentar requerimientos funcionales y no funcionales.  
2. Diseñar arquitectura y modelo relacional (MER + diseño físico).  
3. Implementar API en **Node.js + Express** con **MySQL (mysql2)**.  
4. Desarrollar interfaz web con tablero Kanban conectado al backend.  
5. Integrar módulo de historial de acciones (commits) para tareas.  
6. Realizar pruebas funcionales, documentación y despliegue básico.

---

## 🧰 Tecnologías

- **Backend:** Node.js, Express  
- **Base de datos:** MySQL + mysql2  
- **Frontend:** EJS, HTML5, CSS3, JavaScript, Tailwind CSS  
- **Sesiones y roles:** express-session  
- **Hashing:** argon2  
- **Control de versiones:** Git / GitHub

---

## 📦 Instalación y ejecución (local)

### Requisitos
- Node.js (LTS recomendado)
- MySQL (local o remoto)
- Variables de entorno configuradas (`.env`)

### Pasos
```bash
# 1) instalar dependencias
npm install

# 2) construir estilos (una vez)
npm run build:css

# 3) levantar servidor
npm start
```

### Desarrollo de estilos (watch)
```bash
npm run dev:css
```

---

## 🗂️ Estructura del proyecto (real)

> Estructura obtenida desde el directorio del repositorio (se omiten `.git/` y `node_modules/`).

```bash
tasksflow/
├── argon2/
│   └── hashPass.js
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── areaController.js
│   ├── authController.js
│   ├── companyController.js
│   ├── projectController.js
│   ├── rootController.js
│   ├── supervisorController.js
│   ├── taskCommitController.js
│   ├── taskController.js
│   └── teamController.js
├── database/
│   ├── create_table.sql
│   └── sql.sql
├── documentacion/
│   └── (diagramas, wireframes, wireflows y material del informe)
├── middlewares/
├── models/
├── public/
│   ├── css/
│   ├── img/
│   ├── js/
│   └── site.webmanifest
├── routes/
├── src/
│   └── styles/
│       └── input.css
├── views/
│   ├── admin.ejs
│   ├── cambiar-password.ejs
│   ├── layout.ejs
│   ├── login.ejs
│   ├── portal.ejs
│   ├── root.ejs
│   ├── supervisor.ejs
│   └── user.ejs
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── postcss.config.js
├── server.js
└── tailwind.config.js
```

---

## ⚖️ Licencia

Este proyecto se distribuye bajo **GNU GPL v3**.  
Permite usar, estudiar, modificar y redistribuir el software manteniendo las mismas libertades en derivados.

---

## 🏷️ Versionamiento y Releases

Se utilizan **Git tags** y **GitHub Releases** para formalidad y trazabilidad:

- Tag semántico sugerido: `vMAJOR.MINOR.PATCH` (ej. `v1.0.0`)
- Cada Release agrupa una versión estable con notas de cambios

Repositorio: https://github.com/s4qsistemas/tasksflow/

---

## 👥 Autor

**Diego Ignacio Alvial Arrepol**  
AIEP — TPE401 (2025)
