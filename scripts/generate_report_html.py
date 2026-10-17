#!/usr/bin/env python3
"""
Generates a publication-grade, print-ready HTML & PDF-ready Final Project Report
for TABLESERVE (Team Cloud Guardians).
"""

import os
import markdown

def generate_report():
    md_path = r"C:\Users\Vanshita\Desktop\tableserve\docs\TABLESERVE-Final-Project-Report.md"
    html_out_path = r"C:\Users\Vanshita\Desktop\tableserve\docs\TABLESERVE-Final-Project-Report.html"
    desktop_html = r"C:\Users\Vanshita\Desktop\TABLESERVE-Final-Project-Report.html"
    desktop_md = r"C:\Users\Vanshita\Desktop\TABLESERVE-Final-Project-Report.md"

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    # Convert markdown with table, code, and header extensions
    html_body = markdown.markdown(md_text, extensions=['tables', 'fenced_code', 'toc'])

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TABLESERVE - Project Final Report (Cloud Guardians)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    :root {{
      --primary: #ea580c;
      --primary-dark: #c2410c;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
    }}

    * {{ box-sizing: border-box; }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.65;
      color: var(--slate-800);
      background-color: #cbd5e1;
      margin: 0;
      padding: 40px 20px;
    }}

    .page-container {{
      max-width: 960px;
      margin: 0 auto;
      background: white;
      padding: 60px 80px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    }}

    /* Print styling */
    @media print {{
      body {{
        background: white;
        padding: 0;
      }}
      .page-container {{
        max-width: 100%;
        margin: 0;
        padding: 20mm;
        box-shadow: none;
        border-radius: 0;
      }}
      .no-print {{ display: none !important; }}
      h1, h2, h3 {{ page-break-after: avoid; }}
      table, pre {{ page-break-inside: avoid; }}
    }}

    /* Floating Print Button */
    .print-bar {{
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      background: var(--slate-900);
      color: white;
      padding: 12px 24px;
      border-radius: 9999px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .print-bar:hover {{
      background: var(--primary);
      transform: translateY(-2px);
    }}

    h1 {{
      font-size: 28px;
      font-weight: 800;
      color: var(--slate-900);
      border-bottom: 3px solid var(--primary);
      padding-bottom: 12px;
      margin-top: 36px;
      letter-spacing: -0.02em;
    }}

    h2 {{
      font-size: 20px;
      font-weight: 700;
      color: var(--slate-900);
      border-bottom: 1.5px solid var(--slate-200);
      padding-bottom: 8px;
      margin-top: 32px;
      letter-spacing: -0.01em;
    }}

    h3 {{
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-dark);
      margin-top: 24px;
    }}

    p, li {{
      font-size: 14px;
      color: var(--slate-700);
    }}

    strong {{
      color: var(--slate-900);
      font-weight: 600;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }}

    th, td {{
      padding: 10px 14px;
      border: 1px solid var(--slate-200);
      text-align: left;
    }}

    th {{
      background-color: var(--slate-100);
      font-weight: 700;
      color: var(--slate-900);
    }}

    tr:nth-child(even) {{
      background-color: var(--slate-50);
    }}

    pre {{
      background: var(--slate-900);
      color: #f8fafc;
      padding: 16px 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
      margin: 18px 0;
      border: 1px solid var(--slate-800);
    }}

    code {{
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12.5px;
      background: var(--slate-100);
      color: var(--primary-dark);
      padding: 2px 5px;
      border-radius: 4px;
    }}

    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
    }}

    hr {{
      border: none;
      height: 1px;
      background: var(--slate-200);
      margin: 32px 0;
    }}

    ul, ol {{
      padding-left: 24px;
    }}

    li {{
      margin-bottom: 6px;
    }}

    blockquote {{
      border-left: 4px solid var(--primary);
      margin: 18px 0;
      padding: 10px 18px;
      background: #fff7ed;
      color: #9a3412;
      border-radius: 0 8px 8px 0;
      font-size: 13.5px;
    }}
  </style>
</head>
<body>

  <!-- Floating Print to PDF button -->
  <div class="print-bar no-print" onclick="window.print()">
    <span>🖨️ Print / Save as PDF</span>
  </div>

  <div class="page-container">
    {html_body}
  </div>

</body>
</html>
"""

    with open(html_out_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Generated HTML report: {html_out_path}")

    with open(desktop_html, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Copied HTML report to Desktop: {desktop_html}")

    # Also copy markdown directly to Desktop
    import shutil
    shutil.copy(md_path, desktop_md)
    print(f"Copied Markdown report to Desktop: {desktop_md}")

if __name__ == "__main__":
    generate_report()
