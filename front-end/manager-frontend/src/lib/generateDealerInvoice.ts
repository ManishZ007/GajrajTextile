import type { DealerOrder } from "./api/dealerApi";

function formatINR(n: number) {
  // jsPDF built-in fonts don't support the ₹ glyph — use Rs. instead
  return Number(n).toLocaleString("en-IN");
}

function formatDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Render spaced-caps text to mimic the logo's letter-spacing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spacedText(
  doc: any,
  text: string,
  x: number,
  y: number,
  spacing = 3.5,
) {
  let cx = x;
  for (const ch of text) {
    doc.text(ch, cx, y);
    cx += doc.getTextWidth(ch) + spacing;
  }
  return cx;
}

export async function generateDealerInvoice(order: DealerOrder) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const ml = 20; // left margin
  const mr = W - 20; // right margin

  // ── Palette ──────────────────────────────────────────────────────────────
  const BLACK = [15, 15, 15] as const;
  const GRAY = [120, 120, 120] as const;
  const LGRAY = [200, 200, 200] as const;
  const WHITE = [255, 255, 255] as const;

  // ── Background ───────────────────────────────────────────────────────────
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, W, 297, "F");

  // ── Logo / Brand name ─────────────────────────────────────────────────────
  doc.setFont("times", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...BLACK);
  // Spaced caps like the logo image
  spacedText(doc, "GAJRAJ  PAITHANI", ml, 22, 2.2);

  // Thin rule under logo
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.25);
  doc.line(ml, 27, mr, 27);

  // ── Invoice label + number (top right) ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BLACK);
  doc.text("Invoice", mr, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);

  const metaY = 35;
  const labelX = mr - 70;
  const valX = mr;

  function metaRow(label: string, value: string, y: number) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(label, labelX, y);
    doc.setTextColor(...BLACK);
    doc.text(value, valX, y, { align: "right" });
  }

  metaRow("Invoice number", order.orderNumber, metaY);
  metaRow("Date of issue", formatDate(order.createdAt), metaY + 6);

  // ── From / Bill to ────────────────────────────────────────────────────────
  let y = 44;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text("Gajraj Paithani", ml, y);

  doc.setFont("helvetica", "bold");
  doc.text("Bill to", W / 2 + 5, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);

  const fromLines = ["Handloom Silk Sarees", "Yeola, Maharashtra, India"];
  fromLines.forEach((line) => {
    doc.text(line, ml, y);
    y += 4.5;
  });

  // Bill-to block (right column)
  const billY0 = 49;
  let billY = billY0;
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(order.dealer.name, W / 2 + 5, billY);
  billY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);

  const billLines: string[] = [];
  if (order.dealer.phone) billLines.push(order.dealer.phone);
  if (order.dealer.email) billLines.push(order.dealer.email);
  if (order.dealer.address) billLines.push(order.dealer.address);
  const cs = [order.dealer.city, order.dealer.state].filter(Boolean).join(", ");
  if (cs) billLines.push(cs);
  if (order.dealer.dealerType) billLines.push(order.dealer.dealerType);

  billLines.forEach((line) => {
    doc.text(line, W / 2 + 5, billY);
    billY += 4.5;
  });

  y = Math.max(y, billY) + 8;

  // ── Amount due banner ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text(formatINR(order.balanceAmount) + " due", ml, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text("as of " + formatDate(order.createdAt), ml, y + 6);

  // Status pill
  const STATUS_CLR: Record<string, [number, number, number]> = {
    DRAFT: [160, 160, 160],
    CONFIRMED: [59, 130, 246],
    IN_PRODUCTION: [234, 88, 12],
    READY: [124, 58, 237],
    DELIVERED: [5, 150, 105],
    CANCELLED: [220, 38, 38],
  };
  const sc = STATUS_CLR[order.status] ?? [160, 160, 160];
  const statusLabel = order.status.replace("_", " ");
  const sw = doc.getTextWidth(statusLabel) + 6;
  doc.setFillColor(...sc);
  doc.roundedRect(mr - sw - 2, y - 5, sw + 4, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(statusLabel, mr - sw / 2, y - 0.5, { align: "center" });

  y += 14;

  // ── Horizontal rule ───────────────────────────────────────────────────────
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.line(ml, y, mr, y);
  y += 8;

  // ── Items table ───────────────────────────────────────────────────────────
  // Header row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);

  // Columns: left-aligned for text, right-aligned for numbers
  // Content width: 20..190 = 170mm
  const COL = {
    desc: ml, // left-aligned  width ~42
    color: ml + 44, // left-aligned  width ~22
    butti: ml + 68, // left-aligned  width ~22
    padar: ml + 92, // left-aligned  width ~22
    zari: ml + 116, // left-aligned  width ~18
    qtyR: ml + 140, // RIGHT-aligned width ~10
    priceR: ml + 160, // RIGHT-aligned width ~20
    totalR: mr, // RIGHT-aligned
  };

  doc.text("Description", COL.desc, y);
  doc.text("Color", COL.color, y);
  doc.text("Butti", COL.butti, y);
  doc.text("Padar", COL.padar, y);
  doc.text("Zari", COL.zari, y);
  doc.text("Qty", COL.qtyR, y, { align: "left" });
  doc.text("Unit price", COL.priceR, y, { align: "right" });
  doc.text("Amount", COL.totalR, y, { align: "right" });

  y += 4;
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.3);
  doc.line(ml, y, mr, y);
  y += 6;

  // Rows
  doc.setTextColor(...BLACK);
  doc.setFontSize(8.5);

  (order.items ?? []).forEach((item) => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text((item.category || "-").slice(0, 18), COL.desc, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    if (item.gondas) {
      doc.setFontSize(7);
      doc.text("Gondas", COL.desc, y + 4.5);
      doc.setFontSize(8.5);
    }

    doc.setTextColor(...BLACK);
    doc.text((item.color || "-").slice(0, 12), COL.color, y);
    doc.text((item.buttiName || "-").slice(0, 12), COL.butti, y);
    doc.text((item.padarName || "-").slice(0, 12), COL.padar, y);
    doc.text((item.zariName || "-").slice(0, 10), COL.zari, y);
    doc.text(String(item.quantity), COL.qtyR, y, { align: "right" });
    doc.text(formatINR(item.pricePerPiece), COL.priceR, y, { align: "right" });
    doc.text(formatINR(item.totalPrice), COL.totalR, y, { align: "right" });

    y += item.gondas ? 13 : 8;

    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.15);
    doc.line(ml, y - 2, mr, y - 2);
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  y += 4;

  const tLabelX = mr - 60;

  function totalRow(
    label: string,
    value: string,
    bold = false,
    color: [number, number, number] = [...BLACK],
  ) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9 : 8.5);
    doc.setTextColor(...GRAY);
    doc.text(label, tLabelX, y);
    doc.setTextColor(...color);
    doc.text(value, mr, y, { align: "right" });
    y += bold ? 7 : 5.5;
  }

  const totalQty = (order.items ?? []).reduce((s, i) => s + i.quantity, 0);
  totalRow(`Subtotal  (${totalQty} sarees)`, formatINR(order.totalAmount));

  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.25);
  doc.line(tLabelX, y, mr, y);
  y += 5;

  totalRow("Amount paid", formatINR(order.paidAmount), false, [5, 150, 105]);
  totalRow(
    "Amount due",
    formatINR(order.balanceAmount),
    true,
    order.balanceAmount > 0 ? [220, 38, 38] : [5, 150, 105],
  );

  // ── Payment history ───────────────────────────────────────────────────────
  if ((order.payments ?? []).length > 0) {
    y += 8;
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.25);
    doc.line(ml, y, mr, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("PAYMENT HISTORY", ml, y);
    y += 6;

    order.payments.forEach((p) => {
      if (y > 268) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...BLACK);

      const mode = p.paymentMode
        ? "  ·  " + p.paymentMode.replace("_", " ")
        : "";
      const ref = p.referenceNumber ? "  ·  Ref: " + p.referenceNumber : "";
      const note = p.note ? "  ·  " + p.note : "";
      const line = formatDate(p.paidAt) + mode + ref + note;
      doc.text(line, ml, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105);
      doc.text(formatINR(p.amount), mr, y, { align: "right" });
      y += 6;

      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.15);
      doc.line(ml, y - 1.5, mr, y - 1.5);
    });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (order.notes) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("NOTES", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLACK);
    const wrapped = doc.splitTextToSize(order.notes, mr - ml);
    doc.text(wrapped, ml, y);
    y += wrapped.length * 5;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = 297;
  doc.setDrawColor(...LGRAY);
  doc.setLineWidth(0.25);
  doc.line(ml, pageH - 16, mr, pageH - 16);

  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  // Spaced footer brand name
  const footerStartX = W / 2 - 20;
  spacedText(doc, "GAJRAJ  PAITHANI", footerStartX, pageH - 10, 1.6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Page 1 of 1", mr, pageH - 10, { align: "right" });

  doc.save(`${order.orderNumber}-invoice.pdf`);
}
