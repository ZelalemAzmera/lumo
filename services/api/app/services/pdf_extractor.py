import io
from typing import List, Dict, Any, Tuple

class PDFExtractor:
    @staticmethod
    def extract_structure(pdf_bytes: bytes) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extract headings, paragraphs, and accessibility flags from PDF bytes.
        Returns: (sections, flags)
        """
        sections: List[Dict[str, Any]] = []
        flags: List[Dict[str, Any]] = []

        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text:
                        continue
                    
                    # Inspect images on page
                    if len(page.images) > 0:
                        for img_idx, img in enumerate(page.images):
                            flags.append({
                                "type": "IMAGE_WITHOUT_ALT",
                                "message": f"Image on page {page_idx + 1} lacks an accessible description.",
                                "context": f"Page {page_idx + 1}, Image {img_idx + 1}"
                            })

                    lines = text.split("\n")
                    current_heading = f"Page {page_idx + 1}"
                    current_lines: List[str] = []

                    for line in lines:
                        cleaned = line.strip()
                        if not cleaned:
                            continue

                        # Simple heuristic: short line in all caps or title case is a heading
                        if len(cleaned) < 60 and (cleaned.isupper() or cleaned.istitle()):
                            if current_lines:
                                sections.append({
                                    "level": 2,
                                    "heading": current_heading,
                                    "content": "\n\n".join(current_lines)
                                })
                                current_lines = []
                            current_heading = cleaned
                        else:
                            current_lines.append(cleaned)

                    if current_lines:
                        sections.append({
                            "level": 2,
                            "heading": current_heading,
                            "content": "\n\n".join(current_lines)
                        })

        except Exception as e:
            # Fallback for plain text or if pdfplumber fails
            text = pdf_bytes.decode("utf-8", errors="ignore")
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            sections.append({
                "level": 1,
                "heading": "Extracted Content",
                "content": "\n\n".join(lines)
            })

        return sections, flags
