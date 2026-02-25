import { useEffect, useRef, useState } from "react";
import styles from "./PixModel.module.scss";

export default function PixModel({ isOpen, onClose, selectedValue }) {
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [qrCodeText, setQrCodeText] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | waiting | approved | error

  const pollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQrCodeBase64("");
      setQrCodeText("");
      setPaymentId("");
      setStatus("idle");
      setLoading(false);
    } else {
      // para polling ao fechar
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isOpen, selectedValue]);

  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL;

  const generatePix = async () => {
    try {
      setLoading(true);
      setStatus("idle");

      const response = await fetch(`${API_URL}/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: selectedValue,
          name: "Convidado",
        }),
      });

      const data = await response.json();

      setQrCodeBase64(data.qr_code_base64 || "");
      setQrCodeText(data.qr_code_text || "");
      setPaymentId(data.payment_id || "");
      setStatus("waiting");

      // checa o status a cada 3s
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          if (!data.payment_id) return;
          const r = await fetch(`${API_URL}/payment-status/${data.payment_id}`);
          const s = await r.json();

          if (s.status === "approved") {
            setStatus("approved");
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch {
          // ignore polling errors
        }
      }, 3000);
    } catch (e) {
      console.error(e);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      alert("Código Pix copiado!");
    } catch {
      alert("Não consegui copiar automaticamente. Selecione e copie manualmente.");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Pagamento via Pix</h2>
        <p>Valor: R$ {selectedValue}</p>

        {!qrCodeBase64 && (
          <button onClick={generatePix} disabled={loading}>
            {loading ? "Gerando..." : "Gerar Pix"}
          </button>
        )}

        {qrCodeBase64 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code Pix"
              style={{ width: 300, maxWidth: "90%", height: "auto" }}
            />

            <p style={{ marginTop: 12, fontWeight: 700 }}>
              Ou copie o código Pix:
            </p>

            <textarea
              value={qrCodeText}
              readOnly
              style={{ width: "100%", height: 96, marginTop: 8 }}
            />

            <button
              onClick={copyPix}
              style={{ marginTop: 10 }}
              disabled={!qrCodeText}
            >
              Copiar código Pix
            </button>

            {status === "waiting" && (
              <p style={{ marginTop: 12 }}>
                ⏳ Aguardando confirmação do pagamento...
              </p>
            )}

            {status === "approved" && (
              <p style={{ marginTop: 12, fontWeight: 800 }}>
                ✅ Presente confirmado! 🎉 Obrigado pelo presente!
              </p>
            )}

            {status === "error" && (
              <p style={{ marginTop: 12 }}>
                ❌ Não consegui gerar/confirmar agora. Tente novamente.
              </p>
            )}

            {paymentId && (
              <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                ID do pagamento: {paymentId}
              </p>
            )}
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 12 }}>
          Fechar
        </button>
      </div>
    </div>
  );
}