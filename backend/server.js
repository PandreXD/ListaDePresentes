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

// “Banco” em memória (simples)
const paymentsStore = new Map();

app.get("/", (req, res) => {
  res.send("OK");
});

/**
 * 1) Cria pagamento Pix (retorna QR + payment_id)
 */
app.post("/create-payment", async (req, res) => {
  const { value, name = "Convidado" } = req.body;

  // ✅ validação forte do valor
  const amount = Number(value);
  if (!amount || Number.isNaN(amount) || amount < 5) {
    return res.status(400).json({
      error: "Valor inválido. Use no mínimo R$ 5.",
      received: value,
    });
  }

  try {
    const result = await paymentApi.create({
      body: {
        transaction_amount: amount,
        description: `Presente casamento - ${name}`,
        payment_method_id: "pix",
        payer: {
          email: "wkpedroff@gmail.com",
          first_name: name,
          // ✅ ajuda a evitar erros “internal_error” em alguns cenários
          identification: {
            type: "CPF",
            number: "19119119100",
          },
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

    return res.json({
      payment_id: String(result.id),
      qr_code_base64: result?.point_of_interaction?.transaction_data?.qr_code_base64,
      qr_code_text: result?.point_of_interaction?.transaction_data?.qr_code,
      status: result.status,
    });
  } catch (error) {
    // ✅ logs completos (Render > Logs)
    console.error("Erro ao criar pagamento (raw):", error);
    console.error("Erro ao criar pagamento (message):", error?.message);
    console.error("Erro ao criar pagamento (cause):", error?.cause);
    console.error("Erro ao criar pagamento (response.data):", error?.response?.data);

    return res.status(500).json({
      error: "Erro ao criar pagamento",
      message: error?.message || null,
      cause: error?.cause || null,
      response: error?.response?.data || null,
    });
  }
});

/**
 * 2) Endpoint para o frontend consultar status do pagamento
 */
app.get("/payment-status/:id", async (req, res) => {
  const id = String(req.params.id);

  try {
    const cached = paymentsStore.get(id);
    if (cached?.status === "approved") {
      return res.json({ status: "approved" });
    }

    const mpPayment = await paymentApi.get({ id });
    const status = mpPayment.status;

    paymentsStore.set(id, {
      id,
      status,
      updatedAt: Date.now(),
    });

    return res.json({ status });
  } catch (error) {
    console.error("Erro ao consultar status (raw):", error);
    console.error("Erro ao consultar status (message):", error?.message);
    console.error("Erro ao consultar status (cause):", error?.cause);
    console.error("Erro ao consultar status (response.data):", error?.response?.data);

    return res.status(500).json({
      error: "Erro ao consultar status",
      message: error?.message || null,
      cause: error?.cause || null,
      response: error?.response?.data || null,
    });
  }
});

/**
 * 3) WEBHOOK do Mercado Pago
 */
app.post("/webhook", async (req, res) => {
  try {
    const type = req.body?.type;
    const dataId = req.body?.data?.id;

    const qType = req.query?.type;
    const qDataId = req.query?.["data.id"];

    const finalType = type || qType;
    const finalId = String(dataId || qDataId || "");

    // responde rápido
    res.sendStatus(200);

    if (!finalId) return;

    const mpPayment = await paymentApi.get({ id: finalId });
    const status = mpPayment.status;

    paymentsStore.set(finalId, {
      id: finalId,
      status,
      updatedAt: Date.now(),
    });

    console.log("Webhook recebido:", { id: finalId, status, type: finalType });
  } catch (error) {
    console.error("Erro no webhook (raw):", error);
    console.error("Erro no webhook (message):", error?.message);
    console.error("Erro no webhook (cause):", error?.cause);
    console.error("Erro no webhook (response.data):", error?.response?.data);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));