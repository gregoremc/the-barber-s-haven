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

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page {
    size: 50mm auto;
    margin: 2mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    width: 46mm;
    padding: 2mm;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider {
    border-top: 1px dashed #000;
    margin: 3mm 0;
  }
  .title {
    font-size: 11px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2mm;
  }
  .shop-name {
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1mm;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin: 1mm 0;
  }
  .amount {
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    margin: 3mm 0;
  }
  .sig-line {
    border-top: 1px solid #000;
    margin-top: 10mm;
    padding-top: 1mm;
    text-align: center;
    font-size: 9px;
  }
  .sig-section {
    margin-top: 5mm;
  }
  @media print {
    body { width: 46mm; }
  }
</style>
</head>
<body>
  <div class="shop-name">${data.shopName}</div>
  <div class="divider"></div>
  <div class="title">${title}</div>
  <div class="divider"></div>
  
  <div class="row">
    <span>Profissional:</span>
  </div>
  <div class="bold">${data.barberName}</div>
  
  <div style="margin-top:2mm" class="row">
    <span>Data:</span>
    <span class="bold">${formattedDate}</span>
  </div>
  
  <div class="divider"></div>
  
  <div class="center" style="font-size:9px">Valor ${data.type === "advance" ? "do Adiantamento" : "Pago"}</div>
  <div class="amount">${formattedAmount}</div>
  
  <div class="divider"></div>
  
  <div class="sig-section">
    <div class="sig-line">
      ${data.barberName}<br/>Profissional
    </div>
  </div>
  
  <div class="sig-section">
    <div class="sig-line">
      Responsável<br/>${data.shopName}
    </div>
  </div>
  
  <div class="divider" style="margin-top:5mm"></div>
  <div class="center" style="font-size:8px;margin-top:1mm">
    Documento gerado em<br/>${new Date().toLocaleString("pt-BR")}
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=220,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
