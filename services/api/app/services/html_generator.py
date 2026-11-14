from typing import List, Dict, Any

class HTMLGenerator:
    @staticmethod
    def generate_accessible_html(
        title: str, 
        sections: List[Dict[str, Any]], 
        lang: str = "en"
    ) -> str:
        """
        Generate semantic, WCAG 2.2 AA compliant HTML from extracted document sections.
        """
        body_html = []
        for sec in sections:
            level = min(max(sec.get("level", 2), 1), 6)
            heading_text = sec.get("heading", "").strip()
            content = sec.get("content", "").strip()

            if heading_text:
                body_html.append(f"    <h{level}>{heading_text}</h{level}>")
            
            if content:
                for paragraph in content.split("\n\n"):
                    p = paragraph.strip()
                    if p:
                        body_html.append(f"    <p>{p}</p>")

        content_block = "\n".join(body_html)

        html = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      color: #1a1a2e;
      background-color: #f8fafc;
    }}
    h1, h2, h3, h4, h5, h6 {{
      color: #0f172a;
      margin-top: 1.5em;
    }}
    p {{
      margin-bottom: 1em;
    }}
    a:focus-visible {{
      outline: 3px solid #0066cc;
      outline-offset: 2px;
    }}
  </style>
</head>
<body>
  <main role="main">
    <h1>{title}</h1>
{content_block}
  </main>
</body>
</html>"""
        return html
