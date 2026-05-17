// Client + server safe. No Node-only imports.

export type ParsedRow = {
  date: string;
  amountCents: number;
  description: string;
  merchant?: string;
  category?: string;
};

export type ColumnMapping = {
  date?: string;
  amount?: string;        // signed
  debit?: string;         // OR debit + credit
  credit?: string;
  description?: string;
  merchant?: string;
  category?: string;
};

// Candidate column names by field, across common bank exports (EN, FR, DE, ES, IT, NL).
const CANDIDATES: Record<keyof ColumnMapping, string[]> = {
  date: [
    "date", "transaction date", "posted date", "posting date", "value date", "operation date",
    "date d'opération", "date opération", "date opration", "date valeur", "date comptable",
    "buchungsdatum", "valutadatum", "datum",
    "fecha", "fecha operación", "fecha valor",
    "data", "data operazione", "data valuta",
    "boekdatum",
  ],
  amount: [
    "amount", "value", "transaction amount", "amount (eur)", "amount (gbp)", "amount (usd)",
    "montant", "montant eur", "montant en eur", "valeur",
    "betrag", "betrag eur",
    "importe", "importe eur",
    "importo", "valore",
    "bedrag",
  ],
  debit: [
    "debit", "debits", "withdrawal", "out", "money out", "paid out",
    "débit", "débit euros", "debit euros", "montant débit", "dépense",
    "soll", "lastschrift",
    "cargo", "salida",
    "addebito", "uscita",
    "af", "afschrijving",
  ],
  credit: [
    "credit", "credits", "deposit", "in", "money in", "paid in",
    "crédit", "crédit euros", "credit euros", "montant crédit", "recette",
    "haben", "gutschrift",
    "abono", "entrada",
    "accredito", "entrata",
    "bij", "bijschrijving",
  ],
  description: [
    "description", "details", "memo", "narrative", "label", "reference", "subject", "info",
    "transaction details", "particulars",
    "libellé", "libelle", "libellé opération", "libelle operation", "intitulé", "motif", "détail",
    "verwendungszweck", "buchungstext", "umsatz",
    "concepto", "descripción", "detalle",
    "descrizione", "causale",
    "omschrijving", "mededeling",
  ],
  merchant: [
    "merchant", "payee", "counterparty", "originator", "transaction party", "beneficiary",
    "bénéficiaire", "beneficiaire", "destinataire", "tiers",
    "empfänger", "empfaenger", "auftraggeber",
    "beneficiario",
    "tegenrekening", "naam tegenpartij",
  ],
  category: [
    "category", "type", "tag", "transaction type",
    "catégorie", "categorie", "type d'opération",
    "kategorie",
    "categoría", "categoria",
    "tipo",
  ],
};

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[\s_\-./()[\]]+/g, "")
    .trim();
}

export function detectColumns(headers: string[]): ColumnMapping {
  const norm = headers.map((h) => ({ original: h, norm: normalizeKey(h) }));
  const out: ColumnMapping = {};
  for (const field of Object.keys(CANDIDATES) as (keyof ColumnMapping)[]) {
    const candidates = CANDIDATES[field].map(normalizeKey);
    // Exact match
    let match = norm.find((h) => candidates.includes(h.norm));
    // Header contains candidate, or vice versa
    if (!match) {
      match = norm.find((h) =>
        candidates.some((c) => c.length >= 4 && (h.norm.includes(c) || c.includes(h.norm)))
      );
    }
    if (match) out[field] = match.original;
  }
  // If we found both `amount` AND debit/credit, prefer amount and ignore the others (more reliable).
  if (out.amount) {
    delete out.debit;
    delete out.credit;
  }
  return out;
}

export function parseAmount(raw: unknown): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }

  s = s.replace(/[\s€$£¥₹]/g, "");

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let normalized: string;
  if (lastDot === -1 && lastComma === -1) {
    normalized = s;
  } else if (lastDot > lastComma) {
    normalized = s.replace(/,/g, "");
  } else {
    normalized = s.replace(/\./g, "").replace(",", ".");
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return negative ? -cents : cents;
}

export function parseDate(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // ISO 8601
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (EU)
  const eu = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (eu) {
    let [, dd, mm, yyyy] = eu;
    if (yyyy.length === 2) yyyy = (Number(yyyy) > 70 ? "19" : "20") + yyyy;
    const day = Number(dd), month = Number(mm) - 1, year = Number(yyyy);
    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, month, day));
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }

  // Last resort: native Date parser (handles many English formats).
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native.toISOString();
  return null;
}

export function normalizeRow(
  raw: Record<string, string>,
  m: ColumnMapping
): ParsedRow | { error: string } {
  const dateRaw = m.date ? raw[m.date] : undefined;
  const date = dateRaw ? parseDate(dateRaw) : null;
  if (!date) return { error: `date: cannot parse "${dateRaw ?? ""}"` };

  let amountCents: number | null = null;
  if (m.amount && raw[m.amount] != null && String(raw[m.amount]).trim() !== "") {
    amountCents = parseAmount(raw[m.amount]);
    if (amountCents == null) return { error: `amount: cannot parse "${raw[m.amount]}"` };
  } else if (m.debit || m.credit) {
    const dRaw = m.debit ? String(raw[m.debit] ?? "").trim() : "";
    const cRaw = m.credit ? String(raw[m.credit] ?? "").trim() : "";
    const d = dRaw ? parseAmount(dRaw) : 0;
    const c = cRaw ? parseAmount(cRaw) : 0;
    if (d == null || c == null) return { error: "debit/credit: cannot parse" };
    amountCents = (c ?? 0) - Math.abs(d ?? 0);
    if (amountCents === 0 && !dRaw && !cRaw) return { error: "amount: both debit and credit empty" };
  } else {
    return { error: "no amount column mapped" };
  }

  const description = (m.description ? raw[m.description] : "")?.trim() || "";
  if (!description) return { error: "description: empty" };

  return {
    date,
    amountCents,
    description,
    merchant: m.merchant ? raw[m.merchant]?.trim() || undefined : undefined,
    category: m.category ? raw[m.category]?.trim() || undefined : undefined,
  };
}

export function isMappingValid(m: ColumnMapping): boolean {
  if (!m.date || !m.description) return false;
  if (!m.amount && !m.debit && !m.credit) return false;
  return true;
}
