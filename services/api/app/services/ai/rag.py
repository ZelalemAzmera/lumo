from typing import List, Dict, Any

class TranscriptRAG:
    @staticmethod
    def chunk_transcript(transcript_text: str) -> List[Dict[str, Any]]:
        """
        Split a transcript into searchable chunks with estimated timestamps.
        """
        lines = [l.strip() for l in transcript_text.split("\n") if l.strip()]
        chunks = []
        for i, line in enumerate(lines):
            # Estimate timestamp interval
            start_sec = i * 15
            end_sec = start_sec + 15
            mm1, ss1 = divmod(start_sec, 60)
            mm2, ss2 = divmod(end_sec, 60)
            chunks.append({
                "timestamp_start": f"{mm1:02d}:{ss1:02d}",
                "timestamp_end": f"{mm2:02d}:{ss2:02d}",
                "text": line
            })
        return chunks

    @staticmethod
    def find_relevant_chunks(question: str, chunks: List[Dict[str, Any]], limit: int = 3) -> List[Dict[str, Any]]:
        """
        Keyword matching search against transcript chunks.
        """
        q_words = set(question.lower().split())
        scored_chunks = []

        for chunk in chunks:
            chunk_words = set(chunk["text"].lower().split())
            score = len(q_words.intersection(chunk_words))
            scored_chunks.append((score, chunk))

        # Sort by relevance score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        # Return top matches or first chunks if no keyword overlap
        selected = [item[1] for item in scored_chunks[:limit] if item[0] > 0]
        if not selected and chunks:
            selected = chunks[:1]

        return selected
