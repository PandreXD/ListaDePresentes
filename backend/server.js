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

app.get("/", (req, res) => res.send("OK"));

app.post("/create-payment", async (req, res) => {
  const { value, name = "Convidado" } = req.body;

  const amount = Number(value);
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Valor inválido." });
  }

  try {
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description: `Presente casamento - ${name}`,
        payment_method_id: "pix",
        
      },
    });

    return res.json({
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
      qr_code_text: result.point_of_interaction.transaction_data.qr_code,
    });
  } catch (error) {
    console.error("Erro Mercado Pago:", error?.response?.data || error);
    return res.status(500).json({
      error: "Erro ao criar pagamento",
      details: error?.response?.data || null,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));