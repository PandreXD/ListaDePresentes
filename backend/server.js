import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Payment } from "mercadopago";

dotenv.config();
console.log("MP token carregado?", !!process.env.MP_ACCESS_TOKEN);
const app = express();
app.use(express.json());
app.use(cors());

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

app.post("/create-payment", async (req, res) => {
  const { value, name = "Convidado" } = req.body;

  try {
    const payment = new Payment(client);

    const result = await payment.create({
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

    res.json({
  qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
  qr_code_text: result.point_of_interaction.transaction_data.qr_code,
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});