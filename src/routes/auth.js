import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

const loginSchema = {
    body: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
            email: { type: 'string' },
            password: { type: 'string' }
        }
    }
}

export async function authRoutes(app) {
    app.post('/login', { schema: loginSchema }, async (request, response) => {
        const { email, password } = request.body

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return response.status(401).send({ status: false, message: "Invalid credentials" })
        }

        const passwordMatches = await bcrypt.compare(password, user.password)
        if (!passwordMatches) {
            return response.status(401).send({ status: false, message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        return response.status(200).send({
            status: true,
            token,
            user: { id: user.id, name: user.name, email: user.email }
        })
    })
}
