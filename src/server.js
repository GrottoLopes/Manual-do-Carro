import 'dotenv/config'
import { fastify } from 'fastify'
import { usersRoutes } from './routes/users.js'
import { autosRoutes } from './routes/autos.js'
import { authRoutes } from './routes/auth.js'
import { maintenancesRoutes } from './routes/maintenances.js'

const app = fastify({
    logger: {
        transport: {
            target: 'pino-pretty'
        }
    }
})

app.addHook('onRequest', (request, reply, done) => {
    const origin = request.headers.origin || '*'
    reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (request.method === 'OPTIONS') {
        reply.code(204).send()
        return
    }
    done()
})

app.register(authRoutes)
app.register(usersRoutes)
app.register(autosRoutes)
app.register(maintenancesRoutes)

app.listen({
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.PORT) || 3000
})
