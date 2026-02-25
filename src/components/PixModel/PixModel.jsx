import { useEffect, useState } from "react";
import styles from "./PixModel.module.scss";

export default function PixModel({ isOpen, onClose, selectedValue }) {
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [qrCodeText, setQrCodeText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQrCodeBase64("");
      setQrCodeText("");
      setLoading(false);
    }
  }, [isOpen, selectedValue]);

  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL;

  const generatePix = async () => {
    try {
      setLoading(true);

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
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar Pix. Tente novamente.");
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

            <p style={{ marginTop: 12, opacity: 0.85 }}>
              Após pagar, o app do seu banco vai confirmar o Pix.
            </p>
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 12 }}>
          Fechar
        </button>
      </div>
    </div>
  );
}