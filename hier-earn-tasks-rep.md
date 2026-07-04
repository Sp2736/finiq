# Prompt for Antigravity Agent — Hierarchy Earnings Excel Export

Copy everything below into Antigravity and point it at the `finiq-api` repo (and `finiq` frontend repo if the export is triggered/generated there).

---

I want you to improve the Excel export for the **"Hierarchy Earnings"** report in this codebase. Before changing anything, find and read the actual code that generates this report (search for terms like `Hierarchy Earnings`, `hierarchy-earnings`, `hierarchyEarnings`, or the export/report service that builds it — it likely uses `exceljs`). Confirm the real implementation rather than assuming.

## Context — current report structure

The exported sheet has these columns:
`User | Type | Gross Rec. (Rs.) | Paid (Self) (Rs.) | Total Paid (Rs.) | Net Rec. (Rs.)`

Rows are a 2-level hierarchy:
- **Parent rows** — `Sub-Broker` or `Direct Client` (top of each group, no indent)
- **Child rows** — indented with a `↳` prefix, and typed either `AMC` or `Investor` depending on which variant of the report was requested
- A final **`GRAND TOTALS`** row sums all columns

There are two variants of this same report:
1. Child rows broken down by **AMC** (mutual fund company)
2. Child rows broken down by **Investor**

## Task 1 — Fix file naming

Currently both variants are likely exported with the same generic filename pattern (e.g. `Hierarchy_Earnings_<startDate>_to_<endDate>.xlsx`). Find where the filename is generated and update it so the name reflects which breakdown was requested, keeping the existing date format:

- AMC breakdown → `Hierarchy_Earnings_by_AMC_<startDate>_to_<endDate>.xlsx`
- Investor breakdown → `Hierarchy_Earnings_by_Investor_<startDate>_to_<endDate>.xlsx`

Use whatever the existing date-range format string already is (currently looks like `YYYY-MM-DD_to_YYYY-MM-DD`). Don't hardcode this twice — derive the suffix from the same report-type flag/enum that already determines whether child rows are AMC or Investor, so the naming can never drift out of sync with the content.

## Task 2 — Polish the Excel formatting

Some basic styling already exists (dark header row, italic indented child rows). Build on it — don't strip it out — and bring it up to a polished, presentation-ready standard:

**Header row**
- Keep bold white text on a dark navy/brand fill
- Freeze the header row (freeze pane below row 1)
- Enable autofilter on the header row
- Set a comfortable row height

**Parent rows (Sub-Broker / Direct Client)**
- Bold text
- Light shaded background fill (e.g. a pale blue/grey) so each group visually stands out from its children
- A thin top border to separate one group from the previous group's last child row

**Child rows (AMC / Investor)**
- Keep the indent and italic styling
- Subtle alternating row shading within each group for readability on long lists (e.g. very light grey on every other child row)
- Slightly muted text color (already using a grey — keep that)

**Numbers**
- All four amount columns (`Gross Rec.`, `Paid (Self)`, `Total Paid`, `Net Rec.`) right-aligned, formatted as `#,##0.00`
- Consider a ₹/Rs. prefix in the number format if it doesn't clutter the column

**Grand totals row**
- Bold, distinct fill color (e.g. gold/amber or a darker shade than the parent rows)
- A medium/thick top border to clearly separate it from the data above

**General**
- Sensible column widths (auto-fit or fixed widths sized to the longest realistic name, e.g. `User` column wide enough for full names with the `↳` indent)
- Thin borders around the full table for a clean grid
- Turn off default gridlines outside the table if the library supports it
- Font: keep Calibri 11 for consistency with the rest of the app's exports

**Optional but nice if low-effort**
- A small title block above the table: report name (AMC or Investor breakdown), the date range, and "Generated on <date>"
- Print setup: landscape orientation, fit columns to one page width, if exceljs/the library makes this trivial

## Constraints

- Apply this styling logic in one shared place if both report variants (AMC/Investor) go through the same export function — don't duplicate styling code per variant.
- Don't change the underlying data/aggregation logic, only filenames and presentation/styling.
- Test by generating both variants and confirming filenames and visual formatting are correct before considering this done.
