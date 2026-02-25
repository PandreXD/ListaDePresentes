import { useEffect, useState } from "react";
import styles from "./PixModel.module.scss";

export default function PixModel({ isOpen, onClose, selectedValue }) {
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [qrCodeText, setQrCodeText] = useState("");
  const [loading, setLoading] = useState(false);

  // Sempre que abrir o modal ou mudar o valor, limpa o QR anterior
  useEffect(() => {
    if (isOpen) {
      setQrCodeBase64("");
      setQrCodeText("");
      setLoading(false);
    }
  }, [isOpen, selectedValue]);

  if (!isOpen) return null;

  const generatePix = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:3000/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: selectedValue,
          name: "Convidado", // se quiser, depois a gente coloca um input pra pegar nome
        }),
      });

      const data = await response.json();
      console.log("RETORNO BACKEND:", data);

      // Aqui precisa bater com o que o backend retorna
      // Recomendo que o backend retorne: qr_code_base64 e qr_code_text
      setQrCodeBase64(data.qr_code_base64 || data.qr_code || "");
      setQrCodeText(data.qr_code_text || "");
    } catch (error) {
      console.error("Erro ao gerar Pix:", error);
      alert("Não foi possível gerar o Pix. Veja o console para detalhes.");
    } finally {
      setLoading(false);
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText);
      alert("Código Pix copiado!");
    } catch (e) {
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
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code Pix"
              style={{ width: "300px", maxWidth: "90%", height: "auto" }}
            />

            <p style={{ marginTop: "15px", fontWeight: "bold" }}>
              Ou copie o código Pix:
            </p>

            <textarea
              value={qrCodeText}
              readOnly
              style={{ width: "100%", height: "100px", marginTop: "10px" }}
            />

            <button
              onClick={copyPix}
              style={{ marginTop: "10px", padding: "10px 20px", cursor: "pointer" }}
              disabled={!qrCodeText}
            >
              Copiar código Pix
            </button>
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: "12px" }}>
          Fechar
        </button>
      </div>
    </div>
  );
}