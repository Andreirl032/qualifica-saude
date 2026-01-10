import os
from datetime import datetime
from werkzeug.utils import secure_filename
from models import db, Procedure, Document, ProfessionalDocument, CSVHistory
from sqlalchemy.exc import SQLAlchemyError


def get_document_details_service(doc_id):
    try:
        doc = Document.query.filter_by(id=doc_id).first()
        if not doc:
            return {'message': 'Documento não encontrado'}, 404
        
        proc = Procedure.query.filter_by(id=doc.procedure_id).first()
        if not proc:
            return {'message': 'Procedimento não encontrado'}, 404
        
        from models import User
        patient = User.query.filter_by(id=proc.patient_id).first()
        
        return {
            'id': doc.id,
            'name': doc.name,
            'status': doc.status,
            'observacoes': doc.observacoes,
            'last_upload_filename': doc.last_upload_filename,
            'last_upload_at': doc.last_upload_at.isoformat() if doc.last_upload_at else None,
            'procedure': {
                'id': proc.id,
                'name': proc.name,
                'date': proc.date,
                'facility': proc.facility,
                'status': proc.status
            },
            'patient': {
                'id': patient.id if patient else None,
                'name': patient.name if patient else 'Desconhecido',
                'cpf': patient.cpf if patient else None
            }
        }, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar documento'}, 500


def get_document_file_path_service(doc_id):
    try:
        doc = Document.query.filter_by(id=doc_id).first()
        if not doc or not doc.last_upload_filename:
            return None, 'Documento não possui arquivo'
        
        proc = Procedure.query.filter_by(id=doc.procedure_id).first()
        if not proc:
            return None, 'Procedimento não encontrado'
        
        file_path = os.path.join(os.getcwd(), 'uploads', str(proc.patient_id), doc.last_upload_filename)
        return file_path, None
    except Exception as e:
        print(f"Erro ao buscar caminho do arquivo: {e}")
        return None, 'Erro ao buscar arquivo'


def qualify_document_service(doc_id, status, observacoes, qualified_by_user_id):
    if status not in ['aprovado', 'rejeitado']:
        return {'message': 'Status inválido'}, 400
    
    try:
        doc = Document.query.filter_by(id=doc_id).first()
        if not doc:
            return {'message': 'Documento não encontrado'}, 404
        
        doc.status = status
        doc.observacoes = observacoes
        doc.qualified_at = datetime.now()
        doc.qualified_by = qualified_by_user_id
        
        proc = Procedure.query.filter_by(id=doc.procedure_id).first()
        if proc:
            all_docs = Document.query.filter_by(procedure_id=proc.id).all()
            if all(d.status in ['aprovado', 'rejeitado'] for d in all_docs):
                if any(d.status == 'rejeitado' for d in all_docs):
                    proc.status = 'pendente-documentos'
                else:
                    # Todos aprovados
                    proc.status = 'agendado'
        
        db.session.commit()
        
        return {'ok': True, 'document': doc.to_dict()}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao qualificar documento'}, 500


def get_patient_procedures_service(patient_id):
    try:
        procedures = Procedure.query.filter_by(patient_id=patient_id).all()
        return {'data': [p.to_dict() for p in procedures]}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar procedimentos'}, 500


def get_professional_documents_service():
    try:
        from models import User
        
        docs = Document.query.filter(
            Document.status.in_(['enviado', 'aprovado', 'rejeitado'])
        ).all()
        
        result = []
        for doc in docs:
            proc = Procedure.query.filter_by(id=doc.procedure_id).first()
            if not proc:
                continue
            
            patient = User.query.filter_by(id=proc.patient_id).first()
            if not patient:
                continue
            
            result.append({
                'id': doc.id,
                'patientName': patient.name,
                'patientCpf': patient.cpf,
                'procedureName': proc.name,
                'documentName': doc.name,
                'status': doc.status,
                'receivedAt': doc.last_upload_at.isoformat() if doc.last_upload_at else None,
                'lastUpdate': doc.qualified_at.isoformat() if doc.qualified_at else (doc.last_upload_at.isoformat() if doc.last_upload_at else None),
                'notes': doc.observacoes,
                'priority': 'alta' if doc.status == 'enviado' else 'baixa'
            })
        
        return {'data': result}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar documentos'}, 500


def upload_document_service(procedure_id, document_id, file, patient_id):
    try:
        proc = Procedure.query.filter_by(id=procedure_id, patient_id=patient_id).first()
        
        if not proc:
            return {'message': 'Procedimento não encontrado'}, 404
        
        doc = Document.query.filter_by(id=document_id, procedure_id=procedure_id).first()
        
        if not doc:
            return {'message': 'Documento não encontrado'}, 404
        
        if not file:
            return {'message': 'Arquivo inválido'}, 400
        
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(os.getcwd(), 'uploads', str(patient_id))
        os.makedirs(upload_folder, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(upload_folder, unique_filename)
        
        file.save(file_path)
        
        doc.status = 'enviado'
        doc.last_upload_filename = unique_filename
        doc.last_upload_at = datetime.now()
        
        all_docs = Document.query.filter_by(procedure_id=procedure_id).all()
        if all(d.status in ['aprovado', 'enviado'] for d in all_docs):
            proc.status = 'aguardando-analise'
        
        db.session.commit()
        
        return {'ok': True, 'procedure': proc.to_dict()}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao fazer upload do documento'}, 500
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao salvar arquivo: {e}")
        return {'message': 'Erro ao salvar arquivo'}, 500


def get_csv_history_service():
    try:
        history = CSVHistory.query.all()
        return {'data': [h.to_dict() for h in history]}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar histórico'}, 500
