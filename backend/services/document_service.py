from datetime import datetime
from models import db, Procedure, Document, ProfessionalDocument, CSVHistory
from sqlalchemy.exc import SQLAlchemyError


def qualify_document_service(doc_id, status, observacoes=None):
    if status not in ['aprovado', 'rejeitado']:
        return {'message': 'Status inválido'}, 400
    
    return {'ok': True, 'id': doc_id, 'status': status, 'observacoes': observacoes}, 200


def get_patient_procedures_service(patient_id):
    try:
        procedures = Procedure.query.filter_by(patient_id=patient_id).all()
        return {'data': [p.to_dict() for p in procedures]}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar procedimentos'}, 500


def get_professional_documents_service():
    try:
        docs = ProfessionalDocument.query.all()
        return {'data': [d.to_dict() for d in docs]}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar documentos'}, 500


def upload_document_service(procedure_id, document_id, file_name, patient_id):
    try:
        proc = Procedure.query.filter_by(id=procedure_id, patient_id=patient_id).first()
        
        if not proc:
            return {'message': 'Procedimento não encontrado'}, 404
        
        doc = Document.query.filter_by(id=document_id, procedure_id=procedure_id).first()
        
        if not doc:
            return {'message': 'Documento não encontrado'}, 404
        
        if not file_name:
            return {'message': 'Arquivo inválido'}, 400
        
        doc.status = 'enviado'
        doc.last_upload_filename = file_name
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


def get_csv_history_service():
    try:
        history = CSVHistory.query.all()
        return {'data': [h.to_dict() for h in history]}, 200
    except SQLAlchemyError as e:
        print(f"Erro no banco de dados: {e}")
        return {'message': 'Erro ao buscar histórico'}, 500
