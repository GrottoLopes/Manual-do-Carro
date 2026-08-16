import { isAuth } from "../middlewares/is-auth.js"
import { prisma } from "../lib/prisma.js"

const maintenanceSchema = {
    body: {
        type: 'object',
        required: ['placa', 'descricao', 'km'],
        additionalProperties: false,
        properties: {
            placa: { type: 'string' },
            descricao: { type: 'string' },
            custo: { type: 'number' },
            km: { type: 'number' },
            data: { type: 'string', format: 'date' }
        }
    }
}

function toApiFormat(maintenance) {
    return {
        id: maintenance.id,
        placa: maintenance.vehicle?.plate,
        descricao: maintenance.description,
        custo: maintenance.cost,
        km: maintenance.km,
        data: maintenance.date
    }
}

export async function maintenancesRoutes(app) {
    // Adiciona uma manutenção a um carro do usuário autenticado, buscando pela placa
    app.post('/manutencoes', { schema: maintenanceSchema, onRequest: [isAuth] }, async (request, response) => {
        const { placa, descricao, custo, km, data } = request.body

        try {
            const vehicle = await prisma.vehicle.findUnique({ where: { plate: placa } })

            if (!vehicle || vehicle.ownerId !== request.userId) {
                return response.status(404).send({ status: false, message: "Car not found" })
            }

            const maintenance = await prisma.maintenance.create({
                data: {
                    description: descricao,
                    cost: custo,
                    km,
                    date: data ? new Date(data) : undefined,
                    vehicleId: vehicle.id
                }
            })

            return response.status(201).send({ status: true, message: "Maintenance added", manutencao: toApiFormat({ ...maintenance, vehicle }) })
        } catch (e) {
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error creating maintenance" })
        }
    })

    // Lista as manutenções feitas pela placa do carro
    app.get('/manutencoes/:placa', { onRequest: [isAuth] }, async (request, response) => {
        const { placa } = request.params

        try {
            const vehicle = await prisma.vehicle.findUnique({ where: { plate: placa } })

            if (!vehicle || vehicle.ownerId !== request.userId) {
                return response.status(404).send({ status: false, message: "Car not found" })
            }

            const maintenances = await prisma.maintenance.findMany({
                where: { vehicleId: vehicle.id },
                orderBy: { date: 'desc' }
            })

            return response.status(200).send(
                maintenances.map(m => toApiFormat({ ...m, vehicle }))
            )
        } catch (e) {
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error listing maintenances" })
        }
    })
}
