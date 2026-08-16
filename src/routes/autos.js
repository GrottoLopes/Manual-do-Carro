import { isAuth } from "../middlewares/is-auth.js"
import { prisma } from "../lib/prisma.js"

const autoSchema = {
    body: {
        type: 'object',
        required: ['placa', 'marca', 'modelo', 'ano', 'cor', 'combustivel', 'km'],
        additionalProperties: false,
        properties: {
            placa: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            ano: { type: 'number' },
            cor: { type: 'string' },
            combustivel: { type: 'string' },
            km: { type: 'number' }
        }
    }
}

const updateAutoSchema = {
    body: {
        type: 'object',
        additionalProperties: false,
        properties: {
            placa: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            ano: { type: 'number' },
            cor: { type: 'string' },
            combustivel: { type: 'string' },
            km: { type: 'number' }
        }
    }
}

// Traduz o registro do banco (em inglês) pro formato que a API já expõe (em português)
function toApiFormat(vehicle) {
    return {
        id: vehicle.id,
        placa: vehicle.plate,
        marca: vehicle.brand,
        modelo: vehicle.model,
        ano: vehicle.year,
        cor: vehicle.color,
        combustivel: vehicle.fuel,
        km: vehicle.km,
        ownerId: vehicle.ownerId
    }
}

export async function autosRoutes(app) {
    // Lista somente os veículos do usuário autenticado
    app.get('/autos', { onRequest: [isAuth] }, async (request, response) => {
        try {
            const autos = await prisma.vehicle.findMany({
                where: { ownerId: request.userId }
            })
            return response.status(200).send(autos.map(toApiFormat))
        } catch (e) {
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error listing vehicles" })
        }
    })

    app.post('/autos', { schema: autoSchema, onRequest: [isAuth] }, async (request, response) => {
        const data = request.body
        try {
            const newAuto = await prisma.vehicle.create({
                data: {
                    plate: data.placa,
                    brand: data.marca,
                    model: data.modelo,
                    year: data.ano,
                    color: data.cor,
                    fuel: data.combustivel,
                    km: data.km,
                    ownerId: request.userId
                }
            })
            return response.status(201).send({ status: true, message: "Car added", auto: toApiFormat(newAuto) })
        } catch (e) {
            if (e.code === 'P2002') {
                return response.status(409).send({ status: false, message: "Plate already registered" })
            }
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error creating vehicle" })
        }
    })

    app.put('/autos/:id', { schema: updateAutoSchema, onRequest: [isAuth] }, async (request, response) => {
        const id = Number(request.params.id)
        const data = request.body

        const fieldMap = {
            placa: 'plate', marca: 'brand', modelo: 'model',
            ano: 'year', cor: 'color', combustivel: 'fuel', km: 'km'
        }
        const updateData = {}
        for (const key of Object.keys(data)) {
            updateData[fieldMap[key]] = data[key]
        }

        try {
            const existing = await prisma.vehicle.findUnique({ where: { id } })
            if (!existing || existing.ownerId !== request.userId) {
                return response.status(404).send({ status: false, message: "Car not found" })
            }

            const updated = await prisma.vehicle.update({ where: { id }, data: updateData })
            return response.status(200).send({ status: true, message: "Car updated", auto: toApiFormat(updated) })
        } catch (e) {
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error to update car infos" })
        }
    })

    app.delete('/autos/:id', { onRequest: [isAuth] }, async (request, response) => {
        const id = Number(request.params.id)

        try {
            const existing = await prisma.vehicle.findUnique({ where: { id } })
            if (!existing || existing.ownerId !== request.userId) {
                return response.status(404).send({ status: false, message: "Car not found" })
            }

            await prisma.vehicle.delete({ where: { id } })
            return response.status(200).send({ status: true, message: "Car deleted" })
        } catch (e) {
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error in delete car function" })
        }
    })
}
