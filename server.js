import express from "express"
import cors from "cors"
import { promises as fs } from "node:fs"

const PORT = 3333;
const DATABASE_URL = "./database/db.json"

const app = express()

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}))

app.use(express.json())

// Aqui lê o Json
const lerData = async () => {
  const data = await fs.readFile(DATABASE_URL, "utf-8")
  return JSON.parse(data)
}

const mudarData = async (data) => {
  await fs.writeFile(DATABASE_URL, JSON.stringify(data, null, 2))
}

// 1. POST /motoristas
app.post("/motoristas", async (request, response) => {
  const { nome, data_nascimento, carteira_habilitacao, onibus_id } = request.body

  if (!nome || !data_nascimento || !carteira_habilitacao) {
    return response.status(400).json({ message: "Campos obrigatórios faltando" })
  }

  const db = await lerData()
  const id = Date.now()

  const novoMotorista = { id, nome, data_nascimento, carteira_habilitacao, onibus_id: onibus_id || null }
  db.motoristas.push(novoMotorista)

  await mudarData(db)

  response.status(201).json({ message: "Motorista cadastrado", motorista: novoMotorista })
})

// 2. POST /onibus
app.post("/onibus", async (request, response) => {
  const { placa, modelo, ano_fabricacao, capacidade, motorista_id } = request.body

  if (!placa || !modelo || !ano_fabricacao || !capacidade) {
    return response.status(400).json({ message: "Campos obrigatórios faltando" })
  }

  const db = await lerData()
  const id = Date.now()

  const novoOnibus = { id, placa, modelo, ano_fabricacao, capacidade, motorista_id: motorista_id || null }
  db.onibus.push(novoOnibus)

  await mudarData(db)

  response.status(201).json({ message: "Ônibus cadastrado", onibus: novoOnibus })
});

// 3. GET /motoristas
app.get("/motoristas", async (request, response) => {
  const db = await lerData()
  response.status(200).json({ motoristas: db.motoristas })
})

// 4. GET /onibus
app.get("/onibus", async (request, response) => {
  const db = await lerData()
  response.status(200).json({ onibus: db.onibus })
})

// 5. GET /onibus/:id/motorista
app.get("/onibus/:id/motorista", async (request, response) => {
  const { id } = request.params
  const db = await lerData()

  const onibus = db.onibus.find((o) => o.id.toString() === id)

  if (!onibus) {
    return response.status(404).json({ message: "Ônibus não encontrado" })
  }

  const motorista = db.motoristas.find((m) => m.id === onibus.motorista_id)

  response.status(200).json({
    onibus,
    motorista: motorista || null
  })
})

// 6. PUT /motoristas/:id/onibus
app.put("/motoristas/:id/onibus", async (request, response) => {
  const { id } = request.params
  const { onibus_id } = request.body;

  const db = await lerData()

  const motorista = db.motoristas.find((m) => m.id.toString() === id)
  if (!motorista) {
    return response.status(404).json({ message: "Motorista não encontrado" })
  }

  const onibus = db.onibus.find((o) => o.id === onibus_id)
  if (!onibus) {
    return response.status(404).json({ message: "Ônibus não encontrado" })
  }

  motorista.onibus_id = onibus_id;
  onibus.motorista_id = motorista.id

  await mudarData(db)

  response.status(200).json({ message: "Vínculo realizado com sucesso" })
})

// 7. DELETE /onibus/:id/motorista
app.delete("/onibus/:id/motorista", async (request, response) => {
  const { id } = request.params
  const db = await lerData()

  const onibus = db.onibus.find((o) => o.id.toString() === id)
  if (!onibus) {
    return response.status(404).json({ message: "Ônibus não encontrado" })
  }

  const motorista = db.motoristas.find((m) => m.id === onibus.motorista_id)

  if (motorista) {
    motorista.onibus_id = null;
  }

  onibus.motorista_id = null

  await mudarData(db)

  response.status(200).json({ message: "Associação removida com sucesso" })
})

app.listen(PORT, () => {
  console.log("Servidor rodando na porta: " + PORT)
})