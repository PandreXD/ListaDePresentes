import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Payment } from "mercadopago";

dotenv.config();

const app = express();
app.use(express.json());


app.use(cors());

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const paymentApi = new Payment(client);

// “Banco” em memória (simples). 
const paymentsStore = new Map();

/**
 * 1) Cria pagamento Pix (retorna QR + payment_id)
 */
app.post("/create-payment", async (req, res) => {
  const { value, name = "Convidado" } = req.body;

  try {
    const result = await paymentApi.create({
      body: {
        transaction_amount: Number(value),
        description: `Presente casamento - ${name}`,
        payment_method_id: "pix",
        payer: {
          email: "teste@email.com",
          first_name: name,
        },
        
      
      },
    });

    // Guarda estado inicial
    paymentsStore.set(String(result.id), {
      id: String(result.id),
      status: result.status,
      value: result.transaction_amount,
      name,
      updatedAt: Date.now(),
    });

    res.json({
      payment_id: String(result.id),
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
      qr_code_text: result.point_of_interaction.transaction_data.qr_code,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

/**
 * 2) Endpoint para o frontend consultar status do pagamento
 * - Primeiro tenta no store
 * - Se não tiver (ou quiser garantir), consulta Mercado Pago por ID
 */
app.get("/payment-status/:id", async (req, res) => {
  const id = String(req.params.id);

  try {
    // Se já temos no store, devolve rápido
    const cached = paymentsStore.get(id);
    if (cached?.status === "approved") {
      return res.json({ status: "approved" });
    }

    // Consulta no MP por ID (referência oficial: GET /v1/payments/{id})
    const mpPayment = await paymentApi.get({ id });

    const status = mpPayment.status;
    paymentsStore.set(id, {
      id,
      status,
      updatedAt: Date.now(),
    });

    return res.json({ status });
  } catch (error) {
    console.error("Erro ao consultar status:", error);
    return res.status(500).json({ error: "Erro ao consultar status" });
  }
});

/**
 * 3) WEBHOOK do Mercado Pago
 * MP manda notificações de eventos (ex: payments) e você consulta o pagamento pelo ID
 */
app.post("/webhook", async (req, res) => {
  try {
    // MP normalmente envia algo com type + data.id (padrão docs)
    const type = req.body?.type;
    const dataId = req.body?.data?.id;

    // Alguns casos podem vir via querystring (?type=payment&data.id=123)
    const qType = req.query?.type;
    const qDataId = req.query?.["data.id"];

    const finalType = type || qType;
    const finalId = String(dataId || qDataId || "");

    // Responde 200 rápido (boa prática)
    res.sendStatus(200);

    // Só processa se for pagamento e tiver id
    if (!finalId) return;

    // Consulta pagamento no MP e atualiza store
    // (o webhook “avisa”, mas o status confiável vem do GET payment)
    const mpPayment = await paymentApi.get({ id: finalId });
    const status = mpPayment.status;

    paymentsStore.set(finalId, {
      id: finalId,
      status,
      updatedAt: Date.now(),
    });

    console.log("Webhook recebido:", { id: finalId, status, type: finalType });
  } catch (error) {
    console.error("Erro no webhook:", error);
    // webhook: mesmo com erro, não precisa retornar 500 após res 200
  }
});

app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));