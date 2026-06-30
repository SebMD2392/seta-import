# SETA IMPORT — Tienda de Controles Remotos

Tienda e-commerce para controles remotos y accesorios. Marca: **SETA IMPORT**.

---

## 🚀 Cómo correr en Visual Studio Code

### Requisitos previos
- [Node.js](https://nodejs.org/) v18 o superior instalado
- [Visual Studio Code](https://code.visualstudio.com/)

### Pasos

1. **Abrir la carpeta en VS Code**
   - File → Open Folder → seleccionar la carpeta `seta-import`

2. **Abrir la terminal integrada**
   - Terminal → New Terminal  
   - O presionar `` Ctrl+` ``

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   - Ir a: `http://localhost:5173`

---

## 🔑 Acceso Administrador

- **PIN por defecto:** `1234`
- Para cambiarlo: editar `ADMIN_PIN` en `src/app/App.tsx`

## 📱 Sistema de WhatsApp (NUEVO)

En modo administrador aparece un botón verde **"WhatsApp: +51 XXX..."** en la barra de productos.

Al hacer clic:
- Puedes cambiar el número de teléfono del destinatario
- El número se guarda en `localStorage` (persiste al recargar)
- Incluye el código de país (Perú = **51** + número)
- Ejemplo: `51987654321`

---

## 📁 Estructura del proyecto

```
seta-import/
├── public/
│   └── logo.png          ← Logo SETA IMPORT
├── src/
│   ├── app/
│   │   └── App.tsx       ← Componente principal
│   ├── styles/
│   │   └── index.css     ← Estilos globales + Tailwind
│   └── main.tsx          ← Punto de entrada
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## ⚙️ Funcionalidades

- **Catálogo** con filtros por marca y búsqueda
- **Carrito** con cantidad y total
- **Pedido por WhatsApp** con mensaje automático
- **Admin panel** (PIN protegido):
  - Agregar / editar / eliminar productos
  - **Cambiar número de WhatsApp** del destinatario ← NUEVO
  - Gestionar marcas con colores personalizados
