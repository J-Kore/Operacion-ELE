// app/api/auth/[...nextauth]/route.ts
//
// Endpoint único que maneja todo el flujo de Auth.js: signin, signout,
// session, callback. No tocar manualmente — Auth.js genera las rutas
// internas automáticamente a partir del objeto `handlers` exportado
// en auth.ts (que contiene los métodos GET y POST ya armados).

import { handlers } from '@/auth'

export const { GET, POST } = handlers