import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def delete_john_doe_data(tx):
    # Match any nodes with patientName "John Doe" or text containing "Migraine"
    query = """
    MATCH (n)
    WHERE n.patientId = 'P12345' 
       OR toLower(n.patientName) CONTAINS 'john doe' 
       OR toLower(n.name) CONTAINS 'john doe' 
       OR toLower(n.text) CONTAINS 'john doe'
       OR toLower(n.text) CONTAINS 'igraine' 
       OR toLower(n.diagnostic) CONTAINS 'igraine'
    DETACH DELETE n
    RETURN count(n) as deleted_count
    """
    result = tx.run(query)
    record = result.single()
    return record["deleted_count"]

with driver.session() as session:
    deleted = session.execute_write(delete_john_doe_data)
    print(f"Deleted {deleted} nodes related to John Doe / Migraine.")

driver.close()