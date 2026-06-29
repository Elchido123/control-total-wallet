# Control Total Wallet

Plataforma de gestión de pagos digitales con motor anti-fraud integrado.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estado | Zustand + TanStack Query |
| UI | Tailwind CSS v4 |
| Backend | Next.js API Routes |
| DB | SQLite + Drizzle ORM |
| Auth | NextAuth.js v5 |
| Anti-Fraud | Proxy rotator, fingerprint, Playwright |
| Testing | Playwright (E2E) + Vitest (unit) |

## Requisitos

- Node.js 22+
- npm

## Instalación

```bash
git clone <repo>
cd control-total-wallet
npm install
```

## Configuración

```bash
cp .env.example .env.local
# Editar .env.local con tu configuración
```

## Base de datos

```bash
# Push schema a SQLite
npm run db:generate
npm run db:migrate

# Seed con datos de prueba
npm run db:seed
```

## Desarrollo

```bash
npm run dev
# Abrir http://localhost:3000
```

## Usuarios de prueba

| Email | Contraseña | Nombre |
|-------|-----------|--------|
| juan@example.com | 1234 | Juan Pérez |
| maria@example.com | password456 | María López |
| carlos@example.com | password789 | Carlos García |

## Tests

```bash
# Tests unitarios
npx vitest run

# Tests E2E (requiere Playwright browsers)
npx playwright install
npx playwright test
```

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login
│   ├── (dashboard)/       # Dashboard protegido
│   ├── pay/               # Página iframe para bookmarklet
│   └── api/               # API Routes
├── components/
│   ├── ui/                # Componentes base
│   ├── wallet/            # Wallet (balance, transacciones)
│   ├── stores/            # Tiendas y pagos
│   ├── cards/             # Gestión de tarjetas
│   └── antifraud/         # Indicadores anti-fraud
├── lib/
│   ├── db/                # Drizzle schema + client
│   ├── anti-fraud/        # Motor anti-fraud
│   ├── payment/           # Procesamiento de pagos
│   ├── integration/       # Bookmarklet + bridge
│   └── utils/             # Utilidades
├── store/                 # Zustand stores
├── hooks/                 # Custom hooks
└── styles/                # Tailwind CSS
```

## API Routes

### Auth
- `POST /api/auth/[...nextauth]` - Login/Logout

### Wallet
- `GET /api/wallet/balance` - Saldo actual
- `POST /api/wallet/topup` - Depositar saldo

### Tarjetas
- `GET /api/cards` - Listar tarjetas
- `POST /api/cards` - Crear tarjeta
- `GET /api/cards/[id]` - Ver tarjeta
- `PUT /api/cards/[id]` - Actualizar tarjeta
- `DELETE /api/cards/[id]` - Eliminar tarjeta

### Transacciones
- `GET /api/transactions` - Listar (filtros: tipo, estado, limite, offset)
- `POST /api/transactions` - Crear (con validación anti-fraud)
- `POST /api/transactions/confirm` - Confirmar/rechazar

### Anti-Fraud
- `GET /api/antifraud/status` - Estado del sistema
- `GET/POST /api/antifraud/rotate-proxy` - Rotación de proxy
- `POST /api/antifraud/pipeline` - Validación pre-pago

### Integración
- `GET /api/integration/sites` - Sitios soportados
- `POST /api/integration` - Procesar pago externo

### Usuario
- `GET/PUT /api/user` - Perfil de usuario

## Bookmarklet

Arrastra este enlace a tu barra de marcadores:

```
javascript:(function(){var s=document.createElement("script");s.src="https://app.controltotalwallet.com/bookmarklet.js";document.body.appendChild(s);})();
```

## Deploy

### Vercel

```bash
npx vercel --prod
```

### Docker

```bash
docker build -t control-total-wallet .
docker run -p 3000:3000 control-total-wallet
```

## Licencia

MIT
