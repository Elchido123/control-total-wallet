# API Reference — Control Total Wallet

## Autenticación

Todas las rutas protegidas requieren sesión activa via NextAuth.js.
Las peticiones no autenticadas retornan `401 { error: "No autorizado" }`.

## Wallet

### GET /api/wallet/balance

Retorna el saldo y estado de la tarjeta principal.

**Response:**
```json
{
  "saldo": 12450,
  "numero": "**** **** **** 4523",
  "limite": 19000,
  "activa": true,
  "bloqueada": false
}
```

### POST /api/wallet/topup

Deposita fondos a la wallet.

**Body:**
```json
{
  "monto": 500,
  "concepto": "Depósito"
}
```

## Tarjetas

### GET /api/cards

Lista todas las tarjetas del usuario.

### POST /api/cards

Agrega una nueva tarjeta.

**Body:**
```json
{
  "numero": "4111111111111111",
  "titular": "Juan Pérez",
  "expiracion": "12/28",
  "cvv": "123",
  "banco": "BBVA"
}
```

### PUT /api/cards/[id]

Actualiza una tarjeta (activa, bloqueada, limite, saldo).

**Body:**
```json
{
  "activa": false,
  "limite": 15000
}
```

## Transacciones

### GET /api/transactions

Lista transacciones con filtros opcionales.

**Query params:** `tipo=gasto`, `estado=approved`, `limite=20`, `offset=0`

**Response:**
```json
{
  "data": [...],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### POST /api/transactions

Crea una nueva transacción con validación anti-fraud completa.

**Body:**
```json
{
  "storeId": "mercadolibre",
  "monto": 350,
  "concepto": "Compra de prueba"
}
```

La API ejecuta el FraudPipeline automáticamente:
1. Verifica tarjeta existe y está activa
2. Verifica cooldown (tarjeta bloqueada)
3. Verifica límite de monto ($19,000 MXN máx)
4. Verifica saldo suficiente
5. Verifica límite diario (2 transacciones/día)
6. Asigna proxy rotado
7. Descuenta saldo y crea transacción

### POST /api/transactions/confirm

Confirma o rechaza una transacción pendiente.

**Body:**
```json
{
  "transactionId": 5,
  "status": "approved"
}
```

## Anti-Fraud

### GET /api/antifraud/status

Estado actual del sistema anti-fraud.

**Response:**
```json
{
  "dailyUsage": 1,
  "dailyLimit": 2,
  "cooldownActive": false,
  "cardActive": true,
  "cardBlocked": false,
  "cooldownEscalation": 0
}
```

### POST /api/antifraud/pipeline

Ejecuta la validación anti-fraud sin crear transacción.

**Body:**
```json
{
  "monto": 350,
  "storeId": "mercadolibre"
}
```

**Response:**
```json
{
  "passed": true,
  "checks": [...],
  "canProceed": true
}
```

## Integración

### GET /api/integration/sites

Lista sitios soportados. Filtro opcional: `?hostname=mercadolibre.com.mx`

### POST /api/integration

Procesa un pago desde integración externa.

**Body:**
```json
{
  "site": "mercadolibre.com.mx",
  "monto": "350.00",
  "url": "https://www.mercadolibre.com.mx/item/..."
}
```

## Usuario

### GET /api/user

Retorna perfil del usuario autenticado.

### PUT /api/user

Actualiza perfil del usuario.

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "direccion": "Calle 123",
  "telefono": "555-1234"
}
```
