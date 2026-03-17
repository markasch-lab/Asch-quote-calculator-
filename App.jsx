import React, { useMemo, useState } from "react";
import { Calculator, ClipboardList, DollarSign, FileText, Receipt, RotateCcw, Wrench } from "lucide-react";
import jsPDF from "jspdf";

const serviceCatalog = [
  { id: "service_call", name: "Service Call / First Hour", price: 175, category: "Base" },
  { id: "outlet_repair", name: "Outlet / Switch Repair", price: 115, category: "Electrical" },
  { id: "faucet_diverter", name: "Faucet / Diverter Repair", price: 125, category: "Plumbing" },
  { id: "shower_door", name: "Shower Door Adjustment", price: 95, category: "Bathroom" },
  { id: "garage_lube", name: "Garage Door Service / Lube", price: 110, category: "Garage" },
  { id: "window_adjustment", name: "Window Adjustment", price: 95, category: "Windows" },
  { id: "cabinet_repair", name: "Cabinet Repair", price: 175, category: "Carpentry" },
  { id: "wall_plate", name: "Aux / Low Voltage Wall Plate Install", price: 95, category: "Low Voltage" },
  { id: "roof_patch", name: "Minor Roof Patch / EPDM Repair", price: 225, category: "Roofing" },
  { id: "toilet_holder", name: "Toilet Paper Holder Install", price: 85, category: "Bathroom" },
  { id: "towel_rack", name: "Towel Rack Install", price: 95, category: "Bathroom" },
  { id: "home_inspection", name: "Home Inspection Punch List Item", price: 90, category: "Punch List" },
  { id: "light_fixture", name: "Light Fixture / Basic Electrical Install", price: 145, category: "Electrical" },
  { id: "tv_accessory", name: "TV / Accessory Install", price: 185, category: "Install" },
  { id: "carpet_repair", name: "Carpet Repair", price: 175, category: "Carpet" },
  { id: "carpet_stretch", name: "Carpet Stretching", price: 225, category: "Carpet" },
  { id: "carpet_patch", name: "Carpet Patching", price: 195, category: "Carpet" },
  { id: "transition_strip", name: "Transition Strip Installation", price: 95, category: "Flooring" }
];

const rateSheetGroups = [
  { title: "Base Pricing", items: [
    { service: "Service Call / First Hour", price: "$175" },
    { service: "General Labor", price: "$75/hr" },
    { service: "Skilled Repair", price: "$95/hr" },
    { service: "Half Day Rate", price: "$350" },
    { service: "Full Day Rate", price: "$650" }
  ]},
  { title: "Electrical & Low Voltage", items: [
    { service: "Outlet / Switch Repair", price: "$85–$150" },
    { service: "Light Fixture Installation", price: "$100–$180" },
    { service: "Aux / Low Voltage Wall Plate Install", price: "$75–$120" },
    { service: "Electrical Troubleshooting", price: "$125–$250" }
  ]},
  { title: "Bathroom & Kitchen", items: [
    { service: "Faucet / Diverter Repair", price: "$90–$160" },
    { service: "Shower Door Adjustment", price: "$75–$140" },
    { service: "Toilet Paper Holder Install", price: "$75–$125" },
    { service: "Towel Rack Install", price: "$75–$125" },
    { service: "Cabinet Repair", price: "$120–$250" }
  ]},
  { title: "Doors, Windows & Exterior", items: [
    { service: "Window Adjustment", price: "$75–$125" },
    { service: "Garage Door Lube / Adjustment", price: "$85–$150" },
    { service: "Minor Roof Patch / EPDM Repair", price: "$150–$300" },
    { service: "Caulking / Sealing", price: "$85–$175" }
  ]},
  { title: "Flooring & Carpet", items: [
    { service: "Carpet Repair", price: "$125–$250" },
    { service: "Carpet Stretching", price: "$150–$300" },
    { service: "Carpet Patching", price: "$125–$275" },
    { service: "Carpet Installation", price: "Quoted by job" },
    { service: "Transition Strip Installation", price: "$75–$140" }
  ]},
  { title: "Punch List & Property Maintenance", items: [
    { service: "Home Inspection Repair Item", price: "$90–$175" },
    { service: "Pre-Sale / Post-Inspection Repairs", price: "Quoted by job" },
    { service: "Rental Turnover Repairs", price: "Quoted by job" },
    { service: "Punch List Bundle", price: "$250–$600" }
  ]}
];

const laborRates = { general: 75, skilled: 95 };

const brand = {
  company: "Asch Construction Services LLC",
  phone: "720-401-7049",
  email: "markasch@aschconstruction.com",
  tagline: "Registered & Insured • Handyman • Property Repair • Punch List Services",
  initials: "ASCH"
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

function LogoBadge() {
  return <div className="logo-badge">{brand.initials}</div>;
}

function DocumentShell({ title, subtitle, children }) {
  return (
    <div className="doc-shell">
      <div className="doc-header">
        <div className="doc-brand">
          <LogoBadge />
          <div>
            <div className="company-name">{brand.company}</div>
            <div className="company-tagline">{brand.tagline}</div>
            <div className="company-contact">{brand.phone} • {brand.email}</div>
          </div>
        </div>
        <div className="doc-title-wrap">
          <div className="doc-title">{title}</div>
          <div className="doc-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="doc-body">{children}</div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("proposal");
  const [selectedServices, setSelectedServices] = useState([]);
  const [materials, setMaterials] = useState(0);
  const [materialMarkup, setMaterialMarkup] = useState(25);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("30-day workmanship warranty. Payment due upon completion.");
  const [extraLaborHours, setExtraLaborHours] = useState(0);
  const [laborType, setLaborType] = useState("general");
  const [proposalNumber, setProposalNumber] = useState("ACS-2026-001");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [depositPaid, setDepositPaid] = useState(0);

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const chosenServices = useMemo(
    () => serviceCatalog.filter((service) => selectedServices.includes(service.id)),
    [selectedServices]
  );

  const servicesSubtotal = useMemo(
    () => chosenServices.reduce((sum, item) => sum + item.price, 0),
    [chosenServices]
  );

  const extraLaborTotal = useMemo(
    () => Number(extraLaborHours || 0) * laborRates[laborType],
    [extraLaborHours, laborType]
  );

  const materialsWithMarkup = useMemo(() => {
    const base = Number(materials || 0);
    const markup = Number(materialMarkup || 0) / 100;
    return base + base * markup;
  }, [materials, materialMarkup]);

  const subtotalBeforeDiscount = servicesSubtotal + extraLaborTotal + materialsWithMarkup;
  const discountedSubtotal = Math.max(subtotalBeforeDiscount - Number(discount || 0), 0);
  const taxAmount = discountedSubtotal * (Number(taxRate || 0) / 100);
  const grandTotal = discountedSubtotal + taxAmount;
  const balanceDue = Math.max(grandTotal - Number(depositPaid || 0), 0);

  const todayString = new Date().toLocaleDateString();

  const resetForm = () => {
    setSelectedServices([]);
    setMaterials(0);
    setMaterialMarkup(25);
    setDiscount(0);
    setTaxRate(0);
    setCustomerName("");
    setAddress("");
    setNotes("30-day workmanship warranty. Payment due upon completion.");
    setExtraLaborHours(0);
    setLaborType("general");
    setProposalNumber("ACS-2026-001");
    setInvoiceNumber("INV-2026-001");
    setDepositPaid(0);
  };

  const quoteSummary = `ASCH CONSTRUCTION SERVICES LLC\nProposal #: ${proposalNumber}\nCustomer: ${customerName || "—"}\nAddress: ${address || "—"}\n\nSelected Work:\n${chosenServices.map((s) => `• ${s.name} — ${formatCurrency(s.price)}`).join("\n") || "• None selected"}\n${extraLaborHours ? `• Extra ${laborType} labor (${extraLaborHours} hrs) — ${formatCurrency(extraLaborTotal)}` : ""}\n${Number(materials) ? `• Materials + ${materialMarkup}% markup — ${formatCurrency(materialsWithMarkup)}` : ""}\n${Number(discount) ? `• Discount — ${formatCurrency(Number(discount))}` : ""}\n${Number(taxRate) ? `• Tax (${taxRate}%) — ${formatCurrency(taxAmount)}` : ""}\n\nTotal: ${formatCurrency(grandTotal)}\n\nNotes:\n${notes || "—"}`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(quoteSummary);
      alert("Quote copied.");
    } catch {
      alert("Copy failed.");
    }
  };

  const savePdf = () => {
    const doc = new jsPDF();
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(brand.company, 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(brand.tagline, 20, y);
    y += 6;
    doc.text(`${brand.phone} | ${brand.email}`, 20, y);
    y += 12;

    const title = activeTab === "invoice" ? "INVOICE" : activeTab === "rates" ? "RATE SHEET" : "PROPOSAL";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, rightX, 20, { align: "right" });

    if (activeTab === "rates") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      rateSheetGroups.forEach((group) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(group.title, 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        group.items.forEach((item) => {
          const wrapped = doc.splitTextToSize(`${item.service} - ${item.price}`, 170);
          doc.text(wrapped, 22, y);
          y += wrapped.length * 5;
        });
        y += 4;
      });
      doc.save("asch-rate-sheet.pdf");
      return;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Customer: ${customerName || ""}`, 20, y); y += 6;
    doc.text(`Address: ${address || ""}`, 20, y); y += 6;
    doc.text(`Date: ${todayString}`, 20, y); y += 6;
    doc.text(`${activeTab === "invoice" ? "Invoice" : "Proposal"} #: ${activeTab === "invoice" ? invoiceNumber : proposalNumber}`, 20, y); y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, y);
    doc.text("Amount", rightX, y, { align: "right" });
    y += 6; doc.line(20, y, rightX, y); y += 6;

    doc.setFont("helvetica", "normal");
    chosenServices.forEach((item) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const wrapped = doc.splitTextToSize(item.name, 120);
      doc.text(wrapped, 20, y);
      doc.text(formatCurrency(item.price), rightX, y, { align: "right" });
      y += wrapped.length * 5 + 2;
    });

    if (Number(extraLaborHours) > 0) { doc.text(`Extra ${laborType} labor (${extraLaborHours} hrs)`, 20, y); doc.text(formatCurrency(extraLaborTotal), rightX, y, { align: "right" }); y += 6; }
    if (Number(materials) > 0) { doc.text(`Materials + ${materialMarkup}% markup`, 20, y); doc.text(formatCurrency(materialsWithMarkup), rightX, y, { align: "right" }); y += 6; }
    if (Number(discount) > 0) { doc.text("Discount", 20, y); doc.text(`-${formatCurrency(discount)}`, rightX, y, { align: "right" }); y += 6; }
    if (Number(taxRate) > 0) { doc.text(`Tax (${taxRate}%)`, 20, y); doc.text(formatCurrency(taxAmount), rightX, y, { align: "right" }); y += 6; }
    if (activeTab === "invoice" && Number(depositPaid) > 0) { doc.text("Deposit Paid", 20, y); doc.text(`-${formatCurrency(depositPaid)}`, rightX, y, { align: "right" }); y += 6; }

    y += 4; doc.line(20, y, rightX, y); y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(activeTab === "invoice" ? "Balance Due" : "Total", 20, y);
    doc.text(formatCurrency(activeTab === "invoice" ? balanceDue : grandTotal), rightX, y, { align: "right" });
    y += 12;

    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(`Notes: ${notes}`, 170);
    doc.text(noteLines, 20, y);

    doc.save(activeTab === "invoice" ? "asch-invoice.pdf" : "asch-proposal.pdf");
  };

  return (
    <div className="app-shell">
      <div className="top-grid">
        <div className="left-column">
          <div className="card">
            <div className="card-header">
              <div className="header-icon"><Calculator size={24} /></div>
              <div>
                <h1>Asch Quote Calculator</h1>
                <p>Branded estimate, proposal, invoice, and rate sheet app.</p>
              </div>
            </div>
            <div className="form-grid two-col">
              <div><label>Customer Name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Marc Martinez" /></div>
              <div><label>Service Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="1651 Franklin" /></div>
              <div><label>Proposal Number</label><input value={proposalNumber} onChange={(e) => setProposalNumber(e.target.value)} /></div>
              <div><label>Invoice Number</label><input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
              <div><label>Extra Labor Hours</label><input type="number" min="0" step="0.5" value={extraLaborHours} onChange={(e) => setExtraLaborHours(e.target.value)} /></div>
              <div><label>Labor Type</label><select value={laborType} onChange={(e) => setLaborType(e.target.value)}><option value="general">General Labor — $75/hr</option><option value="skilled">Skilled Repair — $95/hr</option></select></div>
              <div><label>Materials Cost</label><input type="number" min="0" value={materials} onChange={(e) => setMaterials(e.target.value)} /></div>
              <div><label>Markup %</label><input type="number" min="0" value={materialMarkup} onChange={(e) => setMaterialMarkup(e.target.value)} /></div>
              <div><label>Discount</label><input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
              <div><label>Tax %</label><input type="number" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
              <div><label>Deposit Paid</label><input type="number" min="0" value={depositPaid} onChange={(e) => setDepositPaid(e.target.value)} /></div>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><Wrench size={18} /> Select Services</div>
            <div className="service-grid">
              {serviceCatalog.map((service) => {
                const checked = selectedServices.includes(service.id);
                return (
                  <button type="button" key={service.id} className={`service-card ${checked ? "selected" : ""}`} onClick={() => toggleService(service.id)}>
                    <div><div className="service-name">{service.name}</div><div className="service-category">{service.category}</div></div>
                    <div className="price-pill">{formatCurrency(service.price)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><ClipboardList size={18} /> Job Notes / Terms</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} />
          </div>
        </div>

        <div className="right-column">
          <div className="card sticky-card">
            <div className="section-title"><DollarSign size={18} /> Quote Summary</div>
            <div className="total-box">
              <div className="total-label">Grand Total</div>
              <div className="total-value">{formatCurrency(grandTotal)}</div>
              <div className="balance-due">Balance Due: {formatCurrency(balanceDue)}</div>
            </div>
            <div className="summary-list">
              <div><span>Selected Services</span><strong>{formatCurrency(servicesSubtotal)}</strong></div>
              <div><span>Extra Labor</span><strong>{formatCurrency(extraLaborTotal)}</strong></div>
              <div><span>Materials + Markup</span><strong>{formatCurrency(materialsWithMarkup)}</strong></div>
              <div><span>Subtotal</span><strong>{formatCurrency(subtotalBeforeDiscount)}</strong></div>
              <div><span>Discount</span><strong>-{formatCurrency(discount)}</strong></div>
              <div><span>Tax</span><strong>{formatCurrency(taxAmount)}</strong></div>
              <div><span>Deposit</span><strong>-{formatCurrency(depositPaid)}</strong></div>
            </div>
            <div className="button-grid">
              <button className="primary-btn" onClick={copySummary}>Copy Quote</button>
              <button className="secondary-btn" onClick={savePdf}>Save PDF</button>
              <button className="secondary-btn full" onClick={resetForm}><RotateCcw size={16} /> Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-row">
        <button className={`tab-btn ${activeTab === "proposal" ? "active" : ""}`} onClick={() => setActiveTab("proposal")}><FileText size={16} /> Proposal</button>
        <button className={`tab-btn ${activeTab === "invoice" ? "active" : ""}`} onClick={() => setActiveTab("invoice")}><Receipt size={16} /> Invoice</button>
        <button className={`tab-btn ${activeTab === "rates" ? "active" : ""}`} onClick={() => setActiveTab("rates")}><DollarSign size={16} /> Rate Sheet</button>
      </div>

      {activeTab === "proposal" && (
        <DocumentShell title="Proposal" subtitle={`Proposal # ${proposalNumber}`}>
          <div className="doc-grid two-up">
            <div className="info-box"><div className="info-label">Prepared For</div><div className="info-big">{customerName || "Customer Name"}</div><div className="info-text">{address || "Service Address"}</div></div>
            <div className="info-box"><div className="info-row"><span>Date</span><strong>{todayString}</strong></div><div className="info-row"><span>Proposal Number</span><strong>{proposalNumber}</strong></div><div className="info-row"><span>Status</span><strong>Open</strong></div></div>
          </div>
          <div className="table-box mt-24">
            <div className="table-header"><span>Description</span><span>Amount</span></div>
            {chosenServices.length === 0 ? <div className="table-row muted">No services selected yet.</div> : chosenServices.map((item) => <div key={item.id} className="table-row split"><span>{item.name}</span><strong>{formatCurrency(item.price)}</strong></div>)}
            {Number(extraLaborHours) > 0 && <div className="table-row split"><span>Extra {laborType} labor ({extraLaborHours} hrs)</span><strong>{formatCurrency(extraLaborTotal)}</strong></div>}
            {Number(materials) > 0 && <div className="table-row split"><span>Materials + {materialMarkup}% markup</span><strong>{formatCurrency(materialsWithMarkup)}</strong></div>}
            {Number(discount) > 0 && <div className="table-row split"><span>Discount</span><strong>-{formatCurrency(discount)}</strong></div>}
          </div>
          <div className="doc-grid side-summary mt-24">
            <div className="info-box"><div className="info-label">Terms & Warranty</div><div className="notes-text">{notes}</div></div>
            <div className="info-box"><div className="info-label">Pricing Summary</div><div className="info-row"><span>Subtotal</span><strong>{formatCurrency(subtotalBeforeDiscount)}</strong></div><div className="info-row"><span>Discount</span><strong>-{formatCurrency(discount)}</strong></div><div className="info-row"><span>Tax</span><strong>{formatCurrency(taxAmount)}</strong></div><div className="info-row total"><span>Total</span><strong>{formatCurrency(grandTotal)}</strong></div></div>
          </div>
        </DocumentShell>
      )}

      {activeTab === "invoice" && (
        <DocumentShell title="Invoice" subtitle={`Invoice # ${invoiceNumber}`}>
          <div className="doc-grid two-up">
            <div className="info-box"><div className="info-label">Bill To</div><div className="info-big">{customerName || "Customer Name"}</div><div className="info-text">{address || "Service Address"}</div></div>
            <div className="info-box"><div className="info-row"><span>Date</span><strong>{todayString}</strong></div><div className="info-row"><span>Invoice Number</span><strong>{invoiceNumber}</strong></div><div className="info-row"><span>Balance Due</span><strong>{formatCurrency(balanceDue)}</strong></div></div>
          </div>
          <div className="table-box mt-24">
            <div className="table-header"><span>Item</span><span>Amount</span></div>
            {chosenServices.length === 0 ? <div className="table-row muted">No services selected yet.</div> : chosenServices.map((item) => <div key={item.id} className="table-row split"><span>{item.name}</span><strong>{formatCurrency(item.price)}</strong></div>)}
            {Number(extraLaborHours) > 0 && <div className="table-row split"><span>Extra {laborType} labor ({extraLaborHours} hrs)</span><strong>{formatCurrency(extraLaborTotal)}</strong></div>}
            {Number(materials) > 0 && <div className="table-row split"><span>Materials + {materialMarkup}% markup</span><strong>{formatCurrency(materialsWithMarkup)}</strong></div>}
            {Number(discount) > 0 && <div className="table-row split"><span>Discount</span><strong>-{formatCurrency(discount)}</strong></div>}
            {Number(taxRate) > 0 && <div className="table-row split"><span>Tax ({taxRate}%)</span><strong>{formatCurrency(taxAmount)}</strong></div>}
            {Number(depositPaid) > 0 && <div className="table-row split"><span>Deposit Paid</span><strong>-{formatCurrency(depositPaid)}</strong></div>}
            <div className="table-row split total-row"><span>Total Due</span><strong>{formatCurrency(balanceDue)}</strong></div>
          </div>
          <div className="doc-grid side-summary mt-24">
            <div className="info-box"><div className="info-label">Invoice Notes</div><div className="notes-text">{notes}</div></div>
            <div className="info-box"><div className="info-label">Payment Summary</div><div className="info-row"><span>Invoice Total</span><strong>{formatCurrency(grandTotal)}</strong></div><div className="info-row"><span>Deposit</span><strong>-{formatCurrency(depositPaid)}</strong></div><div className="info-row total"><span>Balance Due</span><strong>{formatCurrency(balanceDue)}</strong></div></div>
          </div>
        </DocumentShell>
      )}

      {activeTab === "rates" && (
        <DocumentShell title="Rate Sheet" subtitle="Standard Pricing Guide">
          <div className="doc-grid two-up">
            <div className="info-box"><div className="info-label">Business Info</div><div className="info-big">{brand.company}</div><div className="info-text">{brand.tagline}</div><div className="info-text mt-12">{brand.phone} • {brand.email}</div></div>
            <div className="info-box"><div className="info-label">Pricing Notes</div><div className="notes-text">Rates may vary based on materials, access, damage, and job complexity. Materials are billed at cost plus markup. Bundled jobs are usually quoted at a flat rate. Larger projects and carpet installs are quoted by job.</div></div>
          </div>
          <div className="rate-grid mt-24">
            {rateSheetGroups.map((group) => (
              <div key={group.title} className="table-box">
                <div className="table-header one-col">{group.title}</div>
                {group.items.map((item) => <div key={item.service} className="table-row split"><span>{item.service}</span><strong>{item.price}</strong></div>)}
              </div>
            ))}
          </div>
        </DocumentShell>
      )}
    </div>
  );
}
