from app.core.database import get_engine, Base
import app.models

engine = get_engine()
print(f"Connecting to: {engine.url}")
print("Creating all missing tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
