import csv
import io
from datetime import datetime
from models import db, User, Procedure, CSVHistory
from services.auth_service import hash_password
from utils import normalize_cpf
from sqlalchemy.exc import SQLAlchemyError


def process_csv_service(file_content, filename):
    try:
        content = file_content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        rows_processed = 0
        errors = []
        
        required_fields = ['nome', 'cpf', 'email', 'procedimento', 'data', 'unidade']
        if not all(field in csv_reader.fieldnames for field in required_fields):
            missing = [f for f in required_fields if f not in csv_reader.fieldnames]
            return {
                'message': f'Campos obrigatórios faltando: {", ".join(missing)}',
                'errors': [f'Header inválido. Campos esperados: {", ".join(required_fields)}']
            }, 400
    
        for idx, row in enumerate(csv_reader, start=2):
            try:
                if not all([row.get('nome'), row.get('cpf'), row.get('email')]):
                    errors.append(f"Linha {idx}: Dados obrigatórios faltando")
                    continue
                
                cpf_clean = normalize_cpf(row['cpf'])
                if not cpf_clean or len(cpf_clean) != 11:
                    errors.append(f"Linha {idx}: CPF inválido ({row['cpf']})")
                    continue
                
                user = User.query.filter_by(cpf=cpf_clean).first()
                if not user:
                    user_id = f"u{cpf_clean[:8]}"
                    
                    user = User(
                        id=user_id,
                        name=row['nome'].strip(),
                        email=row['email'].strip().lower(),
                        cpf=cpf_clean,
                        role='paciente',
                        password=None  # Usuário precisará definir senha no primeiro acesso
                    )
                    db.session.add(user)
                    db.session.flush()  # Para garantir que o user.id está disponível
                
                # Criar procedimento se informado
                if row.get('procedimento') and row.get('data') and row.get('unidade'):
                    proc_id = f"proc{cpf_clean[:6]}{int(datetime.now().timestamp())}"
                    
                    procedure = Procedure(
                        id=proc_id,
                        patient_id=user.id,
                        name=row['procedimento'].strip(),
                        date=row['data'].strip(),
                        facility=row['unidade'].strip(),
                        status='pendente-documentos'
                    )
                    db.session.add(procedure)
                
                rows_processed += 1
                
            except Exception as e:
                errors.append(f"Linha {idx}: {str(e)}")
                continue
        
        # Registrar no histórico
        status = 'Sucesso' if not errors else f'Processado com {len(errors)} erro(s)'
        timestamp = datetime.now().strftime('%d/%m/%Y %H:%M')
        
        history = CSVHistory(
            filename=filename,
            rows=rows_processed,
            status=status,
            timestamp=timestamp
        )
        db.session.add(history)
        
        db.session.commit()
        
        return {
            'message': f'{rows_processed} linha(s) processada(s) com sucesso',
            'rows_processed': rows_processed,
            'errors': errors,
            'history_id': history.id
        }, 200 if not errors else 207  # 207 = Multi-Status (sucesso parcial)
        
    except UnicodeDecodeError:
        return {'message': 'Arquivo deve estar em formato UTF-8', 'errors': []}, 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao processar CSV: {e}")
        
        try:
            history = CSVHistory(
                filename=filename,
                rows=0,
                status='Erro na validação',
                timestamp=datetime.now().strftime('%d/%m/%Y %H:%M')
            )
            db.session.add(history)
            db.session.commit()
        except:
            pass
        
        return {'message': 'Erro ao processar CSV', 'errors': [str(e)]}, 500
