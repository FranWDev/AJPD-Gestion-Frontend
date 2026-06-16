# AJPD Gestión Asociación - Frontend

Este es el frontend del sistema de gestión de la **Asociación Juvenil Proyecto Dubini (AJPD)**. Está desarrollado utilizando **Angular v22.0.0** con una arquitectura moderna de **componentes standalone** y detección de cambios **Zoneless** para un rendimiento óptimo.

---

## 🎨 Diseño y Estética

El diseño está optimizado para escritorio (desktop-first) pero con adaptabilidad móvil total, ofreciendo una experiencia seria, premium e intuitiva. 

### Paleta de Colores de la Asociación
La aplicación utiliza variables CSS personalizadas definidas en [styles.css](file:///home/franchu/Escritorio/AJPD-GestionMiembros/front/src/styles.css):
* `--color-primary`: `#10234e` (Azul oscuro corporativo)
* `--color-secondary`: `#ca4353` (Rojo frambuesa)
* `--color-accent`: `#fa9336` (Naranja)
* `--color-background`: `#e5e0e2` (Fondo gris claro)
* `--color-blue-light`: `#7db3c6` (Azul claro)
* `--color-pink`: `#af7084` (Rosa viejo)
* `--color-peach`: `#f7b487` (Melocotón)
* `--color-blue-medium`: `#4462aa` (Azul intermedio)
* `--color-blue-sky`: `#54a4bc` (Azul cielo)

---

## 🛠️ Tecnologías Clave

* **Framework:** Angular 22.0.0 (Standalone Components, Zoneless change detection).
* **Lenguaje:** TypeScript 6.
* **Estilos:** Vanilla CSS (sin frameworks restrictivos de CSS) para máximo control estético, micro-animaciones suaves y transiciones de estado.
* **PWA (Progressive Web App):** Configurado con `@angular/service-worker` para cachear recursos estáticos y habilitar inicio ultra-rápido y offline.
* **Reactividad:** RxJS para flujos de datos asíncronos y debounce de búsquedas en tiempo real.
* **Gestión de Texto Enriquecido:** EditorJS integrado para la redacción y maquetación de noticias web.

---

## 📁 Estructura del Código Fuente

La estructura está organizada bajo `src/app/` siguiendo buenas prácticas de modularidad:

```text
src/app/
├── core/                  # Singleton Services, Guards, Interceptors e Interfaces
│   ├── guards/            # AuthGuard para control de rutas
│   ├── interceptors/      # AuthInterceptor (JWT en cabeceras) y HttpErrorInterceptor
│   ├── handlers/          # GlobalErrorHandler para control centralizado de fallos
│   ├── models/            # Interfaces de dominio (miembro.model.ts, web.model.ts, etc.)
│   └── services/          # Servicios core (Auth, Miembros, Cargos, Centros, PWA, etc.)
│
├── features/              # Componentes de página principales (Standalone)
│   ├── login/             # Pantalla de inicio de sesión con JWT / Google OAuth2
│   ├── dashboard/         # Dashboard principal de administración
│   ├── miembros/          # CRUD de Miembros (listados paginados, filtros avanzados)
│   ├── historial/         # Vista cronológica de asignación de cargos (Timeline)
│   ├── maestros/          # Vistas de datos maestros (Cargos y Centros)
│   ├── permisos/          # Pantalla de gestión de permisos por correo de usuario
│   ├── web/               # Panel de control de contenidos de la web (Editor de noticias, Hero, Slider)
│   └── shell/             # Componente base que envuelve la aplicación con Sidebar y Topbar
│
├── shared/                # Componentes comunes, directivas y pipes reutilizables
│   └── components/        # Modales y elementos UI comunes
│       ├── popup/         # Ventana emergente genérica para avisos y errores
│       ├── modal-confirm/ # Modal de confirmación para acciones destructivas/bajas
│       ├── modal-miembro/ # Modal unificado de creación y edición de miembro
│       ├── modal-detail/  # Modal de visualización extendida de miembro
│       ├── modal-documentos/ # Modal CRUD de subida y visualización de DNI/Fotos
│       └── skeleton/      # Marcadores de posición de carga (Skeleton Loaders)
```

---

## ⚙️ Características Destacadas de la UI

1. **Búsqueda Inteligente con Debounce (Pooling):** El filtro de miembros realiza peticiones al servidor con un delay controlado (de 1 segundo tras detener la escritura) para optimizar el consumo de la base de datos.
2. **Sistema de Bajas Visual:** Los miembros dados de baja se diferencian con una estética visual atenuada distinta, y su acción de "Dar de baja" cambia dinámicamente a "Eliminar".
3. **Línea de Tiempo (Timeline):** Tanto en la ficha de miembro como en el historial global de cargos, se utiliza una línea de tiempo vertical animada para mostrar cronológicamente la evolución de los puestos.
4. **Modales Centralizados:** Toda la interacción secundaria se realiza mediante modales genéricos y reutilizables coordinados por el `ModalService`.
5. **Gestión Documental Separada:** El modal de edición de usuarios permite abrir de forma aislada un sub-modal CRUD para subir o eliminar documentos y fotos de perfil (los cuales se sirven mediante enlaces temporales firmados generados por el backend).

---

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos
* **Node.js v22** o superior instalado.
* **npm** instalado.

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Entorno
Asegúrate de configurar los parámetros de conexión en el archivo `.env` o en los archivos de configuración bajo `src/environments/`:
* `src/environments/environment.ts`
* `src/environments/environment.development.ts`

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
O bien:
```bash
ng serve
```
La aplicación se compilará y estará disponible en `http://localhost:4200/`.

---

## 📦 Compilación para Producción

Para compilar el proyecto y generar los archivos optimizados para producción (incluyendo el Service Worker de la PWA):

```bash
npm run build
```
Los archivos compilados se guardarán en la carpeta `dist/`.
