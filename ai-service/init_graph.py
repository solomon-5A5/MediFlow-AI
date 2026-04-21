import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Force load the new .env file to bypass any terminal caching
load_dotenv(override=True)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

SETUP_QUERIES = [
    # 1. The Sandbox Reset (Deletes everything so we can test cleanly)
    "MATCH (n) DETACH DELETE n;",
    
    # 2. Uniqueness Constraints (The Guardrails)
    "CREATE CONSTRAINT patient_id IF NOT EXISTS FOR (p:Patient) REQUIRE p.id IS UNIQUE;",
    "CREATE CONSTRAINT disease_name IF NOT EXISTS FOR (d:Disease) REQUIRE d.name IS UNIQUE;",
    "CREATE CONSTRAINT scan_id IF NOT EXISTS FOR (s:Scan) REQUIRE s.id IS UNIQUE;",
    
    # 3. The Vector Index (For Hybrid RAG)
    """
    CREATE VECTOR INDEX mediflow_patients_v2 IF NOT EXISTS 
    FOR (d:DiagnosisEvent) ON (d.embedding) 
    OPTIONS {indexConfig: {
        `vector.dimensions`: 384, 
        `vector.similarity_function`: 'cosine'
    }};
    """
]

def setup_sandbox_graph():
    print("🔄 Connecting to Neo4j Sandbox...")
    
    if not NEO4J_PASSWORD:
        print("❌ Error: NEO4J_PASSWORD is empty. Check your .env file!")
        return

    try:
        # Initialize the connection
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        
        with driver.session() as session:
            for query in SETUP_QUERIES:
                # Just print a clean summary of the query being run
                clean_name = query.split('IF')[0].strip() if 'IF' in query else "Wiping Database"
                print(f"Executing: {clean_name}...")
                session.run(query)
                
        print("✅ Sandbox Graph Schema and Vector Index fully initialized!")
        driver.close()
        
    except Exception as e:
        print(f"❌ Setup Failed: {e}")

if __name__ == "__main__":
    setup_sandbox_graph()