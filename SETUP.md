# Setup do backend — Manual do Carro

## 1. Instalar dependências
```bash
npm install
```

## 2. Configurar o banco de dados
1. Crie uma conta gratuita em [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (ambos têm PostgreSQL free tier).
2. Copie a connection string que eles fornecem.
3. Duplique o arquivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
4. Cole a connection string na variável `DATABASE_URL` do `.env`.
5. Troque `JWT_SECRET` por uma string aleatória e forte (pode gerar uma com `openssl rand -hex 32`).

## 3. Criar as tabelas no banco (migration)
```bash
npx prisma migrate dev --name init
```
Esse comando cria as tabelas `users`, `vehicles` e `maintenances` no banco configurado e gera o Prisma Client.

## 4. Rodar o servidor
```bash
npm run dev
```
A API sobe em `http://localhost:3000`.

## 5. Fluxo de uso da API

### Criar usuário (rota pública)
```
POST /users
{
  "name": "Gabriel",
  "birthdate": "1995-05-22",
  "city": "São Paulo",
  "state": "SP",
  "country": "BR",
  "phone": "11945983111",
  "email": "gabriel@email.com",
  "password": "senha123"
}
```

### Login (gera o token JWT)
```
POST /login
{
  "email": "gabriel@email.com",
  "password": "senha123"
}
```
Resposta: `{ "token": "..." }`. Use esse token no header das próximas requisições:
```
Authorization: Bearer <token>
```

### Cadastrar veículo (autenticado)
```
POST /autos
{
  "placa": "ABC-1234",
  "marca": "Fiat",
  "modelo": "Palio",
  "ano": 2004,
  "cor": "preto",
  "combustivel": "flex",
  "km": 150000
}
```

### Cadastrar manutenção
```
POST /manutencoes
{
  "placa": "ABC-1234",
  "descricao": "Troca de óleo",
  "custo": 250.0,
  "km": 152000
}
```

### Listar manutenções de um carro
```
GET /manutencoes/ABC-1234
```

## Observações importantes
- Todas as rotas (exceto `POST /users` e `POST /login`) exigem o header `Authorization: Bearer <token>`.
- Cada usuário só enxerga e edita os próprios veículos e manutenções (checagem feita via `ownerId`).
- Senhas nunca são retornadas nas respostas da API.
- Se precisar visualizar os dados do banco graficamente, rode `npx prisma studio`.

## 6. Interface web (login, veículos e manutenções)

Um arquivo único `frontend/index.html` traz uma tela funcional: login, criação de conta, cadastro de veículos por usuário e registro de manutenções por veículo.

**Como abrir:**
1. Deixe a API rodando (`npm run dev`).
2. Dê duplo clique no arquivo `frontend/index.html` (ele abre direto no navegador, sem precisar de servidor).
3. Se a API estiver em outra porta/host, abra "URL da API (avançado)" na tela de login e ajuste o endereço.

O CORS já está liberado no `server.js` (`@fastify/cors`) especificamente para permitir esse tipo de acesso direto pelo navegador.

**Fluxo da tela:**
1. Aba "Criar conta" → cadastra o usuário.
2. Aba "Entrar" → faz login e guarda o token (só na memória da página — atualizar a página exige logar de novo).
3. Aba "Veículos" → formulário adiciona carros vinculados ao usuário logado; cada carro aparece como um cartão estilo placa.
4. Aba "Manutenções" → escolha o veículo no seletor e registre/consulte o histórico dele.

