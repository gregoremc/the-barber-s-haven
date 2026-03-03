import jsPDF from "jspdf";

interface ReceiptData {
  type: "payment" | "advance";
  shopName: string;
  barberName: string;
  amount: number;
  date: string;
}

export const printReceipt = (data: ReceiptData) => {
  const title = data.type === "payment" ? "COMPROVANTE DE PAGAMENTO" : "COMPROVANTE DE ADIANTAMENTO";
  const formattedAmount = `R$ ${data.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const formattedDate = new Date(data.date + "T12:00:00").toLocaleDateString("pt-BR");
  const now = new Date().toLocaleString("pt-BR");

  // 50mm width ≈ 141.73 points
  const pageWidth = 141.73;
  const doc = new jsPDF({ unit: "pt", format: [pageWidth, 400] });
  const cx = pageWidth / 2;
  const margin = 8;
  let y = 12;

  const drawDashedLine = (yPos: number) => {
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setLineDashPattern([], 0);
  };

  // Shop name
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text(data.shopName, cx, y, { align: "center" });
  y += 10;

  drawDashedLine(y);
  y += 8;

  // Title
  doc.setFontSize(9);
  doc.text(title, cx, y, { align: "center" });
  y += 8;

  drawDashedLine(y);
  y += 10;

  // Barber
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text("Profissional:", margin, y);
  y += 8;
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.text(data.barberName, margin, y);
  y += 10;

  // Date
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.text("Data:", margin, y);
  doc.setFont("courier", "bold");
  doc.text(formattedDate, pageWidth - margin, y, { align: "right" });
  y += 8;

  drawDashedLine(y);
  y += 8;

  // Amount label
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  const amountLabel = data.type === "advance" ? "Valor do Adiantamento" : "Valor Pago";
  doc.text(amountLabel, cx, y, { align: "center" });
  y += 10;

  // Amount value
  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.text(formattedAmount, cx, y, { align: "center" });
  y += 10;

  drawDashedLine(y);
  y += 20;

  // Signature: Barber
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([], 0);
  doc.line(margin + 10, y, pageWidth - margin - 10, y);
  y += 6;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text(data.barberName, cx, y, { align: "center" });
  y += 6;
  doc.text("Profissional", cx, y, { align: "center" });
  y += 18;

  // Signature: Manager
  doc.line(margin + 10, y, pageWidth - margin - 10, y);
  y += 6;
  doc.text("Responsável", cx, y, { align: "center" });
  y += 6;
  doc.text(data.shopName, cx, y, { align: "center" });
  y += 12;

  drawDashedLine(y);
  y += 6;

  // Footer
  doc.setFontSize(6);
  doc.text(`Documento gerado em ${now}`, cx, y, { align: "center" });
  y += 8;

  // Resize page to content
  const finalHeight = y + 4;
  const pages = doc.internal.pages;
  // Update page dimensions
  (doc.internal as any).pageSize.height = finalHeight;

  // Download
  const fileName = `${data.type === "advance" ? "adiantamento" : "pagamento"}_${data.barberName.replace(/\s+/g, "_")}_${data.date}.pdf`;
  doc.save(fileName);
};
