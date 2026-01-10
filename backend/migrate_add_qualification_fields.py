
from app import create_app
from models import db

def migrate():
    app = create_app()
    with app.app_context():
        with db.engine.connect() as conn:
            try:
                conn.execute(db.text('ALTER TABLE documents ADD COLUMN IF NOT EXISTS observacoes TEXT'))
                print(" Coluna 'observacoes' adicionada")
            except Exception as e:
                print(f"Coluna 'observacoes': {e}")
            
            try:
                conn.execute(db.text('ALTER TABLE documents ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMP'))
                print(" Coluna 'qualified_at' adicionada")
            except Exception as e:
                print(f"Coluna 'qualified_at': {e}")
            
            try:
                conn.execute(db.text('ALTER TABLE documents ADD COLUMN IF NOT EXISTS qualified_by VARCHAR(50)'))
                conn.execute(db.text('ALTER TABLE documents ADD CONSTRAINT fk_qualified_by FOREIGN KEY (qualified_by) REFERENCES users(id) ON DELETE SET NULL'))
                print("Coluna 'qualified_by' adicionada com foreign key")
            except Exception as e:
                print(f"Coluna 'qualified_by': {e}")
            
            conn.commit()
        
        print("\n Migração concluída com sucesso!")

if __name__ == '__main__':
    migrate()
