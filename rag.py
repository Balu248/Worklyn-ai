import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import requests
from uuid import uuid4

client = chromadb.Client(
    Settings(
        persist_directory="./chroma_data",
        anonymized_telemetry=False,
        is_persistent=True
    )
)
# Create embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Get or create collection
collection = client.get_or_create_collection(name="hr_policies")


def embed_text(text: str):
    return embedding_model.encode(text).tolist()


def store_chunks(chunks: list, tenant_id: str):
    upload_batch_id = str(uuid4())

    print(f"Storing {len(chunks)} chunks for tenant {tenant_id}")

    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            embeddings=[embed_text(chunk)],
            ids=[f"{tenant_id}_{upload_batch_id}_{i}"],
            metadatas=[{"tenant_id": tenant_id}]
        )

def query_chunks(question: str, tenant_id: str):
    question_embedding = embed_text(question)

    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=3,
        where={"tenant_id": tenant_id}
    )

    if results["documents"]:
        return results["documents"][0]
    return []


def generate_answer(context_chunks: list, question: str):
    context = "\n\n".join(context_chunks)

    prompt = f"""
You are an HR assistant. Answer strictly based on the provided policy.

Policy:
{context}

Question:
{question}

Answer:
"""

    response = requests.post(
        "http://host.docker.internal:11434/api/generate",
        json={
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
    )

    return response.json()["response"]
