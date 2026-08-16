import bcrypt from 'bcrypt'
import { isAuth } from "../middlewares/is-auth.js"
import { prisma } from "../lib/prisma.js"

const createUserSchema = {
    body: {
        type: 'object',
        required: ['name', 'birthdate', 'city', 'state', 'country', 'phone', 'email', 'password'],
        additionalProperties: false,
        properties: {
            name: { type: 'string' },
            birthdate: { type: 'string', format: 'date' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
        }
    }
}

const updateUserSchema = {
    body: {
        type: 'object',
        additionalProperties: false,
        properties: {
            name: { type: 'string' },
            birthdate: { type: 'string', format: 'date' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
        }
    }
}

// Nunca devolver o hash da senha nas respostas
function sanitizeUser(user) {
    const { password, ...rest } = user
    return rest
}

export async function usersRoutes(app) {
    app.get('/users', { onRequest: [isAuth] }, async (request, response) => {
        try {
            const users = await prisma.user.findMany()
            return response.status(200).send(users.map(sanitizeUser))
        } catch (e) {
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error listing users" })
        }
    })

    // Rota pública: criar conta não exige estar autenticado
    app.post('/users', { schema: createUserSchema }, async (request, response) => {
        const data = request.body
        try {
            const hashedPassword = await bcrypt.hash(data.password, 10)

            const newUser = await prisma.user.create({
                data: {
                    name: data.name,
                    birthdate: new Date(data.birthdate),
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    phone: data.phone,
                    email: data.email,
                    password: hashedPassword
                }
            })

            return response.status(201).send({
                status: true,
                message: "User added",
                user: sanitizeUser(newUser)
            })
        } catch (e) {
            if (e.code === 'P2002') {
                return response.status(409).send({ status: false, message: "Email already registered" })
            }
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error creating user" })
        }
    })

    app.put('/users/:id', { schema: updateUserSchema, onRequest: [isAuth] }, async (request, response) => {
        const id = Number(request.params.id)
        const data = { ...request.body }

        try {
            if (data.birthdate) data.birthdate = new Date(data.birthdate)
            if (data.password) data.password = await bcrypt.hash(data.password, 10)

            const updatedUser = await prisma.user.update({
                where: { id },
                data
            })

            return response.status(200).send({
                status: true,
                message: "User updated",
                user: sanitizeUser(updatedUser)
            })
        } catch (e) {
            if (e.code === 'P2025') {
                return response.status(404).send({ status: false, message: "User not found" })
            }
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error updating user" })
        }
    })

    app.delete('/users/:id', { onRequest: [isAuth] }, async (request, response) => {
        const id = Number(request.params.id)

        try {
            await prisma.user.delete({ where: { id } })
            return response.status(200).send({ status: true, message: "User deleted" })
        } catch (e) {
            if (e.code === 'P2025') {
                return response.status(404).send({ status: false, message: "User not found" })
            }
            request.log.error(e)
            return response.status(500).send({ status: false, message: "Error deleting user" })
        }
    })
}
