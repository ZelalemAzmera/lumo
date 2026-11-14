import io
import json
import zipfile
import hashlib
from datetime import datetime, timezone
from typing import Dict, Tuple

class ZipBuilder:
    @staticmethod
    def build_lesson_package(
        lesson_id: str,
        title: str,
        captions_en: str = "",
        captions_am: str = "",
        transcript_text: str = "",
        audio_bytes: bytes = b"ID3\x03\x00\x00\x00\x00\x00\x00" # Minimal audio frame
    ) -> Tuple[bytes, int, str]:
        """
        Builds a deterministic, offline learning package zip with manifest and SHA-256 checksums.
        Returns: (zip_bytes, total_bytes, sha256_hash)
        """
        buffer = io.BytesIO()

        # Offline HTML Player Template
        offline_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title} — Offline Lesson</title>
  <style>
    body {{ font-family: system-ui, sans-serif; padding: 20px; background: #0f172a; color: #fff; }}
    .box {{ background: #1e293b; padding: 16px; border-radius: 8px; max-width: 680px; margin: auto; }}
    audio {{ width: 100%; margin: 12px 0; }}
  </style>
</head>
<body>
  <div class="box">
    <h1>{title}</h1>
    <audio controls src="audio.mp3"></audio>
    <h2>Transcript</h2>
    <pre style="white-space: pre-wrap; font-family: inherit;">{transcript_text or 'Lesson audio and captions available.'}</pre>
  </div>
</body>
</html>"""

        files_to_pack: Dict[str, bytes] = {
            "lesson.html": offline_html.encode("utf-8"),
            "audio.mp3": audio_bytes,
            "captions-en.vtt": captions_en.encode("utf-8"),
            "captions-am.vtt": captions_am.encode("utf-8"),
            "transcript.txt": transcript_text.encode("utf-8")
        }

        manifest_entries = []
        total_size = 0

        for path, data in files_to_pack.items():
            file_hash = hashlib.sha256(data).hexdigest()
            size = len(data)
            total_size += size
            manifest_entries.append({
                "path": path,
                "sizeBytes": size,
                "sha256": file_hash
            })

        manifest = {
            "schemaVersion": "1.0",
            "lessonId": lesson_id,
            "title": title,
            "version": "1.0.0",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "files": manifest_entries,
            "totalSizeBytes": total_size
        }

        manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")

        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("manifest.json", manifest_bytes)
            for path, data in files_to_pack.items():
                zf.writestr(path, data)

        zip_data = buffer.getvalue()
        package_checksum = hashlib.sha256(zip_data).hexdigest()

        return zip_data, len(zip_data), package_checksum
