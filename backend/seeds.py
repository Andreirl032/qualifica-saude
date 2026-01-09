from datetime import datetime, timedelta
from app import create_app
from models import db, User, Procedure, Document, ProfessionalDocument, CSVHistory
from services.auth_service import hash_password


def seed_users():
    users = [
        {'id': 'u1', 'name': 'Andrei Paciente', 'email': 'paciente@demo.com', 
         'cpf': '12312312312', 'role': 'paciente', 'password': hash_password('123456')},
        {'id': 'u2', 'name': 'João Profissional', 'email': 'profissional@demo.com',
         'cpf': '22222222222', 'role': 'profissional', 'password': hash_password('123456')},
        {'id': 'u3', 'name': 'Augusto Secretário', 'email': 'secretario@demo.com',
         'cpf': '33333333333', 'role': 'secretario', 'password': hash_password('123456')},
        {'id': 'u4', 'name': 'Paciente Sem Senha', 'email': 'primeiro@demo.com',
         'cpf': '44444444444', 'role': 'paciente', 'password': None}
    ]
    
    for u in users:
        if not User.query.filter_by(id=u['id']).first():
            db.session.add(User(**u))
    
    db.session.commit()
    print("✓ Usuários")


def seed_procedures():
    procs = [
        {'id': 'proc1', 'patient_id': 'u1', 'name': 'Cirurgia de joelho direito',
         'date': '20/11/2025 08:00', 'facility': 'Hospital Municipal Demo', 'status': 'pendente-documentos'},
        {'id': 'proc2', 'patient_id': 'u1', 'name': 'Endoscopia digestiva',
         'date': '25/11/2025 14:30', 'facility': 'Clínica Especializada Demo', 'status': 'agendado'},
        {'id': 'proc3', 'patient_id': 'u1', 'name': 'Consulta de retorno',
         'date': '10/12/2025 10:00', 'facility': 'Ambulatório Demo', 'status': 'completo'}
    ]
    
    for p in procs:
        if not Procedure.query.filter_by(id=p['id']).first():
            db.session.add(Procedure(**p))
    
    db.session.commit()
    print("✓ Procedimentos")


def seed_documents():
    docs = [
        {'id': 'doc1', 'procedure_id': 'proc1', 'name': 'Risco cirúrgico', 'status': 'pendente', 'type': 'pdf'},
        {'id': 'doc2', 'procedure_id': 'proc1', 'name': 'Exame de sangue recente', 'status': 'aprovado', 'type': 'pdf'},
        {'id': 'doc3', 'procedure_id': 'proc2', 'name': 'Consentimento informado assinado', 'status': 'pendente', 'type': 'pdf'},
        {'id': 'doc4', 'procedure_id': 'proc3', 'name': 'Relatório de alta', 'status': 'aprovado', 'type': 'pdf'}
    ]
    
    for d in docs:
        if not Document.query.filter_by(id=d['id']).first():
            db.session.add(Document(**d))
    
    db.session.commit()
    print("✓ Documentos")


def seed_professional_documents():
    base = datetime(2025, 11, 16, 9, 10, 0)
    
    docs = [
        {
            'id': 'doc-101',
            'patient_name': 'Andrei Paciente',
            'patient_cpf': '123.123.123-12',
            'procedure_name': 'Cirurgia de joelho direito',
            'document_name': 'Risco cirúrgico',
            'status': 'pendente',
            'received_at': base,
            'last_update': base,
            'attachment_filename': 'risco-cirurgico.pdf',
            'attachment_url': '#',
            'notes': 'Paciente relata alergia a analgésicos. Avaliar laudo.',
            'pending_reason': 'Documento obrigatório antes do agendamento',
            'priority': 'alta'
        },
        {
            'id': 'doc-102',
            'patient_name': 'Carla Souza',
            'patient_cpf': '555.444.333-22',
            'procedure_name': 'Endoscopia digestiva',
            'document_name': 'Consentimento informado',
            'status': 'pendente',
            'received_at': base - timedelta(days=1, hours=5, minutes=25),
            'last_update': base + timedelta(days=1, hours=22, minutes=55),
            'attachment_filename': 'consentimento.pdf',
            'attachment_url': '#',
            'notes': 'Revisar assinatura do responsável.',
            'pending_reason': 'Assinatura pouco legível no rodapé',
            'priority': 'media'
        },
        {
            'id': 'doc-103',
            'patient_name': 'Luan Pereira',
            'patient_cpf': '987.654.321-00',
            'procedure_name': 'Tomografia computadorizada',
            'document_name': 'Exame de creatinina',
            'status': 'aprovado',
            'received_at': base - timedelta(days=6, hours=22, minutes=55),
            'last_update': base - timedelta(days=6, hours=22, minutes=10),
            'attachment_filename': 'creatinina.pdf',
            'attachment_url': '#',
            'notes': 'Resultado dentro da faixa.',
            'pending_reason': None,
            'priority': 'baixa'
        },
        {
            'id': 'doc-104',
            'patient_name': 'Marta Oliveira',
            'patient_cpf': '321.654.987-00',
            'procedure_name': 'Consulta pré-operatória',
            'document_name': 'Lista de medicamentos',
            'status': 'rejeitado',
            'received_at': base - timedelta(days=4, hours=16, minutes=50),
            'last_update': base - timedelta(days=3, hours=23, minutes=30),
            'attachment_filename': 'medicamentos.docx',
            'attachment_url': '#',
            'notes': 'Anexado documento ilegível. Solicitar novo upload.',
            'pending_reason': None,
            'priority': 'baixa'
        }
    ]
    
    for d in docs:
        if not ProfessionalDocument.query.filter_by(id=d['id']).first():
            db.session.add(ProfessionalDocument(**d))
    
    db.session.commit()
    print("✓ Docs profissionais")


def seed_csv_history():
    # Remove IDs existentes para evitar conflitos
    CSVHistory.query.delete()
    
    history = [
        {'filename': 'pacientes_2025-11-17.csv', 'rows': 32, 'status': 'Sucesso', 'timestamp': '17/11/2025 09:42'},
        {'filename': 'pacientes_correcao.csv', 'rows': 12, 'status': 'Sucesso', 'timestamp': '16/11/2025 15:21'},
        {'filename': 'lote_novembro.csv', 'rows': 45, 'status': 'Erro na validação', 'timestamp': '15/11/2025 18:07'}
    ]
    
    for h in history:
        db.session.add(CSVHistory(**h))
    
    db.session.commit()
    print("✓ CSV history")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        print("\n Populando banco...\n")
        seed_users()
        seed_procedures()
        seed_documents()
        seed_professional_documents()
        seed_csv_history()
        print("\n Pronto!\n")
