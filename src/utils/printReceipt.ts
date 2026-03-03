import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptData {
  type: "payment" | "advance";
  shopName: string;
  barberName: string;
  amount: number;
  date: string;
}

export const printReceipt = async (data: ReceiptData) => {
  const title = data.type === "payment" ? "COMPROVANTE DE PAGAMENTO" : "COMPROVANTE DE ADIANTAMENTO";
  const formattedAmount = `R$ ${data.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const formattedDate = new Date(data.date + "T12:00:00").toLocaleDateString("pt-BR");
  const now = new Date().toLocaleString("pt-BR");

  // Create off-screen container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "190px"; // ~50mm at 96dpi
  container.style.background = "#fff";
  container.style.padding = "8px";
  container.style.fontFamily = "'Courier New', monospace";
  container.style.fontSize = "10px";
  container.style.color = "#000";

  container.innerHTML = `
    <div style="text-align:center;font-weight:bold;font-size:11px;margin-bottom:4px">${data.shopName}</div>
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="text-align:center;font-weight:bold;font-size:10px;margin-bottom:4px">${title}</div>
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="margin:4px 0">
      <span>Profissional:</span><br/>
      <strong>${data.barberName}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;margin:6px 0">
      <span>Data:</span>
      <strong>${formattedDate}</strong>
    </div>
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="text-align:center;font-size:8px">Valor ${data.type === "advance" ? "do Adiantamento" : "Pago"}</div>
    <div style="text-align:center;font-weight:bold;font-size:14px;margin:6px 0">${formattedAmount}</div>
    <div style="border-top:1px dashed #000;margin:6px 0"></div>
    <div style="margin-top:30px">
      <div style="border-top:1px solid #000;padding-top:2px;text-align:center;font-size:8px">
        ${data.barberName}<br/>Profissional
      </div>
    </div>
    <div style="margin-top:24px">
      <div style="border-top:1px solid #000;padding-top:2px;text-align:center;font-size:8px">
        Responsavel<br/>${data.shopName}
      </div>
    </div>
    <div style="border-top:1px dashed #000;margin:12px 0 4px"></div>
    <div style="text-align:center;font-size:7px">Documento gerado em<br/>${now}</div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 3, useCORS: true, logging: false });
    const imgData = canvas.toDataURL("image/png");
    const pxWidth = canvas.width;
    const pxHeight = canvas.height;

    // 50mm wide
    const pdfWidth = 50;
    const pdfHeight = (pxHeight * pdfWidth) / pxWidth;

    const doc = new jsPDF({ unit: "mm", format: [pdfWidth, pdfHeight + 4] });
    doc.addImage(imgData, "PNG", 0, 2, pdfWidth, pdfHeight);

    const fileName = `${data.type === "advance" ? "adiantamento" : "pagamento"}_${data.barberName.replace(/\s+/g, "_")}_${data.date}.pdf`;
    doc.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};
