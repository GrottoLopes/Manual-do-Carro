import jwt from 'jsonwebtoken'

export function isAuth(request, response, done) {
    const { authorization } = request.headers

    if (!authorization) {
        return response.status(401).send({ status: false, message: "Token not provided" })
    }

    // Aceita tanto "Bearer <token>" quanto o token puro
    const token = authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : authorization

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        // Disponibiliza o id do usuário autenticado pro resto da rota
        request.userId = payload.id
        done()
    } catch (e) {
        return response.status(403).send({ status: false, message: "Invalid or expired token" })
    }
}
